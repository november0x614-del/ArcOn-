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
import { getCircleClientInstance } from "./circleClient.js";
import * as crypto from "crypto";

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

const ARC_USDC_TOKEN_ID = "15dc2b5d-0994-58b0-bf8c-3a0501148ee8";
export const HIGH_VALUE_THRESHOLD = 500; // USDC threshold for mandatory admin approval

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
  const tokenAddress = (metadata.tokenAddress || USDC_ADDRESS) as `0x${string}`;

  // Fetch token decimals for correct estimation
  const decimals = await getTokenDecimals(tokenAddress);

  // Amount in 18-decimal internal for logic checks
  const amountInternal = BigInt(Math.floor(amount * 1_000_000)) * 10n ** 12n;

  // Fetch balances FIRST
  const tokenBalanceRaw = await getTokenBalance(sourceAddress, tokenAddress);

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
  const useTokenId = !metadata.tokenAddress || metadata.tokenAddress === USDC_ADDRESS;

  const txParams: any = {
    idempotencyKey,
    walletId: walletData.wallet_id,
    destinationAddress: validDest,
    amount: [amount.toFixed(6)], // Standardize to 6 decimals for USDC transfer string
    fee: { 
      type: "level", 
      config: { 
        feeLevel: "MEDIUM" 
      } 
    },
  };

  if (useTokenId) {
    txParams.tokenId = ARC_USDC_TOKEN_ID;
  } else {
    txParams.tokenAddress = tokenAddress;
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

  for (let i = 0; i < recipients.length; i++) {
    const rec = recipients[i];
    const validDest = validateDestination(rec.address);
    const idempotencyKey = crypto.randomUUID();

    try {
      // Using createTransaction for standard transfers
      const response = await client.createTransaction({
        idempotencyKey,
        walletId: walletData.wallet_id,
        destinationAddress: validDest,
        amount: [rec.amount.toFixed(6)], 
        tokenId: ARC_USDC_TOKEN_ID, // Use explicit USDC Token ID for Arc Testnet
        fee: {
          type: "level",
          config: {
            feeLevel: "HIGH", // Higher priority for batch elements
          },
        },
      });

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
