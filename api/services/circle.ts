import {
  validateDestination,
  isBlocklisted,
  getTokenBalance,
  getTokenDecimals,
  waitForConfirmation,
  USDC_ADDRESS,
  getArcScanUrl,
} from "./arcViem";
import { encodeFunctionData, parseAbi } from "viem";
import { logAuditEvent } from "./audit";
import { getCircleClientInstance, circleApiFetch } from "./circleClient";
import * as crypto from "crypto";

import { getSupabaseAdmin } from "../config/supabase";

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
    console.error(
      `[CircleService] Failed to fetch token details for ${tokenId}:`,
      error,
    );
    return null;
  }
}

export async function createWallet(supabaseAdmin: any, userId: string) {
  const client = getCircleClientInstance();

  // 1. Get Wallet Set ID from Env
  const walletSetId = process.env.CIRCLE_WALLET_SET_ID;

  if (!walletSetId) {
    throw new Error(
      "KETERGANTUNGAN_WALLET_SET_ID: Aplikasi tidak memiliki CIRCLE_WALLET_SET_ID di file (.env). " +
      "Membuat Wallet Set secara dinamis di Vercel akan menyebabkan timeout. " +
      "Silakan buat Wallet Set di konsol Circle dan masukkan ID-nya ke environment variables."
    );
  }

  // 2. Create Wallet in the Set
  const walletResponse = await client.createWallets({
    walletSetId,
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
      wallet_set_id: walletSetId,
    });
    if (error) console.error("Failed mapping to Supabase:", error);
  }

  return {
    walletId: wallet.id,
    address: wallet.address,
    walletSetId: walletSetId,
  };
}

export async function batchCreateWallets(
  supabaseAdmin: any,
  users: { id: string; name: string }[],
) {
  const client = getCircleClientInstance();

  // 1. Ensure we have a Wallet Set
  const walletSetId = process.env.CIRCLE_WALLET_SET_ID;

  if (!walletSetId) {
    throw new Error("Batch creation requires a pre-defined CIRCLE_WALLET_SET_ID.");
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
    ESTIMATION_ERROR:
      "Gagal memperkirakan biaya transaksi (Smart contract revert).",
    INSUFFICIENT_NATIVE_TOKEN: "Saldo gas (token native) tidak mencukupi.",
    FEE_EXCEEDS_MAX_ALLOWANCE:
      "Biaya gas melebihi batas maksimal yang diizinkan.",
    GAS_LIMIT_TOO_LOW: "Batas gas (gas limit) terlalu rendah.",
    FAILED_ON_CHAIN: "Transaksi gagal dieksekusi di Blockchain.",
    PAYMASTER_POLICY_EXCEED_MAX_DAILY_TRANSACTIONS:
      "Batas harian transaksi Gas Station telah tercapai.",
    PAYMASTER_POLICY_EXCEED_MAX_SPEND_USD_PER_TX:
      "Transaksi melebihi batas USD per transaksi Gas Station.",
    PAYMASTER_POLICY_SENDER_IN_BLOCKLIST:
      "Alamat pengirim masuk dalam daftar blokir Paymaster.",
    INTERNAL_ERROR: "Terjadi kesalahan internal pada layanan Circle.",
    // General API Errors
    "-1": "Terjadi kesalahan yang tidak diketahui saat memproses permintaan API (Something went wrong).",
    "2": "Parameter API tidak valid atau format permintaan salah (Invalid Entity/Field).",
    "3": "Akses ditolak. API Key tidak memiliki izin untuk endpoint ini (Forbidden).",
    // API Codes (155xxx)
    "155112": "PIN yang Anda masukkan salah. Silakan coba lagi.",
    "155119":
      "PIN Anda terkunci sementara karena terlalu banyak percobaan. Mohon tunggu beberapa saat.",
    "155121":
      "Sesi transaksi (Challenge) telah kedaluwarsa. Silakan ulangi transaksi Anda.",
    "155141":
      "Anda telah mencapai batas percobaan OTP. Silakan tunggu 60 menit.",
    "155142": "Batas pengiriman OTP harian telah tercapai.",
  };

  const detailsMap: Record<string, string> = {
    "ERC20: transfer amount exceeds balance":
      "Saldo token tidak mencukupi untuk transfer ini.",
    "Insufficient Balance": "Saldo tidak mencukupi (token atau gas).",
    "Blacklistable: account is blacklisted":
      "Alamat terlibat masuk dalam daftar blokir (USDC Contract Blacklist).",
    "Check allowance":
      "Izin penggunaan token (Allowance) tidak mencukupi atau tidak ditemukan.",
    "ERC20: insufficient allowance": "Izin penggunaan token tidak mencukupi.",
    "Transfer amount must be greater than zero":
      "Jumlah transfer harus lebih besar dari nol.",
    "Amount below minimum": "Jumlah terlalu kecil (di bawah batas minimum).",
    "AA95 out of gas": "Transaksi kehabisan gas saat eksekusi di blockchain.",
    "ERC20: transfer to the zero address":
      "Tidak dapat mengirim ke alamat nol (0x0).",
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
  return (
    details || reason || "Transaksi gagal karena alasan teknis blockchain."
  );
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
  if (
    !isBypass &&
    amount >= HIGH_VALUE_THRESHOLD &&
    userId !== "00000000-0000-0000-0000-000000000000"
  ) {
    // Save to database as pending_approval
    const { data: pendingTx, error: dbError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: userId,
        amount: `-${amount.toFixed(2)}`,
        type: type,
        status: "pending_approval",
        internal_ref: `pending_${crypto.randomBytes(8).toString("hex")}`,
        metadata: {
          ...metadata,
          description: `[Approval Required] ${metadata.memo || (type === "transfer" ? `Transfer to ${validDest}` : "Treasury Move")}`,
          real: true,
          destinationAddress: validDest,
          isHighValue: true,
          requestedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) throw dbError;

    await logAuditEvent(
      supabaseAdmin,
      userId,
      "HIGH_VALUE_TX_APPROVAL_QUEUED",
      {
        amount,
        txId: pendingTx.id,
      },
    );

    return {
      txId: pendingTx.id,
      status: "pending_approval",
      message:
        "This transaction exceeds the threshold and requires administrator approval.",
    };
  }
  // --- END ENFORCED APPROVAL QUEUE ---

  // Fase 2: Gas Estimation & Balance Checks
  const sourceAddress = walletData.wallet_address as `0x${string}`;

  // Use USDC_ADDRESS as default if no valid tokenAddress provided
  let tokenAddress = USDC_ADDRESS;
  if (type === "swap") {
    // For swaps, the token being transferred out of user wallet is fromToken
    if (
      metadata.fromToken &&
      metadata.fromToken !== "USDC" &&
      metadata.tokenAddress
    ) {
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
  const tokenBalanceRaw = await getTokenBalance(
    sourceAddress,
    tokenAddressTyped,
  );

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
    throw new Error(
      `Amount is too small for the required token precision (${decimals} decimals).`,
    );
  }

  const txParams: any = {
    idempotencyKey,
    walletId: walletData.wallet_id,
    destinationAddress: validDest,
    amount: [formattedAmount],
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM",
      },
    },
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
    metadata: {
      ...metadata,
      description:
        metadata.memo ||
        (type === "transfer" ? `Transfer to ${validDest}` : undefined),
      real: true,
    },
  });

  if (error) throw error;

  return {
    txId: circleTxId,
  };
}

