export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

/**
 * Tipos gerados do schema Supabase.
 * Regenerar após cada migration com: pnpm supabase:types
 */
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
