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
import { getCircleClientInstance, getAppKitInstance } from "./circleClient.js";

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

  const { kit, adapter } = getAppKitInstance();

  // Validate amount format
  const amountStr = amount.toFixed(decimals >= 6 ? 6 : decimals);

  try {
    const result = await kit.send({
      from: { adapter, chain: "Arc_Testnet" as any, address: sourceAddress },
      to: validDest,
      amount: amountStr,
      token: (metadata.fromToken || "USDC") as any // Map token symbols or default
    });

    // Assume AppKit handles sequential operations safely
    const circleTxId = result.txHash || `${Date.now()}-appkit-send`;

    const { error } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: `-${amount.toFixed(2)}`,
      type: type,
      status: "pending",
      internal_ref: circleTxId,
      description:
        metadata.memo ||
        (type === "transfer" ? `Transfer to ${validDest}` : undefined),
      metadata: { ...metadata, real: true, generatedViaAppKit: true },
    });

    if (error) throw error;

    return {
      txId: circleTxId,
    };
  } catch (err: any) {
    console.error("[CCTP/AppKit Error]", err?.message || err);
    throw new Error(err?.message || "Failed to execute transaction via AppKit");
  }
}

export async function executeAppKitEarnDeposit(supabaseAdmin: any, userId: string, amount: number, vaultAddress: string) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();
  if (!walletData?.wallet_address) throw new Error("No wallet found");

  const { kit, adapter } = getAppKitInstance();

  try {
    const result = await kit.earn.deposit({
      from: { adapter, chain: "Arc_Testnet" as any, address: walletData.wallet_address as string },
      vaultAddress: vaultAddress as any,
      amount: amount.toString()
    });

    const txId = result.txHash || `${Date.now()}-appkit-earn-deposit`;

    const { error } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: `-${amount.toFixed(2)}`,
      type: "stake",
      status: "pending",
      internal_ref: txId,
      description: `Stake ${amount} in Vault`,
      metadata: { vaultAddress, real: true, generatedViaAppKit: true },
    });

    if (error) throw error;

    return { txId };
  } catch (err: any) {
    console.error("[AppKit Earn Deposit Error]", err?.message || err);
    throw new Error(err?.message || "Failed to execute earn deposit via AppKit");
  }
}

export async function estimateSwap(supabaseAdmin: any, userId: string, amount: number, fromToken: string, toToken: string) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();
  if (!walletData?.wallet_address) throw new Error("No wallet found");

  const { kit, adapter } = getAppKitInstance();

  try {
    const estimateResult = await kit.estimateSwap({
      from: { adapter, chain: "Arc_Testnet" as any, address: walletData.wallet_address as string },
      tokenIn: fromToken as any,
      tokenOut: toToken as any,
      amountIn: amount.toString(),
      config: { slippageBps: 300 }
    });
    return estimateResult;
  } catch (err: any) {
    console.error("[AppKit Swap Estimate Error]", err?.message || err);
    throw new Error(err?.message || "Failed to estimate swap via AppKit");
  }
}

export async function executeAppKitEarnWithdraw(supabaseAdmin: any, userId: string, amount: number, vaultAddress: string) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();
  if (!walletData?.wallet_address) throw new Error("No wallet found");

  const { kit, adapter } = getAppKitInstance();

  try {
    const result = await kit.earn.withdraw({
      from: { adapter, chain: "Arc_Testnet" as any, address: walletData.wallet_address as string },
      vaultAddress: vaultAddress as any,
      amount: amount.toString()
    });

    const txId = result.txHash || `${Date.now()}-appkit-earn-withdraw`;

    const { error } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: `+${amount.toFixed(2)}`,
      type: "claim",
      status: "pending",
      internal_ref: txId,
      description: `Claim ${amount} from Vault`,
      metadata: { vaultAddress, real: true, generatedViaAppKit: true },
    });

    if (error) throw error;

    return { txId };
  } catch (err: any) {
    console.error("[AppKit Earn Withdraw Error]", err?.message || err);
    throw new Error(err?.message || "Failed to execute earn withdraw via AppKit");
  }
}

