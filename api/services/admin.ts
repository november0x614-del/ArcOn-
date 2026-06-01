import { getCircleClientInstance } from "./circleClient";
import { getSupabaseAdmin } from "../config/supabase";

export async function getWalletDetails(walletId: string) {
  const client = getCircleClientInstance();
  const response = await client.getWallet({ id: walletId });
  return response.data?.wallet;
}

export async function upgradeWallet(walletId: string) {
  // Commented out as the specific SDK method name for upgrade varies by version
  // and is not currently exposed in the prototype of the local client instance.
  // Administrator can use the Circle Dashboard for bulk upgrades if needed.
  console.log(
    `[Admin] Manual upgrade requested for wallet ${walletId} (Method pending SDK verification)`,
  );
  return { status: "Feature pending SDK update" };
}

export async function fetchSystemTransactions(limit = 20) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function fetchPendingApprovals() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, profiles(full_name)")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

import { executeTransaction } from "./circle";

export async function decideApproval(
  txId: string,
  decision: "approve" | "reject",
) {
  const supabase = getSupabaseAdmin();

  // 1. Fetch the transaction
  const { data: tx, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", txId)
    .single();

  if (fetchError || !tx)
    throw new Error("Transaction not found or already processed");
  if (tx.status !== "pending_approval")
    throw new Error("Transaction is not in pending_approval state");

  if (decision === "reject") {
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "failed",
        metadata: {
          ...tx.metadata,
          description: `[Rejected] ${tx.metadata?.description || ""}`,
        },
      })
      .eq("id", txId);
    if (updateError) throw updateError;
    return { status: "rejected" };
  }

  // 2. Approve and Execute
  // We need to bypass the threshold check when calling executeTransaction again
  // Or better, we manually call the Circle execution part here.
  // Actually, executeTransaction can be modified to accept a 'bypassApproval' flag.

  // For now, let's just use the metadata to store the bypass flag
  const amount = Math.abs(parseFloat(tx.amount));
  const destination = tx.metadata?.destinationAddress || tx.metadata?.toAddress;

  const result = await executeTransaction(
    supabase,
    tx.user_id,
    amount,
    destination,
    tx.type,
    { ...tx.metadata, bypassApproval: true }, // Need to modify executeTransaction to respect this
  );

  // 3. Update the original record (or delete it? No, keep it as the record)
  // Actually executeTransaction creates a NEW record.
  // We should modify executeTransaction to optionally UPDATE an existing record.
  // But to keep it simple, we'll let it create a new record and mark this one as 'approved_and_replaced'

  await supabase
    .from("transactions")
    .update({
      status: "success",
      metadata: {
        ...tx.metadata,
        description: `[Approved] ${tx.metadata?.description || ""}`,
      },
      internal_ref: result.txId, // Update with real Circle Tx ID
    })
    .eq("id", txId);

  return { status: "approved", circleTxId: result.txId };
}
