import { ArcNativeService } from "./arcNative.js";
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

export async function createWallet(supabaseAdmin: any, userId: string) {
  const client = getCircleClientInstance();

  // 1. Create Wallet Set
  const walletSetResponse = await client.createWalletSet({
    name: "Arc Commerce Wallet Set",
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
    accountType: "EOA",
  });

  const wallet = walletResponse.data?.wallets?.[0];
  if (!wallet) {
    throw new Error(
      "Wallet creation failed: no wallets array returned from Circle",
    );
  }

  // 3. Save to Supabase if userId is provided
  if (userId) {
    // Get next unique index for HD Wallet derivation
    const { data: countData } = await supabaseAdmin
      .from("user_wallets")
      .select("id");

    const nextIndex = (countData?.length || 0) + 1;
    const nativeWallet = ArcNativeService.getDepositAddress(nextIndex);

    const { error } = await supabaseAdmin.from("user_wallets").upsert({
      id: userId,
      wallet_id: wallet.id,
      wallet_address: wallet.address,
      wallet_set_id: walletSet.id,
      hd_index: nextIndex,
      native_deposit_address: nativeWallet.address,
      native_private_key: nativeWallet.privateKey,
    });
    if (error) console.error("Failed mapping to Supabase:", error);
  }

  return {
    walletId: wallet.id,
    address: wallet.address,
    walletSetId: walletSet.id,
  };
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

  // Fase 3 Preview: Memo support (if provided in metadata)
  const txParams: any = {
    walletId: walletData.wallet_id,
    destinationAddress: validDest,
    amount: [amount.toFixed(decimals >= 6 ? 6 : decimals)], // Circle might expect standard decimal string
    fee: { type: "sponsor" } as any, // Changed to Sponsor to use Gas Station
    tokenAddress: metadata.tokenAddress || "", // Use provided token address or empty for native
    blockchain: "ARC-TESTNET",
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
