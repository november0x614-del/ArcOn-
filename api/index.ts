import { verifyAndProcessWebhook } from "./services/webhook.js";
import { logAuditEvent } from "./services/audit.js";
import { createWallet, executeTransaction } from "./services/circle.js";
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
      const { data: existingWallet, error: fetchError } = await getSupabaseAdmin()
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
    const result = await createWallet(getSupabaseAdmin(), userId);
    console.log(`Wallet created successfully: ${result.address}`);
    res.json(result);
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
    const { data, error } = await getSupabaseAdmin()
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
    
    // Check if we have env variables
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Mocking balance as Supabase is not configured yet.");
      return res.json({
        balance: 1540.23,
        realBalance: 1540.23,
        currency: "USDC",
        allBalances: [
          { token: { symbol: 'USDC' }, amount: '1540.23' },
          { token: { symbol: 'EURC' }, amount: '42.50' },
          { token: { symbol: 'ARC' }, amount: '10.0' }
        ]
      });
    }

    // 1. Get the wallet ID from Supabase
    const { data: walletData, error: walletError } = await getSupabaseAdmin()
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
        
        console.log("Circle Balance Response:", JSON.stringify(balanceResponse?.data, null, 2));
        
        if (balanceResponse?.data?.tokenBalances) {
            tokenBalances = balanceResponse.data.tokenBalances;
        }
        
        const usdcToken = tokenBalances.find((b: any) => 
          b.token?.symbol === 'USDC' || b.token?.name?.includes('USDC')
        );
        baseBalance = parseFloat(usdcToken?.amount || '0');
        console.log(`USDC Balance found: ${baseBalance}`);
      } catch (e) {
        console.error("Circle API balance fetch failed", e);
      }
    }

    // Adjust balance based on pending local transactions to improve responsiveness
    // (Circle API might be slow to reflect recent on-chain transfers)
    // Only consider pending transactions from the last 5 minutes to avoid stuck txs breaking balance
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    try {
      const { data: pendingTxs } = await getSupabaseAdmin()
        .from('transactions')
        .select('amount, metadata')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('created_at', fiveMinutesAgo);

      if (pendingTxs) {
        for (const tx of pendingTxs) {
          // Only adjust if it involves USDC (default or explicitly stated)
          const involvesUSDC = !tx.metadata?.fromToken || tx.metadata.fromToken === 'USDC';
          if (involvesUSDC) {
            baseBalance += parseFloat(tx.amount);
          }
        }
      }
    } catch(e) {
      console.error("Pending tx adjust error", e);
    }

    res.json({ 
      balance: Math.max(0, baseBalance), 
      realBalance: baseBalance,
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
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Mocking transactions as Supabase is not configured yet.");
      return res.json([
        { id: '1', user_id: req.params.userId, amount: '50', type: 'receive', status: 'success', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', user_id: req.params.userId, amount: '-10.5', type: 'transfer', status: 'success', created_at: new Date(Date.now() - 86400000).toISOString(), metadata: { recipientName: "Coffee Shop" } },
        { id: '3', user_id: req.params.userId, amount: '100', type: 'swap', status: 'success', created_at: new Date(Date.now() - 172800000).toISOString(), metadata: { fromToken: "USDC", toToken: "ARC" } }
      ]);
    }

    const { data, error } = await getSupabaseAdmin()
      .from('transactions')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook Simulation Route (For Testnet testing only)
app.post("/api/webhook/simulate", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    console.log(`Simulating webhook for user ${userId}, amount ${amount}`);

    const { error } = await getSupabaseAdmin()
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
    const { userId, amount, fromToken, toToken, tokenAddress } = req.body;
    const dexAddress = "0x3333333333333333333333333333333333333333";
    
    const result = await executeTransaction(getSupabaseAdmin(), userId, amount, dexAddress, 'swap', { fromToken, toToken, tokenAddress });
    res.status(200).json({ message: "Swap queued", txId: result.txId });
  } catch (error: any) {
    console.error("Swap Error", error);
    res.status(500).json({ error: error.message });
  }
});

