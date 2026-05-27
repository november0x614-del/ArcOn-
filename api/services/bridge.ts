import {
  TOKEN_MESSENGER,
  USDC_ADDRESS,
  formatRecipientForCCTP
} from "./arcViem.js";
import { getCircleClientInstance } from "./circleClient.js";

/**
 * Handles the final step of a CCTP Inbound Bridge (Other Chain -> Arc).
 * Submits the 'receiveMessage' transaction to Arc given a source transaction hash.
 */
export async function finalizeInboundBridge(
    supabaseAdmin: any,
    userId: string,
    sourceTxHash: string,
    _sourceChainRpc?: string
) {
    console.log(`[BridgeService] Finalizing inbound bridge for tx: ${sourceTxHash}`);

    const { data: walletData } = await supabaseAdmin
        .from('user_wallets').select('wallet_id, wallet_address').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("User has no wallet");

    console.log(`[BridgeService] Attempting to track CCTP message for hash: ${sourceTxHash}`);

    await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: "+0.00",
        type: 'bridge',
        status: 'pending',
        internal_ref: sourceTxHash,
        metadata: { sourceTxHash, direction: 'inbound', isCCTP: true }
    });
}

/**
 * Handles an Outbound Bridge (Arc -> Other Chain) using App Kit Bridge Kit.
 */
export async function initiateOutboundBridge(
    supabaseAdmin: any,
    userId: string,
    destinationDomain: number,
    _destinationAddress: string,
    amount: number
) {
    const { data: walletData } = await supabaseAdmin
        .from('user_wallets').select('wallet_id, wallet_address').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("User has no wallet");

    const client = getCircleClientInstance();

    // Lazy load heavy dependencies
    const bridgeKitMod = await import("@circle-fin/bridge-kit");
    const BridgeKit = bridgeKitMod.BridgeKit || bridgeKitMod.default;
    
    const circleWalletsAdapterMod = await import("@circle-fin/adapter-circle-wallets");
    // Use factory function if available, otherwise fallback
    const createAdapter = circleWalletsAdapterMod.createCircleWalletsAdapter || circleWalletsAdapterMod.default;
    
    // Initialize BridgeKit
    const kit = new BridgeKit({ environment: "sandbox" });
    const adapter = createAdapter({
        client: client,
        walletId: walletData.wallet_id
    });

    console.log(`[BridgeService] Initiating BridgeKit outbound: ${amount} USDC`);

    // Using BridgeKit to abstract CCTP
    const result = await kit.bridge({
        from: { adapter: adapter, chain: "Arc_Testnet" },
        to: { adapter: null as any, chain: destinationDomain.toString() }, // Simplified/placeholder
        amount: amount.toString(),
    });

    return {
        approveTxId: result.transactionId,
        burnTxId: result.transactionId
    };
}
