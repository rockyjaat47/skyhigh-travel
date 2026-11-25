import type { SupabaseClient } from '@supabase/supabase-js'
import { env, hasSupabase } from '../config/env'

let client: SupabaseClient | null = null

/**
 * Lazily creates the Supabase client (code-split; never loaded when the
 * backend isn't configured). Returns null when env vars are missing.
 */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (!hasSupabase) return null
  if (client) return client
  const { createClient } = await import('@supabase/supabase-js')
  client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'skyhigh-admin-auth' },
  })
  return client
}
