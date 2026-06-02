import express from "express";
import { getDelegateAdapter, unifiedBalanceKit } from "../services/unifiedBalance";
import { getSupabaseAdmin } from "../config/supabase";

const router = express.Router();
const supabase = getSupabaseAdmin();

// Fetch balances
router.get("/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const balances = await unifiedBalanceKit.getBalances({
      sources: { address: address },
      networkType: "testnet",
      includePending: true,
    });
    res.json(balances);
  } catch (error: any) {
    console.error("Unified Balance fetch error:", error);
    res.status(500).json({ error: "Failed to fetch balances" });
  }
});

// Helper to get delegate key
const getDelegateKey = async (userId: string) => {
  const { data: walletData, error } = await supabase
    .from("user_wallets")
    .select("delegate_private_key")
    .eq("id", userId)
    .single();

  if (error || !walletData?.delegate_private_key) {
    throw new Error("Delegate wallet not configured for user");
  }
  return walletData.delegate_private_key;
};

// Deposit into user's balance
router.post("/deposit", async (req, res) => {
  try {
    const { amount, userAddress, userId, chain } = req.body;
    const privateKey = await getDelegateKey(userId);
    const delegateAdapter = getDelegateAdapter(privateKey);

    const result = await unifiedBalanceKit.depositFor({
      from: { adapter: delegateAdapter, chain: chain || "Base_Sepolia" },
      amount: amount,
      token: "USDC",
      depositAccount: userAddress,
    });
    res.json(result);
  } catch (error: any) {
    console.error("Unified Deposit error:", error);
    res.status(500).json({ error: error.message || "Failed to deposit" });
  }
});

// Spend from user's balance
router.post("/spend", async (req, res) => {
  try {
    const { amount, userAddress, userId, recipientAddress, chain } = req.body;
    const privateKey = await getDelegateKey(userId);
    const delegateAdapter = getDelegateAdapter(privateKey);

    const result = await unifiedBalanceKit.spend({
      amount: amount,
      token: "USDC",
      from: [
        {
          adapter: delegateAdapter,
          sourceAccount: userAddress,
        },
      ],
      to: {
        adapter: delegateAdapter,
        chain: chain || "Arc_Testnet",
        recipientAddress,
      },
    });
    res.json(result);
  } catch (error: any) {
    console.error("Unified Spend error:", error);
    res.status(500).json({ error: error.message || "Failed to spend" });
  }
});

export default router;
