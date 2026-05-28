import express from "express";
import { getSupabaseAdmin } from "../config/supabase.js";
import { createWallet, batchCreateWallets } from "../services/circle.js";
import { fetchUnifiedBalance } from "../services/balance.js";
import { getWalletDetails, upgradeWallet, fetchSystemTransactions, fetchPendingApprovals, decideApproval } from "../services/admin.js";
import { logAdminAction } from "../services/audit.js";

const router = express.Router();

let platformConfigs = {
  swapFee: "0.15%",
  withdrawFee: "0.00 USDC",
  bridgeFee: "2.00 USDC",
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
};

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

router.get("/config", (_req, res) => {
  res.json(platformConfigs);
});

router.post("/config", (req, res) => {
  try {
    platformConfigs = { ...platformConfigs, ...req.body };
    res.json({
      message: "Config updated successfully",
      config: platformConfigs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: wallets, error: walletsError } = await supabase
      .from("user_wallets")
      .select("id, wallet_id, wallet_address, created_at");

    if (walletsError) throw walletsError;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url");

    let authUsers: any[] = [];
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (!authError && authData) {
        authUsers = authData.users || [];
      }
    } catch (err) {
      console.warn("Could not list auth users from Supabase admin client:", err);
    }

    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.VITE_ADMIN_EMAIL ||
      "admin@admin.com";

    const combined = (wallets || []).map((w) => {
      const profile = (profiles || []).find((p) => p.id === w.id);
      const authUser = authUsers.find((u) => u.id === w.id);

      const isDeleted = authUser?.user_metadata?.deleted === true;
      const isBlocked = authUser?.user_metadata?.blocked === true || !!authUser?.banned_until;
      const status = isDeleted ? "Archived" : isBlocked ? "Blocked" : "Active";

      let email = authUser?.email || `user_${w.wallet_address.substring(2, 6)}@testnet.com`;
      if (w.id === "00000000-0000-0000-0000-000000000000") {
        email = adminEmail;
      }

      return {
        id: w.id,
        name: profile?.full_name || (w.id === "00000000-0000-0000-0000-000000000000" ? "Platform Admin" : "Anonymous"),
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

    if (!walletData?.wallet_id) return res.status(404).json({ error: "Wallet not found" });

    const details = await getWalletDetails(walletData.wallet_id);
    res.json(details);
  } catch (error: any) {
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

    if (!walletData?.wallet_id) return res.status(404).json({ error: "Wallet not found" });

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

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
      user_metadata: {
        blocked: true,
        deleted: true,
        deletedAt: new Date().toISOString(),
      },
    });

    if (updateError) throw updateError;

    try {
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: "SOFT_DELETE_USER",
        metadata: { deleted_by: "admin", timestamp: new Date().toISOString() },
      });
    } catch (auditErr) {
      console.warn("Could not insert into audit_logs table", auditErr);
    }

    res.json({
      message: "Pengguna berhasil diarsipkan (soft-delete).",
    });
  } catch (error: any) {
    console.error("Failed to soft delete user:", error);
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
      .select("amount")
      .eq("status", "success");

    let totalVolume = 0;
    if (!txError && transactions) {
      transactions.forEach((tx) => {
        const amt = Math.abs(parseFloat(tx.amount || "0"));
        totalVolume += amt;
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
        const balanceResult = await fetchUnifiedBalance("00000000-0000-0000-0000-000000000000", adminWallet, supabase);
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
    });
  } catch (error: any) {
    console.error("Failed to fetch admin stats:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const transactions = await fetchSystemTransactions(limit);
    res.json(transactions);
  } catch (error: any) {
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
      { decision }
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
