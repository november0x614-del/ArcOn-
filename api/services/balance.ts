import { formatUnits } from "viem";
import { publicClient, USDC_ADDRESS, getTokenBalance } from "./arcViem.js";
import { getCircleClientInstance } from "./circleClient.js";

interface CacheEntry {
  data: any;
  timestamp: number;
}
const balanceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2500; // 2.5 seconds cache TTL

export async function fetchUnifiedBalance(
  userId: string,
  walletData: any,
  supabaseAdmin: any,
) {
  if (!walletData?.wallet_address) {
    return {
      balance: 0,
      realBalance: 0,
      currency: "USDC",
      allBalances: [],
    };
  }

  const now = Date.now();
  const cached = balanceCache.get(userId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const walletId = walletData.wallet_id;
  const walletAddress = walletData.wallet_address;

  // 1. Parallel Fetch: Circle Balance (Cloud) + Arc Native Balance (On-Chain) + Arc ERC20 USDC
  const [circleResponse, nativeWei, nativeUSDCWei] = await Promise.all([
    walletId
      ? getCircleClientInstance()
          .getWalletTokenBalance({ id: walletId })
          .catch((err) => {
            console.warn(`[CircleBalance API] getWalletTokenBalance failed for wallet ${walletId}:`, err.message);
            return null;
          })
      : null,
    publicClient.getBalance({ address: walletAddress as `0x${string}` }).catch((e) => {
      console.warn("RPC getBalance failed:", e.message);
      return 0n;
    }),
    getTokenBalance(walletAddress, USDC_ADDRESS).catch((e) => {
      console.warn("RPC getTokenBalance failed:", e.message);
      return 0n;
    }),
  ]);

  const tokenBalances: any[] = [];
  let totalValueUsd = 0;

  // prices (aligned with Arc Network where Native = USDC)
  const USDC_PRICE = 1.0;

  // 2. Process Initial Balances from Circle
  if (circleResponse?.data?.tokenBalances) {
    const circleTokens = circleResponse.data.tokenBalances;
    for (const b of circleTokens) {
      tokenBalances.push({ ...b });
    }
  }

  // 3. Merge Arc Native Assets (Gas)
  const nativeBalanceFormatted = formatUnits(nativeWei, 18);
  const existingArcIndex = tokenBalances.findIndex(
    (b: any) => b.token?.symbol === "ARC" || b.token?.isNative === true
  );

  if (existingArcIndex >= 0) {
    tokenBalances[existingArcIndex].amount = nativeBalanceFormatted;
  } else {
    tokenBalances.push({
      token: {
        symbol: "ARC",
        name: "Arc Network Native",
        decimals: 18,
        blockchain: "ARC-TESTNET",
        isNative: true,
      },
      amount: nativeBalanceFormatted,
    });
  }

  // 4. Merge on-chain USDC (ERC20 Contract)
  const nativeUSDCFormatted = formatUnits(nativeUSDCWei, 6);
  const existingUSDCIndex = tokenBalances.findIndex(
    (b: any) => b.token?.symbol === "USDC" && b.token?.isNative === false
  );

  if (existingUSDCIndex >= 0) {
    tokenBalances[existingUSDCIndex].amount = nativeUSDCFormatted;
  } else {
    tokenBalances.push({
      token: {
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        blockchain: "ARC-TESTNET",
        isNative: false,
        tokenAddress: USDC_ADDRESS,
      },
      amount: nativeUSDCFormatted,
    });
  }

  // 5. Final Deduplication for USDC calculation
  // Since Native and Token USDC are the same value on ArcScan, we should merge them.
  let finalUsdcAmount = 0;
  const otherBalances: any[] = [];

  for (const b of tokenBalances) {
    const symbol = b.token?.symbol || "UNKNOWN";
    if (symbol === "USDC" || symbol === "ARC") {
      const amt = parseFloat(b.amount || "0");
      if (amt > finalUsdcAmount) finalUsdcAmount = amt;
    } else {
      otherBalances.push(b);
    }
  }

  // Calculate simulated ledger-based balances across ALL popular tokens
  const simulatedBalances: Record<string, number> = {
    USDC: 0,
    EURC: 0,
    cirBTC: 0,
    MINT: 0,
  };

  try {
    const { data: txs } = await supabaseAdmin
      .from("transactions")
      .select("amount, type, status, metadata")
      .eq("user_id", userId)
      .eq("status", "success");

    if (txs) {
      for (const tx of txs) {
        const amt = parseFloat(tx.amount || "0");
        const metadata = tx.metadata || {};
        const fromTokenSym = metadata.fromToken || "USDC";
        const toTokenSym = metadata.toToken || "";

        if (tx.type === "swap") {
          const fromAmount = Math.abs(amt);
          const toAmount = parseFloat(metadata.toAmount || "0") || (fromAmount * parseFloat(metadata.exchangeRate || "1"));
          
          simulatedBalances[fromTokenSym] = (simulatedBalances[fromTokenSym] || 0) - fromAmount;
          if (toTokenSym) {
            simulatedBalances[toTokenSym] = (simulatedBalances[toTokenSym] || 0) + toAmount;
          }
        } else if (tx.type === "receive" || tx.type === "deposit") {
          const tokenSym = metadata.token || metadata.symbol || "USDC";
          simulatedBalances[tokenSym] = (simulatedBalances[tokenSym] || 0) + amt;
        } else {
          const tokenSym = metadata.token || metadata.symbol || "USDC";
          simulatedBalances[tokenSym] = (simulatedBalances[tokenSym] || 0) + amt; // amt is negative for debits
        }
      }
    }
  } catch (e) {
    console.error("[BalanceService] Simulated tx calculation failed:", e);
  }

  // Elevate USDC balance if simulated balance is higher (bypass onchain zero limits)
  const usdcSimulated = simulatedBalances["USDC"] || 0;
  if (finalUsdcAmount < usdcSimulated) {
    finalUsdcAmount = usdcSimulated;
  }

  // Push consolidated USDC entry
  const consolidatedUSDC = {
    token: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      blockchain: "ARC-TESTNET",
      isNative: true,
    },
    amount: finalUsdcAmount.toString(),
  };

  // Merge simulated balances for other popular tokens (EURC, cirBTC, MINT)
  const popularTokens = [
    { symbol: "EURC", name: "Euro Coin", decimals: 6 },
    { symbol: "cirBTC", name: "Circle Bitcoin", decimals: 8 },
    { symbol: "MINT", name: "Arc Mintable Assets", decimals: 18 }
  ];

  for (const token of popularTokens) {
    const simAmt = simulatedBalances[token.symbol] || 0;
    const existingIndex = otherBalances.findIndex((b: any) => b.token?.symbol === token.symbol);
    
    if (existingIndex >= 0) {
      const currentAmt = parseFloat(otherBalances[existingIndex].amount || "0");
      if (currentAmt < simAmt) {
        otherBalances[existingIndex].amount = simAmt.toString();
      }
    } else if (simAmt > 0) {
      otherBalances.push({
        token: {
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          blockchain: "ARC-TESTNET",
          isNative: false,
        },
        amount: simAmt.toString(),
      });
    }
  }

  const finalBalances = [consolidatedUSDC, ...otherBalances];
  tokenBalances.length = 0;
  tokenBalances.push(...finalBalances);

  // Recalculate actual total Value
  totalValueUsd = finalUsdcAmount * USDC_PRICE;
  for (const b of otherBalances) {
    totalValueUsd += parseFloat(b.amount || "0") * 1.0; 
  }

  // 5. Consideration of Pending Transactions (Local UI feel)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  try {
    const { data: pendingTxs } = await supabaseAdmin
      .from("transactions")
      .select("amount, metadata")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("created_at", fiveMinutesAgo);

    if (pendingTxs) {
      for (const tx of pendingTxs) {
        totalValueUsd += parseFloat(tx.amount || "0") * USDC_PRICE;
      }
    }
  } catch (e) {
    console.error("[BalanceService] Pending tx adjust error", e);
  }

  const finalResult = {
    balance: Math.max(0, totalValueUsd),
    realBalance: totalValueUsd,
    currency: "USDC",
    allBalances: tokenBalances,
  };

  balanceCache.set(userId, { data: finalResult, timestamp: Date.now() });

  return finalResult;
}
