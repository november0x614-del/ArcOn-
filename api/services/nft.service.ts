
import { getSupabaseAdmin } from "../config/supabase";
import { getCircleClientInstance } from "./circleClient";
import { createWallet, interpretCircleError } from "./circle";
import * as crypto from "crypto";

export async function mintNftService(
  userId: string,
  walletAddress: string,
  name: string,
  description: string,
  image: string,
  nftContractAddress: string
) {
  const supabaseAdmin = getSupabaseAdmin();
  const ADMIN_ID = "00000000-0000-0000-0000-000000000000";

  // 1. Get Admin Wallet from Env or DB securely
  let envWalletId = process.env.MINTER_WALLET_ID;
  
  // Basic validation: Circle Wallet IDs must be UUIDs. If it looks like an address, it's wrong.
  if (envWalletId && (envWalletId.startsWith("0x") || envWalletId.length !== 36)) {
      console.warn("[NFT Mint Service] MINTER_WALLET_ID looks like an address or is invalid. Circle requires the Wallet UUID.");
      envWalletId = undefined;
  }
  
  let adminWallet = { wallet_id: envWalletId };

  if (!adminWallet.wallet_id) {
    console.warn("[NFT Mint Service] Minter Wallet ID not found in env, falling back to DB...");
    const ADMIN_ID = "00000000-0000-0000-0000-000000000000";
    let { data: dbWallet, error: adminError } = await supabaseAdmin
      .from("user_wallets")
      .select("wallet_id")
      .eq("id", ADMIN_ID) // Admin ID
      .single();
    
    if (adminError || !dbWallet) {
        console.warn("[NFT Mint Service] Admin Minter Wallet not found, attempting to create...");
        try {
          const newAdminWallet = await createWallet(supabaseAdmin, ADMIN_ID);
          adminWallet = { wallet_id: newAdminWallet.walletId };
        } catch (createErr) {
          console.error("[NFT Mint Service] Failed creating admin wallet:", createErr);
          throw new Error("Admin Minter Wallet not configured and could not be created.");
        }
    } else {
        adminWallet = { wallet_id: dbWallet.wallet_id };
    }
  }

  // 2. Prepare Transaction
  const formattedTokenUri = `ipfs://Qm${crypto.randomBytes(16).toString("hex")}`;
  const idempotencyKey = crypto.randomUUID();

  // 3. Initiate Circle Transaction (Contract Execution)
  const client = getCircleClientInstance();
  
  // Ensure contract address is valid EVM format
  const targetContract = nftContractAddress.startsWith("0x") ? nftContractAddress : `0x${nftContractAddress}`;

  console.log("[NFT Mint Service] Initiating Circle API call with refined params:", {
    walletId: adminWallet.wallet_id,
    abiFunctionSignature: "mintTo(address,string)",
    abiParameters: [walletAddress, formattedTokenUri],
    contractAddress: targetContract,
  });

  try {
    const txParams: any = {
      idempotencyKey,
      walletId: adminWallet.wallet_id as string,
      abiFunctionSignature: "mintTo(address,string)",
      abiParameters: [walletAddress, formattedTokenUri],
      contractAddress: targetContract,
      fee: { 
        type: "level", 
        config: { 
          feeLevel: "MEDIUM" 
        } 
      },
    };

    // Only include amount if it's actually needed (it's optional in SDK for contract execution)
    // Some Circle API versions fail if amount is "0" for non-payable functions
    const response = await client.createContractExecutionTransaction(txParams);

    const responseData = response.data as any;
    const circleTxId = responseData?.id;

    if (!circleTxId) {
      console.error("[NFT Mint Service] No transaction ID in response:", response);
      throw new Error("No transaction ID returned from Circle API");
    }

    // 4. Initialize Transaction State in DB (Set to PENDING)
  const { error: txError } = await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    amount: 0,
    type: "mint_nft",
    status: "pending", // Industrial standard: wait for actual confirmation
    internal_ref: circleTxId,
    metadata: {
      description: `Mint NFT: ${name}`,
      name,
      descriptionText: description,
      image,
      nftContractAddress: targetContract,
      tokenUri: formattedTokenUri,
    },
  });

  if (txError) {
    console.error("[NFT Mint Service] Failed inserting into transactions:", JSON.stringify(txError, null, 2));
    throw new Error(`Failed mapping to Supabase (transactions): ${txError.message}`);
  }

  const { error: ledgerError } = await supabaseAdmin.from("transaction_ledger").insert({
    user_id: userId,
    tx_type: "MINT_NFT",
    amount: 0,
    destination_address: targetContract,
    circle_tx_id: circleTxId,
    status: "PENDING",
    metadata: {
      name,
      description,
      tokenUri: formattedTokenUri,
    },
  });

  if (ledgerError) {
    console.error("[NFT Mint Service] Failed inserting into transaction_ledger:", JSON.stringify(ledgerError, null, 2));
    throw new Error(`Failed mapping to Supabase (transaction_ledger): ${ledgerError.message}`);
  }

  return { circleTxId };
 } catch (err: any) {
    console.error("[NFT Mint Service] SDK Failure Trace:", err);
    
    // Parse industrial standard Circle errors
    const circleReason = err.response?.data?.errorReason || err.code || "UNKNOWN";
    const circleDetails = err.response?.data?.errorDetails || err.message;
    const humanError = interpretCircleError(circleReason, circleDetails);
    
    throw new Error(humanError);
 }
}
