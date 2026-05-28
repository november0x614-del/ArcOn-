import { getSupabaseAdmin } from "../config/supabase.js";

export async function logAuditEvent(
  userId: string,
  action: string,
  targetId: string | null = null,
  metadata: any = {}
) {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    amount: "0.00",
    type: "AUDIT_LOG",
    status: "success",
    description: `[AUDIT] ${action}${targetId ? ` on ${targetId}` : ""}`,
    metadata: {
      ...metadata,
      isAudit: true,
      timestamp: new Date().toISOString()
    }
  });

  if (error) {
    console.error("[AuditLog] Failed to log action:", error);
  }
}

// Alias for semantic clarity in admin routes
export const logAdminAction = logAuditEvent;
