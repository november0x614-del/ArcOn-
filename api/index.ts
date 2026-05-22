import { verifyAndProcessWebhook } from "../src/services/webhookHandler";
import { logAuditEvent } from "../src/services/auditLogger";
import express from "express";
import * as crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let supabaseAdminInstance: any = null;

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const rawBackendUrl = process.env.VITE_SUPABASE_URL || "";
    const cleanUrl = rawBackendUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    
    if (!cleanUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }

    supabaseAdminInstance = createClient(
      cleanUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return supabaseAdminInstance;
}

const supabaseAdmin: any = new Proxy({}, {
  get: (_target, prop) => {
    return getSupabaseAdmin()[prop];
  }
});

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

const app = express();

// Important: Next.js API Routes / Vercel Serverless automatically parses JSON for you in some setups,
// but for an exported Express app to work locally and on Vercel Node, we should use express.json().
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
    console.log("Checking if wallet exists...");
    
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: existingWallet, error: fetchError } = await supabaseAdmin
        .from('user_wallets')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Supabase fetch error:", fetchError);
      }
        
      if (existingWallet) {
        console.log(`Wallet already exists: ${existingWallet.wallet_address}`);
        return res.json({
          walletId: existingWallet.wallet_id,
          address: existingWallet.wallet_address,
          walletSetId: existingWallet.wallet_set_id
        });
      }
    }

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

    // 3. Save to Supabase if userId is provided
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await supabaseAdmin.from('user_wallets').upsert({
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
    res.status(500).json({ 
      error: error.message || "Failed to create wallet",
      details: error.response?.data || null
    });
  }
});