// Real Bridge Execution (Placeholder destination)
app.post("/api/bridge/execute", async (req, res) => {
  try {
    const { userId, amount, fromNetwork, toNetwork } = req.body;
    const bridgeAddress = "0x0000000000000000000000000000000000000000";
    
    const result = await executeTransaction(getSupabaseAdmin(), userId, amount, bridgeAddress, 'transfer', { fromNetwork, toNetwork });
    res.status(200).json({ message: "Bridge transfer queued", txId: result.txId });
  } catch (error: any) {
    console.error("Bridge execute error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Real Withdraw Execution (Burn / Treasury destination)
app.post("/api/withdraw/execute", async (req, res) => {
  try {
    const { userId, amount, bank } = req.body;
    const treasuryAddress = "0x1111111111111111111111111111111111111111"; 

    const result = await executeTransaction(getSupabaseAdmin(), userId, amount, treasuryAddress, 'withdraw', { bank });
    res.status(200).json({ message: "Withdraw queued", txId: result.txId });
  } catch (error: any) {
    console.error("Withdraw Error", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook Route. Note: express.raw middleware needs to be carefully handled in Serverless.
// We apply it inline here.
app.post("/api/circle/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    await verifyAndProcessWebhook(req, res, getSupabaseAdmin());
});

// Payment Route
app.post("/api/payments/create", async (req, res) => {
  try {
    const { walletId, destinationAddress, amount, userId, recipientName } = req.body;
    const client = getCircleClient();
    
    // Audit Log for critical transfers
    if (parseFloat(amount) > 100) {
      await logAuditEvent(getSupabaseAdmin(), userId, 'TRANSFER_HIGH_VALUE', { 
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
    await getSupabaseAdmin().from('transactions').insert({
      user_id: userId,
      amount: `-${amount}`,
      type: 'transfer',
      status: 'pending',
      internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
      metadata: { 
        recipientName: recipientName || "EVM Account", 
        destinationAddress: destinationAddress,
        real: true 
      }
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
    
    // Log batch initiation audit trail
    const totalAmount = recipients.reduce((sum: number, r: any) => sum + parseFloat(r.amount || "0"), 0);
    if (totalAmount > 500) {
      await logAuditEvent(getSupabaseAdmin(), userId, 'BATCH_TRANSFER_HIGH_VALUE', { 
          totalAmount, 
          recipientCount: recipients.length
      });
    }

    const responses = [] as any[];
    let successCount = 0;
    let failureCount = 0;

    for (const rec of recipients) {
       try {
         const response = await client.createTransaction({
           walletId: walletId,
           destinationAddress: rec.address,
           amount: [rec.amount.toString()],
           fee: { type: "level", config: { feeLevel: "LOW" } },
           tokenAddress: "",
           blockchain: "ARC-TESTNET"
         } as any);
         
         await getSupabaseAdmin().from('transactions').insert({
            user_id: userId,
            amount: `-${rec.amount}`,
            type: 'transfer',
            status: 'pending',
            internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
            metadata: {
              recipientName: rec.name || "EVM Account",
              destinationAddress: rec.address,
              real: true
            }
         });
         
         responses.push({
           address: rec.address,
           amount: rec.amount,
           status: 'success',
           txId: response.data?.id
         });
         successCount++;
       } catch (txError: any) {
         console.error(`Failed to process batch recipient: ${rec.address}`, txError);
         
         // Record failed transaction locally to keep user ledger complete & consistent
         await getSupabaseAdmin().from('transactions').insert({
            user_id: userId,
            amount: `-${rec.amount}`,
            type: 'transfer',
            status: 'failed',
            internal_ref: `failed_${crypto.randomBytes(8).toString('hex')}`,
            metadata: {
              recipientName: rec.name || "EVM Account",
              destinationAddress: rec.address,
              real: true
            }
         });

         responses.push({
           address: rec.address,
           amount: rec.amount,
           status: 'failed',
           error: txError.message || "Unknown transaction error"
         });
         failureCount++;
       }
    }
    
    res.json({ 
      success: successCount > 0, 
      successCount, 
      failureCount, 
      transfers: responses 
    });
  } catch (error: any) {
    console.error("Batch Payment Execution Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Real Purchase Execution
app.post("/api/purchase/execute", async (req, res) => {
  try {
    const { userId, amount, product } = req.body;
    const merchantAddress = "0x2222222222222222222222222222222222222222"; 

    const result = await executeTransaction(getSupabaseAdmin(), userId, amount, merchantAddress, 'purchase', { product });
    res.status(200).json({ message: "Purchase queued", txId: result.txId });
  } catch (error: any) {
    console.error("Purchase error", error);
    res.status(500).json({ error: error.message });
  }
});

// Rates Route
app.get("/api/rates", async (_req, res) => {
  // Simple simulation for now
  res.json({ rate: 0.9852 });
});

// Tokens Route
app.get("/api/tokens", async (_req, res) => {
  // Return the list of supported tokens
  res.json([
    { symbol: 'USDC', name: 'USD Coin', color: 'bg-[#2775ca]', type: 'Stablecoin' },
    { symbol: 'EURC', name: 'Euro Coin', color: 'bg-[#0055ff]', type: 'Stablecoin' },
    { symbol: 'cirBTC', name: 'Circle Bitcoin', color: 'bg-[#f7931a]', type: 'Wrapped Token' },
  ]);
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
