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

  // Prices (Mock for testnet)
  const ARC_PRICE = 0.02;
  const USDC_PRICE = 1.0;

  // 2. Process Circle Balances
  if (circleResponse?.data?.tokenBalances) {
    const circleTokens = circleResponse.data.tokenBalances;
    for (const b of circleTokens) {
      tokenBalances.push(b);
      const amount = parseFloat(b.amount || "0");
      const price = b.token?.symbol === "ARC" ? ARC_PRICE : USDC_PRICE;
      totalValueUsd += amount * price;
    }
  }

  // 3. Process Arc L1 Native Assets
  const nativeBalanceFormatted = formatUnits(nativeWei, 18);

  const existingArcIndex = tokenBalances.findIndex(
    (b: any) => b.token?.symbol === "ARC",
  );
  if (existingArcIndex >= 0) {
    tokenBalances[existingArcIndex].amount = nativeBalanceFormatted;
    // We don't add to totalValueUsd again, as it was already added from Circle but wait, if we overwrite it, the total value calculated from Circle is inaccurate.
    // Let's recalculate total later.
  } else {
    tokenBalances.push({
      token: {
        symbol: "ARC",
        name: "Arc Network Native Gas Token",
        decimals: 18,
        blockchain: "ARC-TESTNET",
        isNative: true,
      },
      amount: nativeBalanceFormatted,
    });
  }

  // 4. Process on-chain USDC (Arc Native ERC20)
  const nativeUSDCFormatted = parseFloat(formatUnits(nativeUSDCWei, 6));

  if (nativeUSDCFormatted > 0) {
    tokenBalances.push({
      token: {
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        blockchain: "ARC-TESTNET",
        isNative: false,
        tokenAddress: USDC_ADDRESS,
      },
      amount: nativeUSDCFormatted.toString(),
    });
  }

  // Recalculate actual total Value from the finalized array
  totalValueUsd = 0;
  for (const b of tokenBalances) {
    const amount = parseFloat(b.amount || "0");
    const price = b.token?.symbol === "ARC" ? ARC_PRICE : USDC_PRICE;
    totalValueUsd += amount * price;
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
