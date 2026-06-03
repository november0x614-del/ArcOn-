import express from "express";
import { getSupabaseAdmin } from "../config/supabase.js";
import { authenticateAdmin } from "../middleware/adminAuth.js";
import { getTokenBalance, USDC_ADDRESS } from "../services/arcViem.js";
import { formatUnits } from "viem";
import {
  createWallet,
  batchCreateWallets,
  interpretCircleError,
  autoSweepWallets,
  manualSweepAdminWallet,
  executeTransaction,
} from "../services/circle.js";
import { fetchUnifiedBalance } from "../services/balance.js";
import * as crypto from "crypto";
import {
  getWalletDetails,
  upgradeWallet,
  fetchSystemTransactions,
  fetchPendingApprovals,
  decideApproval,
} from "../services/admin.js";
import { logAdminAction } from "../services/audit.js";

const router = express.Router();

// Publicly reachable routes that rely on dashboard PIN auth (temporary fix for monitoring)
router.get("/otc/treasury-balance", async (req, res) => {
  try {
    const config = getPlatformConfigs();
    const treasuryAddress = config.treasuryWalletAddress;
    
    if (!treasuryAddress) {
      return res.status(500).json({ error: "Treasury address not configured in Platform Settings" });
    }

    const balanceRaw = await getTokenBalance(treasuryAddress, USDC_ADDRESS);
    const balance = formatUnits(balanceRaw, 6);

    res.json({ address: treasuryAddress, balance });
  } catch (error: any) {
    console.error("Failed to fetch treasury balance:", error);
    res.status(500).json({ error: error.message });
  }
});



let platformConfigs = {
  swapFee: "0.15%",
  withdrawFee: "0.00 USDC",
  bridgeFee: "2.00 USDC",
  minTransferAmount: "0.1",
  minSwapAmount: "0.1",
  minBridgeAmount: "0.1",
  dailyTransferLimit: "5000.00 USDC",
  gasSubsidyEnabled: true,

  transferEnabled: true,
  withdrawEnabled: true,
  swapEnabled: true,
  stableStakeEnabled: true,
  bridgeEnabled: true,
  faucetEnabled: true,
  batchTransferEnabled: true,

  ecommerceEnabled: true,
  merchantEnabled: true,
  vaEnabled: true,
  qrisEnabled: true,
  scanQrEnabled: true,

  registrationEnabled: true,
  aiAgentEnabled: true,
  eWalletConnectionEnabled: true,
  arcBirdEnabled: true,
  backupPhraseEnabled: true,
  adminPin: "123456",
  useLoungeHubEscrow: false,
  loungeHubContractAddress: "0x8F3Cf9D0eAcC841cA4E8D77fDeFfD15C9C0A74D4",
  treasuryWalletAddress: process.env.PLATFORM_TREASURY_ADDRESS || "0x98A16172aACc841cA4E8D77fDeFfD15C9C0A7400",
};

// Internal cache sync
async function syncConfigsFromDB() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "PLATFORM_CONFIGS")
      .maybeSingle();

    if (error) {
      console.error("[SyncConfig] Error fetching from DB:", error);
      return;
    }

    if (data?.value) {
      platformConfigs = { ...platformConfigs, ...data.value };
      console.log("[SyncConfig] Successfully synced from Supabase.");
    } else {
      // First time initialization in DB if empty
      console.log("[SyncConfig] No config found in DB, seeding defaults...");
      await supabase.from("app_settings").upsert(
        { key: "PLATFORM_CONFIGS", value: platformConfigs },
        { onConflict: "key" }
      );
    }
  } catch (err) {
    console.error("[SyncConfig] Critical failure:", err);
  }
}

// Initial sync
syncConfigsFromDB();

