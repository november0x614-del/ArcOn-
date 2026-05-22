import { NextResponse } from "next/server";
import { supabaseAdmin, getCircleClient } from "../../../../lib/server-utils";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { walletId, recipients, userId } = await req.json();
    const client = getCircleClient();
    
    const responses = [];
    for (const rec of recipients) {
       const response = await client.createTransaction({
         walletId: walletId,
         destinationAddress: rec.address,
         amount: [rec.amount.toString()],
         fee: { type: "level", config: { feeLevel: "LOW" } },
         tokenAddress: "",
         blockchain: "ARC-TESTNET"
       } as any);
       
       await supabaseAdmin.from('transactions').insert({
          user_id: userId,
          amount: `-${rec.amount}`,
          type: 'transfer',
          status: 'pending',
          internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`
       });
       responses.push(response.data);
    }
    
    return NextResponse.json({ success: true, transfers: responses });
  } catch (error: any) {
    console.error("Batch Payment Execution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
