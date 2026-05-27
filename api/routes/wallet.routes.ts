import express from "express";
import { getSupabaseAdmin } from "../config/supabase.js";
import { createWallet } from "../services/circle.js";
import { fetchUnifiedBalance } from "../services/balance.js";
import { publicClient } from "../services/arcViem.js";
import { formatUnits } from "viem";

const router = express.Router();

router.post("/wallets/create", async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("Checking if wallet exists...");

    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: existingWallet, error: fetchError } =
        await getSupabaseAdmin()
          .from("user_wallets")
          .select("*")
          .eq("id", userId)
          .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Supabase fetch error:", fetchError);
      }

      if (existingWallet) {
        console.log(`Wallet already exists: ${existingWallet.wallet_address}`);
        return res.json({
          walletId: existingWallet.wallet_id,
          address: existingWallet.wallet_address,
          walletSetId: existingWallet.wallet_set_id,
        });
      }
    }

    console.log("Creating new wallet for Arc Testnet...");
    const result = await createWallet(getSupabaseAdmin(), userId);
    console.log(`Wallet created successfully: ${result.address}`);
    res.json(result);
  } catch (error: any) {
    console.error("Circle API Error detail:", error);
    res.status(500).json({
      error: error.message || "Failed to create wallet",
      details: error.response?.data || null,
    });
  }
});

router.get("/debug-wallet/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await getSupabaseAdmin()
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/balance/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdmin();

    const { data: walletData } = await supabase
      .from("user_wallets")
      .select("wallet_id, wallet_address")
      .eq("id", userId)
      .single();

    const balanceResult = await fetchUnifiedBalance(
      userId,
      walletData,
      supabase,
    );
    res.json(balanceResult);
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/balance/:userId/tokens", async (req, res) => {
  try {
    const { userId } = req.params;
    const contractsParam = (req.query.contracts as string) || "";
    const contractAddresses = contractsParam ? contractsParam.split(",") : [];

    const { data: walletData, error: walletError } = await getSupabaseAdmin()
      .from("user_wallets")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (walletError || !walletData?.wallet_address) {
      console.log(`No wallet address found for user ${userId}, returning empty`);
      return res.json({ balances: {} });
    }

    const walletAddress = walletData.wallet_address;
    const balances: Record<string, number> = {};

    await Promise.all(
      contractAddresses.map(async (contractAddr) => {
        try {
          const cleanAddr = contractAddr.toLowerCase().trim();
          if (!cleanAddr.startsWith("0x")) return;

          const decimals = (await publicClient
            .readContract({
              address: cleanAddr as `0x${string}`,
              abi: [
                {
                  name: "decimals",
                  type: "function",
                  stateMutability: "view",
                  inputs: [],
                  outputs: [{ name: "", type: "uint8" }],
                },
              ],
              functionName: "decimals",
            } as any)
            .catch(() => 18)) as number;

          const rawBalance = (await publicClient
            .readContract({
              address: cleanAddr as `0x${string}`,
              abi: [
                {
                  name: "balanceOf",
                  type: "function",
                  stateMutability: "view",
                  inputs: [{ name: "owner", type: "address" }],
                  outputs: [{ name: "balance", type: "uint256" }],
                },
              ],
              functionName: "balanceOf",
              args: [walletAddress as `0x${string}`],
            } as any)
            .catch(() => 0n)) as bigint;

          balances[cleanAddr] = rawBalance
            ? parseFloat(formatUnits(rawBalance, decimals))
            : 0;
        } catch (e) {
          console.warn(
            `Fallback: token balance query issue for ${contractAddr}:`,
            e instanceof Error ? e.message : e,
          );
          balances[contractAddr.toLowerCase().trim()] = 0.0;
        }
      }),
    );

    res.json({ balances });
  } catch (error: any) {
    console.error("Custom token balances fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
