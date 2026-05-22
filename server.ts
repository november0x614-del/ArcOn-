import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Lazy initialization of Circle Client

let circleClient: any = null;

function getCircleClient() {
  if (!circleClient) {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
    
    if (!apiKey || !entitySecret) {
      throw new Error("CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET are required for wallet operations.");
    }

    circleClient = initiateDeveloperControlledWalletsClient({
      apiKey,
      entitySecret,
    });
  }
  return circleClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check and Env verification
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      circle_keys: {
        api_key: !!process.env.CIRCLE_API_KEY,
        entity_secret: !!process.env.CIRCLE_ENTITY_SECRET
      }
    });
  });

  // Circle Wallet Routes
  app.post("/api/wallets/create", async (req, res) => {
    try {
      const { userId } = req.body;
      console.log("Creating new wallet for Arc Testnet...");
      const client = getCircleClient();
      
      // 1. Create Wallet Set
      const walletSetResponse = await client.createWalletSet({
        name: "Arc Commerce Wallet Set",
      });

      const walletSet = walletSetResponse.data?.walletSet;
      if (!walletSet?.id) {
        throw new Error("Wallet set creation failed: no ID returned from Circle");
      }

      // 2. Create Wallet in the Set
      const walletResponse = await client.createWallets({
        walletSetId: walletSet.id,
        blockchains: ["ARC-TESTNET"],
        count: 1,
        accountType: "EOA",
      });

      const wallet = walletResponse.data?.wallets?.[0];
      if (!wallet) {
        throw new Error("Wallet creation failed: no wallets array returned from Circle");
      }

      // 3. (Optional) Save to Supabase if userId is provided
      if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { error } = await supabaseAdmin.from('user_wallets').insert({
          id: userId,
          wallet_id: wallet.id,
          wallet_address: wallet.address,
          wallet_set_id: walletSet.id
        });
        if (error) console.error("Failed mapping to Supabase:", error);
      }

      console.log(`Wallet created successfully: ${wallet.address}`);
      res.json({
        walletId: wallet.id,
        address: wallet.address,
        walletSetId: walletSet.id
      });
    } catch (error: any) {
      console.error("Circle API Error detail:", error);
      // Ensure we always return JSON
      res.status(500).json({ 
        error: error.message || "Failed to create wallet",
        details: error.response?.data || null
      });
    }
  });

  // Balance Route
  app.get("/api/balance/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      // In a real app, integrate via Circle or fetch from Supabase
      // For now, return a placeholder that supports fetching
      res.json({ balance: 1250.50, currency: "USDC" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transactions Route
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      // Fetch from Supabase
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', req.params.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook Route
  app.post("/api/circle/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    // 1. Verify Signature
    const signature = req.headers['x-signature-ed25519'] as string;
    const publicKey = process.env.CIRCLE_WEBHOOK_PUBLIC_KEY;
    
    if (!signature || !publicKey) {
      console.error("Missing signature or public key in webhook request");
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const isVerified = crypto.verify(
        'ed25519',
        req.body, // The raw body as Buffer
        Buffer.from(publicKey, 'base64'),
        Buffer.from(signature, 'base64')
      );

      if (!isVerified) {
        console.error("Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      
      console.log("Circle Webhook signature verified successfully");
    } catch (err) {
      console.error("Signature verification error:", err);
      return res.status(401).json({ error: "Signature verification failed" });
    }
    
    // 2. Process Payload
    try {
      const payload = JSON.parse(req.body.toString());
      console.log("Webhook payload processed:", JSON.stringify(payload));
      
      // Update transaction status in Supabase if needed
      // ...
      
      res.status(200).send("Accepted");
      
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Payment Route (Actual Implementation)
  app.post("/api/payments/create", async (req, res) => {
    try {
      const { walletId, destinationAddress, amount, userId } = req.body;
      const client = getCircleClient();
      
      // Initiate transfer
      const response = await client.createTransfer({
        walletId: walletId,
        destinationAddress: destinationAddress,
        amounts: [{ amount: amount, currency: "USD" }], // USDC is often denominated as USD in API
        feeLevel: "MEDIUM",
      });
      
      // Record in Supabase
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: amount,
        type: 'payment',
        status: 'pending',
        internal_ref: response.data?.transfer?.id
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("Payment Execution Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, localContext } = req.body;
      
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      const contents = `
You are Arc AI Agent, a helpful virtual assistant for Arc Commerce and Arc Testnet Wallet.
You help users with USDC transactions on Arc Testnet, wallet management, checking transaction history (simulated context), and troubleshooting web3 payments.

System State / Local Context (Latest data):
${localContext || 'No current state context available.'}

User History Context:
${history.map((msg: any) => `${msg.sender}: ${msg.text}`).join('\n')}

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
      res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
