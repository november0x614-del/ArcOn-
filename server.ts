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
      
      // 1. Get the wallet ID from Supabase
      const { data: walletData, error: walletError } = await supabaseAdmin
        .from('user_wallets')
        .select('wallet_id')
        .eq('id', userId)
        .single();
      
      if (walletError || !walletData) {
        // Fallback for demo
        return res.json({ balance: 0, currency: "USDC" });
      }

      // 2. Query Circle API for balance
      const client = getCircleClient();
      console.log(`Fetching balance for wallet ID: ${walletData.wallet_id}`);
      
      const walletResponse = await client.getWallet({
        id: walletData.wallet_id
      });
      
      console.log("Wallet Response:", JSON.stringify(walletResponse, null, 2));
      
      const usdcBalance = walletResponse.data?.wallet?.tokenBalances?.find((b: any) => b.tokenSymbol === 'USDC')?.amount || '0';
      console.log(`Parsed USDC Balance: ${usdcBalance}`);
      
      res.json({ balance: parseFloat(usdcBalance), currency: "USDC" });
    } catch (error: any) {
      console.error("Balance fetch error:", error);
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

  // Webhook Simulation Route (For Testnet testing only)
  app.post("/api/webhook/simulate", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      console.log(`Simulating webhook for user ${userId}, amount ${amount}`);

      // 1. Insert a transaction record
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          amount: amount,
          type: 'receive',
          status: 'success',
          internal_ref: `sim_${crypto.randomBytes(8).toString('hex')}`
        });

      if (error) throw error;

      res.status(200).json({ message: "Simulation successful" });
    } catch (error: any) {
      console.error("Simulation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Swap Simulation Route (For Testnet testing only)
  app.post("/api/swap/simulate", async (req, res) => {
    try {
      const { userId, amount, fromToken, toToken } = req.body;
      console.log(`Simulating swap for user ${userId}, amount ${amount} ${fromToken} -> ${toToken}`);

      // 1. Insert interaction records for the swap
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          amount: amount,
          type: 'swap',
          status: 'success',
          internal_ref: `swap_${crypto.randomBytes(8).toString('hex')}`,
          metadata: { fromToken, toToken }
        });

      if (error) throw error;

      res.status(200).json({ message: "Swap executed successfully", txHash: `0xarc${crypto.randomBytes(4).toString('hex')}` });
    } catch (error: any) {
      console.error("Swap error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook Route
  // Public key cache
  const publicKeyCache: Record<string, { publicKey: string, algorithm: string }> = {};

  async function getCirclePublicKey(keyId: string): Promise<{ publicKey: string, algorithm: string }> {
    if (publicKeyCache[keyId]) {
      return publicKeyCache[keyId];
    }
    
    // Fetch from Circle API
    const response = await fetch(`https://api.circle.com/v1/notifications/publicKey/${keyId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.CIRCLE_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch public key from Circle: ${response.statusText}`);
    }

    const data = await response.json();
    const { publicKey, algorithm } = data.data;
    
    publicKeyCache[keyId] = { publicKey, algorithm };
    return { publicKey, algorithm };
  }

  app.post("/api/circle/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    // 1. Verify Signature
    const signature = req.headers['x-circle-signature'] as string;
    const keyId = req.headers['x-circle-key-id'] as string;
    
    if (!signature || !keyId) {
      console.error("Missing signature or key ID in webhook request headers");
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { publicKey, algorithm } = await getCirclePublicKey(keyId);
      
      // Determine signature verification method
      let isVerified = false;
      const keyBuffer = Buffer.from(publicKey, 'base64');
      const signatureBuffer = Buffer.from(signature, 'base64');

      if (algorithm === 'ED25519') {
        isVerified = crypto.verify(
          'ed25519',
          req.body,
          keyBuffer,
          signatureBuffer
        );
      } else if (algorithm === 'ECDSA_SHA_256') {
        // ECDSA verification
        isVerified = crypto.verify(
          'sha256',
          req.body,
          {
            key: keyBuffer,
            dsaEncoding: 'ieee-p1363' // Often needed for Circle's ECDSA
          },
          signatureBuffer
        );
      } else {
        console.error(`Unsupported algorithm: ${algorithm}`);
        return res.status(401).json({ error: "Unsupported algorithm" });
      }

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
      const { type, data } = JSON.parse(req.body.toString());
      console.log(`Webhook received: ${type}`);

      // Circle transfers usually contain an ID that maps to our internal_ref
      if (type === 'transfers.updated' || type === 'transfers.created') {
        const transfer = data;
        const internalRef = transfer.id;
        // Map Circle status to our status
        const newStatus = transfer.status === 'COMPLETE' ? 'success' : 
                          transfer.status === 'FAILED' ? 'failed' : 'pending';

        const { error } = await supabaseAdmin
          .from('transactions')
          .update({ status: newStatus })
          .eq('internal_ref', internalRef);

        if (error) {
          console.error("Supabase update error:", error);
        } else {
          console.log(`Transaction ${internalRef} updated to ${newStatus}`);
        }
      }

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
