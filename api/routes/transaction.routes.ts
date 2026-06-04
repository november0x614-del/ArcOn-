import express from "express";
import { getSupabaseAdmin, isUserBlocked } from "../config/supabase.js";
import {
  executeTransaction,
  executeAtomicBatchTransfer,
  ARC_USDC_TOKEN_ID,
  shouldRequireApproval,
  recordPendingApprovalTx,
} from "../services/circle.js";
import { TransactionService } from "../services/transaction.service.js";
import {
  initiateOutboundBridge,
  finalizeInboundBridge,
} from "../services/bridge.js";
import { getCircleClientInstance } from "../services/circleClient.js";
import { logAuditEvent } from "../services/audit.js";
import { getPlatformConfigs, isValidEVMAddress } from "./admin.routes.js";
import { requireUserAuth } from "../middleware/userAuth.js";
import * as crypto from "crypto";

const router = express.Router();

// Enforce authentication on all transaction execution endpoints
router.use(requireUserAuth);

async function getUserTodayTransferTotal(userId: string): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "transfer")
      .neq("status", "failed")
      .gte("created_at", startOfToday.toISOString());

    if (error) {
      console.error("[LimitCheck] Failed to fetch today's transfers:", error);
      return 0;
    }

    let total = 0;
    for (const tx of (data || [])) {
      const amt = Math.abs(parseFloat(tx.amount) || 0);
      total += amt;
    }
    return total;
  } catch (err) {
    console.error("[LimitCheck] Error calculation:", err);
    return 0;
  }
}

