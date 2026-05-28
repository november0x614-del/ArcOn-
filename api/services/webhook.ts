import * as crypto from "crypto";
import { Request, Response } from "express";
import { interpretCircleError } from "./circle.js";

// Public key cache
const publicKeyCache: Record<string, { publicKey: string; algorithm: string }> =
  {};

async function getCirclePublicKey(
  keyId: string,
): Promise<{ publicKey: string; algorithm: string }> {
  if (publicKeyCache[keyId]) {
    return publicKeyCache[keyId];
  }

  // Fetch from Circle API
  const response = await fetch(
    `https://api.circle.com/v1/notifications/publicKey/${keyId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch public key from Circle: ${response.statusText}`,
    );
  }

  const data = await response.json();
  const { publicKey, algorithm } = data.data;

  publicKeyCache[keyId] = { publicKey, algorithm };
  return { publicKey, algorithm };
}

export async function verifyAndProcessWebhook(
  req: Request,
  res: Response,
  supabaseAdmin: any,
) {
  // 1. Verify Signature
  const signature = req.headers["x-circle-signature"] as string;
  const keyId = req.headers["x-circle-key-id"] as string;

  if (!signature || !keyId) {
    console.error("Missing signature or key ID in webhook request headers");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { publicKey, algorithm } = await getCirclePublicKey(keyId);

    // Determine signature verification method
    let isVerified = false;
    const keyBuffer = Buffer.from(publicKey, "base64");
    const signatureBuffer = Buffer.from(signature, "base64");

    // Standardize body for signature verification to support both raw buffers and pre-parsed bodies
    const rawBodyBuffer = (req as any).rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body)));

    if (algorithm === "ED25519") {
      isVerified = crypto.verify(
        "ed25519",
        rawBodyBuffer,
        keyBuffer,
        signatureBuffer,
      );
    } else if (algorithm === "ECDSA_SHA_256") {
      isVerified = crypto.verify(
        "sha256",
        rawBodyBuffer,
        {
          key: keyBuffer,
          dsaEncoding: "ieee-p1363",
        },
        signatureBuffer,
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
    let payload;
    if (typeof req.body === "string") {
      payload = JSON.parse(req.body);
    } else if (Buffer.isBuffer(req.body)) {
      payload = JSON.parse(req.body.toString("utf-8"));
    } else if (req.body && typeof req.body === "object") {
      payload = req.body;
    } else {
      payload = JSON.parse(((req as any).rawBody || "").toString("utf-8"));
    }

    const type = payload.notificationType;
    const data = payload.notification;
    console.log(`Webhook received: ${type}`);

    if (type === "transfers.updated" || type === "transfers.created") {
      const transfer = data;
      const internalRef = transfer.id;

      // Arc Deterministic Finality: Arc transactions are immutable after 1 confirmation
      // Circle marks COMPLETE when fully settled, we align with that.
      const isFailed = transfer.status === "FAILED";
      const newStatus =
        transfer.status === "COMPLETE"
          ? "success"
          : isFailed
            ? "failed"
            : "pending";

      // Arc hardening: extract txHash if available
      const txHash = transfer.transactionHash || data.txHash;

      // Extract error details if failed
      let errorMessage = null;
      if (isFailed) {
        errorMessage = interpretCircleError(transfer.errorReason, transfer.errorDetails);
      }

      // First fetch the existing transaction to update its metadata
      const { data: existingTx } = await supabaseAdmin
        .from("transactions")
        .select("metadata")
        .eq("internal_ref", internalRef)
        .single();
        
      const updatedMetadata = existingTx?.metadata 
        ? { 
            ...existingTx.metadata, 
            txHash: txHash || existingTx.metadata.txHash,
            errorReason: isFailed ? transfer.errorReason : existingTx.metadata.errorReason,
            errorDetails: isFailed ? transfer.errorDetails : existingTx.metadata.errorDetails,
            errorMessage: errorMessage || existingTx.metadata.errorMessage
          } 
        : { 
            txHash, 
            errorReason: isFailed ? transfer.errorReason : null,
            errorDetails: isFailed ? transfer.errorDetails : null,
            errorMessage 
          };

      const { error } = await supabaseAdmin
        .from("transactions")
        .update({ status: newStatus, metadata: updatedMetadata })
        .eq("internal_ref", internalRef);

      if (error) {
        console.error("Supabase update error:", error);
      } else {
        console.log(`Transaction ${internalRef} updated to ${newStatus}`);
      }
    } else if (type === "transactions.inbound") {
      console.log("Processing inbound transaction:", JSON.stringify(data));
      const {
        id,
        amounts,
        destinationAddress,
        sourceAddress,
        createDate,
        txHash,
      } = data;
      const amountValue = amounts[0]; // Take the first amount (USDC)

      // Arc Hardening: Memo Parsing
      // In a real exchange, we would check the 'memo' field if provided via a Memo contract
      const memo = data.memo || data.metadata?.memo;
      console.log(
        `[Webhook] Inbound transaction ${id} has memo: ${memo || "none"}`,
      );

      const { data: walletData, error: walletError } = await supabaseAdmin
        .from("user_wallets")
        .select("id, wallet_address") // Changed from user_id to id to match schema
        .ilike("wallet_address", destinationAddress)
        .single();

      console.log("Wallet lookup attempt:", {
        destinationAddress,
        walletData,
        walletError,
      });

      if (walletData && !walletError) {
        const { error } = await supabaseAdmin.from("transactions").insert({
          user_id: walletData.id,
          amount: amountValue,
          type: "receive",
          status: "success", // Deterministic finality: immediate success for inbound detected by Circle
          internal_ref: id,
          metadata: {
            sourceAddress,
            createDate,
            destinationAddress,
            txHash,
            finality: "deterministic",
            memo: memo || null,
          },
        });

        if (error) {
          console.error(
            "Supabase insert error for inbound transaction:",
            error,
          );
        } else {
          console.log(
            `Inbound transaction ${id} recorded for user ${walletData.id}`,
          );
        }
      } else {
        console.warn(`No wallet found for address: ${destinationAddress}`);
      }
    }

    res.status(200).send("Accepted");
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}
