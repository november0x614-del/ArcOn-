export async function logAuditEvent(supabaseAdmin: any, userId: string, action: string, metadata: any) {
    try {
      console.log(`[AUDIT] User: ${userId} | Action: ${action} | Meta:`, metadata);
      
      const { error } = await supabaseAdmin.from('audit_logs').insert({
        user_id: userId,
        action: action,
        metadata: metadata,
        timestamp: new Date().toISOString()
      });
      
      if (error) {
        console.error("Failed recording audit log in Supabase:", error);
      }
    } catch (e) {
      console.error("Audit logger exception:", e);
    }
  }
