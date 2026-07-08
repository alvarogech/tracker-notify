import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { StatTile } from '@/components/dashboard/StatTile'
import { GroupCard } from '@/components/groups/GroupCard'
import { shouldSuggestConversion } from '@/lib/business-rules/visitors'
import { isReportWithinDeadline } from '@/lib/business-rules/absences'
import { Building2, Users, UserRoundPlus, HeartHandshake, AlertTriangle, ClipboardX } from 'lucide-react'

export const metadata: Metadata = { title: 'Painel Administrativo' }

interface GroupRow {
  id: string
  name: string
  location?: string | null
  day_of_week?: number | null
  meeting_time?: string | null
  active: boolean
  leader?: { full_name: string } | null
}

interface RelationshipRow {
  id: string
  group_id: string
  type: 'member' | 'visitor'
}

interface PastoralCaseRow {
  id: string
  group_id: string
  status: 'open' | 'resolved'
  escalated_at: string | null
}

interface MeetingRow {
  id: string
  group_id: string
  status: 'scheduled' | 'completed' | 'cancelled'
  scheduled_at: string
}

export default async function AdminPage() {
  await requireRole(['admin'])
  const supabase = createClient()

  const [groupsRes, relationshipsRes, visitsRes, casesRes, meetingsRes] = await Promise.all([
    supabase.from('groups').select('id, name, location, day_of_week, meeting_time, active, leader:profiles(full_name)').order('name'),
    supabase.from('group_relationships').select('id, group_id, type').eq('status', 'active'),
    supabase.from('visitor_visits').select('group_relationship_id'),
    supabase.from('pastoral_cases').select('id, group_id, status, escalated_at'),
    supabase.from('meetings').select('id, group_id, status, scheduled_at'),
  ])

  const groups = (groupsRes.data ?? []) as unknown as GroupRow[]
  const relationships = (relationshipsRes.data ?? []) as unknown as RelationshipRow[]
  const visits = (visitsRes.data ?? []) as unknown as { group_relationship_id: string }[]
  const cases = (casesRes.data ?? []) as unknown as PastoralCaseRow[]
  const meetings = (meetingsRes.data ?? []) as unknown as MeetingRow[]

  const visitCountByRelationship = new Map<string, number>()
  for (const v of visits) {
    visitCountByRelationship.set(v.group_relationship_id, (visitCountByRelationship.get(v.group_relationship_id) ?? 0) + 1)
  }

  const members = relationships.filter((r) => r.type === 'member')
  const visitors = relationships.filter((r) => r.type === 'visitor')
  const visitorsPendingConversion = visitors.filter((r) =>
    shouldSuggestConversion(visitCountByRelationship.get(r.id) ?? 0)
  )

  const openCases = cases.filter((c) => c.status === 'open' && !c.escalated_at)
  const escalatedCases = cases.filter((c) => c.status === 'open' && !!c.escalated_at)

  const overdueMeetings = meetings.filter(
    (m) => m.status === 'scheduled' && !isReportWithinDeadline(new Date(m.scheduled_at), new Date())
  )

  const activeGroups = groups.filter((g) => g.active)

  function countFor(groupId: string, list: { group_id: string }[]) {
    return list.filter((item) => item.group_id === groupId).length
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada de toda a rede HUIOS</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="GRs ativos" value={activeGroups.length} icon={Building2} />
        <StatTile label="Membros ativos" value={members.length} icon={Users} />
        <StatTile
          label="Visitantes aguardando vinculação"
          value={visitorsPendingConversion.length}
          icon={UserRoundPlus}
          variant={visitorsPendingConversion.length > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label="Casos escalados"
          value={escalatedCases.length}
          icon={AlertTriangle}
          variant={escalatedCases.length > 0 ? 'danger' : 'default'}
        />
        <StatTile
          label="Casos abertos"
          value={openCases.length}
          icon={HeartHandshake}
          variant={openCases.length > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label="Relatórios com prazo encerrado"
          value={overdueMeetings.length}
          icon={ClipboardX}
          variant={overdueMeetings.length > 0 ? 'danger' : 'default'}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Grupos de Relacionamento · {groups.length}
        </h2>
        <div className="space-y-2">
          {groups.map((g) => (
            <Link key={g.id} href="/coordenacao" className="block">
              <GroupCard group={g} />
              <div className="mt-1 flex gap-3 px-1 text-xs text-muted-foreground">
                <span>{countFor(g.id, members)} membros</span>
                <span>{countFor(g.id, visitors)} visitantes</span>
                <span>{countFor(g.id, cases.filter((c) => c.status === 'open'))} casos abertos</span>
              </div>
            </Link>
          ))}
          {groups.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum GR cadastrado.</p>
          )}
        </div>
      </section>
    </div>
  )
}
