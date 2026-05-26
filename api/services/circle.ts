import { ArcNativeService } from "./arcNative.js";
import { 
    validateDestination, 
    isBlocklisted, 
    estimateTransferGas, 
    getTokenBalance, 
    getTokenDecimals, 
    getNativeBalance, 
    waitForConfirmation,
    USDC_ADDRESS,
    getArcScanUrl
} from "./arcViem.js";
import { logAuditEvent } from "./audit.js";
import { getCircleClientInstance, getArcAppKit } from "./circleClient.js";

/**
 * Sanitizes metadata to remove non-serializable objects (like BigInt) 
 * preventing "Cannot convert object to primitive value" errors.
 */
export function sanitizeMetadata(data: any): any {
    if (!data) return data;
    return JSON.parse(JSON.stringify(data, (_key, value) => {
        if (typeof value === 'bigint') return value.toString();
        
        if (!value || typeof value !== 'object') return value;

        // Handle Array
        if (Array.isArray(value)) return value;

        // Handle Plain Object
        if (value.constructor && value.constructor.name === 'Object') return value;

        // Otherwise treat as non-serializable
        return `[Object ${value.constructor ? value.constructor.name : 'Unknown'}]`;
    }));
}

export async function createWallet(supabaseAdmin: any, userId: string) {
    const client = getCircleClientInstance();
    
    // 1. Create Wallet Set
    const walletSetResponse = await client.createWalletSet({
        name: "Arc Commerce Wallet Set",
    });

    const walletSet = walletSetResponse.data?.walletSet;
    if (!walletSet?.id) {
        throw new Error("Wallet set creation failed: no ID returned from Circle");
    }

    // 2. Create Wallet in the Set
    const walletResponse = await client.createWallets({
        walletSetId: walletSet.id,
        blockchains: ["ARC-TESTNET"],
        count: 1,
        accountType: "EOA",
    });

    const wallet = walletResponse.data?.wallets?.[0];
    if (!wallet) {
        throw new Error("Wallet creation failed: no wallets array returned from Circle");
    }

    // 3. Save to Supabase if userId is provided
    if (userId) {
        // Get next unique index for HD Wallet derivation
        const { data: countData } = await supabaseAdmin
          .from('user_wallets')
          .select('id');
        
        const nextIndex = (countData?.length || 0) + 1;
        const nativeWallet = ArcNativeService.getDepositAddress(nextIndex);

        const { error } = await supabaseAdmin.from('user_wallets').upsert({
            id: userId,
            wallet_id: wallet.id,
            wallet_address: wallet.address,
            wallet_set_id: walletSet.id,
            hd_index: nextIndex,
            native_deposit_address: nativeWallet.address,
            native_private_key: nativeWallet.privateKey
        });
        if (error) console.error("Failed mapping to Supabase:", error);
    }

    return {
        walletId: wallet.id,
        address: wallet.address,
        walletSetId: walletSet.id
    };
}

