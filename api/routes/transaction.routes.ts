import express from "express";
import { getSupabaseAdmin, isUserBlocked } from "../config/supabase.js";
import { executeTransaction, executeAtomicBatchTransfer, ARC_USDC_TOKEN_ID } from "../services/circle.js";
import { initiateOutboundBridge, finalizeInboundBridge } from "../services/bridge.js";
import { getCircleClientInstance } from "../services/circleClient.js";
import { logAuditEvent } from "../services/audit.js";
import { getPlatformConfigs } from "./admin.routes.js";
import * as crypto from "crypto";

import { executeAppKitSwap, executeAppKitBridge, executeAppKitSend } from "../services/appkit.js";
import { BridgeChain } from "@circle-fin/app-kit";

const router = express.Router();

router.get("/transactions/:userId", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const transactions = data || [];

    // Real-time self-healing fallback check:
    // Pull status directly from Circle for any client-side pending transactions.
    const pendingTxs = transactions.filter(
      (tx: any) =>
        tx.status === "pending" && (tx.internal_ref || tx.tx_hash)
    );

    if (pendingTxs.length > 0) {
      const client = getCircleClientInstance();
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const batchToProcess = pendingTxs.slice(0, 10); // Check up to 10 pending per request
      
      for (const tx of batchToProcess) {
        try {
          let transaction: any = null;
          
          if (tx.internal_ref && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tx.internal_ref)) {
            const circleTx = await client.getTransaction({ id: tx.internal_ref });
            transaction = circleTx.data?.transaction;
          } else if (tx.tx_hash) {
             // Fallback for cases where we have a hash but status is still pending
             // We can search for the transaction by hash via Circle if their API supports it, 
             // or just check for confirmation. Since getTransaction usually requires Circle ID, 
             // if we only have tx_hash, we'd need another endpoint.
             // But for now, we focus on valid internal_ref.
          }

          if (!transaction) continue;
          
          const circleStatus = transaction.status;
          let finalStatus = "pending";

          if (circleStatus === "COMPLETE" || circleStatus === "CONFIRMED") {
            finalStatus = "success";
          } else if (circleStatus === "FAILED" || circleStatus === "CANCELLED") {
            finalStatus = "failed";
          }

          if (finalStatus !== "pending") {
            const updatedMetadata = {
              ...(tx.metadata || {}),
              txHash: transaction?.txHash || tx.metadata?.txHash || transaction?.id,
              errorReason: transaction?.errorReason || null,
              errorDetails: transaction?.errorDetails || null,
              circleStatus: circleStatus, // Preserve original status for debugging
              selfHealed: true,
              healedAt: new Date().toISOString()
            };

            await supabase
              .from("transactions")
              .update({ 
                status: finalStatus, 
                tx_hash: transaction?.txHash || tx.tx_hash,
                metadata: updatedMetadata 
              })
              .eq("id", tx.id);

            // Update the local reference object for immediate response
            tx.status = finalStatus;
            tx.tx_hash = transaction?.txHash || tx.tx_hash;
            tx.metadata = updatedMetadata;
            console.log(`[Self-Healing] Resolved ${tx.internal_ref} (${circleStatus}) to ${finalStatus}`);
          }
        } catch (circleErr: any) {
          console.error(`[Self-Healing] Failed to resolve transaction ${tx.internal_ref}:`, circleErr.message || circleErr);
        }
        await sleep(500); // 500ms delay to prevent rate limits
      }
    }

    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/swap/execute", async (req, res) => {
  try {
    const { userId, amount, fromToken, toToken } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }
    const supabaseAdmin = getSupabaseAdmin();

    const { data: userWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", userId)
      .single();

    if (!userWallet?.wallet_address) {
      throw new Error("User wallet not found");
    }

    const swapResult: any = await executeAppKitSwap(
      userWallet.wallet_address,
      parseFloat(amount),
      fromToken,
      toToken
    );

    const txHashValue = typeof swapResult === "object" ? swapResult.txHash : swapResult;
    const isSimulated = typeof swapResult === "object" && swapResult.simulated === true;

    // Calculate simulated values to write the record in the ledger
    const rates: Record<string, number> = {
      "USDC-ARC": 12.45,
      "ARC-USDC": 0.0803,
      "USDC-EURC": 0.92,
      "EURC-USDC": 1.08,
      "USDC-cirBTC": 0.0000104,
      "cirBTC-USDC": 96150.00,
      "USDC-MINT": 10.0,
      "MINT-USDC": 0.1,
    };
    const pair = `${fromToken}-${toToken}`;
    const rate = rates[pair] || 1.0;
    const toAmountStr = (parseFloat(amount) * rate).toFixed(6);

    const internalRef = `swap_${crypto.randomBytes(8).toString("hex")}`;

    await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: userId,
        amount: `-${amount}`, // Debit USDC/fromToken
        type: "swap",
        status: "success",
        tx_hash: txHashValue,
        internal_ref: internalRef,
        metadata: {
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: toAmountStr,
          exchangeRate: rate,
          real: !isSimulated,
          simulated: isSimulated,
          originalError: isSimulated ? swapResult.originalError : null,
          note: isSimulated ? "Simulated swap due to Sandbox balance/simulation limits" : "Executed via Circle App Kit"
        }
      });

    res.status(200).json({ 
      message: isSimulated ? "Simulated Swap executed" : "App Kit Swap executed", 
      txId: txHashValue, 
      simulated: isSimulated 
    });
  } catch (error: any) {
    console.error("Swap Error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/bridge/execute", async (req, res) => {
  try {
    const { userId, amount, fromNetwork, toNetwork } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }
    const bridgeAddress = "0x0000000000000000000000000000000000000000";

    const result = await executeTransaction(
      getSupabaseAdmin(),
      userId,
      amount,
      bridgeAddress,
      "transfer",
      { fromNetwork, toNetwork },
    );
    res.status(200).json({ message: "Bridge transfer queued", txId: result.txId });
  } catch (error: any) {
    console.error("Bridge execute error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/transfer/execute", async (req, res) => {
  try {
    const { userId, amount, destinationAddress, memo, recipientName } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }
    const supabaseAdmin = getSupabaseAdmin();

    const { data: userWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", userId)
      .single();

    if (!userWallet?.wallet_address) throw new Error("Wallet not found");

    const internalRef = `send_${crypto.randomBytes(8).toString("hex")}`;

    // Add to pending queue in DB immediately
    await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: userId,
        amount: `-${amount}`,
        type: "transfer",
        status: "pending",
        internal_ref: internalRef,
        metadata: {
          recipientName: recipientName || "EVM Account",
          destinationAddress,
          memo,
          real: true,
          isAsync: true
        },
      });

    // Run execution in background (Non-blocking as required by user prompt)
    (async () => {
      try {
        const txHash = await executeAppKitSend(
          userWallet.wallet_address,
          parseFloat(amount),
          destinationAddress
        );
        
        await supabaseAdmin
          .from("transactions")
          .update({
            tx_hash: txHash,
            status: "success"
          })
          .eq("internal_ref", internalRef);
      } catch (err: any) {
        console.error("Async send failed:", err);
        await supabaseAdmin
          .from("transactions")
          .update({
            status: "failed",
            description: err.message || "Failed to execute transaction"
          })
          .eq("internal_ref", internalRef);
      }
    })();

    res.status(202).json({
      message: "App Kit Send queued",
      txId: internalRef,
      status: "pending",
      memo: memo,
    });
  } catch (error: any) {
    console.error("App Kit Send Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/withdraw/execute", async (req, res) => {
  try {
    const { userId, amount, bank, memo } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }
    const supabaseAdmin = getSupabaseAdmin();
    let treasuryAddress = process.env.PLATFORM_TREASURY_ADDRESS;
    
    if (!treasuryAddress) {
      const { data: treasuryWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", "00000000-0000-0000-0000-000000000000")
        .single();
      treasuryAddress = treasuryWallet?.wallet_address;
    }
    
    if (!treasuryAddress) {
      throw new Error("Treasury wallet not configured");
    }

    const result = await executeTransaction(
      getSupabaseAdmin(),
      userId,
      amount,
      treasuryAddress,
      "withdraw",
      { bank, memo, finality: "deterministic" },
    );
    res.status(200).json({ message: "Withdraw queued", txId: result.txId });
  } catch (error: any) {
    console.error("Withdraw Error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/payments/create", async (req, res) => {
  try {
    const { walletId, destinationAddress, amount, userId, recipientName } = req.body;
    const client = getCircleClientInstance();

    if (parseFloat(amount) > 100) {
      await logAuditEvent(getSupabaseAdmin(), userId, "TRANSFER_HIGH_VALUE", {
        amount,
        destinationAddress,
      });
    }

    const response = await client.createTransaction({
      idempotencyKey: crypto.randomUUID(),
      walletId: walletId,
      destinationAddress: destinationAddress,
      amount: [amount.toString()],
      feeLevel: "MEDIUM",
      tokenId: ARC_USDC_TOKEN_ID, // Ensure we use USDC token ID by default for payments
    } as any);

    await getSupabaseAdmin()
      .from("transactions")
      .insert({
        user_id: userId,
        amount: `-${amount}`,
        type: "transfer",
        status: "pending",
        internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString("hex")}`,
        metadata: {
          recipientName: recipientName || "EVM Account",
          destinationAddress: destinationAddress,
          real: true,
        },
      });

    res.json(response.data);
  } catch (error: any) {
    console.error("Payment Execution Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/payments/batch", async (req, res) => {
  try {
    const { userId, recipients, platformFee } = req.body;
    
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Your account has been disabled. Transaction suspended.",
      });
    }

    const recipientCount = Array.isArray(recipients) ? recipients.length : 0;
    const feeValue = parseFloat(platformFee || "0");

    console.log(`[BatchRoute] Initiating Atomic Batch for User ${userId} with ${recipientCount} recipients. Fee: ${feeValue} USDC`);
    
    // Using atomic service with platformFee inclusion
    const result = await executeAtomicBatchTransfer(
      getSupabaseAdmin(),
      userId,
      recipients.map((r: any) => ({
        address: r.address,
        amount: parseFloat(r.amount),
        name: r.name,
      })),
      feeValue
    );

    res.json({
      success: true,
      message: "Atomic batch transaction initiated",
      txId: result.txId,
      recipientCount: result.recipientCount,
      totalAmount: result.totalAmount,
    });
  } catch (error: any) {
    console.error("Batch Payment Execution Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/purchase/execute", async (req, res) => {
  try {
    const { userId, amount, product } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }

    const config = getPlatformConfigs();
    const useEscrow = config?.useLoungeHubEscrow === true;
    const recipientAddress = useEscrow 
      ? (config?.loungeHubContractAddress || "0x8F3Cf9D0eAcC841cA4E8D77fDeFfD15C9C0A74D4")
      : "0x2222222222222222222222222222222222222222";

    const memoText = useEscrow 
      ? `[On-Chain Escrow Locked - LoungeHub] Purchase ${product}` 
      : `Purchase ${product}`;

    const result = await executeTransaction(
      getSupabaseAdmin(),
      userId,
      amount,
      recipientAddress,
      "purchase",
      { 
        product,
        memo: memoText,
        useEscrow,
        escrowAddress: recipientAddress
      },
    );
    res.status(200).json({ 
      message: useEscrow ? "Purchase locked in Escrow Contract" : "Purchase queued", 
      txId: result.txId,
      useEscrow,
      escrowAddress: recipientAddress
    });
  } catch (error: any) {
    console.error("Purchase error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/stake/execute", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }
    // Industrial Standard: Staking Vault Address (Example Node Validator)
    const vaultAddress = "0x5555555555555555555555555555555555555555";

    const result = await executeTransaction(
      getSupabaseAdmin(),
      userId,
      amount,
      vaultAddress,
      "stake",
      { 
        pool: "StableStake Vault #3A",
        apy: "12.5%",
        finality: "deterministic" 
      },
    );
    res.status(200).json({ message: "Staking transaction initiated", txId: result.txId });
  } catch (error: any) {
    console.error("Stake Error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/bridge/cctp", async (req, res) => {
  try {
    const { userId, amount, destinationAddress, destinationDomain } = req.body;
    
    // Convert destination domain to BridgeChain enum map
    let targetChain = BridgeChain.Ethereum_Sepolia;
    if (destinationDomain === 6) targetChain = BridgeChain.Base_Sepolia;
    if (destinationDomain === 1) targetChain = BridgeChain.Avalanche_Fuji;
    if (destinationDomain === 26) targetChain = BridgeChain.Arc_Testnet;

    const supabaseAdmin = getSupabaseAdmin();
    const { data: userWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", userId)
      .single();

    if (!userWallet?.wallet_address) throw new Error("Wallet not found");

    const txHash = await executeAppKitBridge(
      userWallet.wallet_address,
      parseFloat(amount),
      destinationAddress,
      targetChain
    );

    res.status(200).json({
      message: "CCTP Bridge via App Kit initiated",
      burnTxId: txHash,
      status: "pending_burn",
    });
  } catch (error: any) {
    console.error("App Kit Bridge error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/bridge/inbound/claim", async (req, res) => {
  try {
    const { userId, sourceTxHash, sourceChainRpc } = req.body;
    await finalizeInboundBridge(getSupabaseAdmin(), userId, sourceTxHash, sourceChainRpc);
    res.status(200).json({ message: "Inbound bridge claim initiated" });
  } catch (error: any) {
    console.error("Inbound Bridge Claim error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
