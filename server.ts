import express from "express";
import path from "path";
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