export async function executeTransaction(
    supabaseAdmin: any,
    userId: string,
    amount: number,
    _destinationAddress: string,
    type: string,
    metadata: any
) {
    const { data: walletData } = await supabaseAdmin
        .from('user_wallets').select('wallet_id, wallet_address').eq('id', userId).single();
    if (!walletData?.wallet_id || !walletData?.wallet_address) throw new Error("No wallet found");

    // Fase 1: Validate destination and check blocklist
    const validDest = validateDestination(_destinationAddress);
    const blocked = await isBlocklisted(validDest);
    
    if (blocked) {
        throw new Error(`Destination address ${validDest} is blocklisted by Arc Protocol`);
    }

    // Fase 2: Gas Estimation & Balance Checks
    const sourceAddress = walletData.wallet_address as `0x${string}`;
    const tokenAddress = (metadata.tokenAddress || USDC_ADDRESS) as `0x${string}`;
    
    // Fetch token decimals for correct estimation
    const decimals = await getTokenDecimals(tokenAddress);
    
    // Amount in token's raw decimals for on-chain simulation
    const amountRaw = BigInt(Math.floor(amount * (Math.pow(10, decimals))));
    // Amount in 18-decimal internal for logic checks
    const amountInternal = BigInt(Math.floor(amount * 1_000_000)) * (10n ** 12n);

    // Fetch balances FIRST
    const [nativeBalance, tokenBalanceRaw] = await Promise.all([
        getNativeBalance(sourceAddress),
        getTokenBalance(sourceAddress, tokenAddress)
    ]);

    // Consistently normalize token balance to 18 decimals internal for comparison
    const tokenBalanceInternal = tokenBalanceRaw * (10n ** BigInt(18 - decimals)); 

    if (tokenBalanceInternal < amountInternal) {
        const symbol = metadata.fromToken || "USDC";
        throw new Error(`Insufficient ${symbol} balance. Need ${amount.toFixed(2)} ${symbol}, have ${(Number(tokenBalanceInternal) / 1e18).toFixed(2)} ${symbol}`);
    }

    // Now estimate gas once we know we have the amount
    const gasInfo = await estimateTransferGas(sourceAddress, validDest, amountRaw, tokenAddress);

    if (nativeBalance < gasInfo.totalCostWei) {
        throw new Error(`Insufficient native USDC for gas. Need ${gasInfo.costHuman.toFixed(6)} USDC, have ${(Number(nativeBalance) / 1e18).toFixed(6)} USDC`);
    }

    // Perform transaction using App Kit Abstraction
    const kit = getArcAppKit(walletData.wallet_id);
    const adapter = (kit as any).adapter;
    
    console.log(`[CircleService] Executing ${type} via App Kit...`);
    
    let response: any;
    if (type === 'swap') {
        response = await (kit as any).swap({
            from: { adapter, chain: "Arc_Testnet" as any },
            toToken: metadata.toToken || "ARC",
            fromToken: metadata.fromToken || "USDC",
            amount: amount.toString()
        } as any);
    } else {
        response = await kit.send({
            from: { adapter, chain: "Arc_Testnet" as any },
            to: validDest,
            amount: amount.toString(),
            token: metadata.fromToken || "USDC"
        });
    }
    
    // Circle return an internal tx ID first
    const circleTxId = (response as any).txHash || (response as any).id;

    const result = { 
        txId: circleTxId, 
        explorerUrl: (response as any).explorerUrl || getArcScanUrl('tx', circleTxId || '')
    };

    const sanitizedMetadata = sanitizeMetadata({ ...metadata, real: true, explorerUrl: result.explorerUrl });

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${amount.toFixed(2)}`,
        type: type,
        status: 'pending',
        internal_ref: circleTxId,
        description: metadata.memo || (type === 'transfer' ? `Transfer to ${validDest}` : undefined),
        metadata: sanitizedMetadata
    });

    if (error) throw error;

    const client = getCircleClientInstance();

    // Fase 3: Deterministic Finality Background Monitoring
    // In Arc, once the hash is published, we can wait for single-block confirmation
    // Note: Circle SDK asynchronous flow might broadcast the hash shortly after creation
    (async () => {
        try {
            // Give Circle a moment to broadcast and provide the hash
            let txHash: string | undefined;
            for (let i = 0; i < 5; i++) {
                const statusResponse = await client.getTransaction({ id: circleTxId || "" });
                txHash = statusResponse.data?.transaction?.txHash;
                if (txHash) break;
                await new Promise(r => setTimeout(r, 2000));
            }

            if (txHash) {
                console.log(`[CircleService] Hash detected: ${txHash}. Waiting for Arc Deterministic Finality...`);
                const receipt = await waitForConfirmation(txHash);
                
                await supabaseAdmin.from('transactions')
                    .update({ status: 'confirmed', metadata: { ...metadata, blockNumber: receipt.blockNumber.toString() } })
                    .eq('internal_ref', circleTxId);
                
                logAuditEvent(supabaseAdmin, userId, 'transaction_finalized', { txHash, blockNumber: receipt.blockNumber.toString() });
            }
        } catch (err) {
            console.error(`[CircleService] Finality monitoring failed for ${circleTxId}:`, err);
        }
    })();
    
    return {
        txId: circleTxId
    };
}
