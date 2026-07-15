import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Users, UserRoundPlus, Home, HandHeart, CalendarCheck, HeartHandshake, GraduationCap, BadgeCheck, Award, Briefcase, Clock, AlertTriangle } from 'lucide-react'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { StatTile } from '@/components/dashboard/StatTile'
import { Badge } from '@/components/ui/badge'
import { DeleteGroupButton } from '@/components/groups/DeleteGroupButton'
import { CascadeDeleteGroupButton } from '@/components/groups/CascadeDeleteGroupButton'
import { shouldSuggestConversion, countVisits } from '@/lib/business-rules/visitors'
import { isReportWithinDeadline } from '@/lib/business-rules/absences'
import { isEligibleToServe, isEligibleToLeadFormatively } from '@/lib/business-rules/eligibility'
import {
  computeCoverageRate,
  computeAttendanceRate,
  formatRateFraction,
  formatRatePercent,
  selectRecentMeetings,
  type SimpleAttendanceStatus,
} from '@/lib/business-rules/indicators'

export const metadata: Metadata = { title: 'Detalhe do GR' }

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const RECENT_MEETINGS_WINDOW = 6
const ON_TIME_WINDOW_DAYS = 30

interface GroupRow {
  id: string
  name: string
  location: string | null
  day_of_week: number | null
  meeting_time: string | null
  active: boolean
  leader: { full_name: string } | null
}

interface PersonRow {
  id: string
  full_name: string
  phone: string | null
  archived_at: string | null
}

interface RelationshipRow {
  id: string
  type: 'member' | 'visitor'
  person: PersonRow | null
}

interface CaseRow {
  id: string
  status: 'open' | 'resolved'
  escalated_at: string | null
  person: { full_name: string } | null
}

interface MeetingRow {
  id: string
  scheduled_at: string
  status: 'scheduled' | 'completed' | 'cancelled'
  report_submitted_at: string | null
  attendance_records: { status: SimpleAttendanceStatus }[]
}

interface HostRow {
  person_id: string
  started_at: string
  host: { full_name: string } | null
}

interface CooperatorRow {
  person_id: string
  started_at: string
  cooperator: { full_name: string } | null
}

interface TrainingRecordRow {
  person_id: string
  program: { code: string } | null
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireRole(['coordinator', 'admin'])
  const isAdmin = profile.role === 'admin'
  const supabase = createClient()

  const { data: groupData } = await supabase
    .from('groups')
    .select('id, name, location, day_of_week, meeting_time, active, leader:profiles(full_name)')
    .eq('id', params.id)
    .single()

  const group = groupData as unknown as GroupRow | null
  if (!group) notFound()

  const [relRes, casesRes, meetingsRes, hostRes, cooperatorsRes] = await Promise.all([
    supabase
      .from('group_relationships')
      .select('id, type, person:people(id, full_name, phone, archived_at)')
      .eq('group_id', params.id)
      .eq('status', 'active'),
    supabase
      .from('pastoral_cases')
      .select('id, status, escalated_at, person:people(full_name)')
      .eq('group_id', params.id),
    supabase
      .from('meetings')
      .select('id, scheduled_at, status, report_submitted_at, attendance_records(status)')
      .eq('group_id', params.id),
    supabase
      .from('group_hosts')
      .select('person_id, started_at, host:people(full_name)')
      .eq('group_id', params.id)
      .is('ended_at', null)
      .maybeSingle(),
    supabase
      .from('group_cooperators')
      .select('person_id, started_at, cooperator:people(full_name)')
      .eq('group_id', params.id)
      .is('ended_at', null),
  ])

  const relationships = (relRes.data ?? []) as unknown as RelationshipRow[]
  const members = relationships.filter((r) => r.type === 'member' && r.person && !r.person.archived_at)
  const visitors = relationships.filter((r) => r.type === 'visitor' && r.person && !r.person.archived_at)
  const memberIds = members.map((m) => m.person!.id)
  const visitorRelIds = visitors.map((v) => v.id)

