import * as crypto from "crypto";
import { Request, Response } from "express";

// Public key cache
const publicKeyCache: Record<string, { publicKey: string, algorithm: string }> = {};

async function getCirclePublicKey(keyId: string): Promise<{ publicKey: string, algorithm: string }> {
  if (publicKeyCache[keyId]) {
    return publicKeyCache[keyId];
  }
  
  // Fetch from Circle API
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

export async function verifyAndProcessWebhook(
  req: Request,
  res: Response,
  supabaseAdmin: any
) {
  // 1. Verify Signature
  const signature = req.headers['x-circle-signature'] as string;
  const keyId = req.headers['x-circle-key-id'] as string;
  
  if (!signature || !keyId) {
    console.error("Missing signature or key ID in webhook request headers");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { publicKey, algorithm } = await getCirclePublicKey(keyId);
    
    // Determine signature verification method
    let isVerified = false;
    const keyBuffer = Buffer.from(publicKey, 'base64');
    const signatureBuffer = Buffer.from(signature, 'base64');

    if (algorithm === 'ED25519') {
      isVerified = crypto.verify(
        'ed25519',
        req.body,
        keyBuffer,
        signatureBuffer
      );
    } else if (algorithm === 'ECDSA_SHA_256') {
      isVerified = crypto.verify(
        'sha256',
        req.body,
        {
          key: keyBuffer,
          dsaEncoding: 'ieee-p1363'
        },
        signatureBuffer
      );
    } else {
      console.error(`Unsupported algorithm: ${algorithm}`);
      return res.status(401).json({ error: "Unsupported algorithm" });
    }

    if (!isVerified) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    console.log("Circle Webhook signature verified successfully");
  } catch (err) {
    console.error("Signature verification error:", err);
    return res.status(401).json({ error: "Signature verification failed" });
  }
  
  // 2. Process Payload
  try {
    const payload = JSON.parse(req.body.toString());
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
        .select('user_id, wallet_address')
        .ilike('wallet_address', destinationAddress) // Use ilike for case-insensitive match
        .single();
        
      console.log("Wallet lookup attempt:", { destinationAddress, walletData, walletError });

      if (walletData && !walletError) {
          const { error } = await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: walletData.user_id, // Use user_id from wallet
              amount: amountValue,
              type: 'receive',
              status: 'success',
              internal_ref: id,
              metadata: { sourceAddress, createDate, destinationAddress }
            });
          
          if (error) {
            console.error("Supabase insert error for inbound transaction:", error);
          } else {
            console.log(`Inbound transaction ${id} recorded for user ${walletData.user_id}`);
          }
      } else {
          console.warn(`No wallet found or error in lookup for address: ${destinationAddress}. Error:`, walletError);
      }
    }

    res.status(200).send("Accepted");
    
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}
