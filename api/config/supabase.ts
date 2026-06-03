import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

try {
  dotenv.config();
} catch (e) {
  console.warn("Dotenv load warning:", e);
}

let supabaseAdminInstance: any = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const rawBackendUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const cleanUrl = rawBackendUrl
      .replace(/\/rest\/v1\/?$/, "")
      .replace(/\/$/, "");

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!cleanUrl || !serviceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL / VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
      );
    }

    supabaseAdminInstance = createClient(
      cleanUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return supabaseAdminInstance;
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  if (!userId || userId === "00000000-0000-0000-0000-000000000000")
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
