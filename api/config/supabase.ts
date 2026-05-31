import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

let supabaseAdminInstance: any = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const rawBackendUrl = process.env.VITE_SUPABASE_URL || "";
    const cleanUrl = rawBackendUrl
      .replace(/\/rest\/v1\/?$/, "")
      .replace(/\/$/, "");

    if (!cleanUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
      );
    }

    supabaseAdminInstance = createClient(
      cleanUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return supabaseAdminInstance;
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  if (!userId || userId === (process.env.PLATFORM_ADMIN_UUID as string))
    return false;
  try {
    const { data } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    return (
      data?.user?.user_metadata?.blocked === true ||
      data?.user?.user_metadata?.deleted === true
    );
  } catch (err) {
    return false;
  }
}
