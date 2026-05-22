import { NextResponse } from "next/server";
import { supabaseAdmin, getCircleClient } from "../../../../lib/server-utils";
import { logAuditEvent } from "../../../../services/auditLogger";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { walletId, destinationAddress, amount, userId } = await req.json();
    const client = getCircleClient();
    
    // Audit Log for critical transfers
    if (parseFloat(amount) > 100) {
      await logAuditEvent(supabaseAdmin, userId, 'TRANSFER_HIGH_VALUE', { 
          amount, 
          destinationAddress 
      });
    }

    // Initiate transfer
    const response = await client.createTransaction({
      walletId: walletId,
      destinationAddress: destinationAddress,
      amount: [amount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
      tokenAddress: "",
      blockchain: "ARC-TESTNET"
    } as any);
    
    // Record in Supabase
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      amount: `-${amount}`,
      type: 'transfer',
      status: 'pending',
      internal_ref: response.data?.id || `req_${crypto.randomBytes(8).toString('hex')}`
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Payment Execution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
