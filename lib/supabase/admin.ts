import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase client using the Service Role Key.
 * WARNING: This client bypasses Row Level Security (RLS).
 * NEVER expose this key to the client-side or use it in public routes.
 * ALWAYS verify the user's admin status before performing actions with this client.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin client requires URL and service role key configuration.')
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
