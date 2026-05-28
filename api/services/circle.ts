import {
  validateDestination,
  isBlocklisted,
  getTokenBalance,
  getTokenDecimals,
  waitForConfirmation,
  USDC_ADDRESS,
  getArcScanUrl,
} from "./arcViem.js";
import { logAuditEvent } from "./audit.js";
import { getCircleClientInstance, circleApiFetch } from "./circleClient.js";
import * as crypto from "crypto";

import { getSupabaseAdmin } from "../config/supabase.js";

async function getGasFeeStrategy(): Promise<"SPONSORED" | "USER_PAID_USDC"> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "GAS_FEE_STRATEGY")
      .maybeSingle();
    return (data?.value as any) || "SPONSORED";
  } catch (err) {
    console.error("[CircleService] Failed to fetch gas strategy:", err);
    return "SPONSORED";
  }
}

export async function getTokenDetails(tokenId: string) {
  try {
    const response = await circleApiFetch(`/v1/w3s/tokens/${tokenId}`);
    return response.data?.token;
  } catch (error) {
    console.error(`[CircleService] Failed to fetch token details for ${tokenId}:`, error);
    return null;
  }
}

export async function createWallet(supabaseAdmin: any, userId: string) {
  const client = getCircleClientInstance();

  // 1. Create Wallet Set
  const walletSetResponse = await client.createWalletSet({
    name: "Lounge Wallet Set",
  });

  const walletSet = walletSetResponse.data?.walletSet;
  if (!walletSet?.id) {
    throw new Error("Wallet set creation failed: no ID returned from Circle");
  }

  // 2. Create Wallet in the Set
  const walletResponse = await client.createWallets({
    walletSetId: walletSet.id,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    accountType: "SCA",
  });

  const wallet = walletResponse.data?.wallets?.[0];
  if (!wallet) {
    throw new Error(
      "Wallet creation failed: no wallets array returned from Circle",
    );
  }

  // 3. Save to Supabase if userId is provided
  if (userId) {
    const { error } = await supabaseAdmin.from("user_wallets").upsert({
      id: userId,
      wallet_id: wallet.id,
      wallet_address: wallet.address,
      wallet_set_id: walletSet.id,
    });
    if (error) console.error("Failed mapping to Supabase:", error);
  }

  return {
    walletId: wallet.id,
    address: wallet.address,
    walletSetId: walletSet.id,
  };
}

export async function batchCreateWallets(
  supabaseAdmin: any,
  users: { id: string; name: string }[],
) {
  const client = getCircleClientInstance();

  // 1. Ensure we have a Wallet Set
  const { data: adminWallet } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_set_id")
    .eq("id", "00000000-0000-0000-0000-000000000000")
    .single();

  let walletSetId = adminWallet?.wallet_set_id;

  if (!walletSetId) {
    const walletSetResponse = await client.createWalletSet({
      name: "Lounge Batch Wallet Set",
    });
    walletSetId = walletSetResponse.data?.walletSet?.id;
  }

  if (!walletSetId) {
    throw new Error("Could not determine or create Wallet Set ID");
  }

  // 2. Prepare metadata (limit 200 as per Circle Docs)
  const metadata = users.slice(0, 200).map((u) => ({
    name: u.name || "Anonymous User",
    refId: u.id, // Internal UUID from our system
  }));

  // 3. Create Wallets in Batch
  const response = await client.createWallets({
    walletSetId,
    blockchains: ["ARC-TESTNET"],
    count: metadata.length,
    accountType: "SCA",
    metadata,
  });

  const createdWallets = response.data?.wallets || [];

  // 4. Map back to Supabase using refId
  const upsertData = createdWallets.map((w: any) => ({
    id: w.refId, // Maps back to our user UUID
    wallet_id: w.id,
    wallet_address: w.address,
    wallet_set_id: walletSetId,
  }));

  if (upsertData.length > 0) {
    const { error } = await supabaseAdmin
      .from("user_wallets")
      .upsert(upsertData);
    if (error) console.error("Failed batch mapping to Supabase:", error);
  }

  return createdWallets;
}

