import { supabase } from "./supabaseClient";

/**
 * Authenticated Fetch wrapper for Lounge API calls.
 * Automatically injects the Supabase JWT token from the current session.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

  // Only inject token for relative /api path or local domain api
  if (url.startsWith("/api/")) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    
    if (token) {
      init = init || {};
      const headers = new Headers(init.headers);
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      init.headers = headers;
    }
  }

  return fetch(input, init);
}
