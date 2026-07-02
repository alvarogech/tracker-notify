import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { canResolveCase } from '@/lib/business-rules/pastoral-cases'
import { CaseStatusBadge } from '@/components/pastoral-care/CaseStatusBadge'
import { CaseActionsPanel } from '@/components/pastoral-care/CaseActionsPanel'

export const metadata: Metadata = { title: 'Caso de Pastoreio' }

interface CaseRow {
  id: string
  status: 'open' | 'resolved'
  trigger_streak: number | null
  escalated_at: string | null
  created_at: string
  resolved_at: string | null
  resolution_notes: string | null
  person: { id: string; full_name: string } | null
  group: { id: string; name: string; leader_id: string } | null
}

interface ActionRow {
  id: string
  description: string
  created_at: string
  creator: { full_name: string } | null
}

function formatDateTime(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const admin = createAdminClient()

  const { data: caseData } = await admin
    .from('pastoral_cases')
    .select(
      'id, status, trigger_streak, escalated_at, created_at, resolved_at, resolution_notes, person:people(id, full_name), group:groups(id, name, leader_id)'
    )
    .eq('id', params.id)
    .single()

  const caseRow = caseData as unknown as CaseRow | null
  if (!caseRow || !caseRow.group) notFound()
  if (profile.role === 'leader' && caseRow.group.leader_id !== profile.id) notFound()

  const { data: actionsData } = await admin
    .from('pastoral_actions')
    .select('id, description, created_at, creator:profiles(full_name)')
    .eq('case_id', caseRow.id)
    .order('created_at', { ascending: true })

  const actions = (actionsData ?? []) as unknown as ActionRow[]
  const canResolve = caseRow.status === 'open' && canResolveCase(actions.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/casos" className="text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="truncate text-xl font-bold">{caseRow.person?.full_name ?? '—'}</h1>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2">
          <CaseStatusBadge status={caseRow.status} escalated={!!caseRow.escalated_at} />
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Grupo: {caseRow.group.name}</p>
          <p>Aberto em {formatDateTime(caseRow.created_at)}</p>
          {caseRow.trigger_streak !== null && (
            <p>Gatilho: {caseRow.trigger_streak} faltas consecutivas</p>
          )}
          {caseRow.escalated_at && <p>Escalado em {formatDateTime(caseRow.escalated_at)}</p>}
          {caseRow.resolved_at && <p>Resolvido em {formatDateTime(caseRow.resolved_at)}</p>}
          {caseRow.resolution_notes && (
            <p className="pt-1 text-foreground">Resultado: {caseRow.resolution_notes}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Linha do tempo de ações</h2>
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {actions.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card p-4 text-sm">
                <p>{a.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(a.created_at)}
                  {a.creator?.full_name ? ` · ${a.creator.full_name}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <CaseActionsPanel caseId={caseRow.id} canResolve={canResolve} isOpen={caseRow.status === 'open'} />
    </div>
  )
}
