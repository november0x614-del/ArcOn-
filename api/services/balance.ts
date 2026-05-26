import { formatUnits } from "viem";
import { publicClient, USDC_ADDRESS, getTokenBalance } from "./arcViem.js";
import { getArcAppKit } from "./circleClient.js";

export async function fetchUnifiedBalance(userId: string, walletData: any, supabaseAdmin: any) {
    if (!walletData?.wallet_address) {
        return {
            balance: 0,
            realBalance: 0,
            currency: "USDC",
            allBalances: []
        };
    }

    const walletId = walletData.wallet_id;
    const walletAddress = walletData.wallet_address;

    // 1. Parallel Fetch: Circle Balance (via App Kit) + Arc Native Balance (On-Chain) + Arc ERC20 USDC
    const kit = getArcAppKit(walletId);
    
    // Attempt to fetch via adapter directly if AppKit method is unsure
    console.log("[BalanceService] Adapter keys:", Object.keys((kit as any).adapter));
    
    const [kitBalances, nativeWei, nativeUSDCWei] = await Promise.all([
        walletId ? (kit as any).adapter.getBalance({}).catch((e: any) => { console.error("[BalanceService] getBalance failed:", e); return []; }) : [],
        publicClient.getBalance({ address: walletAddress as `0x${string}` }),
        getTokenBalance(walletAddress, USDC_ADDRESS)
    ]);

    const tokenBalances: any[] = [];
    let totalValueUsd = 0;

    // Prices (Mock for testnet)
    const ARC_PRICE = 0.02;
    const USDC_PRICE = 1.0;

    // 2. Process Circle Balances (via App Kit)
    if (Array.isArray(kitBalances)) {
        tokenBalances.push(...kitBalances);
        
        // Sum all Circle tokens for total value
        for (const b of kitBalances) {
            const amount = parseFloat(b.amount || "0");
            const symbol = b.token?.symbol || b.symbol;
            const price = (symbol === 'ARC') ? ARC_PRICE : USDC_PRICE;
            totalValueUsd += amount * price;
        }
    }

    // 3. Process Arc L1 Native Assets
    const nativeBalanceFormatted = formatUnits(nativeWei, 18);
    const nativeVal = parseFloat(nativeBalanceFormatted);
    
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
        totalValueUsd += nativeVal * ARC_PRICE;
    }

    // 4. Process on-chain USDC (Arc Native ERC20)
    const nativeUSDCFormatted = parseFloat(formatUnits(nativeUSDCWei, 6));
    totalValueUsd += nativeUSDCFormatted * USDC_PRICE;

    if (nativeUSDCFormatted > 0) {
        tokenBalances.push({
            token: { 
                symbol: 'USDC', 
                name: 'USD Coin (Arc Native)', 
                decimals: 6, 
                blockchain: 'ARC-TESTNET',
                isNative: true 
            },
            amount: nativeUSDCFormatted.toString()
        });
    }

    // 5. Consideration of Pending Transactions (Local UI feel)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    try {
        const { data: pendingTxs } = await supabaseAdmin
            .from('transactions')
            .select('amount, metadata')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .gte('created_at', fiveMinutesAgo);

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
        allBalances: tokenBalances
    };
}
