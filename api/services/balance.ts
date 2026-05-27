import { getAppKitInstance } from "./circleClient.js";

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

  const walletAddress = walletData.wallet_address;
  const tokenBalances: any[] = [];
  let totalValueUsd = 0;

  const ARC_PRICE = 0.02;
  const USDC_PRICE = 1.0;

  try {
    const { kit, adapter } = getAppKitInstance();
    const balances = await kit.unifiedBalance.getBalances({
      token: "USDC",
      sources: { address: walletAddress },
      includePending: true
    });

    // Process Unified Balances Breakdown
    for (const breakdown of balances.breakdown) {
      for (const chainBalance of breakdown.breakdown) {
        const usdcAmount = parseFloat(chainBalance.confirmedBalance);
        if (usdcAmount > 0) {
          totalValueUsd += usdcAmount * USDC_PRICE;
          tokenBalances.push({
            token: {
              symbol: "USDC",
              name: "USD Coin",
              decimals: 6,
              blockchain: chainBalance.chain,
              isNative: false,
            },
            amount: usdcAmount.toString(),
            status: "confirmed"
          });
        }
        
        if (chainBalance.pendingBalance) {
          const pendingAmount = parseFloat(chainBalance.pendingBalance);
          if (pendingAmount > 0) {
            totalValueUsd += pendingAmount * USDC_PRICE;
            tokenBalances.push({
              token: {
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                blockchain: chainBalance.chain,
                isNative: false,
              },
              amount: pendingAmount.toString(),
              status: "pending"
            });
          }
        }
      }
    }

  } catch (err: any) {
    console.error("[BalanceService] Unified Balance fetch failed:", err);
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

  return {
    balance: Math.max(0, totalValueUsd),
    realBalance: totalValueUsd,
    currency: "USDC",
    allBalances: tokenBalances,
  };
}