router.post("/init", async (_req, res) => {
  try {
    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.VITE_ADMIN_EMAIL ||
      "admin@admin.com";
    const supabase = getSupabaseAdmin();

    console.log(`[AdminInit] Initializing default admin: ${adminEmail}`);

    const userId = "00000000-0000-0000-0000-000000000000";

    const { data: existingWallet } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("id", userId)
      .single();

    if (existingWallet) {
      return res.json({
        message: "Admin already initialized",
        wallet: existingWallet,
      });
    }

    console.log("[AdminInit] Creating Circle Wallet for Admin...");
    const circleResult = await createWallet(supabase, userId);

    res.json({
      message: "Admin initialized successfully",
      adminId: userId,
      wallet: circleResult,
    });
  } catch (error: any) {
    console.error("Admin Init Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export function getPlatformConfigs() {
  return platformConfigs;
}

router.get("/config", async (_req, res) => {
  // Ensure we are synced (or we could just fetch from DB directly here for 100% certainty)
  res.json(platformConfigs);
});

router.post("/config", async (req, res) => {
  try {
    const newConfig = { ...platformConfigs, ...req.body };
    const supabase = getSupabaseAdmin();
    
    // Save to Supabase
    const { error } = await supabase.from("app_settings").upsert(
      { key: "PLATFORM_CONFIGS", value: newConfig },
      { onConflict: "key" }
    );

    if (error) throw error;

    // Update local cache
    platformConfigs = newConfig;

    res.json({
      message: "Config updated and persisted successfully",
      config: platformConfigs,
    });
  } catch (error: any) {
    console.error("[ConfigUpdate] Failed:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    console.log("[AdminUsers] Starting fetch...");
    const { data: wallets, error: walletsError } = await supabase
      .from("user_wallets")
      .select("id, wallet_id, wallet_address, created_at");

    if (walletsError) {
      console.error("[AdminUsers] Wallets fetch error:", JSON.stringify(walletsError, null, 2));
      throw walletsError;
    }
    
    console.log(`[AdminUsers] Fetched ${wallets?.length || 0} wallet records.`);
    
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url");                

    if (profilesError) {
      console.error("[AdminUsers] Profiles fetch error:", JSON.stringify(profilesError, null, 2));
    } else {
      console.log(`[AdminUsers] Fetched ${profiles?.length || 0} profile records.`);
    }

    let authUsers: any[] = [];
    try {
      const { data: authData, error: authError } =
        await supabase.auth.admin.listUsers();
      if (!authError && authData) {
        authUsers = authData.users || [];
      }
    } catch (err) {
      console.warn(
        "Could not list auth users from Supabase admin client:",
        err,
      );
    }

    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.VITE_ADMIN_EMAIL ||
      "admin@admin.com";

    const combined = (wallets || []).map((w) => {
      const profile = (profiles || []).find((p) => p.id === w.id);
      const authUser = authUsers.find((u) => u.id === w.id);

      const isDeleted = authUser?.user_metadata?.deleted === true;
      const isBlocked =
        authUser?.user_metadata?.blocked === true || !!authUser?.banned_until;
      const status = isDeleted ? "Archived" : isBlocked ? "Blocked" : "Active";

      let email =
        authUser?.email ||
        `user_${w.wallet_address.substring(2, 6)}@testnet.com`;
      if (w.id === "00000000-0000-0000-0000-000000000000") {
        email = adminEmail;
      }

      return {
        id: w.id,
        name:
          profile?.full_name ||
          (w.id === "00000000-0000-0000-0000-000000000000"
            ? "Platform Admin"
            : "Anonymous"),
        email: email,
        wallet: w.wallet_address,
        walletId: w.wallet_id,
        createdAt: w.created_at,
        status: status,
      };
    });

    res.json(combined);
  } catch (error: any) {
    console.error("Failed to fetch admin users:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/users/:userId/wallet", async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdmin();
    const { data: walletData } = await supabase
      .from("user_wallets")
      .select("wallet_id")
      .eq("id", userId)
      .single();

    if (!walletData?.wallet_id)
      return res.status(404).json({ error: "Wallet not found" });

    const details = await getWalletDetails(walletData.wallet_id);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/users/:userId/sweep-funds", async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdmin();
    const config = getPlatformConfigs();
    const treasuryAddress = config.treasuryWalletAddress;

    if (!treasuryAddress) {
      return res.status(400).json({ error: "Platform Treasury Address is not configured." });
    }

    const { data: walletData } = await supabase
      .from("user_wallets")
      .select("wallet_address")
      .eq("id", userId)
      .maybeSingle();

    if (!walletData?.wallet_address) {
      return res.status(404).json({ error: "User wallet not found." });
    }

    // Get balance of USDC
    const balanceRaw = await getTokenBalance(walletData.wallet_address as `0x${string}`, USDC_ADDRESS);
    const balanceNum = parseFloat(formatUnits(balanceRaw, 6)); // Ensure it's in USDC decimals

    if (balanceNum <= 0) {
      return res.status(400).json({ error: "User wallet has zero balance, nothing to sweep." });
    }

    const result = await executeTransaction(
      supabase,
      userId,
      balanceNum,
      treasuryAddress,
      "sweep",
      { memo: "Manual admin sweep", bypassApproval: true }
    );

    // Update their Supabase balance to reflect 0 instantly locally as well, though the webhook might re-sync it
    await supabase.from("user_wallets").update({ balance: 0 }).eq("id", userId);

    res.json({ message: `Successfully swept ${balanceNum} USDC to Treasury.`, txId: result.txId });
  } catch (error: any) {
    console.error("Manual Sweep Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/users/:userId/upgrade", async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdmin();
    const { data: walletData } = await supabase
      .from("user_wallets")
      .select("wallet_id")
      .eq("id", userId)
      .single();

    if (!walletData?.wallet_id)
      return res.status(404).json({ error: "Wallet not found" });

    const result = await upgradeWallet(walletData.wallet_id);
    res.json({ message: "Upgrade initiated", result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/users/block", async (req, res) => {
  try {
    const { userId, block } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (userId === "00000000-0000-0000-0000-000000000000") {
      return res.status(400).json({ error: "Cannot block platform admin" });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: block ? "876000h" : "none",
      user_metadata: { blocked: block },
    });

    if (error) throw error;

    res.json({
      message: `User successfully ${block ? "blocked" : "unblocked"}`,
      user: data.user,
    });
  } catch (error: any) {
    console.error("Failed to toggle user block status:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (userId === "00000000-0000-0000-0000-000000000000") {
      return res.status(400).json({ error: "Cannot delete platform admin" });
    }

    const supabase = getSupabaseAdmin();
    const config = getPlatformConfigs();
    const treasuryAddress = config.treasuryWalletAddress;

    // PRE-DELETE HOOK: Sweep Wallet
    if (treasuryAddress) {
      const { data: walletData } = await supabase
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", userId)
        .maybeSingle();

      if (walletData?.wallet_address) {
        try {
          const balanceRaw = await getTokenBalance(walletData.wallet_address as `0x${string}`, USDC_ADDRESS);
          const balanceNum = parseFloat(formatUnits(balanceRaw, 6)); // Ensure it's in USDC decimals
          
          if (balanceNum > 0) {
            console.log(`[Pre-Delete Hook] Sweeping ${balanceNum} USDC from ${walletData.wallet_address} to ${treasuryAddress}`);
            await executeTransaction(
              supabase,
              userId,
              balanceNum,
              treasuryAddress,
              "sweep",
              { memo: "Pre-delete hook sweep", bypassApproval: true }
            );
          } else {
            console.log(`[Pre-Delete Hook] Wallet ${walletData.wallet_address} balance is 0. No sweep needed.`);
          }
        } catch (sweepError) {
          // Failure to sweep shouldn't necessarily block deletion in a Dev environment, 
          // but we log it as critical.
          console.error("[Pre-Delete Hook] Sweep failed, but proceeding with deletion:", sweepError);
        }
      }
    }

    // ON DELETE CASCADE: Hard Delete User
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    // Manual cleanup for tables just in case FK ON DELETE CASCADE isn't enabled
    await supabase.from("user_wallets").delete().eq("id", userId);
    await supabase.from("profiles").delete().eq("id", userId);

    try {
      await supabase.from("audit_logs").insert({
        user_id: "00000000-0000-0000-0000-000000000000", // Admin Action
        action: "HARD_DELETE_USER",
        metadata: { deleted_target: userId, timestamp: new Date().toISOString() },
      });
    } catch (auditErr) {
      console.warn("Could not insert into audit_logs table", auditErr);
    }

    res.json({
      message: "Pengguna berhasil dihapus sepenuhnya beserta saldo dompet (Hard Delete + Auto Sweep).",
    });
  } catch (error: any) {
    console.error("Failed to hard delete user:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();

    const { count: userCount } = await supabase
      .from("user_wallets")
      .select("*", { count: "exact", head: true });

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("status", "success");

    let totalVolume = 0;
    let batchVolume = 0;
    let singleVolume = 0;

    if (!txError && transactions) {
      transactions.forEach((tx) => {
        const amt = Math.abs(parseFloat(tx.amount || "0"));
        totalVolume += amt;

        // Logical check for Batch vs Single
        if (tx.type === "batchTransfer") {
          batchVolume += amt;
        } else if (tx.type === "transfer" || tx.type === "payment") {
          // In context of e-commerce, "payment" is often single, "transfer" is definitely single.
          singleVolume += amt;
        }
      });
    }

    let treasuryBalanceStr = "0.00 USDC";
    try {
      const { data: adminWallet } = await supabase
        .from("user_wallets")
        .select("wallet_id, wallet_address")
        .eq("id", "00000000-0000-0000-0000-000000000000")
        .single();

      if (adminWallet) {
        const balanceResult = await fetchUnifiedBalance(
          "00000000-0000-0000-0000-000000000000",
          adminWallet,
          supabase,
        );
        if (balanceResult?.balance) {
          treasuryBalanceStr = `${balanceResult.balance} USDC`;
        }
      }
    } catch (balErr) {
      console.log("Could not fetch real admin balance:", balErr);
    }

    res.json({
      totalUsers: userCount || 0,
      totalVolume: `${totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
      treasuryBalance: treasuryBalanceStr,
      volumeData: {
        batch: batchVolume,
        single: singleVolume,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch admin stats:", error);
    res.status(500).json({ error: error.message });
  }
});

router.use(authenticateAdmin);

router.get("/transactions", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const transactions = await fetchSystemTransactions(limit);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/otc/reconcile", async (req, res) => {
  try {
    const { txId, adminId } = req.body;
    const supabase = getSupabaseAdmin();

    // 1. Get transaction
    const { data: tx, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", txId)
      .single();
    
    if (fetchError || !tx) throw new Error("Transaction not found");

    // 2. Perform reconciliation (update status)
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ status: "success" })
      .eq("id", txId);
    
    if (updateError) throw updateError;

    // 3. Log into audit_logs
    await supabase
      .from("audit_logs")
      .insert({
        user_email: "admin", // Or fetch email from adminId if possible
        action: "OTC_RECONCILED",
        tx_hash: tx.tx_hash,
        details: { txId, reconciled_by: adminId }
      });

    res.json({ message: "Reconciled successfully" });
  } catch (error: any) {
    console.error("Failed to reconcile OTC transaction:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/otc/pending", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "manual_reconciliation_required")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error("Failed to fetch pending OTC transactions:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/users/batch-wallets", async (req, res) => {
  try {
    const { userIds } = req.body; // Opsional: Berikan array ID user, atau biarkan kosong untuk proses semua yang belum punya wallet
    const supabase = getSupabaseAdmin();

    let targetUsers = [];

    if (userIds && userIds.length > 0) {
      // Ambil user spesifik yang diminta
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      targetUsers = profiles || [];
    } else {
      // Ambil SEMUA user yang belum memiliki entri di user_wallets
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, full_name");

      const { data: existingWallets } = await supabase
        .from("user_wallets")
        .select("id");

      const existingIds = new Set((existingWallets || []).map((w) => w.id));
      targetUsers = (allProfiles || []).filter((p) => !existingIds.has(p.id));
    }

    if (targetUsers.length === 0) {
      return res.json({
        message: "Tidak ada user yang memerlukan pembuatan wallet baru.",
        count: 0,
      });
    }

    // Batasan Circle: Maksimal 200 per batch
    const batchList = targetUsers.slice(0, 200).map((u) => ({
      id: u.id,
      name: u.full_name,
    }));

    console.log(
      `[AdminBatch] Memulai pembuatan dompet massal untuk ${batchList.length} pengguna...`,
    );
    const result = await batchCreateWallets(supabase, batchList);

    res.json({
      message: `Berhasil memicu pendaftaran massal untuk ${result.length} pengguna.`,
      count: result.length,
      wallets: result,
    });
  } catch (error: any) {
    console.error("Batch Creation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/approvals", async (_req, res) => {
  try {
    const approvals = await fetchPendingApprovals();
    res.json(approvals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/approvals/:txId/decide", async (req, res) => {
  try {
    const { txId } = req.params;
    const { decision } = req.body; // 'approve' | 'reject'
    const result = await decideApproval(txId, decision);
    await logAdminAction(
      "00000000-0000-0000-0000-000000000000",
      decision === "approve" ? "TREASURY_TX_APPROVED" : "TREASURY_TX_REJECTED",
      txId,
      { decision },
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- COMPLIANCE / SANCTIONS BLOCKLIST ---

router.get("/compliance/blocklist", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("sanctions_blocklist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/compliance/blocklist", async (req, res) => {
  try {
    const { address, reason } = req.body;
    if (!address) return res.status(400).json({ error: "Address is required" });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("sanctions_blocklist")
      .insert({
        address,
        reason,
        added_by: "00000000-0000-0000-0000-000000000000", // Admin by default for now
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      "00000000-0000-0000-0000-000000000000",
      "COMPLIANCE_ADDRESS_BLOCKED",
      address,
      { reason },
    );

    res.json({ message: "Address added to blocklist", data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/compliance/blocklist/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("sanctions_blocklist")
      .delete()
      .eq("address", address);

    if (error) throw error;

    await logAdminAction(
      "00000000-0000-0000-0000-000000000000",
      "COMPLIANCE_ADDRESS_UNBLOCKED",
      address,
    );

    res.json({ message: "Address removed from blocklist" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- INFRASTRUCTURE & SETTINGS ---

router.get("/config/fees", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "GAS_FEE_STRATEGY")
      .maybeSingle();

    if (error) throw error;
    res.json({ strategy: data?.value || "SPONSORED" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/config/fees", async (req, res) => {
  try {
    const { strategy } = req.body;
    if (!["SPONSORED", "USER_PAID_USDC"].includes(strategy)) {
      return res.status(400).json({ error: "Invalid strategy" });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: "GAS_FEE_STRATEGY", value: strategy },
        { onConflict: "key" },
      );

    if (error) throw error;

    await logAdminAction(
      "00000000-0000-0000-0000-000000000000",
      "FEE_STRATEGY_UPDATED",
      strategy,
    );

    res.json({ message: `Gas strategy updated to ${strategy}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/wallet/auto-sweep", async (req, res) => {
  try {
    const { threshold, secret } = req.body;
    if (secret !== process.env.ADMIN_SECRET)
      return res.status(403).json({ error: "Unauthorized" });

    const treasuryAddress = process.env.PLATFORM_TREASURY_ADDRESS;
    if (!treasuryAddress)
      return res.status(400).json({ error: "Treasury address not configured" });

    const result = await autoSweepWallets(
      getSupabaseAdmin(),
      threshold || 50,
      treasuryAddress,
    );
    res.json({ message: "Sweep completed", result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/treasury/sweep", async (req, res) => {
  try {
    const { amount } = req.body;
    const config = getPlatformConfigs();
    const treasuryAddress = config.treasuryWalletAddress;

    if (!treasuryAddress) {
      return res.status(400).json({ error: "Treasury address not configured in Platform Settings" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than zero" });
    }

    const result = await manualSweepAdminWallet(
      getSupabaseAdmin(),
      parseFloat(amount),
      treasuryAddress
    );

    await logAdminAction(
      "00000000-0000-0000-0000-000000000000",
      "TREASURY_MANUAL_SWEEP",
      treasuryAddress,
      { amount }
    );

    res.json({ message: "Manual sweep transaction initiated", result });
  } catch (error: any) {
    console.error("Manual Sweep Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- PENDING TRANSACTIONS & WEBHOOK SIMULATION FOR PREVIEW & VERCEL ---

router.get("/config/pending-transactions", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, user_id, amount, type, status, internal_ref, created_at, metadata",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/config/simulate-circle-webhook", async (req, res) => {
  try {
    const { internalRef, status, errorReason, errorDetails } = req.body;
    if (!internalRef || !status) {
      return res
        .status(400)
        .json({
          error:
            "internalRef and status are required (and optionally errorReason, errorDetails)",
        });
    }

    const supabase = getSupabaseAdmin();

    const isFailed = status === "FAILED";
    const newStatus =
      status === "COMPLETE" ? "success" : isFailed ? "failed" : "pending";
    const txHash = isFailed
      ? null
      : `0x${crypto.randomBytes(32).toString("hex")}`;

    // 1. Fetch transaction metadata first
    const { data: existingTx, error: fetchError } = await supabase
      .from("transactions")
      .select("user_id, metadata, type")
      .eq("internal_ref", internalRef)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existingTx) {
      return res
        .status(404)
        .json({ error: "Transaction not found with that internal reference" });
    }

    let errorMessage = null;
    if (isFailed) {
      errorMessage = interpretCircleError(
        errorReason || "FAILED_ON_CHAIN",
        errorDetails || "Insufficient Balance",
      );
    }

    const updatedMetadata = existingTx.metadata
      ? {
          ...existingTx.metadata,
          txHash: txHash || existingTx.metadata.txHash,
          errorReason: isFailed
            ? errorReason || "FAILED_ON_CHAIN"
            : existingTx.metadata.errorReason,
          errorDetails: isFailed
            ? errorDetails || "Insufficient Balance"
            : existingTx.metadata.errorDetails,
          errorMessage: errorMessage || existingTx.metadata.errorMessage,
          simulated: true,
          simulatedAt: new Date().toISOString(),
        }
      : {
          txHash,
          errorReason: isFailed ? errorReason || "FAILED_ON_CHAIN" : null,
          errorDetails: isFailed
            ? errorDetails || "Insufficient Balance"
            : null,
          errorMessage,
          simulated: true,
          simulatedAt: new Date().toISOString(),
        };

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: newStatus,
        metadata: updatedMetadata,
      })
      .eq("internal_ref", internalRef);

    if (updateError) throw updateError;

    // Log admin action for auditing simulation
    await logAdminAction(
      "00000000-0000-0000-0000-000000000000",
      "TRANSACTION_WEBHOOK_SIMULATED",
      internalRef,
      { status: newStatus, isFailed },
    );

    res.json({
      success: true,
      message: `Successfully simulated webhook event: Transaction ${internalRef} updated to ${newStatus}`,
      txHash,
      status: newStatus,
    });
  } catch (error: any) {
    console.error("[Simulate webhook route] error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