export const ARC_USDC_TOKEN_ID = "15dc2b5d-0994-58b0-bf8c-3a0501148ee8";
export const HIGH_VALUE_THRESHOLD = 500; // USDC threshold for mandatory admin approval

/**
 * Interprets Circle errorReason and errorDetails into human-readable messages.
 * Based on Circle Documentation: Transaction States and Errors.
 */
export function interpretCircleError(reason: string, details?: string): string {
  const reasonMap: Record<string, string> = {
    // Blockchain Reasons
    ESTIMATION_ERROR: "Gagal memperkirakan biaya transaksi (Smart contract revert).",
    INSUFFICIENT_NATIVE_TOKEN: "Saldo gas (token native) tidak mencukupi.",
    FEE_EXCEEDS_MAX_ALLOWANCE: "Biaya gas melebihi batas maksimal yang diizinkan.",
    GAS_LIMIT_TOO_LOW: "Batas gas (gas limit) terlalu rendah.",
    FAILED_ON_CHAIN: "Transaksi gagal dieksekusi di Blockchain.",
    PAYMASTER_POLICY_EXCEED_MAX_DAILY_TRANSACTIONS: "Batas harian transaksi Gas Station telah tercapai.",
    PAYMASTER_POLICY_EXCEED_MAX_SPEND_USD_PER_TX: "Transaksi melebihi batas USD per transaksi Gas Station.",
    PAYMASTER_POLICY_SENDER_IN_BLOCKLIST: "Alamat pengirim masuk dalam daftar blokir Paymaster.",
    INTERNAL_ERROR: "Terjadi kesalahan internal pada layanan Circle.",
    // General API Errors
    "-1": "Terjadi kesalahan yang tidak diketahui saat memproses permintaan API (Something went wrong).",
    "2": "Parameter API tidak valid atau format permintaan salah (Invalid Entity/Field).",
    "3": "Akses ditolak. API Key tidak memiliki izin untuk endpoint ini (Forbidden).",
    // API Codes (155xxx)
    "155112": "PIN yang Anda masukkan salah. Silakan coba lagi.",
    "155119": "PIN Anda terkunci sementara karena terlalu banyak percobaan. Mohon tunggu beberapa saat.",
    "155121": "Sesi transaksi (Challenge) telah kedaluwarsa. Silakan ulangi transaksi Anda.",
    "155141": "Anda telah mencapai batas percobaan OTP. Silakan tunggu 60 menit.",
    "155142": "Batas pengiriman OTP harian telah tercapai.",
  };

  const detailsMap: Record<string, string> = {
    "ERC20: transfer amount exceeds balance": "Saldo token tidak mencukupi untuk transfer ini.",
    "Insufficient Balance": "Saldo tidak mencukupi (token atau gas).",
    "Blacklistable: account is blacklisted": "Alamat terlibat masuk dalam daftar blokir (USDC Contract Blacklist).",
    "Check allowance": "Izin penggunaan token (Allowance) tidak mencukupi atau tidak ditemukan.",
    "ERC20: insufficient allowance": "Izin penggunaan token tidak mencukupi.",
    "Transfer amount must be greater than zero": "Jumlah transfer harus lebih besar dari nol.",
    "Amount below minimum": "Jumlah terlalu kecil (di bawah batas minimum).",
    "AA95 out of gas": "Transaksi kehabisan gas saat eksekusi di blockchain.",
    "ERC20: transfer to the zero address": "Tidak dapat mengirim ke alamat nol (0x0).",
  };

  // Prioritize meaningful details if they exist in our map
  if (details) {
    for (const [key, msg] of Object.entries(detailsMap)) {
      if (details.includes(key)) return msg;
    }
  }

  // Fallback to reason
  if (reason && reasonMap[reason]) return reasonMap[reason];

  // Raw fallback
  return details || reason || "Transaksi gagal karena alasan teknis blockchain.";
}