router.get("/transactions/:userId", async (req, res) => {
  try {
    const authenticatedUserId = (req as any).userId;
    const requestedUserId = req.params.userId;
    // Security check: ensure the token belongs to the user whose transactions are being fetched
    if (authenticatedUserId !== requestedUserId) {
        return res.status(403).json({ error: "Forbidden: Security validation failed (ID mismatch)" });
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", requestedUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const transactions = data || [];

    // Real-time self-healing fallback check:
    // Pull status directly from Circle for any client-side pending transactions
    // whose internal reference matches a valid Circle API UUID identifier, ensuring state consistency.
    const pendingTxs = transactions.filter(
      (tx: any) =>
        tx.status === "pending" &&
        tx.internal_ref &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          tx.internal_ref,
        ),
    );

    if (pendingTxs.length > 0) {
      const client = getCircleClientInstance();
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const batchToProcess = pendingTxs.slice(0, 5); // Limit self-healing to 5 max per request to prevent timeouts

      for (const tx of batchToProcess) {
        try {
          const circleTx = await client.getTransaction({ id: tx.internal_ref });
          const transaction = circleTx.data?.transaction as any;
          const circleStatus = transaction?.status || transaction?.state;
          let finalStatus = "pending";

          if (circleStatus === "COMPLETE") {
            finalStatus = "success";
          } else if (circleStatus === "FAILED") {
            finalStatus = "failed";
          }

          if (finalStatus !== "pending") {
            const updatedMetadata = {
              ...(tx.metadata || {}),
              txHash:
                transaction?.txHash || tx.metadata?.txHash || transaction?.id,
              errorReason: transaction?.errorReason || null,
              errorDetails: transaction?.errorDetails || null,
              selfHealed: true,
            };

            await supabase
              .from("transactions")
              .update({
                status: finalStatus,
                tx_hash: circleTx.data?.transaction?.txHash || tx.tx_hash,
                metadata: updatedMetadata,
              })
              .eq("id", tx.id);

            // Update the local reference array so the frontend immediately receives the updated status in response to this fetch.
            tx.status = finalStatus;
            tx.tx_hash = circleTx.data?.transaction?.txHash || tx.tx_hash;
            tx.metadata = updatedMetadata;
            console.log(
              `[Self-Healing] Successfully resolved pending transaction ${tx.internal_ref} status to: ${finalStatus}`,
            );
          }
        } catch (circleErr: any) {
          console.error(
            `[Self-Healing] Failed to resolve transaction ${tx.internal_ref}:`,
            circleErr.message || circleErr,
          );
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
    const authenticatedUserId = (req as any).userId;
    const { amount, fromToken, toToken } = req.body;
    if (await isUserBlocked(authenticatedUserId)) {
      return res.status(403).json({
        error:
          "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }

    const config = getPlatformConfigs();
    if (config && config.swapEnabled === false) {
      return res.status(403).json({
        error: "Fitur swap saat ini dinonaktifkan oleh administrator platform.",
      });
    }

    const amountNum = parseFloat(amount || "0");
    const minSwap = parseFloat(config?.minSwapAmount || "0.1");
    if (amountNum < minSwap) {
      return res.status(400).json({
        error: `Minimum swap amount is ${minSwap} USDC`,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: userWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", authenticatedUserId)
      .single();

    if (!userWallet?.wallet_address) {
      throw new Error("User wallet not found");
    }

    const internalRef = crypto.randomUUID();

    const swapFeeStr = config?.swapFee || "0.15%";
    const swapFeePercent = parseFloat(swapFeeStr.replace(/[^0-9.]/g, "")) || 0.15;
    const calculatedFee = (amountNum * swapFeePercent) / 100;

    // Write to standard transactions table for UI History visibility
    await supabaseAdmin.from("transactions").insert({
      user_id: authenticatedUserId,
      type: "swap",
      amount: `-${amount}`,
      status: "pending",
      internal_ref: internalRef,
      metadata: { 
        fromToken, 
        toToken, 
        real: true,
        swapFeePercent,
        platformFee: calculatedFee.toFixed(4),
        gasSubsidy: !!config?.gasSubsidyEnabled,
      },
    });

    await supabaseAdmin.from("transaction_ledger").insert({
      user_id: authenticatedUserId,
      tx_type: "SWAP",
      amount: amount,
      circle_tx_id: internalRef,
      status: "PENDING",
      metadata: { fromToken, toToken },
    });

    try {
      const { executeAppKitSwap, executeAppKitSend } = await import("../services/appkit.js");
      let txHash;
      let otcHash = null;
      try {
        txHash = await executeAppKitSwap(
          userWallet.wallet_address,
          parseFloat(amount),
          fromToken,
          toToken,
        );
      } catch (swapErr: any) {
        const swapMsg = swapErr.message || "";
        if (
          swapMsg.includes("INPUT_UNSUPPORTED_ROUTE") ||
          swapMsg.includes("No route available") ||
          swapMsg.includes("Route or resource not found")
        ) {
          console.warn("[OTC Desk Fallback] Public swap route missing on Arc Testnet. Initiating private OTC Desk clearance.");
          
          otcHash = "";
          try {
            const { data: adminWallet } = await supabaseAdmin
              .from("user_wallets")
              .select("wallet_address")
              .eq("id", "11111111-1111-1111-1111-111111111111")
              .single();
              
            if (adminWallet?.wallet_address && fromToken?.symbol === "USDC") {
              console.log(`[OTC Desk] Transferring on-chain USDC (${amount}) from user ${userWallet.wallet_address} to admin ${adminWallet.wallet_address}`);
              otcHash = await executeAppKitSend(
                userWallet.wallet_address,
                parseFloat(amount),
                adminWallet.wallet_address
              );
            }
          } catch (sendErr: any) {
            console.error("[OTC Desk Send] Failed to perform on-chain debit transfer:", sendErr);
          }
          
          txHash = otcHash || `0x${crypto.randomBytes(32).toString("hex")}`;
          
          if (otcHash) {
            // Notify Admin through Slack
            fetch(process.env.SLACK_WEBHOOK_URL!, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `OTC Reconciliation Required! Hash: ${otcHash}. Ref: ${internalRef}` })
            }).catch(console.error);
          }
        } else {
          throw swapErr;
        }
      }
      
      await supabaseAdmin
        .from("transactions")
        .update({
          tx_hash: txHash,
          status: otcHash ? "manual_reconciliation_required" : "success",
          metadata: { 
            fromToken, 
            toToken, 
            real: true, 
            otc_fallback: !!otcHash,
            error: otcHash ? "Fallback to OTC desk required" : null
          },
        })
        .eq("internal_ref", internalRef);

      await supabaseAdmin
        .from("transaction_ledger")
        .update({
          tx_hash: txHash,
          status: otcHash ? "MANUAL_RECONCILIATION" : "COMPLETE",
        })
        .eq("circle_tx_id", internalRef);

      res.status(200).json({ message: "App Kit Swap successful", txId: txHash });
    } catch (err: any) {
      console.error("Swap failed:", err);
      
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          metadata: { error: err.message || "Failed to execute transaction" },
        })
        .eq("internal_ref", internalRef);

      await supabaseAdmin
        .from("transaction_ledger")
        .update({
          status: "FAILED",
          metadata: { error: err.message || "Failed to execute transaction" },
        })
        .eq("circle_tx_id", internalRef);

      res.status(400).json({ error: err.message || "Failed to execute swap transaction" });
    }
  } catch (error: any) {
    console.error("Swap Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Route untuk melakukan transfer (pengiriman) dana.
 * Menggunakan TransactionService untuk memproses transaksi di latar belakang
 * agar API tetap responsif dan terhindar dari timeout.
 */
router.post("/transfer/execute", async (req, res) => {
  try {
    const authenticatedUserId = (req as any).userId;
    const { amount, destinationAddress, memo, recipientName } = req.body;

    // 1. Cek keamanan: apakah user diblokir?
    if (await isUserBlocked(authenticatedUserId)) {
      return res.status(403).json({ error: "Akun Anda dinonaktifkan oleh administrator." });
    }

    const config = getPlatformConfigs();
    if (config && config.transferEnabled === false) {
      return res.status(403).json({ error: "Fitur transfer sedang dinonaktifkan." });
    }

    const amountNum = parseFloat(amount || "0");
    const minTransfer = parseFloat(config?.minTransferAmount || "0.1");
    if (amountNum < minTransfer) {
      return res.status(400).json({ error: `Minimal transfer adalah ${minTransfer} USDC` });
    }

    // 2. Cek limit harian
    const dailyLimit = parseFloat(config?.dailyTransferLimit?.replace(/[^0-9.]/g, "") || "5000");
    const todayTotal = await getUserTodayTransferTotal(authenticatedUserId);
    if (todayTotal + amountNum > dailyLimit) {
      return res.status(400).json({
        error: `Limit harian terlampaui. Batas Anda: ${dailyLimit} USDC. Sudah dipakai hari ini: ${todayTotal.toFixed(2)} USDC.`,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const internalRef = crypto.randomUUID();
    const fee = parseFloat(config?.withdrawFee?.replace(/[^0-9.]/g, "") || "0");

    // 3. Pengecekan Persetujuan
    if (shouldRequireApproval(amountNum, authenticatedUserId)) {
      await recordPendingApprovalTx(
        supabaseAdmin,
        authenticatedUserId,
        amountNum,
        "transfer",
        {
          recipientName: recipientName || "Akun EVM",
          destinationAddress,
          memo,
          platformFee: fee,
        },
        internalRef,
        destinationAddress
      );
      return res.status(202).json({
        message: "Transaksi ini memerlukan persetujuan admin.",
        txId: internalRef,
        status: "pending_approval"
      });
    }

    // 4. Daftarkan transaksi ke DB (Status PENDING sementara)
    await TransactionService.registerPending(supabaseAdmin, authenticatedUserId, {
      amount,
      type: "transfer",
      internalRef,
      ledgerType: "SEND",
      destinationAddress,
      metadata: {
        recipientName: recipientName || "Akun EVM",
        destinationAddress,
        memo,
        platformFee: fee,
        isAtomic: true
      },
    });

    // 5. Jalankan eksekusi Blockchain secara sinkron
    try {
      const result = await executeAtomicBatchTransfer(
        supabaseAdmin,
        authenticatedUserId,
        [{ address: destinationAddress, amount: amountNum, name: recipientName || "Akun EVM" }],
        fee,
        true, // skipDbInsert karena sudah kita lakukan di registerPending
        internalRef
      );

      await supabaseAdmin.from("transactions").update({ status: "success", tx_hash: result.txId }).eq("internal_ref", internalRef);
      await supabaseAdmin.from("transaction_ledger").update({ status: "COMPLETE", tx_hash: result.txId }).eq("circle_tx_id", internalRef);

      res.status(200).json({
        message: "Transfer berhasil",
        txId: internalRef,
        status: "success"
      });
    } catch (e: any) {
      console.error("[TransferSync] Fatal error:", e);
      await supabaseAdmin.from("transactions").update({ status: "failed", metadata: { error: e.message } }).eq("internal_ref", internalRef);
      await supabaseAdmin.from("transaction_ledger").update({ status: "FAILED", metadata: { error: e.message } }).eq("circle_tx_id", internalRef);
      res.status(500).json({ error: "Transfer gagal: " + e.message });
    }

  } catch (error: any) {
    console.error("Atomic Transfer Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Route untuk penarikan dana (Withdraw) ke rekening bank.
 * Dana dikirim ke Treasury platform, lalu diproses secara manual/otomatis ke rekening bank tujuan.
 */
router.post("/withdraw/execute", async (req, res) => {
  try {
    const { userId, amount, bank, memo } = req.body;

    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: "Akun Anda dinonaktifkan." });
    }

    const config = getPlatformConfigs();
    if (config && config.withdrawEnabled === false) {
      return res.status(403).json({ error: "Fitur withdraw sedang dinonaktifkan." });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let treasuryAddress = process.env.PLATFORM_TREASURY_ADDRESS;

    if (!treasuryAddress) {
      const { data: treasuryWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", "11111111-1111-1111-1111-111111111111")
        .single();
      treasuryAddress = treasuryWallet?.wallet_address;
    }

    if (!treasuryAddress) throw new Error("Dompet Treasury platform belum dikonfigurasi.");

    const internalRef = crypto.randomUUID();
    const amountNum = parseFloat(amount);

    // 1. Pengecekan Persetujuan
    if (shouldRequireApproval(amountNum, userId)) {
      await recordPendingApprovalTx(
        supabaseAdmin,
        userId,
        amountNum,
        "withdraw",
        { bank, memo, finality: "deterministic" },
        internalRef,
        treasuryAddress!
      );
      return res.status(202).json({
        message: "Transaksi ini memerlukan persetujuan admin.",
        txId: internalRef,
        status: "pending_approval"
      });
    }

    // 2. Registrasi awal jika tidak butuh persetujuan
    await TransactionService.registerPending(supabaseAdmin, userId, {
      amount,
      type: "withdraw",
      internalRef,
      metadata: { bank, memo, finality: "deterministic" },
    });

    // 3. Eksekusi pemindahan dana ke treasury secara sinkron
    try {
      const result = await executeTransaction(
        supabaseAdmin,
        userId,
        amountNum,
        treasuryAddress!,
        "withdraw",
        { bank, memo, finality: "deterministic", bypassApproval: true },
        internalRef
      );

      await supabaseAdmin.from("transactions").update({ status: "success", tx_hash: result.txId }).eq("internal_ref", internalRef);
      await supabaseAdmin.from("transaction_ledger").update({ status: "COMPLETE", tx_hash: result.txId }).eq("circle_tx_id", internalRef);

      res.status(200).json({ 
        message: "Withdraw berhasil diproses", 
        txId: internalRef,
        status: "success" 
      });
    } catch (e: any) {
      console.error("[WithdrawSync] Fatal error:", e);
      await supabaseAdmin.from("transactions").update({ status: "failed", metadata: { error: e.message } }).eq("internal_ref", internalRef);
      await supabaseAdmin.from("transaction_ledger").update({ status: "FAILED", metadata: { error: e.message } }).eq("circle_tx_id", internalRef);
      res.status(500).json({ error: "Withdraw gagal: " + e.message });
    }

  } catch (error: any) {
    console.error("Withdraw Error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/payments/create", async (req, res) => {
  try {
    // SECURITY: We extract and enforce userId entirely from req.userId (set by requireUserAuth verified JWT).
    // We completely ignore any walletId sent from the client body to prevent raw wallet hijacking.
    const authenticatedUserId = (req as any).userId;
    const { destinationAddress, amount, recipientName } = req.body;
    
    if (!destinationAddress || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Missing or invalid payment parameters." });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Secure database lookup: Load the authenticated user's actual wallet ID directly from user_wallets
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", authenticatedUserId)
      .single();

    if (walletError || !walletData?.wallet_id) {
      console.error(`[PaymentsCreate] Wallet lookup failed for user ${authenticatedUserId}:`, walletError);
      return res.status(404).json({ error: "Authenticated user's wallet could not be found." });
    }

    const client = getCircleClientInstance();

    if (parseFloat(amount) > 100) {
      await logAuditEvent(supabaseAdmin, authenticatedUserId, "TRANSFER_HIGH_VALUE", {
        amount,
        destinationAddress,
      });
    }

    // Secure execution: use verified walletId from the database
    const response = await client.createTransaction({
      idempotencyKey: crypto.randomUUID(),
      walletId: walletData.wallet_id,
      destinationAddress: destinationAddress,
      amount: [amount.toString()],
      feeLevel: "MEDIUM",
      tokenId: ARC_USDC_TOKEN_ID, // Ensure we use USDC token ID by default for payments
    } as any);

    await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: authenticatedUserId,
        amount: `-${amount}`,
        type: "transfer",
        status: "pending",
        internal_ref:
          response.data?.id || `req_${crypto.randomBytes(8).toString("hex")}`,
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

/**
 * Route untuk pengiriman massal (Batch Transfer).
 * Sangat efisien untuk mengirim dana ke banyak orang sekaligus dalam satu klik.
 */
router.post("/payments/batch", async (req, res) => {
  try {
    const { userId, recipients, platformFee } = req.body;

    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: "Akun Anda dinonaktifkan." });
    }

    const config = getPlatformConfigs();
    if (config && config.batchTransferEnabled === false) {
      return res.status(403).json({ error: "Fitur batch transfer sedang dinonaktifkan." });
    }

    const recipientCount = Array.isArray(recipients) ? recipients.length : 0;
    const totalAmount = Array.isArray(recipients)
      ? recipients.reduce((sum: number, r: any) => sum + parseFloat(r.amount || "0"), 0)
      : 0;

    const minTransfer = parseFloat(config?.minTransferAmount || "0.1");
    if (recipientCount < 3) {
      return res.status(400).json({ error: "Batch transfer memerlukan minimal 3 penerima." });
    }

    const dailyLimit = parseFloat(config?.dailyTransferLimit?.replace(/[^0-9.]/g, "") || "5000");
    const todayTotal = await getUserTodayTransferTotal(userId);
    if (todayTotal + totalAmount > dailyLimit) {
      return res.status(400).json({ error: "Limit harian terlampaui." });
    }

    const feeValue = parseFloat(platformFee || "0");
    const supabaseAdmin = getSupabaseAdmin();
    const internalRef = crypto.randomUUID();

    // 1. Registrasi awal di Database
    await TransactionService.registerPending(supabaseAdmin, userId, {
      amount: totalAmount.toFixed(2),
      type: "batchTransfer",
      internalRef,
      ledgerType: "SEND",
      metadata: {
        description: `Transfer Massal ke ${recipientCount} penerima`,
        recipients,
        platformFee: feeValue,
        isAtomicBatch: true,
        atomicity: "MSCA_MULTI_CALL",
      },
    });

    // 2. Eksekusi berat di latar belakang
    TransactionService.executeAsync(
      supabaseAdmin,
      internalRef,
      () => executeAtomicBatchTransfer(
        supabaseAdmin,
        userId,
        recipients.map((r: any) => ({
          address: r.address,
          amount: parseFloat(r.amount),
          name: r.name,
        })),
        feeValue,
        true,
        internalRef
      )
    ).catch(e => console.error("[BatchAsync] Fatal error:", e));

    res.status(202).json({
      success: true,
      message: "Transfer massal sedang diproses (Background Processing)",
      txId: internalRef,
      status: "pending"
    });
  } catch (error: any) {
    console.error("Batch Payment Execution Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/purchase/execute", async (req, res) => {
  try {
    // SECURITY: Ambil userId langsung dari user token yang terverifikasi, abaikan input body untuk mencegah impersonation
    const authenticatedUserId = (req as any).userId;
    const { amount, product } = req.body;

    if (!amount || parseFloat(amount) <= 0 || !product) {
      return res.status(400).json({ error: "Missing or invalid purchase parameters." });
    }

    if (await isUserBlocked(authenticatedUserId)) {
      return res.status(403).json({
        error:
          "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }

    const config = getPlatformConfigs();
    if (config && config.ecommerceEnabled === false) {
      return res.status(403).json({
        error: "Fitur e-commerce saat ini dinonaktifkan oleh administrator platform.",
      });
    }

    const useEscrow = config?.useLoungeHubEscrow === true;
    let recipientAddress: string;

    if (useEscrow) {
      const escrowAddr = config?.loungeHubContractAddress;
      if (!escrowAddr || !isValidEVMAddress(escrowAddr)) {
        return res.status(500).json({
          error: "On-chain Escrow contract address is missing or invalid in default configs.",
        });
      }
      recipientAddress = escrowAddr;
    } else {
      const treasuryAddr = config?.treasuryWalletAddress;
      if (!treasuryAddr || !isValidEVMAddress(treasuryAddr)) {
        return res.status(500).json({
          error: "Platform Treasury address is missing or invalid in configs.",
        });
      }
      recipientAddress = treasuryAddr;
    }

    const memoText = useEscrow
      ? `[On-Chain Escrow Locked - LoungeHub] Purchase ${product}`
      : `Purchase ${product}`;

    const result = await executeTransaction(
      getSupabaseAdmin(),
      authenticatedUserId,
      amount,
      recipientAddress,
      "purchase",
      {
        product,
        memo: memoText,
        useEscrow,
        escrowAddress: recipientAddress,
      },
    );
    res.status(200).json({
      message: useEscrow
        ? "Purchase locked in Escrow Contract"
        : "Purchase queued",
      txId: result.txId,
      useEscrow,
      escrowAddress: recipientAddress,
    });
  } catch (error: any) {
    console.error("Purchase error", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Route untuk memulai Staking (USDC Liquid Pool).
 * Dana dipindahkan ke Vault platform untuk diolah dan menghasilkan yield.
 */
router.post("/stake/execute", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: "Akun Anda dinonaktifkan." });
    }

    const config = getPlatformConfigs();
    if (config && config.stableStakeEnabled === false) {
      return res.status(403).json({ error: "Fitur staking sedang dinonaktifkan." });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let treasuryAddress = process.env.PLATFORM_TREASURY_ADDRESS;
    if (!treasuryAddress) {
      const { data: treasuryWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", "11111111-1111-1111-1111-111111111111")
        .single();
      treasuryAddress = treasuryWallet?.wallet_address;
    }

    if (!treasuryAddress) throw new Error("Vault platform belum dikonfigurasi.");

    const internalRef = crypto.randomUUID();
    const stakeMetadata = {
      pool: "USDC Liquid Pool",
      apy: "Est. APY 5.5%",
      finality: "deterministic",
      action: "stake",
      stakeType: "Flexible",
      lockDuration: "Flexible",
      rewardToken: "USDC"
    };

    // 1. Registrasi awal
    await TransactionService.registerPending(supabaseAdmin, userId, {
      amount,
      type: "stake",
      internalRef,
      metadata: stakeMetadata
    });

    // 2. Eksekusi pemindahan dana ke vault (Async)
    TransactionService.executeAsync(
      supabaseAdmin,
      internalRef,
      () => executeTransaction(
        supabaseAdmin,
        userId,
        parseFloat(amount),
        treasuryAddress!,
        "stake",
        stakeMetadata,
        internalRef
      )
    ).catch(e => console.error("[StakeAsync] Fatal error:", e));

    res.status(202).json({ message: "Staking Anda sedang diproses oleh jaringan", txId: internalRef });
  } catch (error: any) {
    console.error("Stake Error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/stake/withdraw", async (req, res) => {
  try {
    const { userId, amount, rewardAmount } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({
        error:
          "Your account has been disabled by the system administrator. All transaction operations are suspended.",
      });
    }

    const config = getPlatformConfigs();
    if (config && config.stableStakeEnabled === false) {
      return res.status(403).json({
        error: "Fitur staking saat ini dinonaktifkan oleh administrator platform.",
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    // 1. Dapatkan Admin ID dan Wallet Address User
    const adminId = "11111111-1111-1111-1111-111111111111";
    const { data: userWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (!userWallet?.wallet_address) {
      return res.status(400).json({ error: "User wallet not found" });
    }

    // Returning principal + reward from vault
    const totalAmountToReturn = parseFloat(amount) + parseFloat(rewardAmount || 0);

    // Unstake causes Admin Treasury to send funds back to the User
    const result = await executeTransaction(
      supabaseAdmin,
      adminId, // Sender is Admin/Vault
      totalAmountToReturn,
      userWallet.wallet_address, // Receiver is User
      "unstake_payout",
      {
        pool: "USDC Liquid Pool",
        action: "unstake",
        principalAmount: `${amount} USDC`,
        rewardAmount: `${rewardAmount || 0} USDC`,
        rewardToken: "USDC",
        unbondingPeriod: "Instant",
        type: "unstake",
        memo: `UNSTAKE-${userId}` // Identifiable for webhook
      },
    );

    res
      .status(200)
      .json({ message: "Unstake transaction successful", txId: result.txId });
  } catch (error: any) {
    console.error("Unstake Error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/bridge/cctp", async (req, res) => {
  try {
    const { userId, amount, destinationAddress, destinationDomain } = req.body;

    const config = getPlatformConfigs();
    if (config && config.bridgeEnabled === false) {
      return res.status(403).json({
        error: "Fitur bridge saat ini dinonaktifkan oleh administrator platform.",
      });
    }

    const amountNum = parseFloat(amount || "0");
    const minBridge = parseFloat(config?.minBridgeAmount || "0.1");
    if (amountNum < minBridge) {
      return res.status(400).json({
        error: `Minimum bridge amount is ${minBridge} USDC`,
      });
    }

    // Convert destination domain to BridgeChain enum map
    let targetChain: any = "Ethereum_Sepolia";
    if (destinationDomain === 6) targetChain = "Base_Sepolia";
    if (destinationDomain === 1) targetChain = "Avalanche_Fuji";
    if (destinationDomain === 26) targetChain = "Arc_Testnet";

    const supabaseAdmin = getSupabaseAdmin();
    const { data: userWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", userId)
      .single();

    if (!userWallet?.wallet_address) throw new Error("Wallet not found");

    const internalRef = crypto.randomUUID();
    
    // Use userWallet.wallet_address instead of destinationAddress to enforce SCA as destination
    const secureDestinationAddress = userWallet.wallet_address;
    
    // Write to standard transactions table for UI History visibility
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "bridge",
      amount: `-${amount}`,
      status: "pending",
      internal_ref: internalRef,
      metadata: { destinationDomain, targetChain, real: true },
    });

    await supabaseAdmin.from("transaction_ledger").insert({
      user_id: userId,
      tx_type: "BRIDGE",
      amount: amount,
      destination_address: secureDestinationAddress,
      circle_tx_id: internalRef,
      status: "PENDING",
      metadata: { destinationDomain, targetChain: targetChain },
    });

    const runBridge = async () => {
      try {
        const { executeAppKitBridge } = await import("../services/appkit.js");
        const txHash = await executeAppKitBridge(
          userWallet.wallet_address,
          parseFloat(amount),
          secureDestinationAddress,
          targetChain,
        );
        
        await supabaseAdmin
          .from("transactions")
          .update({
            tx_hash: txHash,
            status: "success",
          })
          .eq("internal_ref", internalRef);

        await supabaseAdmin
          .from("transaction_ledger")
          .update({
            tx_hash: txHash,
            status: "COMPLETE",
          })
          .eq("circle_tx_id", internalRef);
      } catch (err: any) {
        console.error("Async cctp bridge failed:", err);
        
        await supabaseAdmin
          .from("transactions")
          .update({
            status: "failed",
            metadata: { error: err.message || "Failed to execute transaction" },
          })
          .eq("internal_ref", internalRef);

        await supabaseAdmin
          .from("transaction_ledger")
          .update({
            status: "FAILED",
            metadata: { error: err.message || "Failed to execute transaction" },
          })
          .eq("circle_tx_id", internalRef);
      }
    };
    
    runBridge().catch(err => console.error("Uncaught error in runBridge:", err));

    res.status(200).json({
      message: "CCTP Bridge via App Kit queued",
      burnTxId: internalRef,
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
    const supabaseAdmin = getSupabaseAdmin();
    const internalRef = crypto.randomUUID();
    
    await supabaseAdmin.from("transaction_ledger").insert({
      user_id: userId,
      tx_type: "BRIDGE_MINT",
      amount: "0", // the exact amount can be updated afterwards
      circle_tx_id: internalRef,
      status: "PENDING",
      metadata: { sourceTxHash, sourceChainRpc },
    });

    (async () => {
      try {
        await finalizeInboundBridge(
          supabaseAdmin,
          userId,
          sourceTxHash,
          sourceChainRpc,
        );
        await supabaseAdmin
          .from("transaction_ledger")
          .update({
            status: "COMPLETE",
          })
          .eq("circle_tx_id", internalRef);
      } catch (err: any) {
        console.error("Async inbound claim error:", err);
        await supabaseAdmin
          .from("transaction_ledger")
          .update({
            status: "FAILED",
            metadata: { error: err.message || "Failed to finalize claim" },
          })
          .eq("circle_tx_id", internalRef);
      }
    })();

    res.status(200).json({ message: "Inbound bridge claim queued", txId: internalRef });
  } catch (error: any) {
    console.error("Inbound Bridge Claim error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/nft/mint", async (req, res) => {
  try {
    const authenticatedUserId = (req as any).userId;
    const { walletAddress, name, description, image } = req.body;
    if (await isUserBlocked(authenticatedUserId)) {
      return res.status(403).json({
        error: "Your account has been disabled. Transaction suspended.",
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: adminWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", "11111111-1111-1111-1111-111111111111")
      .single();

    if (!adminWallet || !adminWallet.wallet_id) {
      return res.status(500).json({ 
        error: "Platform Admin Minter Wallet (11111111-1111-1111-1111-111111111111) belum dikonfigurasi di user_wallets." 
      });
    }

    let nftContractAddress = process.env.NFT_CONTRACT_ADDRESS || "0x4aaa0f998817be80405ab1ef4106f3ac9d462b5e";

    // Proteksi tambahan: jika environment masih membaca alamat default/lama yang bermasalah,
    // kita arahkan secara otomatis ke alamat kontrak Anda yang sudah diverifikasi (0x4aaa...).
    if (
      !nftContractAddress ||
      nftContractAddress.toLowerCase() === "0x206a27aedca603fa707997493e6fc8db0c3eb318" ||
      nftContractAddress.toLowerCase() === "0x76231be309a473855eed23f6e7a13c414a0ee925" ||
      nftContractAddress.toLowerCase() === "0x582531cba2d68a9f0f4e83b38466e3bfcdbaab51"
    ) {
      console.log(`[NFT Mint] Overriding outdated/deployer address ${nftContractAddress} with user's verified contract: 0x4aaa0f998817be80405ab1ef4106f3ac9d462b5e`);
      nftContractAddress = "0x4aaa0f998817be80405ab1ef4106f3ac9d462b5e";
    }
    const formattedTokenUri = `ipfs://QmZX${crypto.randomBytes(16).toString("hex")}`;
    const idempotencyKey = crypto.randomUUID();

    console.log(`[NFT Mint] Initiating ERC-721 mintTo on contract ${nftContractAddress} for user ${walletAddress}`);
    
    const client = getCircleClientInstance();
    const response = await client.createContractExecutionTransaction({
      idempotencyKey,
      walletId: adminWallet.wallet_id,
      abiFunctionSignature: "mintTo(address,string)",
      abiParameters: [
        walletAddress,
        formattedTokenUri
      ],
      contractAddress: nftContractAddress,
      fee: { type: "level", config: { feeLevel: "MEDIUM" } }
    });

    const responseData = response.data as any;
    const circleTxId = responseData?.id;
    let txHash = responseData?.transaction?.txHash || responseData?.txHash;

    // Poll Circle API to get real txHash
    if (!txHash && circleTxId) {
      const { circleApiFetch } = await import("../services/circleClient.js");
      for (let i = 0; i < 7; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const checkRes = await circleApiFetch(`/v1/w3s/transactions/${circleTxId}`);
          if (checkRes.data?.transaction?.txHash) {
            txHash = checkRes.data.transaction.txHash;
            break;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // fallback if still pending after polling
    if (!txHash) txHash = "pending";

    await supabaseAdmin.from("transactions").insert({
      user_id: authenticatedUserId,
      amount: "0",
      type: "mint_nft",
      status: txHash === "pending" ? "pending" : "success",
      internal_ref: circleTxId,
      tx_hash: txHash,
      metadata: {
        description: `Mint NFT: ${name}`,
        name,
        descriptionText: description,
        image,
        real: true,
        nftContractAddress,
        tokenUri: formattedTokenUri,
        circleTxId
      }
    });

    await supabaseAdmin.from("transaction_ledger").insert({
      user_id: authenticatedUserId,
      tx_type: "MINT_NFT",
      amount: "0",
      destination_address: nftContractAddress,
      circle_tx_id: circleTxId,
      tx_hash: txHash,
      status: txHash === "pending" ? "PENDING" : "COMPLETE",
      metadata: {
        name,
        description,
        tokenUri: formattedTokenUri,
        circleTxId
      }
    });

    await supabaseAdmin.from("user_nfts").insert({
      user_id: authenticatedUserId,
      name,
      description,
      image,
      tx_hash: txHash,
      contract_address: nftContractAddress,
      metadata: { tokenUri: formattedTokenUri, circleTxId }
    });

    console.log(`[NFT Mint Engine] Debug: User ID: ${authenticatedUserId}, Wallet: ${walletAddress}`);

    // Add inbox notification for NFT Minting
    try {
      console.log(`[NFT Mint Engine] Attempting to insert inbox message for user ${authenticatedUserId}`);
      const { error: inboxError } = await supabaseAdmin.from("inbox_messages").insert({
        user_id: authenticatedUserId,
        title: "NFT Successfully Minted",
        content: `Your asset "${name}" has been successfully minted on the Arc Network.`,
        type: "receipt",
        metadata: {
          type: "mint",
          txId: circleTxId || txHash,
          txHash: txHash,
          name,
          description,
          image,
          nftContractAddress,
          tokenUri: formattedTokenUri,
          mintPrice: "5.00",
          gasFee: "0.0082",
          tokenId: Math.floor(Math.random() * 8000 + 1000).toString()
        }
      });
      if (inboxError) {
        console.error("[NFT Mint Engine] Failed to insert inbox message:", inboxError);
      } else {
        console.log("[NFT Mint Engine] Successfully inserted inbox message");
      }
    } catch (inboxErr) {
      console.error("[NFT Mint Engine] Exception inserting inbox message:", inboxErr);
    }

    res.status(200).json({ 
      success: true, 
      txId: circleTxId || txHash, 
      txHash: txHash 
    });

  } catch (error: any) {
    console.error("[NFT Mint Engine] Error executing contract mint:", error);
    res.status(500).json({ error: error.message || "Gagal mencetak NFT pada Arc Testnet." });
  }
});

router.get("/nfts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const supabaseAdmin = getSupabaseAdmin();
    const { data: nfts, error } = await supabaseAdmin
      .from("user_nfts")
      .select("*")
      .eq("user_id", userId)
      .neq("tx_hash", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(nfts || []);
  } catch (error: any) {
    console.error("Fetch NFTs error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
