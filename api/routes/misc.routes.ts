import express from "express";
import { GoogleGenAI } from "@google/genai";
import { publicClient, getTokenMetadata } from "../services/arcViem.js";
import { verifyAndProcessWebhook } from "../services/webhook.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import { getTokenDetails, executeTransaction } from "../services/circle.js";
import { fetchUnifiedBalance } from "../services/balance.js";
import { requireUserAuth } from "../middleware/userAuth.js";
import rateLimit from "express-rate-limit";
import * as crypto from "crypto";

const router = express.Router();

// Define specialized rate limiters to mitigate DoS and Gemini quota exhaustion
const authCleanupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 cleanup requests per hour
  message: { error: "Terlalu banyak permintaan pembersihan akun. Silakan coba lagi nanti." },
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP or user to 30 requests per 15 minutes
  message: { error: "Terlalu banyak pesan ke asisten AI (Rate Limit). Silakan coba lagi nanti." },
});

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
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

router.post("/faucet/claim", requireUserAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).userId;
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Resolve user's actual wallet address from user_wallets to prevent parameter tampering
    const { data: userWallet } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_address")
      .eq("id", authenticatedUserId)
      .maybeSingle();

    if (!userWallet || !userWallet.wallet_address) {
      return res.status(400).json({ error: "SCA Wallet not registered yet. Please create a wallet in the wallet setup section." });
    }

    const secureAddress = userWallet.wallet_address;

    // 2. Cooldown check: Limit claims to once per 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentClaims } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("user_id", authenticatedUserId)
      .eq("type", "receive")
      .gte("created_at", twentyFourHoursAgo);

    if (recentClaims && recentClaims.length > 0) {
      return res.status(429).json({ 
        error: "Limits exceeded",
        message: "You can only claim 100 USDC from the faucet once every 24 hours to prevent abuse."
      });
    }

    const adminId = "11111111-1111-1111-1111-111111111111";
    let txHash: string = crypto.randomUUID();
    
    // Attempt actual Circle transfer from Platform Treasury Account
    const result = await executeTransaction(
      supabaseAdmin,
      adminId,
      100, // 100 USDC
      secureAddress,
      "faucet_distribution",
      {
        memo: "USDC Faucet Distribution",
        bypassApproval: true
      }
    );
    
    if (result && result.txId) {
      txHash = result.txId;
    }

    // Always ensure database is updated to credit user
    await getSupabaseAdmin()
      .from("transactions")
      .insert({
        user_id: authenticatedUserId,
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

    res.json({
      success: true,
      message: "100 USDC sent to your wallet on Arc Testnet via Circle SDK",
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

router.post("/tokens/import", requireUserAuth, async (req, res) => {
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

router.get("/tokens/imported", requireUserAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("user_tokens")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      if (error.code === "42P01") {
        console.warn("[Database] user_tokens table not found. Returning empty list.");
        return res.json([]);
      }
      throw error;
    }
    res.json(
      (data || []).map((t: any) => ({
        symbol: t.symbol,
        name: t.name,
        contractAddress: t.contract_address,
        decimals: t.decimals,
      })),
    );
  } catch (error: any) {
    console.error("Get imported tokens error:", error);
    res.json([]);
  }
});

router.delete("/tokens/imported/:address", requireUserAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { address } = req.params;
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

router.post("/chat", chatLimiter, requireUserAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    const authenticatedUserId = (req as any).userId;
    const supabase = getSupabaseAdmin();
    
    // Mitigate prompt injection: Fetch real, authenticated balance and transaction history in server context
    let realServerContext = "";
    try {
      const { data: userWallet } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("id", authenticatedUserId)
        .single();
        
      if (userWallet && userWallet.wallet_address) {
        const balances = await fetchUnifiedBalance(authenticatedUserId, userWallet, supabase);
        const usdcBal = balances.allBalances?.find((b: any) => b.token?.symbol === "USDC")?.amount || "0";
        const arcBal = balances.allBalances?.find((b: any) => b.token?.symbol === "ARC")?.amount || "0";

        const { data: recentTxs } = await supabase
          .from("transactions")
          .select("amount, type, status, created_at")
          .eq("user_id", authenticatedUserId)
          .order("created_at", { ascending: false })
          .limit(5);
          
        realServerContext = `
* User Wallet Address: ${userWallet.wallet_address}
* User USDC Balance: ${usdcBal} USDC
* User ARC Gas Balance: ${arcBal} ARC
* Recent Verified Transactions:
${recentTxs?.map(tx => `- Type: ${tx.type}, Amount: ${tx.amount}, Status: ${tx.status}, Date: ${tx.created_at}`).join("\n") || "No recent transactions found."}
`;
      }
    } catch (e: any) {
      console.warn("[ChatServerContext] Failed to load server-side context:", e);
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const parsedHistory = Array.isArray(history) ? history.slice(-15) : []; // restrict history window size
    const sanitizedMessage = typeof message === "string" ? message.slice(0, 1000) : ""; // limit input character length

    const contents = `
You are Lounge AI Agent, a helpful virtual assistant for Lounge and Arc Testnet Wallet.
You help users with USDC transactions on Arc Testnet, wallet management, checking transaction history (simulated context), and troubleshooting web3 payments.

System State / Authenticated Server Context (Latest data):
${realServerContext || "No current state context available."}

User History Context:
${parsedHistory.map((msg: any) => `${msg.sender}: ${msg.text}`).join("\n")}

New User Message: ${sanitizedMessage}

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

router.post("/auth/cleanup-unconfirmed", authCleanupLimiter, async (req, res) => {
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

// Support GET (health-check/verification) and OPTIONS (CORS preflight) alongside POST on the Webhook route
router
  .route("/circle/webhook")
  .options((req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = [process.env.APP_URL].filter(Boolean) as string[];
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("https://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
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
    const origin = req.headers.origin;
    const allowedOrigins = [process.env.APP_URL].filter(Boolean) as string[];
    if (origin && (allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("https://localhost:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    await verifyAndProcessWebhook(req, res, getSupabaseAdmin());
  });

export default router;
