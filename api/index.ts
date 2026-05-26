import { verifyAndProcessWebhook } from "./services/webhook.js";
import { logAuditEvent } from "./services/audit.js";
import { createWallet, executeTransaction } from "./services/circle.js";
import { publicClient } from "./services/arcViem.js";
import { initiateOutboundBridge, finalizeInboundBridge } from "./services/bridge.js";
import express from "express";
import * as crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
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
          { token: { symbol: 'USDC', name: 'USD Coin', decimals: 6, blockchain: 'ARC-TESTNET' }, amount: '1540.23' },
          { token: { symbol: 'EURC', name: 'Euro Coin', decimals: 6, blockchain: 'ARC-TESTNET' }, amount: '42.50' },
          { token: { symbol: 'ARC', name: 'Arc Network Native Gas Token', decimals: 18, blockchain: 'ARC-TESTNET' }, amount: '12450.0' }
        ]
      });
    }

    // 1. Get the wallet ID and wallet address from Supabase
    const { data: walletData, error: walletError } = await getSupabaseAdmin()
      .from('user_wallets')
      .select('wallet_id, wallet_address')
      .eq('id', userId)
      .single();
    
    if (walletError && walletError.code !== 'PGRST116') {
       console.error("Error fetching wallet data:", walletError);
    }
    
    let baseBalance = 0;
    let tokenBalances: any[] = [];
    let walletId = walletData?.wallet_id;
    let walletAddress = walletData?.wallet_address;
    let nativeBalanceFormatted = "12450.0"; // Sane fallback seed if query fails or wallet is empty

    // Fetch live ARC native balance on-chain via viem
    let nativeUSDCBalance = 0;
    if (walletAddress) {
      try {
        const blockchainBalance = await publicClient.getBalance({
          address: walletAddress as `0x${string}`
        });
        nativeBalanceFormatted = formatUnits(blockchainBalance, 18);
        console.log(`Live native L1 ARC balance fetched on-chain: ${nativeBalanceFormatted}`);
        
        // Arc Unified Balance: check USDC (ERC20) on native address as well
        const usdcContract = process.env.ARC_USDC_CONTRACT || "0x3600000000000000000000000000000000000000";
        try {
          const rawUsdc = (await publicClient.readContract({
            address: usdcContract as `0x${string}`,
            abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: 'balance', type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`]
          } as any)) as bigint;
          nativeUSDCBalance = parseFloat(formatUnits(rawUsdc, 6)); // USDC is 6 decimals
          console.log(`Live native USDC balance on Arc: ${nativeUSDCBalance}`);
        } catch (usdcErr) {
          console.warn("Failed to fetch native USDC balance on-chain:", usdcErr);
        }
      } catch (nativeErr) {
        console.error("Failed to fetch native balance on-chain via publicClient:", nativeErr);
      }
    }

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
        
        // Arc Hardening: ERC-20 Exclusive Accounting
        // We prioritize the 6-decimal interface for USDC accounting as per Arc docs
        const usdcToken = tokenBalances.find((b: any) => 
          b.token?.symbol === 'USDC' || b.token?.name?.includes('USDC')
        );
        
        if (usdcToken) {
          baseBalance = parseFloat(usdcToken.amount);
          // If Circle somehow returned 18 decimals, we would normalize here, 
          // but Circle's Arc integration typically uses 6 for the ERC20 aspect.
          console.log(`[API] USDC Audit: ${usdcToken.amount} (${usdcToken.token?.decimals || 6} decimals)`);
        }
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

    // Inject/update the dynamic live ARC L1 native gas token balance into tokenBalances
    const existingArcIndex = tokenBalances.findIndex((b: any) => b.token?.symbol === 'ARC');
    if (existingArcIndex >= 0) {
      tokenBalances[existingArcIndex].amount = nativeBalanceFormatted;
    } else {
      tokenBalances.push({
        token: {
          symbol: 'ARC',
          name: 'Arc Network Native Gas Token',
          decimals: 18,
          blockchain: 'ARC-TESTNET'
        },
        amount: nativeBalanceFormatted
      });
    }

    // Handle Dual USDC representation logic if USDC is present
    const usdcIndex = tokenBalances.findIndex((b: any) => b.token?.symbol === 'USDC');
    if (usdcIndex >= 0) {
      const usdcItem = tokenBalances[usdcIndex];
      usdcItem.token.decimals = usdcItem.token.decimals || 6;
      
      const circleAmount = parseFloat(usdcItem.amount);
      const totalAmount = circleAmount + nativeUSDCBalance;
      
      // We'll keep the Circle one as is, but add a new entry for Native USDC for clarity
      if (nativeUSDCBalance > 0) {
        tokenBalances.push({
          token: { 
            symbol: 'USDC', 
            name: 'USD Coin (Arc Native)', 
            decimals: 6, 
            blockchain: 'ARC-TESTNET',
            isNative: true 
          },
          amount: nativeUSDCBalance.toString()
        });
      }
      
      baseBalance = totalAmount; // Update base balance with unified sum
      console.log(`[API] Unified USDC: Circle(${circleAmount}) + Native(${nativeUSDCBalance}) = ${totalAmount}`);
    } else if (nativeUSDCBalance > 0) {
      tokenBalances.push({
        token: { 
          symbol: 'USDC', 
          name: 'USD Coin (Arc Native)', 
          decimals: 6, 
          blockchain: 'ARC-TESTNET',
          isNative: true 
        },
        amount: nativeUSDCBalance.toString()
      });
      baseBalance = nativeUSDCBalance;
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

// ERC20 Contract Multi-Token Real-Time Balances Route
app.get("/api/balance/:userId/tokens", async (req, res) => {
  try {
    const { userId } = req.params;
    const contractsParam = req.query.contracts as string || "";
    const contractAddresses = contractsParam ? contractsParam.split(",") : [];

    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Offline fallback: deterministic based on address string
      const mockedBalances: Record<string, number> = {};
      contractAddresses.forEach((addr) => {
        const clean = addr.toLowerCase().trim();
        const num = parseInt(clean.substring(2, 6), 16) || 450;
        mockedBalances[clean] = (num % 850) + 150;
      });
      return res.json({ balances: mockedBalances });
    }

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

app.post("/api/transfer/execute", async (req, res) => {
  try {
    const { userId, amount, destinationAddress } = req.body;
    const supabase = getSupabaseAdmin();
    
    // 1. Determine the best source for funds (Unified Balance logic)
    // For now, we prioritize Circle for simplicity, but we can switch based on balance
    const result = await executeTransaction(supabase, userId, amount, destinationAddress, 'transfer', { 
      intent: 'unified_transfer',
      finality: 'deterministic'
    });
    
    res.status(200).json({ 
      message: "Unified Transfer initiated", 
      txId: result.txId,
      status: 'pending'
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
    const adminEmail = "admin@admin.com";
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

export default app;
