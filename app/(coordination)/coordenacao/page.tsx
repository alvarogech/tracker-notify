import type { Metadata } from 'next'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/groups/GroupCard'
import { DeleteGroupButton } from '@/components/groups/DeleteGroupButton'
import { CascadeDeleteGroupButton } from '@/components/groups/CascadeDeleteGroupButton'
import { StatTile } from '@/components/dashboard/StatTile'
import { shouldSuggestConversion } from '@/lib/business-rules/visitors'
import { isReportWithinDeadline } from '@/lib/business-rules/absences'
import { isEligibleToServe, isEligibleToLeadFormatively } from '@/lib/business-rules/eligibility'
import { resolveActiveHost, resolveActiveCooperators } from '@/lib/business-rules/group-roles'
import {
  computeCoverageRate,
  computeAttendanceRate,
  formatRateFraction,
  formatRatePercent,
  selectRecentMeetingsPerGroup,
  type SimpleAttendanceStatus,
} from '@/lib/business-rules/indicators'
import {
  Users,
  Home,
  HandHeart,
  UserRoundPlus,
  CalendarCheck,
  HeartHandshake,
  GraduationCap,
  BadgeCheck,
  Award,
  Briefcase,
  Clock,
  ClipboardX,
  AlertTriangle,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Coordenação' }

const RECENT_MEETINGS_WINDOW = 6
const ON_TIME_WINDOW_DAYS = 30

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
  person_id: string
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
  scheduled_at: string
  status: 'scheduled' | 'completed' | 'cancelled'
  report_submitted_at: string | null
  attendance_records: { status: SimpleAttendanceStatus }[]
}

interface HostRow {
  group_id: string
  ended_at: string | null
}

interface CooperatorRow {
  ended_at: string | null
}

interface DisciplershipRow {
  person_id: string
  ended_at: string | null
}

interface ServiceRow {
  person_id: string
  ended_at: string | null
}

interface TrainingRecordRow {
  person_id: string
  program: { code: string } | null
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

  const [
    relationshipsRes,
    casesRes,
    meetingsRes,
    hostsRes,
    cooperatorsRes,
    disciplershipRes,
    serviceRes,
  ] = await Promise.all([
    supabase.from('group_relationships').select('id, group_id, person_id, type').eq('status', 'active'),
    supabase.from('pastoral_cases').select('id, group_id, status, escalated_at'),
    supabase
      .from('meetings')
      .select('id, group_id, scheduled_at, status, report_submitted_at, attendance_records(status)'),
    supabase.from('group_hosts').select('group_id, ended_at'),
    supabase.from('group_cooperators').select('ended_at'),
    supabase.from('discipleship_assignments').select('person_id, ended_at'),
    supabase.from('service_assignments').select('person_id, ended_at'),
  ])

  const relationships = (relationshipsRes.data ?? []) as unknown as RelationshipRow[]
  const members = relationships.filter((r) => r.type === 'member')
  const visitors = relationships.filter((r) => r.type === 'visitor')
  const memberIds = members.map((m) => m.person_id)

  const visitorRelIds = visitors.map((v) => v.id)

