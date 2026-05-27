import { formatUnits } from "viem";
import { getAppKitInstance } from "./circleClient.js";
import { publicClient, USDC_ADDRESS, getTokenBalance } from "./arcViem.js";

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

  // Track if we successfully fetched USDC from AppKit
  let appKitSuccess = false;

  try {
    const { kit, adapter } = getAppKitInstance();
    const balances = await kit.unifiedBalance.getBalances({
      token: "USDC",
      sources: { address: walletAddress },
      includePending: true
    });

    // Process Unified Balances Breakdown
    for (const breakdown of balances.breakdown) {
      if (breakdown.breakdown) {
        appKitSuccess = true;
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
    }

  } catch (err: any) {
    console.error("[BalanceService] Unified Balance fetch failed:", err);
  }

  // Fallback / Fetch remaining tokens via on-chain RPC
  try {
    const [nativeWei, nativeUSDCWei] = await Promise.all([
      publicClient.getBalance({ address: walletAddress as `0x${string}` }).catch((e) => {
        console.warn("RPC getBalance failed:", e.message);
        return 0n;
      }),
      !appKitSuccess ? getTokenBalance(walletAddress, USDC_ADDRESS).catch((e) => {
        console.warn("RPC getTokenBalance failed:", e.message);
        return 0n;
      }) : Promise.resolve(0n),
    ]);

    // Add ARC Native Token
    const nativeBalanceFormatted = formatUnits(nativeWei, 18);
    const nativeArcAmount = parseFloat(nativeBalanceFormatted);
    if (nativeArcAmount > 0 || tokenBalances.length === 0) {
      totalValueUsd += nativeArcAmount * ARC_PRICE;
      tokenBalances.push({
        token: {
          symbol: "ARC",
          name: "Arc Network Native Gas Token",
          decimals: 18,
          blockchain: "ARC-TESTNET",
          isNative: true,
        },
        amount: nativeBalanceFormatted,
        status: "confirmed"
      });
    }

    // Add fallback USDC if AppKit failed
    if (!appKitSuccess) {
      const nativeUSDCFormatted = parseFloat(formatUnits(nativeUSDCWei, 6));
      if (nativeUSDCFormatted > 0) {
        totalValueUsd += nativeUSDCFormatted * USDC_PRICE;
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
          status: "confirmed"
        });
      }
    }
  } catch (err: any) {
    console.error("[BalanceService] On-chain fetch failed:", err);
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
