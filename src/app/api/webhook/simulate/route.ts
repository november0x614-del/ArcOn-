import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/server-utils";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId, amount } = await req.json();
    console.log(`Simulating webhook for user ${userId}, amount ${amount}`);

    // 1. Insert a transaction record
    const { error } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'receive',
        status: 'success',
        internal_ref: `sim_${crypto.randomBytes(8).toString('hex')}`
      });

    if (error) throw error;

    return NextResponse.json({ message: "Simulation successful" });
  } catch (error: any) {
    console.error("Simulation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