  const [visitsRes, trainingRecordsRes] = await Promise.all([
    visitorRelIds.length > 0
      ? supabase.from('visitor_visits').select('group_relationship_id').in('group_relationship_id', visitorRelIds)
      : Promise.resolve({ data: [] as { group_relationship_id: string }[] }),
    memberIds.length > 0
      ? supabase.from('training_records').select('person_id, program:training_programs(code)').in('person_id', memberIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ])

  const visitCountByRelationship = new Map<string, number>()
  for (const v of (visitsRes.data ?? []) as { group_relationship_id: string }[]) {
    visitCountByRelationship.set(
      v.group_relationship_id,
      (visitCountByRelationship.get(v.group_relationship_id) ?? 0) + 1
    )
  }
  const visitorsPendingConversionCount = visitors.filter((v) =>
    shouldSuggestConversion(visitCountByRelationship.get(v.id) ?? 0)
  ).length

  const cases = (casesRes.data ?? []) as unknown as PastoralCaseRow[]
  const escalatedCasesCount = cases.filter((c) => c.status === 'open' && !!c.escalated_at).length

  const meetings = (meetingsRes.data ?? []) as unknown as MeetingRow[]
  const now = new Date()
  const overdueMeetingsCount = meetings.filter(
    (m) => m.status === 'scheduled' && !isReportWithinDeadline(new Date(m.scheduled_at), now)
  ).length

  const reportedMeetings = meetings.filter(
    (m) => m.status === 'completed' && m.report_submitted_at !== null
  )
  const recentMeetings = selectRecentMeetingsPerGroup(
    reportedMeetings.map((m) => ({ ...m, groupId: m.group_id, scheduledAt: new Date(m.scheduled_at) })),
    RECENT_MEETINGS_WINDOW
  )
  const attendanceStatuses = recentMeetings.flatMap((m) => m.attendance_records.map((ar) => ar.status))
  const attendanceRate = computeAttendanceRate(attendanceStatuses)

  const thirtyDaysAgo = new Date(now.getTime() - ON_TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const onTimeFlags = reportedMeetings
    .filter((m) => new Date(m.scheduled_at) >= thirtyDaysAgo)
    .map((m) => isReportWithinDeadline(new Date(m.scheduled_at), new Date(m.report_submitted_at!)))
  const onTimeRate = computeCoverageRate(onTimeFlags)

  const hosts = (hostsRes.data ?? []) as unknown as HostRow[]
  const hostsByGroup = new Map<string, HostRow[]>()
  for (const h of hosts) {
    const list = hostsByGroup.get(h.group_id)
    if (list) list.push(h)
    else hostsByGroup.set(h.group_id, [h])
  }
  const groupsWithoutHostCount = active.filter((g) => {
    const list = hostsByGroup.get(g.id) ?? []
    return (
      resolveActiveHost(list.map((h) => ({ endedAt: h.ended_at ? new Date(h.ended_at) : null }))) === null
    )
  }).length

  const cooperators = (cooperatorsRes.data ?? []) as unknown as CooperatorRow[]
  const activeCooperatorsCount = resolveActiveCooperators(
    cooperators.map((c) => ({ endedAt: c.ended_at ? new Date(c.ended_at) : null }))
  ).length

  const disciplershipRows = (disciplershipRes.data ?? []) as unknown as DisciplershipRow[]
  const activeDisciplerPersonIds = new Set(
    disciplershipRows.filter((a) => a.ended_at === null).map((a) => a.person_id)
  )
  const disciplershipCoverage = computeCoverageRate(
    memberIds.map((id) => activeDisciplerPersonIds.has(id))
  )

  const serviceRows = (serviceRes.data ?? []) as unknown as ServiceRow[]
  const activeServicePersonIds = new Set(
    serviceRows.filter((a) => a.ended_at === null).map((a) => a.person_id)
  )
  const serviceCoverage = computeCoverageRate(memberIds.map((id) => activeServicePersonIds.has(id)))

  const completedByPerson = new Map<string, string[]>()
  for (const r of (trainingRecordsRes.data ?? []) as unknown as TrainingRecordRow[]) {
    if (!r.program) continue
    const list = completedByPerson.get(r.person_id) ?? []
    list.push(r.program.code)
    completedByPerson.set(r.person_id, list)
  }
  const culturaCoverage = computeCoverageRate(
    memberIds.map((id) => (completedByPerson.get(id) ?? []).includes('cultura_emaus'))
  )
  const eligibleServeCoverage = computeCoverageRate(
    memberIds.map((id) => isEligibleToServe(completedByPerson.get(id) ?? []))
  )
  const eligibleLeadCoverage = computeCoverageRate(
    memberIds.map((id) => isEligibleToLeadFormatively(completedByPerson.get(id) ?? []))
  )

  function GroupItem({ g }: { g: GroupRow }) {
    return (
      <div key={g.id} className="space-y-2">
        <Link href={`/coordenacao/${g.id}`} className="block">
          <GroupCard group={g} />
        </Link>
        {isAdmin && (
          <div className="space-y-2 px-1">
            <div className="flex gap-2">
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
            <CascadeDeleteGroupButton groupId={g.id} groupName={g.name} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Coordenação</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada da rede HUIOS</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Atenção da rede
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <Link href="/casos" className="block">
            <StatTile
              label="Casos escalados"
              value={escalatedCasesCount}
              icon={AlertTriangle}
              variant={escalatedCasesCount > 0 ? 'danger' : 'default'}
            />
          </Link>
          <Link href="/pessoas" className="block">
            <StatTile
              label="Visitantes aguardando vinculação"
              value={visitorsPendingConversionCount}
              icon={UserRoundPlus}
              variant={visitorsPendingConversionCount > 0 ? 'warning' : 'default'}
            />
          </Link>
          <StatTile
            label="Relatórios com prazo encerrado"
            value={overdueMeetingsCount}
            icon={ClipboardX}
            variant={overdueMeetingsCount > 0 ? 'danger' : 'default'}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Indicadores da rede
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Membros ativos" value={members.length} icon={Users} />
          <StatTile
            label="GRs sem anfitrião definido"
            value={groupsWithoutHostCount}
            icon={Home}
            variant={groupsWithoutHostCount > 0 ? 'warning' : 'default'}
          />
          <StatTile label="Cooperadores ativos" value={activeCooperatorsCount} icon={HandHeart} />
          <StatTile label="Visitantes ativos" value={visitors.length} icon={UserRoundPlus} />
          <StatTile
            label={`Taxa de presença (últimas ${RECENT_MEETINGS_WINDOW} reuniões por GR)`}
            value={formatRateFraction(attendanceRate)}
            icon={CalendarCheck}
          />
          <StatTile
            label="Membros com discipulador ativo"
            value={formatRateFraction(disciplershipCoverage)}
            icon={HeartHandshake}
          />
          <StatTile
            label="Cultura Emaús concluída"
            value={formatRateFraction(culturaCoverage)}
            icon={GraduationCap}
          />
          <StatTile
            label="Aptos a servir"
            value={formatRateFraction(eligibleServeCoverage)}
            icon={BadgeCheck}
          />
          <StatTile
            label="Atendem requisitos formativos p/ liderança"
            value={formatRateFraction(eligibleLeadCoverage)}
            icon={Award}
          />
          <StatTile
            label="Com vínculo de serviço ativo"
            value={formatRateFraction(serviceCoverage)}
            icon={Briefcase}
          />
          <StatTile
            label={`Relatórios no prazo (${ON_TIME_WINDOW_DAYS} dias)`}
            value={formatRatePercent(onTimeRate)}
            icon={Clock}
          />
          <StatTile
            label="Relatórios com prazo encerrado"
            value={overdueMeetingsCount}
            icon={ClipboardX}
            variant={overdueMeetingsCount > 0 ? 'danger' : 'default'}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Grupos de Relacionamento
        </h2>

        {active.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Ativos · {active.length}
            </p>
            {active.map((g) => (
              <GroupItem key={g.id} g={g} />
            ))}
          </div>
        )}

        {inactive.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Inativos · {inactive.length}
            </p>
            {inactive.map((g) => (
              <GroupItem key={g.id} g={g} />
            ))}
          </div>
        )}

        {groups.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">Nenhum GR cadastrado.</p>
        )}
      </section>
    </div>
  )
}