export async function executeTransaction(
  supabaseAdmin: any,
  userId: string,
  amount: number,
  _destinationAddress: string,
  type: string,
  metadata: any,
) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();
  if (!walletData?.wallet_id || !walletData?.wallet_address)
    throw new Error("No wallet found");

  // Fase 1: Validate destination and check blocklist
  const validDest = validateDestination(_destinationAddress);
  const blocked = await isBlocklisted(validDest);

  if (blocked) {
    throw new Error(
      `Destination address ${validDest} is blocklisted by Arc Protocol`,
    );
  }

  // --- START ENFORCED APPROVAL QUEUE FOR HIGH VALUE ---
  const isBypass = metadata?.bypassApproval === true;
  if (!isBypass && amount >= HIGH_VALUE_THRESHOLD && userId !== "00000000-0000-0000-0000-000000000000") {
    // Save to database as pending_approval
    const { data: pendingTx, error: dbError } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: `-${amount.toFixed(2)}`,
      type: type,
      status: "pending_approval",
      internal_ref: `pending_${crypto.randomBytes(8).toString("hex")}`,
      description: `[Approval Required] ${metadata.memo || (type === "transfer" ? `Transfer to ${validDest}` : "Treasury Move")}`,
      metadata: { 
        ...metadata, 
        real: true, 
        destinationAddress: validDest,
        isHighValue: true,
        requestedAt: new Date().toISOString()
      },
    }).select().single();

    if (dbError) throw dbError;

    await logAuditEvent(supabaseAdmin, userId, "HIGH_VALUE_TX_APPROVAL_QUEUED", {
      amount,
      txId: pendingTx.id
    });

    return {
      txId: pendingTx.id,
      status: "pending_approval",
      message: "This transaction exceeds the threshold and requires administrator approval."
    };
  }
  // --- END ENFORCED APPROVAL QUEUE ---

  // Fase 2: Gas Estimation & Balance Checks
  const sourceAddress = walletData.wallet_address as `0x${string}`;
  
  // Use USDC_ADDRESS as default if no valid tokenAddress provided
  let tokenAddress = USDC_ADDRESS;
  if (type === "swap") {
    // For swaps, the token being transferred out of user wallet is fromToken
    if (metadata.fromToken && metadata.fromToken !== "USDC" && metadata.tokenAddress) {
      tokenAddress = metadata.tokenAddress;
    }
  } else {
    if (metadata.tokenAddress && metadata.tokenAddress.startsWith("0x")) {
      tokenAddress = metadata.tokenAddress;
    }
  }
  
  const tokenAddressTyped = tokenAddress as `0x${string}`;

  // Fetch token decimals for correct estimation
  const decimals = await getTokenDecimals(tokenAddressTyped);

  // Amount in 18-decimal internal for logic checks
  const amountInternal = BigInt(Math.floor(amount * 1_000_000)) * 10n ** 12n;

  // Fetch balances FIRST
  const tokenBalanceRaw = await getTokenBalance(sourceAddress, tokenAddressTyped);

  // Consistently normalize token balance to 18 decimals internal for comparison
  const tokenBalanceInternal = tokenBalanceRaw * 10n ** BigInt(18 - decimals);

  if (tokenBalanceInternal < amountInternal) {
    const symbol = metadata.fromToken || "USDC";
    throw new Error(
      `Insufficient ${symbol} balance. Need ${amount.toFixed(2)} ${symbol}, have ${(Number(tokenBalanceInternal) / 1e18).toFixed(2)} ${symbol}`,
    );
  }

  // Skipped gas balance checking because we are using Gas Station (Sponsored fee)

  const client = getCircleClientInstance();
  const idempotencyKey = crypto.randomUUID();

  // Fase 3 Preview: Memo support (if provided in metadata)
  // Use tokenId for USDC on Arc, otherwise use tokenAddress
  // IMPORTANT: On Arc Testnet, Native USDC is represented by ARC_USDC_TOKEN_ID in Circle SDK
  const isUsdc = tokenAddressTyped.toLowerCase() === USDC_ADDRESS.toLowerCase();
  
  const formattedAmount = amount.toFixed(decimals > 6 ? 6 : decimals);
  if (parseFloat(formattedAmount) <= 0 && amount > 0) {
    throw new Error(`Amount is too small for the required token precision (${decimals} decimals).`);
  }

  const txParams: any = {
    idempotencyKey,
    walletId: walletData.wallet_id,
    destinationAddress: validDest,
    amount: [formattedAmount], 
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM"
      }
    }
  };

  if (isUsdc) {
    txParams.tokenId = ARC_USDC_TOKEN_ID;
  } else {
    txParams.tokenAddress = tokenAddressTyped;
    txParams.blockchain = "ARC-TESTNET";
  }

  // Perform transaction using Developer SDK
  const response = await client.createTransaction(txParams);

  // Circle return an internal tx ID first
  const circleTxId = response.data?.id;

  const { error } = await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    amount: `-${amount.toFixed(2)}`,
    type: type,
    status: "pending",
    internal_ref: circleTxId,
    description:
      metadata.memo ||
      (type === "transfer" ? `Transfer to ${validDest}` : undefined),
    metadata: { ...metadata, real: true },
  });

  if (error) throw error;

  return {
    txId: circleTxId,
  };
}

