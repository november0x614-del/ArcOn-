import * as crypto from "crypto";
import { Request, Response } from "express";
import { interpretCircleError } from "./circle.js";
import { getSupabaseAdmin } from "../config/supabase.js";

// Cache untuk kunci publik agar tidak perlu fetch berulang kali
const publicKeyCache: Record<string, { publicKey: string; algorithm: string }> = {};

/**
 * Mengambil Public Key dari Circle untuk verifikasi tanda tangan (Signature).
 */
async function getCirclePublicKey(
  keyId: string,
): Promise<{ publicKey: string; algorithm: string }> {
  if (publicKeyCache[keyId]) return publicKeyCache[keyId];

  const response = await fetch(
    `https://api.circle.com/v1/notifications/publicKey/${keyId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY?.trim()}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) throw new Error(`Gagal mengambil public key: ${response.statusText}`);

  const data = await response.json();
  const result = data.data;
  publicKeyCache[keyId] = result;
  return result;
}

/**
 * Fungsi untuk memproses transaksi keluar (Outbound) yang diperbarui oleh Webhook Circle.
 */
async function handleOutboundTransfer(transfer: any, supabaseAdmin: any) {
  const internalRef = transfer.id;
  const txHash = transfer.transactionHash || transfer.txHash || transfer.transaction?.txHash;
  const txStatus = (transfer.status || transfer.state || "").toUpperCase();

  // Menentukan status akhir berdasarkan feedback dari blockchain
  const isFailed = txStatus === "FAILED" || txStatus === "CANCELED";
  const isComplete = txStatus === "COMPLETE" || txStatus === "SUCCESS";
  const newStatus = isComplete ? "success" : isFailed ? "failed" : "pending";

  console.log(`[Webhook:Outbound] Memproses ID: ${internalRef}, Status: ${txStatus} -> DB: ${newStatus}`);

  // 1. Ambil data transaksi lama untuk mempertahankan metadata
  const { data: existingTx } = await supabaseAdmin
    .from("transactions")
    .select("status, metadata, type, user_id, amount")
    .eq("internal_ref", internalRef)
    .maybeSingle();

  if (!existingTx) return;

  // Keamanan: Jangan update jika status di DB sudah "success"
  if (existingTx.status === "success" && newStatus !== "success") return;

  // Extract error details if failed
  let errorMessage = null;
  if (isFailed) {
    errorMessage = interpretCircleError(transfer.errorReason, transfer.errorDetails);
  }

  // 2. Perbarui status dan hash transaksi di database
  await supabaseAdmin
    .from("transactions")
    .update({
      status: newStatus,
      tx_hash: txHash,
      metadata: {
        ...(existingTx.metadata || {}),
        txHash: txHash || existingTx.metadata?.txHash,
        circleStatus: txStatus,
        errorMessage: errorMessage || existingTx.metadata?.errorMessage,
        webhookReceivedAt: new Date().toISOString(),
      }
    })
    .eq("internal_ref", internalRef)
    .neq("status", "success");

  // 3. Perbarui juga tabel Ledger untuk sinkronisasi akuntansi
  await supabaseAdmin
    .from("transaction_ledger")
    .update({
      status: isComplete ? "COMPLETE" : isFailed ? "FAILED" : "PENDING",
      tx_hash: txHash,
    })
    .eq("circle_tx_id", internalRef);
}

/**
 * Fungsi untuk memproses transaksi masuk (Inbound) yang dideteksi oleh Circle.
 */
async function handleInboundTransfer(data: any, supabaseAdmin: any) {
  const { id, amounts, destinationAddress, sourceAddress, txHash, memo } = data;
  const amountValue = amounts?.[0] || data.amount || 0;

  console.log(`[Webhook:Inbound] Mendeteksi dana masuk sebesar ${amountValue} USDC ke ${destinationAddress}`);

  // Cari siapa pemilik dompet tersebut di sistem kita (ilike untuk case-insensitive)
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("id")
    .ilike("wallet_address", destinationAddress)
    .single();

  if (!walletData) return;

  // Cek apakah transaksi ini sudah pernah diproses sebelumnya (Idempotensi)
  const { data: existingTx } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("internal_ref", id)
    .maybeSingle();

  if (existingTx) return;

  // Logic khusus: Jika memo mengandung pesanan ecommerce
  if (memo && memo.startsWith("ORDER-")) {
    await supabaseAdmin
      .from("ecommerce_orders")
      .update({ status: "ESCROWED", tx_hash: txHash || "pending" })
      .eq("memo", memo);
  }

  // Catat sebagai transaksi baru dengan status sukses
  await supabaseAdmin.from("transactions").insert({
    user_id: walletData.id,
    amount: amountValue,
    type: "receive",
    status: "success",
    internal_ref: id,
    metadata: { sourceAddress, destinationAddress, txHash, memo, finality: "deterministic" },
  });

  await supabaseAdmin.from("transaction_ledger").insert({
    user_id: walletData.id,
    tx_type: "RECEIVE",
    amount: amountValue,
    destination_address: destinationAddress,
    circle_tx_id: id,
    tx_hash: txHash,
    status: "COMPLETE",
  });
}

/**
 * Main Webhook Handler: Memverifikasi tanda tangan dan mengarahkan ke handler yang tepat.
 */
export async function verifyAndProcessWebhook(
  req: Request,
  res: Response,
  supabaseAdmin: any,
) {
  // 1. Verifikasi Tanda Tangan (Signature) untuk keamanan
  const signature = req.headers["x-circle-signature"] as string;
  const keyId = req.headers["x-circle-key-id"] as string;

  if (!signature || !keyId) {
    return res.status(401).json({ error: "Missing signature headers" });
  }

  try {
    const { publicKey, algorithm } = await getCirclePublicKey(keyId);
    let isVerified = false;
    const keyBuffer = Buffer.from(publicKey, "base64");
    const signatureBuffer = Buffer.from(signature, "base64");
    
    // Gunakan rawBody agar verifikasi presisi sesuai byte yang dikirim Circle
    const rawBodyBuffer = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));

    if (algorithm === "ED25519") {
      isVerified = crypto.verify("ed25519", rawBodyBuffer, keyBuffer, signatureBuffer);
    } else if (algorithm === "ECDSA_SHA_256") {
      isVerified = crypto.verify("sha256", rawBodyBuffer, { key: keyBuffer, dsaEncoding: "ieee-p1363" }, signatureBuffer);
    } else {
      return res.status(401).json({ error: "Unsupported crypto algorithm" });
    }

    if (!isVerified) return res.status(401).json({ error: "Invalid signature" });
  } catch (err) {
    return res.status(401).json({ error: "Signature verification failed" });
  }

  // 2. Hubungkan ke Database dan Proses Payload
  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const type = payload.notificationType;
    const data = payload.notification;

    // Bedakan antara transaksi masuk (Top-up) dan keluar (Transfer/Swap)
    const isInbound = type === "transactions.inbound" || data?.transactionType === "INBOUND";
    
    if (isInbound) {
      await handleInboundTransfer(data, supabaseAdmin);
    } else {
      await handleOutboundTransfer(data, supabaseAdmin);
    }

    res.status(200).send("OK");
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}
