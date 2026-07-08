import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function csvField(value: string | number): string {
  const str = String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export async function GET() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const admin = createAdminClient()

  const [groupsRes, relationshipsRes] = await Promise.all([
    admin
      .from('groups')
      .select('id, name, day_of_week, meeting_time, location, active, pending_approval, created_at, leader:profiles(full_name, email)')
      .eq('signup_source', 'self')
      .order('created_at', { ascending: true }),
    admin.from('group_relationships').select('id, group_id, type').eq('status', 'active'),
  ])

  interface GroupRow {
    id: string
    name: string
    day_of_week: number | null
    meeting_time: string | null
    location: string | null
    active: boolean
    pending_approval: boolean
    created_at: string
    leader: { full_name: string; email: string } | null
  }

  const groups = (groupsRes.data ?? []) as unknown as GroupRow[]
  const relationships = (relationshipsRes.data ?? []) as unknown as { group_id: string; type: string }[]

  function countFor(groupId: string, type: string) {
    return relationships.filter((r) => r.group_id === groupId && r.type === type).length
  }

  const header = [
    'Nome do GR',
    'Líder',
    'E-mail do líder',
    'Dia da semana',
    'Horário',
    'Local',
    'Status',
    'Data de cadastro',
    'Membros ativos',
    'Visitantes ativos',
  ]

  const rows = groups.map((g) => [
    csvField(g.name),
    csvField(g.leader?.full_name ?? '—'),
    csvField(g.leader?.email ?? '—'),
    csvField(g.day_of_week !== null ? DAYS[g.day_of_week] : '—'),
    csvField(g.meeting_time?.slice(0, 5) ?? '—'),
    csvField(g.location ?? '—'),
    csvField(g.pending_approval ? 'Pendente' : g.active ? 'Aprovado' : 'Rejeitado/Inativo'),
    csvField(formatDate(g.created_at)),
    csvField(countFor(g.id, 'member')),
    csvField(countFor(g.id, 'visitor')),
  ])

  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="grs-autocadastrados.csv"',
    },
  })
}
