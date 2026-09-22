import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service-role key — this app has no
 * end-user auth, and all writes happen from the cron poller, so RLS is not
 * in play here. Never import this from client components.
 */
export function getDbClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}
