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
  const txParams: any = {
    idempotencyKey,
    walletId: walletData.wallet_id,
    destinationAddress: validDest,
    amount: [amount.toFixed(decimals >= 6 ? 6 : decimals)], // SDK expects 'amount' singular as array of strings in Node.js
    fee: { 
      type: "level", 
      config: { 
        feeLevel: "MEDIUM" 
      } 
    },
    tokenAddress: metadata.tokenAddress || "", // Use provided token address or empty for native
  };

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
 * Executes an Atomic Batch Transfer (Multiple recipients in ONE blockchain transaction)
 * Only supported for SCA wallets.
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
  const idempotencyKey = crypto.randomUUID();

  // Validate all destinations first
  for (const rec of recipients) {
    const valid = validateDestination(rec.address);
    if (await isBlocklisted(valid)) {
      throw new Error(`Address ${valid} is blocklisted. Batch aborted.`);
    }
  }

  /**
   * For Circle Developer-Controlled SCA:
   * Atomic batching is performed via createContractExecutionTransaction with multiple calls.
   */
  const response = await client.createContractExecutionTransaction({
    idempotencyKey,
    walletId: walletData.wallet_id,
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM",
      },
    },
    calls: recipients.map((r) => ({
      contractAddress: USDC_ADDRESS,
      abiFunctionSignature: "transfer(address,uint256)",
      abiParameters: [
        validateDestination(r.address),
        Math.floor(r.amount * 1_000_000).toString(), // USDC has 6 decimals
      ],
    })),
  } as any);

  const circleTxId = response.data?.id;

  // Record each as a separate logical transaction but linked to the same Circle Tx ID
  for (const rec of recipients) {
    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: `-${rec.amount.toFixed(2)}`,
      type: "transfer",
      status: "pending",
      internal_ref: circleTxId,
      metadata: {
        recipientName: rec.name || "Batch Recipient",
        destinationAddress: rec.address,
        isAtomicBatch: true,
        real: true,
      },
    });
  }

  return { txId: circleTxId };
}
