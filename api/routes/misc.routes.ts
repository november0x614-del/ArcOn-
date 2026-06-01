import express from "express";
import { GoogleGenAI } from "@google/genai";
import { publicClient, getTokenMetadata } from "../services/arcViem";
import { verifyAndProcessWebhook } from "../services/webhook";
import { getSupabaseAdmin } from "../config/supabase";
import { getTokenDetails, executeTransaction } from "../services/circle";
import * as crypto from "crypto";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    circle_keys: {
      api_key: !!process.env.CIRCLE_API_KEY,
      entity_secret: !!process.env.CIRCLE_ENTITY_SECRET,
    },
  });
});

router.get("/rates", async (req, res) => {
  const fromToken = (req.query.from as string) || "USDC";
  const toToken = (req.query.to as string) || "ARC";

  const rates: Record<string, number> = {
    "USDC-ARC": 12.45,
    "ARC-USDC": 0.0803,
    "USDC-EURC": 0.92,
    "EURC-USDC": 1.08,
  };

  const pair = `${fromToken}-${toToken}`;
  const rate = rates[pair] || 1.0;

  res.json({ rate: rate + (Math.random() * 0.001 - 0.0005) });
});

router.post("/faucet/claim", async (req, res) => {
  try {
    const { address, userId } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });

    const supabaseAdmin = getSupabaseAdmin();
    const adminId = "00000000-0000-0000-0000-000000000000";

    let txHash = `faucet_${crypto.randomBytes(8).toString("hex")}`;
    let successMessage = "100 USDC sent to your wallet on Arc Testnet via Circle SDK";
    
    try {
      // Attempt actual Circle transfer from Platform Treasury Account
      const result = await executeTransaction(
        supabaseAdmin,
        adminId,
        100, // 100 USDC
        address,
        "faucet_distribution",
        {
          memo: "USDC Faucet Distribution",
          bypassApproval: true
        }
      );
      if (result && result.txId) {
        txHash = result.txId;
      }
    } catch (circleErr: any) {
      console.warn("Live Circle Faucet execution failed, falling back to instant ledger credit:", circleErr.message);
      successMessage = "100 USDC Faucet claimed successfully (Ledger Top-Up)";
    }

    // Always ensure database is updated to credit user
    if (userId) {
      await getSupabaseAdmin()
        .from("transactions")
        .insert({
          user_id: userId,
          amount: "100.00",
          type: "receive",
          status: "success",
          internal_ref: txHash,
          metadata: {
            from: "Arc Treasury",
            token: "USDC",
            note: "USDC Testnet Faucet Distribution",
          },
        });
    }

    res.json({
      success: true,
      message: successMessage,
      txHash: txHash,
      amount: "100",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tokens", async (_req, res) => {
  // These represent ArcScan Verified "Popular" Tokens
  res.json([
    {
      symbol: "USDC",
      name: "USD Coin",
      color: "bg-[#2775ca]",
      type: "Stablecoin",
      contractAddress: "0x3600000000000000000000000000000000000000",
      decimals: 6,
    },
    {
      symbol: "EURC",
      name: "Euro Coin",
      color: "bg-[#0055ff]",
      type: "Stablecoin",
      contractAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
      decimals: 6,
    },
    {
      symbol: "cirBTC",
      name: "Circle Bitcoin",
      color: "bg-[#f7931a]",
      type: "Wrapped Token",
      contractAddress: "0x07f1ea50e30d47376c0dfb3eb853fd40e3a8907a",
      decimals: 8,
    },
    {
      symbol: "MINT",
      name: "Arc Mintable Assets",
      color: "bg-emerald-600",
      type: "Utility Token",
      contractAddress: "0x4fbc689076bc19ad080bfebd8833fd4038a8faec",
      decimals: 18,
    },
  ]);
});

router.get("/tokens/popular", async (req, res) => {
  // Alias for /tokens - using a simple redirect or just defining the route separately
  res.redirect("/api/tokens");
});

router.get("/tokens/resolve/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address format" });
    }
    const metadata = await getTokenMetadata(address);
    if (!metadata) {
      return res
        .status(404)
        .json({ error: "Contract not found or not a valid token" });
    }
    res.json(metadata);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/tokens/import", async (req, res) => {
  try {
    const { userId, symbol, name, contractAddress, decimals } = req.body;
    if (!userId || !contractAddress)
      return res.status(400).json({ error: "Missing data" });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("user_tokens").upsert(
      {
        user_id: userId,
        symbol,
        name,
        contract_address: contractAddress.toLowerCase(),
        decimals,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id, contract_address" },
    );

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tokens/imported/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("user_tokens")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    res.json(
      data.map((t: any) => ({
        symbol: t.symbol,
        name: t.name,
        contractAddress: t.contract_address,
        decimals: t.decimals,
      })),
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/tokens/imported/:userId/:address", async (req, res) => {
  try {
    const { userId, address } = req.params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("user_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("contract_address", address.toLowerCase());

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tokens/:id", async (req, res) => {
  try {
    const tokenId = req.params.id;
    const details = await getTokenDetails(tokenId);
    if (!details) {
      return res
        .status(404)
        .json({ error: "Token details not found in Circle infrastructure." });
    }
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { message, history, localContext } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const contents = `
You are Lounge AI Agent, a helpful virtual assistant for Lounge and Arc Testnet Wallet.
You help users with USDC transactions on Arc Testnet, wallet management, checking transaction history (simulated context), and troubleshooting web3 payments.

System State / Local Context (Latest data):
${localContext || "No current state context available."}

User History Context:
${history.map((msg: any) => `${msg.sender}: ${msg.text}`).join("\n")}

New User Message: ${message}

Please respond concisely and helpfully in Indonesian. Use the system state context to answer questions about balances or recent transactions directly.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate response" });
  }
});

router.post("/auth/cleanup-unconfirmed", async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email || !username) {
      return res
        .status(400)
        .json({
          error: "Email and username are required for pre-flight cleanup.",
        });
    }

    const supabase = getSupabaseAdmin();

    // 1. Temukan profil berdasarkan username
    const { data: profileByUsername } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (profileByUsername) {
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.admin.getUserById(profileByUsername.id);
      if (!getUserError && user && !user.email_confirmed_at) {
        console.log(
          `[Cleanup] Menghapus user unconfirmed dengan username '${username}' (ID: ${user.id})`,
        );
        await supabase.auth.admin.deleteUser(user.id);
      }
    }

    // 2. Temukan user berdasarkan email jika statusnya belum terkonfirmasi
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();
    if (!listError && users) {
      const matchByEmail = users.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (matchByEmail && !matchByEmail.email_confirmed_at) {
        console.log(
          `[Cleanup] Menghapus user unconfirmed dengan email '${email}' (ID: ${matchByEmail.id})`,
        );
        await supabase.auth.admin.deleteUser(matchByEmail.id);
      }
    }

    res.json({
      success: true,
      message: "Stale unconfirmed credentials cleaned up successfully.",
    });
  } catch (error: any) {
    console.error("Cleanup unconfirmed user error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/webhook/simulate", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const ref = `sim_${crypto.randomBytes(8).toString("hex")}`;
    const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;

    const { error } = await getSupabaseAdmin()
      .from("transactions")
      .insert({
        user_id: userId,
        amount: amount,
        type: "receive",
        status: "success",
        internal_ref: ref,
        metadata: {
          txHash,
          destinationAddress: "Simulated Wallet",
        },
      });

    if (error) throw error;
    
    await getSupabaseAdmin().from("transaction_ledger").insert({
      user_id: userId,
      tx_type: "RECEIVE",
      amount: amount,
      circle_tx_id: ref,
      tx_hash: txHash,
      status: "COMPLETE",
      destination_address: "Simulated Wallet"
    });

    res.status(200).json({ message: "Simulation successful" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Support GET (health-check/verification) and OPTIONS (CORS preflight) alongside POST on the Webhook route
router
  .route("/circle/webhook")
  .options((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, X-Circle-Signature, X-Circle-Key-ID",
    );
    res.status(200).end();
  })
  .get((req, res) => {
    res.status(200).json({
      status: "active",
      message:
        "Lounge Webhook Endpoint. Send a POST request with Circle signature headers to process notifications.",
      timestamp: new Date().toISOString(),
    });
  })
  .post(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    await verifyAndProcessWebhook(req, res, getSupabaseAdmin());
  });

export default router;