/**
 * Executes a Batch Transfer using MSCA (Modular Smart Contract Account) Multi-call.
 * This ensures TRUE atomicity: if one transfer fails, the whole batch reverts.
 * Uses Circle's contractExecution endpoint with 'executeBatch' signature.
 */
export async function executeAtomicBatchTransfer(
  supabaseAdmin: any,
  userId: string,
  recipients: { address: string; amount: number; name?: string }[],
  platformFee: number = 0,
) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();

  if (!walletData?.wallet_id || !walletData?.wallet_address) {
    throw new Error("No wallet found for batching");
  }

  // 1. Fetch token decimals and balance for the batch
  const decimals = await getTokenDecimals(USDC_ADDRESS);
  const currentBalance = await getTokenBalance(
    walletData.wallet_address,
    USDC_ADDRESS,
  );

  const totalAmountWithFee =
    recipients.reduce((sum, r) => sum + r.amount, 0) + platformFee;

  // Convert total amount to bigint for comparison
  const totalAmountAtomic = BigInt(
    Math.floor(totalAmountWithFee * Math.pow(10, decimals)),
  );

  if (currentBalance < totalAmountAtomic) {
    throw new Error(
      `Insufficient balance for batch. Need ${totalAmountWithFee.toFixed(2)} USDC, have ${(Number(currentBalance) / Math.pow(10, decimals)).toFixed(2)} USDC`,
    );
  }

  // 2. Validate all destinations and prepare batch data
  const calls: any[] = [];

  // A. Add platform fee transfer if applicable
  if (platformFee > 0) {
    let treasuryAddress = process.env.PLATFORM_TREASURY_ADDRESS;
    if (!treasuryAddress) {
      const { data: treasuryWallet } = await supabaseAdmin
        .from("user_wallets")
        .select("wallet_address")
        .eq("id", "00000000-0000-0000-0000-000000000000")
        .single();
      treasuryAddress = treasuryWallet?.wallet_address;
    }

    if (treasuryAddress) {
      const feeAtomic = BigInt(
        Math.floor(platformFee * Math.pow(10, decimals)),
      );
      const feeCalldata = encodeFunctionData({
        abi: parseAbi(["function transfer(address to, uint256 amount)"]),
        functionName: "transfer",
        args: [treasuryAddress as `0x${string}`, feeAtomic],
      });
      calls.push([USDC_ADDRESS, "0", feeCalldata]);
    }
  }

  // B. Add recipient transfers
  for (const rec of recipients) {
    const validDest = validateDestination(rec.address);
    if (await isBlocklisted(validDest)) {
      throw new Error(`Address ${validDest} is blocklisted. Batch aborted.`);
    }

    const amountAtomic = BigInt(
      Math.floor(rec.amount * Math.pow(10, decimals)),
    );

    const calldata = encodeFunctionData({
      abi: parseAbi(["function transfer(address to, uint256 amount)"]),
      functionName: "transfer",
      args: [validDest, amountAtomic],
    });

    // Format for executeBatch: [targetAddress, nativeValue, callData]
    calls.push([USDC_ADDRESS, "0", calldata]);
  }

  if (calls.length === 0) throw new Error("No transactions to batch");

  console.log(
    `[CircleService] Processing Atomic Batch Transfer (${calls.length} calls) for user ${userId}. Total: ${totalAmountWithFee} USDC`,
  );

  const client = getCircleClientInstance();
  const idempotencyKey = crypto.randomUUID();

  // 3. Execute via Circle contractExecution
  // Use slightly more compatible function signature if standard executeBatch is picky
  // Circle's SCS accounts usually follow the executeBatch((address,uint256,bytes)[]) pattern
  const txParams: any = {
    idempotencyKey,
    walletId: walletData.wallet_id,
    contractAddress: walletData.wallet_address,
    abiFunctionSignature: "executeBatch((address, uint256, bytes)[])",
    abiParameters: [calls],
    fee: {
      type: "level",
      config: {
        feeLevel: "HIGH",
      },
    },
  };

  try {
    const response = await client.createContractExecutionTransaction(txParams);

    if (!response.data?.id) {
      throw new Error(
        "Contract execution failed: No transaction ID returned from Circle API",
      );
    }

    const circleTxId = response.data.id;

    // 4. Record the ATOMIC transaction
    const { error: dbError } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: `-${totalAmountWithFee.toFixed(2)}`,
      type: "batchTransfer",
      status: "pending",
      internal_ref: circleTxId,
      metadata: {
        description: `Atomic Batch Transfer to ${recipients.length} recipients`,
        recipients,
        platformFee,
        real: true,
        isAtomicBatch: true,
        atomicity: "MSCA_MULTI_CALL",
        contractCall: "executeBatch",
        decimals,
      },
    });

    if (dbError) {
      console.error("[CircleService] Failed to record batch in DB:", dbError);
      throw new Error(
        `Failed to record batch transaction in database: ${JSON.stringify(dbError)}`,
      );
    }

    return {
      txId: circleTxId,
      status: "pending",
      recipientCount: recipients.length,
      totalAmount: totalAmountWithFee,
    };
  } catch (error: any) {
    console.error(
      "[CircleService] Atomic Batch Transaction Failed:",
      error.message,
    );
    if (error.response?.data) {
      console.error(
        "[CircleService] API Error Details:",
        JSON.stringify(error.response.data),
      );
    }
    throw new Error(`Atomic Batch Transaction Failed: ${error.message}`);
  }
}

