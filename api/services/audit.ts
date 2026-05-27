export async function logAuditEvent(supabaseAdmin: any, userId: string, action: string, metadata: any) {
    try {
      console.log(`[AUDIT] User: ${userId} | Action: ${action} | Meta:`, metadata);
      
      // Normalize userId: convert non-existent or invalid UUID string to null
      const safeUserId = userId && userId.trim() !== '' ? userId : null;
      
      const dataToInsert = {
        user_id: safeUserId,
        action: action,
        metadata: metadata
      };
      let { error } = await supabaseAdmin.schema('public').from('app_audit_logs').insert(dataToInsert).select();
      
      // If FOREIGN KEY VIOLATION (23503) or INVALID UUID (22P02), retry with null user_id
      if (error && (error.code === '23503' || error.code === '22P02') && safeUserId !== null) {
        console.warn(`[AUDIT] Error ${error.code} for user ${userId}, retrying with null.`);
        ({ error } = await supabaseAdmin.schema('public').from('app_audit_logs').insert({
          user_id: null,
          action: action,
          metadata: metadata
        }).select());
      }
      
      if (error) {
        console.error("Failed recording audit log in Supabase! Table: app_audit_logs");
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        console.error("Error Details:", error.details);
        console.error("Error Hint:", error.hint);
      }
    } catch (e) {
      console.error("Audit logger exception:", e);
    }
  }
