import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Cliente Supabase para uso no browser (anon key).
 * NUNCA usar service_role aqui.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