export async function executeContractTransaction(
  supabaseAdmin: any,
  userId: string,
  contractAddress: string,
  abiFunctionSignature: string,
  abiParameters: any[],
  feeLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM",
) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();

  if (!walletData?.wallet_id) throw new Error("No wallet found");

  const client = getCircleClientInstance();
  const idempotencyKey = crypto.randomUUID();

  const txParams: any = {
    idempotencyKey,
    walletId: walletData.wallet_id,
    contractAddress,
    abiFunctionSignature,
    abiParameters,
    fee: {
      type: "level",
      config: {
        feeLevel,
      },
    },
  };

  const response = await client.createContractExecutionTransaction(txParams);

  const circleTxId = response.data?.id;
  if (!circleTxId)
    throw new Error("Contract execution failed: No transaction ID returned");

  const { error } = await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    amount: "0",
    type: "swap_contract_call",
    status: "pending",
    internal_ref: circleTxId,
    metadata: {
      description: `DEX Contract Execution: ${abiFunctionSignature.split("(")[0]}`,
      real: true,
      contractAddress,
    },
  });

  if (error) throw error;

  return { txId: circleTxId };
}

export async function autoSweepWallets(
  supabaseAdmin: any,
  threshold: number,
  treasuryAddress: string,
) {
  const { data: userWallets, error } = await supabaseAdmin
    .from("user_wallets")
    .select("*");
  if (error) throw error;

  const client = getCircleClientInstance();
  const results = [];

  for (const wallet of userWallets) {
    if (wallet.id === "00000000-0000-0000-0000-000000000000") continue; // Skip admin wallet

    // Get balance of USDC
    const balanceRaw = await getTokenBalance(
      wallet.wallet_address,
      USDC_ADDRESS,
    );
    const balance = Number(balanceRaw); // simplistic for now

    if (balance > threshold) {
      const amountToSweep = balance - threshold; // Leave threshold
      if (amountToSweep <= 0) continue;

      const idempotencyKey = crypto.randomUUID();
      const txParams: any = {
        idempotencyKey,
        walletId: wallet.wallet_id,
        destinationAddress: treasuryAddress,
        amount: [amountToSweep.toFixed(6)],
        tokenId: ARC_USDC_TOKEN_ID,
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      };

      try {
        const response = await client.createTransaction(txParams);
        results.push({
          wallet: wallet.wallet_address,
          txId: response.data?.id,
          amount: amountToSweep,
        });
      } catch (err) {
        console.error(`Failed sweep for ${wallet.wallet_address}:`, err);
      }
    }
  }
  return results;
}

