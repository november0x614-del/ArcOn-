import { NextResponse } from "next/server";
import { supabaseAdmin, getCircleClient } from "../../../../lib/server-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // 1. Get the wallet ID from Supabase
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('user_wallets')
      .select('wallet_id')
      .eq('id', userId)
      .single();
    
    let baseBalance = 0;
    let tokenBalances = [];
    let walletId = walletData?.wallet_id;

    if (!walletError && walletId) {
      // Query Circle API for balance
      const client = getCircleClient();
      console.log(`Fetching balance for wallet ID: ${walletId}`);
      
      try {
        const balanceResponse = await client.getWalletTokenBalance({
          id: walletId
        });
        
        if (balanceResponse?.data?.tokenBalances) {
            tokenBalances = balanceResponse.data.tokenBalances;
            console.log(`Wallet ID: ${walletId}`);
            console.log(`Token Balances: ${JSON.stringify(tokenBalances)}`);
        } else {
            console.log("No wallet token balances in response");
        }
        
        // Look for USDC or USDC-like token
        const usdcToken = tokenBalances.find((b: any) => 
          b.token?.symbol === 'USDC' || b.token?.name?.includes('USDC')
        );
        baseBalance = parseFloat(usdcToken?.amount || '0');
        console.log(`Parsed USDC Balance from Circle: ${baseBalance}`);
      } catch (e) {
        console.error("Circle API balance fetch failed", e);
      }
    } else {
      console.log("No wallet found, returning 0 fallback");
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
      console.log(`Simulated Balance Added: ${simBalance}`);
    }
    
    const totalBalance = baseBalance + simBalance;

    // Return all balances for debugging purposes
    return NextResponse.json({ 
      balance: totalBalance, 
      currency: "USDC",
      allBalances: tokenBalances
    });
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
