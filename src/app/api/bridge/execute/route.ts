import { NextResponse } from "next/server";
import { supabaseAdmin, getCircleClient } from "../../../../lib/server-utils";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId, amount, fromNetwork, toNetwork } = await req.json();
    
    const { data: walletData } = await supabaseAdmin
      .from('user_wallets').select('wallet_id').eq('id', userId).single();
    
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();
    // Dummy bridge smart contract address:
    const bridgeAddress = "0x0000000000000000000000000000000000000000";

    const response = await client.createTransaction({
      walletId: walletData.wallet_id,
      destinationAddress: bridgeAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      amount: `-${parseFloat(amount).toFixed(2)}`,
      type: 'transfer',
      status: 'pending',
      internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
      metadata: { fromNetwork, toNetwork, real: true }
    });

    if (error) throw error;
    return NextResponse.json({ message: "Bridge transfer queued", txId: response.data?.id });
  } catch (error: any) {
    console.error("Bridge execute error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