/**
 * Executes a Batch Transfer. 
 * While atomic batching via 'calls' is only available on specific chains, 
 * we use a reliable sequential loop with separate idempotency for each transfer.
 */
export async function executeAtomicBatchTransfer(
  supabaseAdmin: any,
  userId: string,
  recipients: { address: string; amount: number; name?: string }[],
) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();

  if (!walletData?.wallet_id) throw new Error("No wallet found for batching");

  const client = getCircleClientInstance();
  const txIds: string[] = [];

  // Validate all destinations first to avoid partial failures midway
  for (const rec of recipients) {
    const valid = validateDestination(rec.address);
    if (await isBlocklisted(valid)) {
      throw new Error(`Address ${valid} is blocklisted. Batch aborted.`);
    }
  }

  console.log(`[CircleService] Processing batch of ${recipients.length} transfers for user ${userId}`);

  const gasStrategy = await getGasFeeStrategy();

  for (let i = 0; i < recipients.length; i++) {
    const rec = recipients[i];
    const validDest = validateDestination(rec.address);
    const idempotencyKey = crypto.randomUUID();

    try {
      const txParams: any = {
        idempotencyKey,
        walletId: walletData.wallet_id,
        destinationAddress: validDest,
        amount: [rec.amount.toFixed(6)], 
        tokenId: ARC_USDC_TOKEN_ID, // Use explicit USDC Token ID for Arc Testnet
        fee: {
          type: "level",
          config: {
            feeLevel: "HIGH"
          }
        }
      };

      // Using createTransaction for standard transfers
      const response = await client.createTransaction(txParams);

      const circleTxId = response.data?.id;
      if (circleTxId) {
        txIds.push(circleTxId);

        // Record each transaction in the database
        await supabaseAdmin.from("transactions").insert({
          user_id: userId,
          amount: `-${rec.amount.toFixed(2)}`,
          type: "transfer",
          status: "pending",
          internal_ref: circleTxId,
          metadata: {
            recipientName: rec.name || "Batch Recipient",
            destinationAddress: rec.address,
            batchIndex: i,
            totalInBatch: recipients.length,
            real: true,
          },
        });
      }
    } catch (error: any) {
      console.error(`[CircleService] Batch element ${i} failed:`, error.message);
      // We log but continue if some succeed? No, user probably wants to know.
      // However, since we already triggered preceding ones, we just record the failure.
      throw new Error(`Batch interrupted at recipient ${i + 1}: ${error.message}`);
    }
  }

  return { txId: txIds[0], allTxIds: txIds };
}
