import { SupabaseClient } from "@supabase/supabase-js";

export async function logAuditEvent(
  supabaseAdmin: SupabaseClient,
  userId: string,
  eventType: string,
  details: Record<string, any>
) {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      event_type: eventType,
      details,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (err) {
    console.error("Audit logging failed:", err);
  }
}