// Debug Route: Get wallet details
app.get("/api/debug-wallet/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('user_wallets')
      .select('wallet_id, wallet_address')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
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
    
    if (walletError && walletError.code !== 'PGRST116') {
       console.error("Error fetching wallet ID:", walletError);
    }
    
    let baseBalance = 0;
    let tokenBalances = [];
    let walletId = walletData?.wallet_id;

    if (!walletError && walletId) {
      const client = getCircleClient();
      console.log(`Fetching balance for wallet ID: ${walletId}`);
      
      try {
        const balanceResponse = await client.getWalletTokenBalance({
          id: walletId
        });
        
        if (balanceResponse?.data?.tokenBalances) {
            tokenBalances = balanceResponse.data.tokenBalances;
        }
        
        const usdcToken = tokenBalances.find((b: any) => 
          b.token?.symbol === 'USDC' || b.token?.name?.includes('USDC')
        );
        baseBalance = parseFloat(usdcToken?.amount || '0');
      } catch (e) {
        console.error("Circle API balance fetch failed", e);
      }
    }

    // Add Simulated balances (from webhook simulator) to reflect in UI
    const { data: simData } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'success')
      .like('internal_ref', 'sim_%');

    let simBalance = 0;
    if (simData && simData.length > 0) {
      simBalance = simData.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);
    }
    
    const totalBalance = baseBalance + simBalance;

    res.json({ 
      balance: totalBalance, 
      currency: "USDC",
      allBalances: tokenBalances
    });
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Transactions Route
app.get("/api/transactions/:userId", async (req, res) => {
  try {
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

    const { error } = await supabaseAdmin
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

// Swap Real Execution
app.post("/api/swap/execute", async (req, res) => {
  try {
    const { userId, amount, fromToken, toToken } = req.body;
    
    const { data: walletData } = await supabaseAdmin
      .from('user_wallets').select('wallet_id').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();
    const dexAddress = "0x3333333333333333333333333333333333333333";

    const response = await client.createTransaction({
      walletId: walletData.wallet_id,
      destinationAddress: dexAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${parseFloat(amount).toFixed(2)}`,
        type: 'swap',
        status: 'pending',
        internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
        metadata: { fromToken, toToken, real: true }
    });

    if (error) throw error;
    res.status(200).json({ message: "Swap queued", txId: response.data?.id });
  } catch (error: any) {
    console.error("Swap Error", error);
    res.status(500).json({ error: error.message });
  }
});

// Real Bridge Execution (Placeholder destination)
app.post("/api/bridge/execute", async (req, res) => {
  try {
    const { userId, amount, fromNetwork, toNetwork } = req.body;
    
    const { data: walletData } = await supabaseAdmin
      .from('user_wallets').select('wallet_id').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();
    const bridgeAddress = "0x0000000000000000000000000000000000000000";

    const response = await client.createTransaction({
      walletId: walletData.wallet_id,
      destinationAddress: bridgeAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      amount: `-${parseFloat(amount).toFixed(2)}`,
      type: 'transfer',
      status: 'pending',
      internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
      metadata: { fromNetwork, toNetwork, real: true }
    });

    if (error) throw error;
    res.status(200).json({ message: "Bridge transfer queued", txId: response.data?.id });
  } catch (error: any) {
    console.error("Bridge execute error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Real Withdraw Execution (Burn / Treasury destination)
app.post("/api/withdraw/execute", async (req, res) => {
  try {
    const { userId, amount, bank } = req.body;

    const { data: walletData } = await supabaseAdmin
      .from('user_wallets').select('wallet_id').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();
    const treasuryAddress = "0x1111111111111111111111111111111111111111"; 

    const response = await client.createTransaction({
      walletId: walletData.wallet_id,
      destinationAddress: treasuryAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${parseFloat(amount).toFixed(2)}`,
        type: 'withdraw',
        status: 'pending',
        internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
        metadata: { bank, real: true }
    });

    if (error) throw error;
    res.status(200).json({ message: "Withdraw queued", txId: response.data?.id });
  } catch (error: any) {
    console.error("Withdraw Error", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook Route. Note: express.raw middleware needs to be carefully handled in Serverless.
// We apply it inline here.
app.post("/api/circle/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    await verifyAndProcessWebhook(req, res, supabaseAdmin);
});

// Payment Route
app.post("/api/payments/create", async (req, res) => {
  try {
    const { walletId, destinationAddress, amount, userId } = req.body;
    const client = getCircleClient();
    
    // Audit Log for critical transfers
    if (parseFloat(amount) > 100) {
      await logAuditEvent(supabaseAdmin, userId, 'TRANSFER_HIGH_VALUE', { 
          amount, 
          destinationAddress 
      });
    }

    // Initiate transfer
    const response = await client.createTransaction({
      walletId: walletId,
      destinationAddress: destinationAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);
    
    // Record in Supabase
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      amount: `-${amount}`,
      type: 'transfer',
      status: 'pending',
      internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error("Payment Execution Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Batch Payment Route
app.post("/api/payments/batch", async (req, res) => {
  try {
    const { walletId, recipients, userId } = req.body;
    const client = getCircleClient();
    
    const responses = [];
    for (const rec of recipients) {
       const response = await client.createTransaction({
         walletId: walletId,
         destinationAddress: rec.address,
         amount: [rec.amount.toString()],
         fee: { type: "level", config: { feeLevel: "LOW" } },
         tokenAddress: "",
         blockchain: "ARC-TESTNET"
       } as any);
       
       await supabaseAdmin.from('transactions').insert({
          user_id: userId,
          amount: `-${rec.amount}`,
          type: 'transfer',
          status: 'pending',
          internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`
       });
       responses.push(response.data);
    }
    
    res.json({ success: true, transfers: responses });
  } catch (error: any) {
    console.error("Batch Payment Execution Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Real Purchase Execution
app.post("/api/purchase/execute", async (req, res) => {
  try {
    const { userId, amount, product } = req.body;

    const { data: walletData } = await supabaseAdmin
      .from('user_wallets').select('wallet_id').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();
    const merchantAddress = "0x2222222222222222222222222222222222222222"; 

    const response = await client.createTransaction({
      walletId: walletData.wallet_id,
      destinationAddress: merchantAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${parseFloat(amount).toFixed(2)}`,
        type: 'purchase',
        status: 'pending',
        internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
        metadata: { product, real: true }
    });

    if (error) throw error;
    res.status(200).json({ message: "Purchase queued", txId: response.data?.id });
  } catch (error: any) {
    console.error("Purchase error", error);
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

export default app;