export async function manualSweepAdminWallet(
  supabaseAdmin: any,
  amount: number,
  treasuryAddress: string
) {
  const adminId = "00000000-0000-0000-0000-000000000000";
  const { data: adminWallet } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", adminId)
    .single();

  if (!adminWallet?.wallet_id) throw new Error("Admin wallet not localizable");

  const client = getCircleClientInstance();
  const idempotencyKey = crypto.randomUUID();

  const txParams: any = {
    idempotencyKey,
    walletId: adminWallet.wallet_id,
    destinationAddress: treasuryAddress,
    amount: [amount.toFixed(6)],
    tokenId: ARC_USDC_TOKEN_ID,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  };

  const response = await client.createTransaction(txParams);
  const circleTxId = response.data?.id;

  if (circleTxId) {
    await supabaseAdmin.from("transactions").insert({
      user_id: adminId,
      amount: `-${amount.toFixed(2)}`,
      type: "treasury_sweep",
      status: "pending",
      internal_ref: circleTxId,
      metadata: {
        description: `Manual Treasury Sweep to ${treasuryAddress}`,
        real: true,
        destinationAddress: treasuryAddress,
      },
    });
  }

  return response.data;
}

export async function executeReleaseEscrow(
  supabaseAdmin: any,
  sellerAddress: string,
  amount: number,
  orderId: string
) {
  const adminId = "00000000-0000-0000-0000-000000000000";
  const { data: adminWallet } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", adminId)
    .single();

  if (!adminWallet?.wallet_id) {
    throw new Error("Platform Treasury wallet (Admin wallet) is not found in database or not initialized.");
  }

  const client = getCircleClientInstance();
  const idempotencyKey = crypto.randomUUID();

  // Validate the destination address
  const validDest = validateDestination(sellerAddress);
  const blocked = await isBlocklisted(validDest);
  if (blocked) {
    throw new Error(`Seller address ${validDest} is blocklisted by Arc Protocol.`);
  }

  const feePercent = 0.05;
  const sellerReceiveAmt = amount * (1 - feePercent);

  const txParams: any = {
    idempotencyKey,
    walletId: adminWallet.wallet_id,
    destinationAddress: validDest,
    amount: [sellerReceiveAmt.toFixed(6)],
    tokenId: ARC_USDC_TOKEN_ID,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  };

  const response = await client.createTransaction(txParams);
  const circleTxId = response.data?.id;

  if (circleTxId) {
    // Record transaction
    await supabaseAdmin.from("transactions").insert({
      user_id: adminId,
      amount: `-${sellerReceiveAmt.toFixed(2)}`,
      type: "escrow_release_payout",
      status: "pending",
      internal_ref: circleTxId,
      metadata: {
        description: `Escrow release payout to merchant ${sellerAddress} for order ${orderId}`,
        real: true,
        destinationAddress: sellerAddress,
        orderId: orderId,
        feeKept: (amount * feePercent).toFixed(2)
      },
    });

    // Update the ecommerce_orders table with transaction ID
    await supabaseAdmin
       .from("ecommerce_orders")
       .update({ 
         status: "RELEASED",
         tx_hash: circleTxId
       })
       .eq("id", orderId);
  }

  return {
    txId: circleTxId,
    sellerReceive: sellerReceiveAmt,
    platformFee: amount * feePercent
  };
}
