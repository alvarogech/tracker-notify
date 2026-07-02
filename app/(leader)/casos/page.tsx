import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { CaseStatusBadge } from '@/components/pastoral-care/CaseStatusBadge'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Casos de Pastoreio' }

interface CaseRow {
  id: string
  status: 'open' | 'resolved'
  trigger_streak: number | null
  escalated_at: string | null
  created_at: string
  person: { id: string; full_name: string } | null
  group: { id: string; name: string } | null
}

export default async function CasosPage() {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const supabase = createClient()
  const showGroupName = profile.role !== 'leader'

  const { data } = await supabase
    .from('pastoral_cases')
    .select(
      'id, status, trigger_streak, escalated_at, created_at, person:people(id, full_name), group:groups(id, name)'
    )
    .order('created_at', { ascending: false })

  const cases = (data ?? []) as unknown as CaseRow[]
  const open = cases.filter((c) => c.status === 'open' && !c.escalated_at)
  const escalated = cases.filter((c) => c.status === 'open' && c.escalated_at)
  const resolved = cases.filter((c) => c.status === 'resolved')

  function CaseItem({ c }: { c: CaseRow }) {
    return (
      <Link
        key={c.id}
        href={`/casos/${c.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
      >
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{c.person?.full_name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            {showGroupName && c.group?.name ? `${c.group.name} · ` : ''}
            Aberto em {formatDate(c.created_at)}
          </p>
        </div>
        <CaseStatusBadge status={c.status} escalated={!!c.escalated_at} />
      </Link>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Casos de Pastoreio</h1>

      {escalated.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Escalados à coordenação · {escalated.length}
          </p>
          {escalated.map((c) => (
            <CaseItem key={c.id} c={c} />
          ))}
        </section>
      )}

      {open.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Abertos · {open.length}
          </p>
          {open.map((c) => (
            <CaseItem key={c.id} c={c} />
          ))}
        </section>
      )}

      {resolved.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resolvidos · {resolved.length}
          </p>
          {resolved.map((c) => (
            <CaseItem key={c.id} c={c} />
          ))}
        </section>
      )}

      {cases.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum caso de pastoreio registrado.
        </p>
      )}
    </div>
  )
}
