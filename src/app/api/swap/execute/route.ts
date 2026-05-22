import { NextResponse } from "next/server";
import { supabaseAdmin, getCircleClient } from "../../../../lib/server-utils";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId, amount, fromToken, toToken } = await req.json();
    
    const { data: walletData } = await supabaseAdmin
      .from('user_wallets').select('wallet_id').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();
    const dexAddress = "0x3333333333333333333333333333333333333333"; // Placeholder DEX router

    const response = await client.createTransaction({
      walletId: walletData.wallet_id,
      destinationAddress: dexAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${parseFloat(amount).toFixed(2)}`,
        type: 'swap',
        status: 'pending',
        internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
        metadata: { fromToken, toToken, real: true }
    });

    if (error) throw error;
    return NextResponse.json({ message: "Swap queued", txId: response.data?.id });
  } catch (error: any) {
    console.error("Swap Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
