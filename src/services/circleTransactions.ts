import { AppKit, BridgeChain } from "@circle-fin/app-kit";
import { createCircleWalletsAdapter } from "@circle-fin/adapter-circle-wallets";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const getCircleClient = () => {
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
    const client = getCircleClient();
    
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
        const { error } = await supabaseAdmin.from('user_wallets').upsert({
            id: userId,
            wallet_id: wallet.id,
            wallet_address: wallet.address,
            wallet_set_id: walletSet.id
        });
        if (error) console.error("Failed mapping to Supabase:", error);
    }

    return {
        walletId: wallet.id,
        address: wallet.address,
        walletSetId: walletSet.id
    };
}

export async function performOnChainAction(
    supabaseAdmin: any,
    userId: string,
    action: 'swap' | 'send',
    amount: number,
    metadata: any
) {
    const { data: walletData } = await supabaseAdmin
        .from('user_wallets').select('wallet_id, wallet_address').eq('id', userId).single();
    if (!walletData?.wallet_id || !walletData?.wallet_address) throw new Error("No wallet found");

    const kit = new AppKit();
    const adapter = createCircleWalletsAdapter({
        apiKey: process.env.CIRCLE_API_KEY as string,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET as string,
    });

    let result: any;
    if (action === 'swap') {
        result = await kit.swap({
            from: { adapter, chain: "Arc_Testnet", address: walletData.wallet_address },
            tokenIn: metadata.fromToken,
            tokenOut: metadata.toToken,
            amountIn: amount.toString(),
            config: {
                kitKey: process.env.KIT_KEY as string,
            },
        });
    } else {
        const sendParams = {
            from: { adapter, chain: BridgeChain.Arc_Testnet, address: walletData.wallet_address },
            to: metadata.destinationAddress,
            amount: amount.toString(),
            token: metadata.token || "USDC",
        };
        await kit.estimateSend(sendParams);
        result = await kit.send(sendParams);
    }

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${amount.toFixed(2)}`,
        type: action,
        status: 'pending',
        internal_ref: String(result.txHash || ""),
        metadata: { ...metadata, real: true, explorerUrl: String(result.explorerUrl || "") }
    });

    if (error) throw error;
    
    return {
        txId: result.txHash
    };
}
