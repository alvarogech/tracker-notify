import { createAdminClient } from '@/lib/supabase/server'
import type { UserProfile } from './types'

// Resolve o GR de quem está chamando, seja o líder dono do GR
// (groups.leader_id) ou um cooperador com acesso concedido (group_helpers).
// Usa o cliente admin só para a consulta de qual GR — a autorização real de
// cada ação continua sendo decidida comparando esse id contra o GR alvo.
export async function getCallerGroupId(profile: UserProfile): Promise<string | null> {
  const admin = createAdminClient()

  if (profile.role === 'leader') {
    const { data } = await admin
      .from('groups')
      .select('id')
      .eq('leader_id', profile.id)
      .eq('active', true)
      .maybeSingle()
    return (data as { id: string } | null)?.id ?? null
  }

  if (profile.role === 'cooperator') {
    const { data } = await admin.from('group_helpers').select('group_id').eq('profile_id', profile.id).maybeSingle()
    return (data as { group_id: string } | null)?.group_id ?? null
  }

  return null
}