export async function executeAppKitEarnClaimRewards(supabaseAdmin: any, userId: string, vaultAddress: string) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();
  if (!walletData?.wallet_address) throw new Error("No wallet found");

  const { kit, adapter } = getAppKitInstance();

  try {
    const result = await kit.earn.claimRewards({
      from: { adapter, chain: "Arc_Testnet" as any, address: walletData.wallet_address as string },
      vaultAddress: vaultAddress as any
    });

    if (result.status === "no_rewards") {
      throw new Error("No rewards to claim");
    }

    const txId = result.txHash || `${Date.now()}-appkit-earn-claim`;

    const { error } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: `+0.00`, // To be updated on webhook
      type: "claim",
      status: "pending",
      internal_ref: txId,
      description: `Claim Rewards from Vault`,
      metadata: { vaultAddress, real: true, generatedViaAppKit: true },
    });

    if (error) throw error;

    return { txId };
  } catch (err: any) {
    console.error("[AppKit Earn Claim Rewards Error]", err?.message || err);
    throw new Error(err?.message || "Failed to execute earn claim via AppKit");
  }
}

export async function executeAppKitSwap(supabaseAdmin: any, userId: string, amount: number, fromToken: string, toToken: string) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();
  if (!walletData?.wallet_address) throw new Error("No wallet found");

  const { kit, adapter } = getAppKitInstance();

  try {
    const result = await kit.swap({
      from: { adapter, chain: "Arc_Testnet" as any, address: walletData.wallet_address as string },
      tokenIn: fromToken as any,
      tokenOut: toToken as any,
      amountIn: amount.toString(),
      config: { slippageBps: 300 }
    });

    const txId = result.txHash || `${Date.now()}-appkit-swap`;

    const { error } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      amount: `-${amount.toFixed(2)}`,
      type: "swap",
      status: "pending",
      internal_ref: txId,
      description: `Swap ${amount} ${fromToken} to ${toToken}`,
      metadata: { fromToken, toToken, real: true, generatedViaAppKit: true },
    });

    if (error) throw error;

    return { txId };
  } catch (err: any) {
    console.error("[AppKit Swap Execution Error]", err?.message || err);
    throw new Error(err?.message || "Failed to execute swap via AppKit");
  }
}

export async function executeAppKitBatchTransfer(supabaseAdmin: any, userId: string, recipients: any[]) {
  const { data: walletData } = await supabaseAdmin
    .from("user_wallets")
    .select("wallet_id, wallet_address")
    .eq("id", userId)
    .single();
  if (!walletData?.wallet_address) throw new Error("No wallet found");

  const { kit, adapter } = getAppKitInstance();

  const responses = await Promise.all(
    recipients.map(async (rec) => {
      try {
        const result = await kit.send({
          from: { adapter, chain: "Arc_Testnet" as any, address: walletData.wallet_address as string },
          to: rec.address,
          amount: rec.amount.toString(),
          token: "USDC"
        });

        const txId = typeof result === "object" && result !== null && "transactionHash" in result 
            ? (result as any).transactionHash 
            : `${Date.now()}-appkit-batch-send`;

        await supabaseAdmin.from("transactions").insert({
          user_id: userId,
          amount: `-${rec.amount}`,
          type: "transfer",
          status: "pending", 
          internal_ref: txId,
          metadata: {
            recipientName: rec.name || "EVM Account",
            destinationAddress: rec.address,
            real: true,
            trackedViaAppKit: true
          },
        });

        return {
          address: rec.address,
          amount: rec.amount,
          status: "success",
          txId: txId,
        };
      } catch (txError: any) {
        console.error(`[AppKit] Failed to process batch recipient: ${rec.address}`, txError);
        
        await supabaseAdmin.from("transactions").insert({
          user_id: userId,
          amount: `-${rec.amount}`,
          type: "transfer",
          status: "failed",
          internal_ref: `failed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          metadata: {
            recipientName: rec.name || "EVM Account",
            destinationAddress: rec.address,
            real: true,
            trackedViaAppKit: true
          },
        });

        return {
          address: rec.address,
          amount: rec.amount,
          status: "failed",
          error: txError.message || "Unknown transaction error",
        };
      }
    })
  );

  return responses;
}

