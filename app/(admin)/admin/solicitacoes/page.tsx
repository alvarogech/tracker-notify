import type { Metadata } from 'next'
import { Download } from 'lucide-react'
import { requireRole } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { ApproveRejectButtons } from '@/components/admin/ApproveRejectButtons'

export const metadata: Metadata = { title: 'Solicitações de cadastro' }

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

interface PendingProfileRow {
  id: string
  full_name: string
  email: string
  created_at: string
}

interface PendingGroupRow {
  id: string
  leader_id: string
  name: string
  day_of_week: number | null
  meeting_time: string | null
  location: string | null
}

export default async function SolicitacoesPage() {
  await requireRole(['admin'])
  const admin = createAdminClient()

  const [profilesRes, groupsRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('pending_approval', true)
      .eq('signup_source', 'self')
      .order('created_at', { ascending: true }),
    admin
      .from('groups')
      .select('id, leader_id, name, day_of_week, meeting_time, location')
      .eq('pending_approval', true)
      .eq('signup_source', 'self'),
  ])

  const profiles = (profilesRes.data ?? []) as unknown as PendingProfileRow[]
  const groups = (groupsRes.data ?? []) as unknown as PendingGroupRow[]

  const requests = profiles.map((p) => ({
    profile: p,
    group: groups.find((g) => g.leader_id === p.id) ?? null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Solicitações de cadastro</h1>
          <p className="text-sm text-muted-foreground">Líderes que se cadastraram e aguardam aprovação</p>
        </div>
        <a
          href="/api/admin/export/grs"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors"
        >
          <Download size={14} />
          Exportar CSV
        </a>
      </div>

      <div className="space-y-3">
        {requests.map(({ profile, group }) => (
          <div key={profile.id} className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <p className="font-semibold text-sm">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
              <p className="text-xs text-muted-foreground">Enviado em {formatDate(profile.created_at)}</p>
            </div>

            {group && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                <p className="font-medium text-foreground/80">{group.name}</p>
                {group.day_of_week !== null && (
                  <p>
                    {DAYS[group.day_of_week]} · {group.meeting_time?.slice(0, 5)}
                  </p>
                )}
                {group.location && <p>{group.location}</p>}
              </div>
            )}

            <ApproveRejectButtons profileId={profile.id} />
          </div>
        ))}

        {requests.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma solicitação pendente.
          </p>
        )}
      </div>
    </div>
  )
}
