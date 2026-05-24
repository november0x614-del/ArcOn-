import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
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

const getAppKit = () => {
    const kitKey = process.env.KIT_KEY;
    if (!kitKey) {
        throw new Error("KIT_KEY is required for AppKit operations.");
    }
    return new AppKit();
};

// Note: For actual on-chain transaction execution, we keep the private key server-side.
// DO NOT expose this to the frontend.
const getAdapter = () => {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY is required for AppKit adapters.");
    }
    return createViemAdapterFromPrivateKey({
        privateKey: privateKey,
    });
};

export async function executeTransaction(
    supabaseAdmin: any,
    userId: string,
    amount: number,
    _dexAddress: string, // Kept for compatibility, but AppKit handles routing
    _type: string, // Kept for compatibility
    metadata: any
) {
    console.log("Starting executeTransaction for user:", userId);
    try {
        const kit = getAppKit();
        const adapter = getAdapter();
        console.log("AppKit and Adapter initialized");

        // Perform the swap using AppKit
        console.log("Initiating swap...");
        const result = await kit.swap({
            from: { adapter, chain: "Arc_Testnet" },
            tokenIn: metadata.fromToken,
            tokenOut: metadata.toToken,
            amountIn: amount.toString(),
            config: {
                kitKey: process.env.KIT_KEY as string,
            },
        });
        console.log("Swap completed successfully:", result.txHash);

        // Save to Supabase
        const { error } = await supabaseAdmin.from('transactions').insert({
            user_id: userId,
            amount: `-${amount.toFixed(2)}`,
            type: 'swap',
            status: 'pending',
            internal_ref: result.txHash, // This should be the on-chain hash
            metadata: { ...metadata, real: true, explorerUrl: result.explorerUrl }
        });

        if (error) {
            console.error("Supabase insert error:", error);
            throw error;
        }

        return {
            txId: result.txHash // Now returning the on-chain hash!
        };
    } catch (err: any) {
        console.error("Critical error in executeTransaction:", err);
        throw err;
    }
}
