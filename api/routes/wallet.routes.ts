import express from "express";
import { getSupabaseAdmin } from "../config/supabase.js";
import { createWallet } from "../services/circle.js";
import { fetchUnifiedBalance } from "../services/balance.js";
import { publicClient } from "../services/arcViem.js";
import { formatUnits } from "viem";

const router = express.Router();

router.get("/wallets/resolve/:address", async (req, res) => {
  try {
    const { address } = req.params;

    // Find the wallet owner in user_wallets using Admin privileges
    const { data: walletData, error: walletError } = await getSupabaseAdmin()
      .from("user_wallets")
      .select("id")
      .ilike("wallet_address", address)
      .maybeSingle();

    if (walletError || !walletData?.id) {
      return res
        .status(404)
        .json({ error: "Address not found in internal network." });
    }

    // Now find the profile associated with that user ID
    const { data: profileData, error: profileError } = await getSupabaseAdmin()
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", walletData.id)
      .maybeSingle();

    if (profileError || !profileData) {
      return res.status(404).json({ error: "Profile not found." });
    }

    res.json({
      name: profileData.full_name || profileData.username,
      username: profileData.username,
      avatarUrl: profileData.avatar_url,
      isArcUser: true,
    });
  } catch (error: any) {
    console.error("Resolve error:", error);
    res.status(500).json({ error: "Failed to resolve address" });
  }
});

router.post("/wallets/create", async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(`[WalletGuard] Checking if wallet exists for user ${userId}...`);

    if (!userId) {
      return res.status(400).json({ error: "Missing required parameter: userId" });
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: existingWallet, error: fetchError } =
        await getSupabaseAdmin()
          .from("user_wallets")
          .select("*")
          .eq("id", userId)
          .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("[CRITICAL_DATABASE_ERROR] Supabase wallet lookup failed:", fetchError);
        // CRITICAL PROTECTION: Abort immediately on fetch error (e.g., timeout, connection issues)
        // to prevent false positives where we think user has no wallet and generate a duplicate.
        return res.status(500).json({
          error: "Database error during wallet validation. Connection problem or query failed.",
          details: fetchError,
          protectionTriggered: true
        });
      }

      if (existingWallet) {
        console.log(`[WalletGuard] Wallet already exists in database: ${existingWallet.wallet_address}. Re-using to prevent asset loss.`);
        return res.json({
          walletId: existingWallet.wallet_id,
          address: existingWallet.wallet_address,
          walletSetId: existingWallet.wallet_set_id,
        });
      }
    } else {
      console.warn("[WalletGuard] SUPABASE_SERVICE_ROLE_KEY not configured. Checking database bypassed. Proceeding is prohibited.");
      return res.status(500).json({ error: "Server misconfiguration. Database service access key is missing." });
    }

    console.log(`[WalletGuard] No existing wallet found for user ${userId}. Creating new SCA wallet on Arc Testnet...`);
    const result = await createWallet(getSupabaseAdmin(), userId);
    console.log(`[WalletGuard] Wallet created successfully: ${result.address}`);
    res.json(result);
  } catch (error: any) {
    console.error("[WalletGuard] Circle API / Database mapping Error detail:", error);
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
      console.log(
        `No wallet address found for user ${userId}, returning empty`,
      );
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

router.get("/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      data: { user },
      error,
    } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    if (error || !user)
      return res.status(404).json({ error: "User not found" });
    res.json(
      user.user_metadata?.preferences || {
        favorites: [],
        deletedContactIds: [],
      },
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    const {
      data: { user },
    } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    const newMetadata = {
      ...user?.user_metadata,
      preferences: {
        ...(user?.user_metadata?.preferences || {}),
        ...preferences,
      },
    };

    await getSupabaseAdmin().auth.admin.updateUserById(userId, {
      user_metadata: newMetadata,
    });
    res.json({ success: true, preferences: newMetadata.preferences });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
