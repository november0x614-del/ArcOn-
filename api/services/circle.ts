import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { ArcNativeService } from "./arcNative.js";
import { validateDestination, isBlocklisted, estimateTransferGas, getUSDCBalance, getNativeBalance, waitForConfirmation } from "./arcViem.js";
import { logAuditEvent } from "./audit.js";

const getCircleClientInstance = () => {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
        throw new Error("CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required for wallet operations.");
    }

    return initiateDeveloperControlledWalletsClient({
        apiKey,
        entitySecret,
    });
};

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
    const amountBigInt = BigInt(Math.floor(amount * 1_000_000)); // Assume 6 decimals for USDC
    const sourceAddress = walletData.wallet_address as `0x${string}`;
    
    const [gasInfo, nativeBalance, erc20Balance] = await Promise.all([
        estimateTransferGas(sourceAddress, validDest, amountBigInt),
        getNativeBalance(sourceAddress),
        getUSDCBalance(sourceAddress)
    ]);

    if (nativeBalance < gasInfo.totalCostWei) {
        throw new Error(`Insufficient native USDC for gas. Need ${gasInfo.costHuman.toFixed(6)} USDC, have ${(Number(nativeBalance) / 1e18).toFixed(6)} USDC`);
    }

    if (erc20Balance < amountBigInt) {
        throw new Error(`Insufficient USDC balance. Need ${amount.toFixed(2)} USDC, have ${(Number(erc20Balance) / 1e6).toFixed(2)} USDC`);
    }

    const client = getCircleClientInstance();

    // Fase 3 Preview: Memo support (if provided in metadata)
    const txParams: any = {
        walletId: walletData.wallet_id,
        destinationAddress: validDest,
        amount: [amount.toString()],
        fee: { type: "level", config: { feeLevel: "LOW" } },
        tokenAddress: metadata.tokenAddress || "", // Use provided token address or empty for native
        blockchain: "ARC-TESTNET"
    };

    // Perform transaction using Developer SDK
    const response = await client.createTransaction(txParams);
    
    // Circle return an internal tx ID first
    const circleTxId = response.data?.id;

    const result = { 
        txId: circleTxId, 
        explorerUrl: `https://testnet.arcscan.app/tx/${circleTxId}` 
    };

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${amount.toFixed(2)}`,
        type: type,
        status: 'pending',
        internal_ref: circleTxId,
        metadata: { ...metadata, real: true, explorerUrl: result.explorerUrl }
    });

    if (error) throw error;

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
