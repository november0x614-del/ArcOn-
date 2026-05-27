export async function logAuditEvent(
  supabaseAdmin: any,
  userId: string,
  action: string,
  metadata: any,
) {
  try {
    console.log(
      `[AUDIT] User: ${userId} | Action: ${action} | Meta:`,
      metadata,
    );

    const { error } = await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: action,
      metadata: metadata,
    });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.warn(
          "⚠️ Tabel `audit_logs` belum ada di Supabase. Silakan jalankan `supabase_setup.sql` di SQL Editor Supabase.",
        );
      } else {
        console.error("Failed recording audit log in Supabase:", error);
      }
    }
  } catch (e) {
    console.error("Audit logger exception:", e);
  }
}
