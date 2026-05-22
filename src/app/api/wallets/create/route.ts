import { NextResponse } from "next/server";
import { supabaseAdmin, getCircleClient } from "../../../../lib/server-utils";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    console.log("Checking if wallet exists...");
    
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: existingWallet } = await supabaseAdmin
        .from('user_wallets')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (existingWallet) {
        console.log(`Wallet already exists: ${existingWallet.wallet_address}`);
        return NextResponse.json({
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

    // 3. (Optional) Save to Supabase if userId is provided
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
    return NextResponse.json({
      walletId: wallet.id,
      address: wallet.address,
      walletSetId: walletSet.id
    });
  } catch (error: any) {
    console.error("Circle API Error detail:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create wallet",
      details: error.response?.data || null
    }, { status: 500 });
  }
}
