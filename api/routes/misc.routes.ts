import express from "express";
import { GoogleGenAI } from "@google/genai";
import { publicClient } from "../services/arcViem.js";
import { verifyAndProcessWebhook } from "../services/webhook.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import { getTokenDetails } from "../services/circle.js";
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

    // 1. Simulate ARC (Gas) sending
    const arcHash = `0x${crypto.randomBytes(32).toString("hex")}`;

    // 2. Simulate USDC (Commerce) sending if userId is known
    // In a real app we'd use Circle API to transfer from merchant/treasury back to user
    // Here we just insert a 'receive' record in Supabase to 'top-up' the user logically
    if (userId) {
      await getSupabaseAdmin()
        .from("transactions")
        .insert({
          user_id: userId,
          amount: "100.00",
          type: "receive",
          status: "success",
          internal_ref: `faucet_${crypto.randomBytes(8).toString("hex")}`,
          metadata: {
            from: "Arc Treasury",
            token: "USDC",
            note: "Faucet Distribution",
          },
        });
    }

    res.json({
      success: true,
      message: "10 ARC & 100 USDC sent to your wallet",
      txHash: arcHash,
      amount: "110",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tokens", async (_req, res) => {
  res.json([
    {
      symbol: "USDC",
      name: "USD Coin",
      color: "bg-[#2775ca]",
      type: "Stablecoin",
      contractAddress: "0x3600000000000000000000000000000000000000",
    },
    {
      symbol: "EURC",
      name: "Euro Coin",
      color: "bg-[#0055ff]",
      type: "Stablecoin",
      contractAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    },
    {
      symbol: "cirBTC",
      name: "Circle Bitcoin",
      color: "bg-[#f7931a]",
      type: "Wrapped Token",
      contractAddress: "0x07f1ea50e30d47376c0dfb3eb853fd40e3a8907a",
    },
  ]);
});

router.get("/tokens/:id", async (req, res) => {
  try {
    const tokenId = req.params.id;
    const details = await getTokenDetails(tokenId);
    if (!details) {
      return res.status(404).json({ error: "Token details not found in Circle infrastructure." });
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
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

router.post("/webhook/simulate", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const { error } = await getSupabaseAdmin()
      .from("transactions")
      .insert({
        user_id: userId,
        amount: amount,
        type: "receive",
        status: "success",
        internal_ref: `sim_${crypto.randomBytes(8).toString("hex")}`,
      });

    if (error) throw error;
    res.status(200).json({ message: "Simulation successful" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/circle/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    await verifyAndProcessWebhook(req, res, getSupabaseAdmin());
  },
);

export default router;
