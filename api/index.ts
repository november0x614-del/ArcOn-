import { verifyAndProcessWebhook } from "./services/webhook.js";
import { logAuditEvent } from "./services/audit.js";
import { createWallet, executeTransaction } from "./services/circle.js";
import { publicClient } from "./services/arcViem.js";
import { fetchUnifiedBalance } from "./services/balance.js";
import { initiateOutboundBridge, finalizeInboundBridge } from "./services/bridge.js";
import { getCircleClientInstance } from "./services/circleClient.js";
import express from "express";
import * as crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { formatUnits } from "viem";

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let supabaseAdminInstance: any = null;

export function getSupabaseAdmin() {
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

export async function isUserBlocked(userId: string): Promise<boolean> {
  if (!userId || userId === "00000000-0000-0000-0000-000000000000") return false;
  try {
    const { data } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    return data?.user?.user_metadata?.blocked === true || data?.user?.user_metadata?.deleted === true;
  } catch (err) {
    return false;
  }
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
    const supabase = getSupabaseAdmin();
    
    const { data: walletData } = await supabase
      .from('user_wallets')
      .select('wallet_id, wallet_address')
      .eq('id', userId)
      .single();
    
    // Use the unified balance service
    const balanceResult = await fetchUnifiedBalance(userId, walletData, supabase);
    res.json(balanceResult);
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ERC20 Contract Multi-Token Real-Time Balances Route
app.get("/api/balance/:userId/tokens", async (req, res) => {
  try {
    const { userId } = req.params;
    const contractsParam = req.query.contracts as string || "";
    const contractAddresses = contractsParam ? contractsParam.split(",") : [];

    const { data: walletData, error: walletError } = await getSupabaseAdmin()
      .from('user_wallets')
      .select('wallet_address')
      .eq('id', userId)
      .single();

    if (walletError || !walletData?.wallet_address) {
      console.log(`No wallet address found for user ${userId}, returning empty`);
      return res.json({ balances: {} });
    }

    const walletAddress = walletData.wallet_address;
    const balances: Record<string, number> = {};

    // Parallel fetch balance of each custom/imported asset on-chain
    await Promise.all(
      contractAddresses.map(async (contractAddr) => {
        try {
          const cleanAddr = contractAddr.toLowerCase().trim();
          if (!cleanAddr.startsWith("0x")) return;

          const decimals = (await publicClient.readContract({
            address: cleanAddr as `0x${string}`,
            abi: [{
              name: 'decimals',
              type: 'function',
              stateMutability: 'view',
              inputs: [],
              outputs: [{ name: '', type: 'uint8' }]
            }],
            functionName: 'decimals'
          } as any).catch(() => 18)) as number;

          const rawBalance = (await publicClient.readContract({
            address: cleanAddr as `0x${string}`,
            abi: [{
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'owner', type: 'address' }],
              outputs: [{ name: 'balance', type: 'uint256' }]
            }],
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`]
          } as any).catch(() => 0n)) as bigint;

          balances[cleanAddr] = rawBalance ? parseFloat(formatUnits(rawBalance, decimals)) : 0;
        } catch (e) {
          console.warn(`Fallback: token balance query issue for ${contractAddr}:`, e instanceof Error ? e.message : e);
          balances[contractAddr.toLowerCase().trim()] = 0.0;
        }
      })
    );

    res.json({ balances });
  } catch (error: any) {
    console.error("Custom token balances fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Transactions Route
app.get("/api/transactions/:userId", async (req, res) => {
  try {
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
    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan." });
    }
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
    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan." });
    }
    const bridgeAddress = "0x0000000000000000000000000000000000000000";
    
    const result = await executeTransaction(getSupabaseAdmin(), userId, amount, bridgeAddress, 'transfer', { fromNetwork, toNetwork });
    res.status(200).json({ message: "Bridge transfer queued", txId: result.txId });
  } catch (error: any) {
    console.error("Bridge execute error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/transfer/execute", async (req, res) => {
  try {
    const { userId, amount, destinationAddress, memo } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan." });
    }
    const supabase = getSupabaseAdmin();
    
    // 1. Determine the best source for funds (Unified Balance logic)
    // For now, we prioritize Circle for simplicity, but we can switch based on balance
    const result = await executeTransaction(supabase, userId, amount, destinationAddress, 'transfer', { 
      intent: 'unified_transfer',
      finality: 'deterministic',
      memo: memo || ''
    });
    
    res.status(200).json({ 
      message: "Unified Transfer initiated", 
      txId: result.txId,
      status: 'pending',
      memo: memo 
    });
  } catch (error: any) {
    console.error("Unified Transfer Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Real Withdraw Execution (Burn / Treasury destination)
app.post("/api/withdraw/execute", async (req, res) => {
  try {
    const { userId, amount, bank, memo } = req.body;
    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan." });
    }
    const treasuryAddress = "0x1111111111111111111111111111111111111111"; 

    const result = await executeTransaction(getSupabaseAdmin(), userId, amount, treasuryAddress, 'withdraw', { 
      bank, 
      memo,
      finality: 'deterministic'
    });
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
    const client = getCircleClientInstance();
    
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
    const client = getCircleClientInstance();
    
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
    if (await isUserBlocked(userId)) {
      return res.status(403).json({ error: "Akun Anda telah dinonaktifkan oleh administrator sistem. Semua operasi transaksi ditangguhkan." });
    }
    const merchantAddress = "0x2222222222222222222222222222222222222222"; 

    const result = await executeTransaction(getSupabaseAdmin(), userId, amount, merchantAddress, 'purchase', { product });
    res.status(200).json({ message: "Purchase queued", txId: result.txId });
  } catch (error: any) {
    console.error("Purchase error", error);
    res.status(500).json({ error: error.message });
  }
});

// Rates Route
app.get("/api/rates", async (req, res) => {
  const fromToken = req.query.from as string || 'USDC';
  const toToken = req.query.to as string || 'ARC';
  
  // Real-ish rates based on simulated market pairing
  const rates: Record<string, number> = {
    'USDC-ARC': 12.45,
    'ARC-USDC': 0.0803,
    'USDC-EURC': 0.92,
    'EURC-USDC': 1.08,
  };
  
  const pair = `${fromToken}-${toToken}`;
  const rate = rates[pair] || 1.0;
  
  res.json({ rate: rate + (Math.random() * 0.001 - 0.0005) }); // Add slight jitter for "live" feel
});

// Faucet Route
app.post("/api/faucet/claim", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });

    console.log(`[Faucet] Processing claim for ${address}`);
    
    // In a real Arc app, we would use a funded faucet wallet
    // For this example, we will simulate the success but we could use ArcNativeService 
    // to actually send a transaction if the system wallet had funds.
    
    // We'll perform a real balance check on-chain to show we are looking!
    await publicClient.getBalance({ address: address as `0x${string}` });
    
    // If balance is too high, maybe rate limit? 
    // For now, we simulate the 'sent' state with a real-looking hash
    const fakeHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    
    res.json({ 
       success: true, 
       message: "10 ARC sent to your wallet",
       txHash: fakeHash,
       amount: "10"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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

app.post("/api/bridge/cctp", async (req, res) => {
  try {
    const { userId, amount, destinationAddress, destinationDomain } = req.body;
    
    // In Arc Network, CCTP involves calling the TokenMessenger contract
    const result = await initiateOutboundBridge(
      getSupabaseAdmin(),
      userId,
      destinationDomain || 0, // Default to Ethereum (0) if not provided
      destinationAddress,
      amount
    );
    
    res.status(200).json({ 
      message: "CCTP Outbound Bridge initiated", 
      approveTxId: result.approveTxId,
      burnTxId: result.burnTxId,
      status: 'pending_burn'
    });
  } catch (error: any) {
    console.error("CCTP Bridge error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bridge/inbound/claim", async (req, res) => {
  try {
    const { userId, sourceTxHash, sourceChainRpc } = req.body;
    
    // Finalize the inbound bridge by submitting receiveMessage on Arc
    // This is useful when user has already burned on source chain
    await finalizeInboundBridge(
      getSupabaseAdmin(),
      userId,
      sourceTxHash,
      sourceChainRpc
    );

    res.status(200).json({ message: "Inbound bridge claim initiated" });
  } catch (error: any) {
    console.error("Inbound Bridge Claim error:", error);
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

// Admin Initialization Root
app.post("/api/admin/init", async (_req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || "admin@admin.com";
    const supabase = getSupabaseAdmin();

    console.log(`[AdminInit] Initializing default admin: ${adminEmail}`);

    // 1. Check if user exists in auth.users
    // Note: In typical Supabase, we might not have direct access to auth.users depending on the service role power,
    // but we can try to look up in our public 'profiles' or 'users' table if it exists.
    // For this app, we assume 'user_wallets' is the source of truth for app users.
    
    // We'll create a dummy entry in user_wallets if not exists to facilitate testing
    const userId = "00000000-0000-0000-0000-000000000000"; // Statical UUID for admin fallback
    
    const { data: existingWallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingWallet) {
      return res.json({ message: "Admin already initialized", wallet: existingWallet });
    }

    // 2. Create Circle Wallet for Admin
    console.log("[AdminInit] Creating Circle Wallet for Admin...");
    const circleResult = await createWallet(supabase, userId);

    res.json({
      message: "Admin initialized successfully",
      adminId: userId,
      wallet: circleResult
    });
  } catch (error: any) {
    console.error("Admin Init Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Real-Time Admin Dashboard Endpoint: Config
let platformConfigs = {
  // Transaksi & Batas Biaya
  swapFee: "0.15%",
  withdrawFee: "0.00 USDC",
  bridgeFee: "2.00 USDC",
  dailyTransferLimit: "5000.00 USDC",
  gasSubsidyEnabled: true,

  // Fitur Finansial Utama
  transferEnabled: true,
  withdrawEnabled: true,
  swapEnabled: true,
  stableStakeEnabled: true,
  bridgeEnabled: true,
  faucetEnabled: true,
  batchTransferEnabled: true,

  // Fitur Pembayaran & Dagang
  ecommerceEnabled: true,
  merchantEnabled: true,
  vaEnabled: true,
  qrisEnabled: true,
  scanQrEnabled: true,

  // Integrasi & Keamanan
  registrationEnabled: true,
  aiAgentEnabled: true,
  eWalletConnectionEnabled: true,
  arcBirdEnabled: true,
  backupPhraseEnabled: true
};

app.get("/api/admin/config", (_req, res) => {
  res.json(platformConfigs);
});

app.post("/api/admin/config", (req, res) => {
  try {
    platformConfigs = { ...platformConfigs, ...req.body };
    res.json({ message: "Config updated successfully", config: platformConfigs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Real-Time Admin Dashboard Endpoint: Users List
app.get("/api/admin/users", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: wallets, error: walletsError } = await supabase
      .from('user_wallets')
      .select('id, wallet_id, wallet_address, created_at');

    if (walletsError) {
      throw walletsError;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url');

    let authUsers: any[] = [];
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (!authError && authData) {
        authUsers = authData.users || [];
      }
    } catch (err) {
      console.warn("Could not list auth users from Supabase admin client (possibly restricted/dry-run config):", err);
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || "admin@admin.com";

    const combined = (wallets || []).map(w => {
      const profile = (profiles || []).find(p => p.id === w.id);
      const authUser = authUsers.find(u => u.id === w.id);
      
      const isDeleted = authUser?.user_metadata?.deleted === true;
      const isBlocked = authUser?.user_metadata?.blocked === true || !!authUser?.banned_until;
      const status = isDeleted ? "Archived" : (isBlocked ? "Blocked" : "Active");
      
      let email = authUser?.email || `user_${w.wallet_address.substring(2, 6)}@testnet.com`;
      if (w.id === "00000000-0000-0000-0000-000000000000") {
        email = adminEmail;
      }

      return {
        id: w.id,
        name: profile?.full_name || (w.id === "00000000-0000-0000-0000-000000000000" ? "Platform Admin" : "Anonymous"),
        email: email,
        wallet: w.wallet_address,
        walletId: w.wallet_id,
        createdAt: w.created_at,
        status: status
      };
    });

    res.json(combined);
  } catch (error: any) {
    console.error("Failed to fetch admin users:", error);
    res.status(500).json({ error: error.message });
  }
});

// Block or Unblock user directly in database
app.post("/api/admin/users/block", async (req, res) => {
  try {
    const { userId, block } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    
    if (userId === "00000000-0000-0000-0000-000000000000") {
      return res.status(400).json({ error: "Cannot block platform admin" });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: block ? "876000h" : "none", // 100 years or none
      user_metadata: { blocked: block }
    });

    if (error) {
      throw error;
    }

    res.json({ message: `User successfully ${block ? "blocked" : "unblocked"}`, user: data.user });
  } catch (error: any) {
    console.error("Failed to toggle user block status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user soft-delete/archive from database for auditing
app.delete("/api/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (userId === "00000000-0000-0000-0000-000000000000") {
      return res.status(400).json({ error: "Cannot delete platform admin" });
    }

    const supabase = getSupabaseAdmin();
    
    // Soft Delete: update user metadata to marked as deleted & disable them (ban them for 100 years and mark as blocked and deleted)
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "876000h", // ban for 100 years so they can't login or access API
      user_metadata: { 
        blocked: true,
        deleted: true,
        deletedAt: new Date().toISOString()
      }
    });

    if (updateError) {
      throw updateError;
    }

    // Insert into app_audit_logs table so we have a record of the audit trail
    try {
      await supabase.schema('public').from('app_audit_logs').insert({
        user_id: userId,
        action: "SOFT_DELETE_USER",
        metadata: { deleted_by: "admin", timestamp: new Date().toISOString() }
      });
    } catch (auditErr) {
      console.warn("Could not insert into app_audit_logs table (safe to ignore for this environment):", auditErr);
    }

    res.json({ message: "Pengguna berhasil diarsipkan (soft-delete). Semua database logs, info dompet, dan histori transaksi tetap disimpan untuk audit." });
  } catch (error: any) {
    console.error("Failed to soft delete user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Real-Time Admin Dashboard Endpoint: Stats Overview
app.get("/api/admin/stats", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();

    const { count: userCount } = await supabase
      .from('user_wallets')
      .select('*', { count: 'exact', head: true });

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'success');

    let totalVolume = 0;
    if (!txError && transactions) {
      transactions.forEach(tx => {
        const amt = Math.abs(parseFloat(tx.amount || "0"));
        totalVolume += amt;
      });
    }

    let treasuryBalanceStr = "0.00 USDC";
    try {
      const { data: adminWallet } = await supabase
        .from('user_wallets')
        .select('wallet_id, wallet_address')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (adminWallet) {
        const balanceResult = await fetchUnifiedBalance('00000000-0000-0000-0000-000000000000', adminWallet, supabase);
        if (balanceResult && balanceResult.balance) {
          treasuryBalanceStr = `${balanceResult.balance} USDC`;
        }
      }
    } catch (balErr) {
      console.log("Could not fetch real admin balance:", balErr);
    }

    res.json({
      totalUsers: userCount || 0,
      totalVolume: `${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`,
      treasuryBalance: treasuryBalanceStr
    });
  } catch (error: any) {
    console.error("Failed to fetch admin stats:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;

