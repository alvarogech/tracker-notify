import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/groups/GroupCard'

export const metadata: Metadata = { title: 'Coordenação' }

interface GroupRow {
  id: string
  name: string
  location?: string | null
  day_of_week?: number | null
  meeting_time?: string | null
  active: boolean
  leader?: { full_name: string } | null
}

export default async function CoordenaçãoPage() {
  await requireRole(['coordinator', 'admin'])
  const supabase = createClient()

  const { data } = await supabase
    .from('groups')
    .select('id, name, location, day_of_week, meeting_time, active, leader:profiles(full_name)')
    .order('name')

  const groups = (data ?? []) as unknown as GroupRow[]
  const active = groups.filter((g) => g.active)
  const inactive = groups.filter((g) => !g.active)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Grupos de Relacionamento</h1>

      {active.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Ativos · {active.length}
          </p>
          {active.map((g) => <GroupCard key={g.id} group={g} />)}
        </section>
      )}

      {inactive.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Inativos · {inactive.length}
          </p>
          {inactive.map((g) => <GroupCard key={g.id} group={g} />)}
        </section>
      )}

      {groups.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">
          Nenhum GR cadastrado.
        </p>
      )}
    </div>
  )
}
