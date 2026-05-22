import { NextResponse } from "next/server";
import { supabaseAdmin, getCircleClient } from "../../../../lib/server-utils";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId, amount, product } = await req.json();

    const { data: walletData } = await supabaseAdmin
      .from('user_wallets').select('wallet_id').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();
    const merchantAddress = "0x2222222222222222222222222222222222222222"; // Placeholder merchant

    const response = await client.createTransaction({
      walletId: walletData.wallet_id,
      destinationAddress: merchantAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${parseFloat(amount).toFixed(2)}`,
        type: 'purchase',
        status: 'pending',
        internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
        metadata: { product, real: true }
    });

    if (error) throw error;
    return NextResponse.json({ message: "Purchase queued", txId: response.data?.id });
  } catch (error: any) {
    console.error("Purchase error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
