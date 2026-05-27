import { createClient } from "@supabase/supabase-js";

const rawUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder_anon_key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