  const [visitsRes, disciplershipRes, serviceRes, trainingRes] = await Promise.all([
    visitorRelIds.length > 0
      ? supabase.from('visitor_visits').select('group_relationship_id, visited_at').in('group_relationship_id', visitorRelIds)
      : Promise.resolve({ data: [] as { group_relationship_id: string; visited_at: string }[] }),
    memberIds.length > 0
      ? supabase.from('discipleship_assignments').select('person_id, ended_at').in('person_id', memberIds)
      : Promise.resolve({ data: [] as { person_id: string; ended_at: string | null }[] }),
    memberIds.length > 0
      ? supabase.from('service_assignments').select('person_id, ended_at').in('person_id', memberIds)
      : Promise.resolve({ data: [] as { person_id: string; ended_at: string | null }[] }),
    memberIds.length > 0
      ? supabase.from('training_records').select('person_id, program:training_programs(code)').in('person_id', memberIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ])

  const visits = (visitsRes.data ?? []) as { group_relationship_id: string; visited_at: string }[]
  const visitCountByRelationship = new Map<string, number>()
  for (const v of visits) {
    visitCountByRelationship.set(v.group_relationship_id, (visitCountByRelationship.get(v.group_relationship_id) ?? 0) + 1)
  }
  const visitorsPendingConversionCount = visitors.filter((v) =>
    shouldSuggestConversion(visitCountByRelationship.get(v.id) ?? 0)
  ).length

  const cases = (casesRes.data ?? []) as unknown as CaseRow[]
  const openCases = cases.filter((c) => c.status === 'open' && !c.escalated_at)
  const escalatedCases = cases.filter((c) => c.status === 'open' && !!c.escalated_at)

  const meetings = (meetingsRes.data ?? []) as unknown as MeetingRow[]
  const now = new Date()
  const overdueMeetingsCount = meetings.filter(
    (m) => m.status === 'scheduled' && !isReportWithinDeadline(new Date(m.scheduled_at), now)
  ).length

  const reportedMeetings = meetings.filter((m) => m.status === 'completed' && m.report_submitted_at !== null)
  const recentMeetings = selectRecentMeetings(
    reportedMeetings.map((m) => ({ ...m, scheduledAt: new Date(m.scheduled_at) })),
    RECENT_MEETINGS_WINDOW
  )
  const attendanceStatuses = recentMeetings.flatMap((m) => m.attendance_records.map((ar) => ar.status))
  const attendanceRate = computeAttendanceRate(attendanceStatuses)

  const thirtyDaysAgo = new Date(now.getTime() - ON_TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const onTimeFlags = reportedMeetings
    .filter((m) => new Date(m.scheduled_at) >= thirtyDaysAgo)
    .map((m) => isReportWithinDeadline(new Date(m.scheduled_at), new Date(m.report_submitted_at!)))
  const onTimeRate = computeCoverageRate(onTimeFlags)

  const hostRow = hostRes.data as unknown as HostRow | null
  const cooperatorRows = (cooperatorsRes.data ?? []) as unknown as CooperatorRow[]

  const disciplershipRows = (disciplershipRes.data ?? []) as { person_id: string; ended_at: string | null }[]
  const activeDisciplerPersonIds = new Set(disciplershipRows.filter((a) => a.ended_at === null).map((a) => a.person_id))
  const disciplershipCoverage = computeCoverageRate(memberIds.map((id) => activeDisciplerPersonIds.has(id)))

  const serviceRows = (serviceRes.data ?? []) as { person_id: string; ended_at: string | null }[]
  const activeServicePersonIds = new Set(serviceRows.filter((a) => a.ended_at === null).map((a) => a.person_id))
  const serviceCoverage = computeCoverageRate(memberIds.map((id) => activeServicePersonIds.has(id)))

  const completedByPerson = new Map<string, string[]>()
  for (const r of trainingRes.data as unknown as TrainingRecordRow[]) {
    if (!r.program) continue
    const list = completedByPerson.get(r.person_id) ?? []
    list.push(r.program.code)
    completedByPerson.set(r.person_id, list)
  }
  const culturaCoverage = computeCoverageRate(
    memberIds.map((id) => (completedByPerson.get(id) ?? []).includes('cultura_emaus'))
  )
  const eligibleServeCoverage = computeCoverageRate(memberIds.map((id) => isEligibleToServe(completedByPerson.get(id) ?? [])))
  const eligibleLeadCoverage = computeCoverageRate(
    memberIds.map((id) => isEligibleToLeadFormatively(completedByPerson.get(id) ?? []))
  )

  const activeHostName = hostRow ? hostRow.host?.full_name ?? 'Pessoa removida' : null

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/coordenacao" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {group.leader?.full_name ?? 'Sem líder'}
            {group.day_of_week !== null && group.meeting_time && (
              <> · {DAYS[group.day_of_week]} · {group.meeting_time.slice(0, 5)}</>
            )}
            {group.location && <> · {group.location}</>}
          </p>
        </div>
        {!group.active && (
          <Badge variant="outline" className="text-muted-foreground">
            Inativo
          </Badge>
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/coordenacao/${group.id}/editar`}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            <Pencil size={12} />
            Editar
          </Link>
          <DeleteGroupButton groupId={group.id} />
          <CascadeDeleteGroupButton groupId={group.id} groupName={group.name} />
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Indicadores</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Membros ativos" value={members.length} icon={Users} />
          <StatTile label="Visitantes ativos" value={visitors.length} icon={UserRoundPlus} />
          <StatTile
            label="Visitantes aguardando vinculação"
            value={visitorsPendingConversionCount}
            icon={UserRoundPlus}
            variant={visitorsPendingConversionCount > 0 ? 'warning' : 'default'}
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
            label="Anfitrião"
            value={activeHostName ?? 'Sem anfitrião'}
            icon={Home}
            variant={activeHostName ? 'default' : 'warning'}
          />
          <StatTile label="Cooperadores ativos" value={cooperatorRows.length} icon={HandHeart} />
          <StatTile
            label={`Taxa de presença (últimas ${RECENT_MEETINGS_WINDOW} reuniões)`}
            value={formatRateFraction(attendanceRate)}
            icon={CalendarCheck}
          />
          <StatTile
            label="Membros com discipulador ativo"
            value={formatRateFraction(disciplershipCoverage)}
            icon={HeartHandshake}
          />
          <StatTile label="Cultura Emaús concluída" value={formatRateFraction(culturaCoverage)} icon={GraduationCap} />
          <StatTile label="Aptos a servir" value={formatRateFraction(eligibleServeCoverage)} icon={BadgeCheck} />
          <StatTile
            label="Atendem requisitos formativos p/ liderança"
            value={formatRateFraction(eligibleLeadCoverage)}
            icon={Award}
          />
          <StatTile label="Com vínculo de serviço ativo" value={formatRateFraction(serviceCoverage)} icon={Briefcase} />
          <StatTile
            label={`Relatórios no prazo (${ON_TIME_WINDOW_DAYS} dias)`}
            value={formatRatePercent(onTimeRate)}
            icon={Clock}
          />
          <StatTile
            label="Relatórios com prazo encerrado"
            value={overdueMeetingsCount}
            icon={AlertTriangle}
            variant={overdueMeetingsCount > 0 ? 'danger' : 'default'}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Membros · {members.length}
        </h2>
        <div className="space-y-2">
          {members.map((r) => (
            <Link
              key={r.id}
              href={`/pessoas/${r.person!.id}`}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
            >
              <span className="text-sm font-medium">{r.person!.full_name}</span>
              {r.person!.phone && <span className="text-xs text-muted-foreground">{r.person!.phone}</span>}
            </Link>
          ))}
          {members.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum membro.</p>}
        </div>
      </section>

      {visitors.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Visitantes · {visitors.length}
          </h2>
          <div className="space-y-2">
            {visitors.map((r) => (
              <Link
                key={r.id}
                href={`/pessoas/${r.person!.id}`}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <span className="text-sm font-medium">{r.person!.full_name}</span>
                <span className="text-xs text-muted-foreground">
                  {countVisits(
                    visits
                      .filter((v) => v.group_relationship_id === r.id)
                      .map((v) => ({ visitedAt: new Date(v.visited_at) }))
                  )}{' '}
                  visita(s)
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(openCases.length > 0 || escalatedCases.length > 0) && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Casos de pastoreio abertos · {openCases.length + escalatedCases.length}
          </h2>
          <div className="space-y-2">
            {[...escalatedCases, ...openCases].map((c) => (
              <Link
                key={c.id}
                href={`/casos/${c.id}`}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <span className="text-sm font-medium">{c.person?.full_name ?? 'Pessoa removida'}</span>
                <Badge variant={c.escalated_at ? 'danger' : 'warning'} className="text-xs">
                  {c.escalated_at ? 'Escalado' : 'Aberto'}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Últimas reuniões · {meetings.length}
        </h2>
        <div className="space-y-2">
          {[...meetings]
            .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
            .slice(0, 10)
            .map((m) => {
              const present = m.attendance_records.filter((ar) => ar.status === 'present').length
              return (
                <Link
                  key={m.id}
                  href={`/coordenacao/${group.id}/reunioes/${m.id}`}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
                >
                  <span className="text-sm">{formatDate(m.scheduled_at)}</span>
                  <div className="flex items-center gap-2">
                    {m.status === 'completed' && (
                      <span className="text-xs text-muted-foreground">
                        {present}/{m.attendance_records.length} presentes
                      </span>
                    )}
                    <Badge
                      variant={m.status === 'completed' ? 'success' : m.status === 'cancelled' ? 'outline' : 'warning'}
                      className="text-xs"
                    >
                      {m.status === 'completed' ? 'Concluída' : m.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          {meetings.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma reunião cadastrada.</p>
          )}
        </div>
      </section>
    </div>
  )
}
