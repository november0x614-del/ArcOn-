import express from "express";
import { getSupabaseAdmin, isUserBlocked } from "../config/supabase.js";
import { executeTransaction } from "../services/circle.js";
import { initiateOutboundBridge, finalizeInboundBridge } from "../services/bridge.js";
import { getCircleClientInstance } from "../services/circleClient.js";
import { logAuditEvent } from "../services/audit.js";
import * as crypto from "crypto";

const router = express.Router();

router.get("/transactions/:userId", async (req, res) => {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("transactions")
      .select("*")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/swap/execute", async (req, res) => {
  try {
    const { userId, amount, fromToken, toToken, tokenAddress } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan.",
      });
    }
    const dexAddress = "0x3333333333333333333333333333333333333333";

    const result = await executeTransaction(
      getSupabaseAdmin(),
      userId,
      amount,
      dexAddress,
      "swap",
      { fromToken, toToken, tokenAddress },
    );
    res.status(200).json({ message: "Swap queued", txId: result.txId });
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
        error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan.",
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
    const { userId, amount, destinationAddress, memo } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan.",
      });
    }
    const supabase = getSupabaseAdmin();

    const result = await executeTransaction(
      supabase,
      userId,
      amount,
      destinationAddress,
      "transfer",
      {
        intent: "unified_transfer",
        finality: "deterministic",
        memo: memo || "",
      },
    );

    res.status(200).json({
      message: "Unified Transfer initiated",
      txId: result.txId,
      status: "pending",
      memo: memo,
    });
  } catch (error: any) {
    console.error("Unified Transfer Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/withdraw/execute", async (req, res) => {
  try {
    const { userId, amount, bank, memo } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan.",
      });
    }
    const treasuryAddress = "0x1111111111111111111111111111111111111111";

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
      walletId: walletId,
      destinationAddress: destinationAddress,
      amount: [amount.toString()],
      fee: { type: "SPONSORED" },
      tokenAddress: "",
      blockchain: "ARC-TESTNET",
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
    const { walletId, recipients, userId } = req.body;
    const client = getCircleClientInstance();

    const totalAmount = recipients.reduce((sum: number, r: any) => sum + parseFloat(r.amount || "0"), 0);
    if (totalAmount > 500) {
      await logAuditEvent(getSupabaseAdmin(), userId, "BATCH_TRANSFER_HIGH_VALUE", {
        totalAmount,
        recipientCount: recipients.length,
      });
    }

    const responses = [] as any[];
    let successCount = 0;
    let failureCount = 0;

    for (const rec of recipients) {
      try {
        const response = await client.createTransaction({
          walletId: walletId,
          destinationAddress: rec.address,
          amount: [rec.amount.toString()],
          fee: { type: "SPONSORED" },
          tokenAddress: "",
          blockchain: "ARC-TESTNET",
        } as any);

        await getSupabaseAdmin()
          .from("transactions")
          .insert({
            user_id: userId,
            amount: `-${rec.amount}`,
            type: "transfer",
            status: "pending",
            internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString("hex")}`,
            metadata: {
              recipientName: rec.name || "EVM Account",
              destinationAddress: rec.address,
              real: true,
            },
          });

        responses.push({
          address: rec.address,
          amount: rec.amount,
          status: "success",
          txId: response.data?.id,
        });
        successCount++;
      } catch (txError: any) {
        console.error(`Failed to process batch recipient: ${rec.address}`, txError);
        await getSupabaseAdmin()
          .from("transactions")
          .insert({
            user_id: userId,
            amount: `-${rec.amount}`,
            type: "transfer",
            status: "failed",
            internal_ref: `failed_${crypto.randomBytes(8).toString("hex")}`,
            metadata: {
              recipientName: rec.name || "EVM Account",
              destinationAddress: rec.address,
              real: true,
            },
          });

        responses.push({
          address: rec.address,
          amount: rec.amount,
          status: "failed",
          error: txError.message || "Unknown transaction error",
        });
        failureCount++;
      }
    }

    res.json({
      success: successCount > 0,
      successCount,
      failureCount,
      transfers: responses,
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
        error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan.",
      });
    }
    const merchantAddress = "0x2222222222222222222222222222222222222222";

    const result = await executeTransaction(
      getSupabaseAdmin(),
      userId,
      amount,
      merchantAddress,
      "purchase",
      { product },
    );
    res.status(200).json({ message: "Purchase queued", txId: result.txId });
  } catch (error: any) {
    console.error("Purchase error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/bridge/cctp", async (req, res) => {
  try {
    const { userId, amount, destinationAddress, destinationDomain } = req.body;
    const result = await initiateOutboundBridge(
      getSupabaseAdmin(),
      userId,
      destinationDomain || 0,
      destinationAddress,
      amount,
    );

    res.status(200).json({
      message: "CCTP Outbound Bridge initiated",
      approveTxId: result.approveTxId,
      burnTxId: result.burnTxId,
      status: "pending_burn",
    });
  } catch (error: any) {
    console.error("CCTP Bridge error:", error);
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
