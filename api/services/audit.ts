import { getSupabaseAdmin } from "../config/supabase.js";

export async function logAuditEvent(
  userId: string,
  action: string,
  targetId: string | null = null,
  metadata: any = {},
) {
  const supabase = getSupabaseAdmin();

  // Validate if userId is a valid UUID, otherwise nullify to prevent foreign key errors.
  let cleanUserId: string | null = userId;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId)) {
    cleanUserId = null;
  }

  // Check if user exists in profiles (linked to auth.users) to prevent FK violation
  if (cleanUserId) {
    try {
      const { data: userExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", cleanUserId)
        .maybeSingle();
      
      if (!userExists) {
        cleanUserId = null;
      }
    } catch {
      cleanUserId = null;
    }
  }

  const { error } = await supabase.from("audit_logs").insert({
    user_id: cleanUserId,
    action: `[AUDIT] ${action}${targetId ? ` on ${targetId}` : ""}`,
    metadata: {
      ...metadata,
      isAudit: true,
      timestamp: new Date().toISOString(),
    },
  });

  if (error) {
    console.error("[AuditLog] Failed to log action:", error);
  }
}

// Alias for semantic clarity in admin routes
export const logAdminAction = logAuditEvent;
