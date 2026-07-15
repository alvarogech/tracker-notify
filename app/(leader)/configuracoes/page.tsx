import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { GroupScheduleForm } from '@/components/leader/GroupScheduleForm'
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm'

export const metadata: Metadata = { title: 'Configurações' }

interface Group {
  id: string
  name: string
  day_of_week: number | null
  meeting_time: string | null
  location: string | null
}

export default async function ConfiguracoesPage() {
  const profile = await requireRole(['leader', 'coordinator', 'admin'])
  const supabase = createClient()

  const { data } = await supabase
    .from('groups')
    .select('id, name, day_of_week, meeting_time, location')
    .eq('leader_id', profile.id)
    .eq('active', true)
    .maybeSingle()

  const group = data as Group | null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          {profile.full_name} · {profile.email}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do GR</h2>
        {group ? (
          <GroupScheduleForm group={group} />
        ) : (
          <div className="rounded-xl border bg-card p-5 text-center text-sm text-muted-foreground">
            Você não lidera nenhum GR ativo no momento.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Senha</h2>
        <ChangePasswordForm />
      </section>
    </div>
  )
}
