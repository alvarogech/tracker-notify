import type { Metadata } from 'next'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/groups/GroupCard'
import { DeleteGroupButton } from '@/components/groups/DeleteGroupButton'

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
  const profile = await requireRole(['coordinator', 'admin'])
  const isAdmin = profile.role === 'admin'
  const supabase = createClient()

  const { data } = await supabase
    .from('groups')
    .select('id, name, location, day_of_week, meeting_time, active, leader:profiles(full_name)')
    .order('name')

  const groups = (data ?? []) as unknown as GroupRow[]
  const active = groups.filter((g) => g.active)
  const inactive = groups.filter((g) => !g.active)

  function GroupItem({ g }: { g: GroupRow }) {
    return (
      <div key={g.id} className="space-y-2">
        <GroupCard group={g} />
        {isAdmin && (
          <div className="flex gap-2 px-1">
            <Link
              href={`/coordenacao/${g.id}/editar`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              <Pencil size={12} />
              Editar
            </Link>
            <div className="flex-1">
              <DeleteGroupButton groupId={g.id} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Grupos de Relacionamento</h1>

      {active.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Ativos · {active.length}
          </p>
          {active.map((g) => <GroupItem key={g.id} g={g} />)}
        </section>
      )}

      {inactive.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Inativos · {inactive.length}
          </p>
          {inactive.map((g) => <GroupItem key={g.id} g={g} />)}
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
