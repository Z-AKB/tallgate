/**
 * Browser Supabase client.
 * Uses the anon key — safe to expose to the client. All access control is
 * enforced by Postgres Row-Level Security policies (see NFR-1 / FR-6),
 * never solely by what this client chooses to query.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
