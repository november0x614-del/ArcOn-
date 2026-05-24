import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import * as crypto from "crypto";

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

/**
 * @deprecated Use executeIntentBasedTransaction instead
 */
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

// TODO: Implement Intent-Based Transaction using @circle-fin/adapter-circle-wallets once API structure is confirmed
export async function executeIntentBasedTransaction(
    supabaseAdmin: any,
    userId: string,
    amount: number,
    destinationAddress: string,
    type: string,
    metadata: any
) {
    throw new Error("Not implemented");
}

export async function executeTransaction(
    supabaseAdmin: any,
    userId: string,
    amount: number,
    destinationAddress: string,
    type: string,
    metadata: any
) {
    const { data: walletData } = await supabaseAdmin
        .from('user_wallets').select('wallet_id').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();

    const response = await client.createTransaction({
        walletId: walletData.wallet_id,
        destinationAddress: destinationAddress,
        amount: [amount.toString()],
        fee: { type: "level", config: { feeLevel: "LOW" } },
        tokenAddress: metadata.tokenAddress || "",
        blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${amount.toFixed(2)}`,
        type: type,
        status: 'pending',
        internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
        metadata: { ...metadata, real: true }
    });

    if (error) throw error;
    
    return {
        txId: response.data?.id
    };
}
