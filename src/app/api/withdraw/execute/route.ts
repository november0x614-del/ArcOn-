import { NextResponse } from "next/server";
import { supabaseAdmin, getCircleClient } from "../../../../lib/server-utils";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId, amount, bank } = await req.json();

    const { data: walletData } = await supabaseAdmin
      .from('user_wallets').select('wallet_id').eq('id', userId).single();
    if (!walletData?.wallet_id) throw new Error("No wallet found");

    const client = getCircleClient();
    const treasuryAddress = "0x1111111111111111111111111111111111111111"; // Placeholder

    const response = await client.createTransaction({
      walletId: walletData.wallet_id,
      destinationAddress: treasuryAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);

    const { error } = await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        amount: `-${parseFloat(amount).toFixed(2)}`,
        type: 'withdraw',
        status: 'pending',
        internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`,
        metadata: { bank, real: true }
    });

    if (error) throw error;
    return NextResponse.json({ message: "Withdraw queued", txId: response.data?.id });
  } catch (error: any) {
    console.error("Withdraw Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
