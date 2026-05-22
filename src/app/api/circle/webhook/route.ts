import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/server-utils";
import * as crypto from "crypto";

// Public key cache
const publicKeyCache: Record<string, { publicKey: string, algorithm: string }> = {};

async function getCirclePublicKey(keyId: string): Promise<{ publicKey: string, algorithm: string }> {
  if (publicKeyCache[keyId]) {
    return publicKeyCache[keyId];
  }
  
  const response = await fetch(`https://api.circle.com/v1/notifications/publicKey/${keyId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.CIRCLE_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch public key from Circle: ${response.statusText}`);
  }

  const data = await response.json();
  const { publicKey, algorithm } = data.data;
  
  publicKeyCache[keyId] = { publicKey, algorithm };
  return { publicKey, algorithm };
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-circle-signature');
    const keyId = req.headers.get('x-circle-key-id');
    
    if (!signature || !keyId) {
      console.error("Missing signature or key ID in webhook request headers");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read raw body
    const arrayBuffer = await req.arrayBuffer();
    const rawBody = Buffer.from(arrayBuffer);

    try {
      const { publicKey, algorithm } = await getCirclePublicKey(keyId);
      
      let isVerified = false;
      const keyBuffer = Buffer.from(publicKey, 'base64');
      const signatureBuffer = Buffer.from(signature, 'base64');

      if (algorithm === 'ED25519') {
        isVerified = crypto.verify(
          'ed25519',
          rawBody,
          keyBuffer,
          signatureBuffer
        );
      } else if (algorithm === 'ECDSA_SHA_256') {
        isVerified = crypto.verify(
          'sha256',
          rawBody,
          {
            key: keyBuffer,
            dsaEncoding: 'ieee-p1363'
          },
          signatureBuffer
        );
      } else {
        console.error(`Unsupported algorithm: ${algorithm}`);
        return NextResponse.json({ error: "Unsupported algorithm" }, { status: 401 });
      }

      if (!isVerified) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      
      console.log("Circle Webhook signature verified successfully");
    } catch (err) {
      console.error("Signature verification error:", err);
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }
    
    // Process Payload
    try {
      const payload = JSON.parse(rawBody.toString('utf-8'));
      const type = payload.notificationType;
      const data = payload.notification;
      console.log(`Webhook received: ${type}`);

      if (type === 'transfers.updated' || type === 'transfers.created') {
        const transfer = data;
        const internalRef = transfer.id;
        const newStatus = transfer.status === 'COMPLETE' ? 'success' : 
                          transfer.status === 'FAILED' ? 'failed' : 'pending';

        const { error } = await supabaseAdmin
          .from('transactions')
          .update({ status: newStatus })
          .eq('internal_ref', internalRef);

        if (error) {
          console.error("Supabase update error:", error);
        } else {
          console.log(`Transaction ${internalRef} updated to ${newStatus}`);
        }
      } else if (type === 'transactions.inbound') {
        console.log("Processing inbound transaction:", JSON.stringify(data));
        const { id, amounts, destinationAddress, sourceAddress, createDate } = data;
        const amountValue = amounts[0]; // Take the first amount
        
        const { data: walletData, error: walletError } = await supabaseAdmin
          .from('user_wallets')
          .select('id, wallet_address')
          .ilike('wallet_address', destinationAddress)
          .single();
          
        console.log("Wallet lookup attempt:", { destinationAddress, walletData, walletError });

        if (walletData && !walletError) {
            const { error } = await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: walletData.id,
                amount: amountValue,
                type: 'receive',
                status: 'success',
                internal_ref: id,
                metadata: { sourceAddress, createDate, destinationAddress }
              });
            
            if (error) {
              console.error("Supabase insert error for inbound transaction:", error);
            } else {
              console.log(`Inbound transaction ${id} recorded for user ${walletData.id}`);
            }
        } else {
            console.warn(`No wallet found or error in lookup for address: ${destinationAddress}. Error:`, walletError);
        }
      }

      return NextResponse.json({ status: "success" });
      
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Webhook main error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
