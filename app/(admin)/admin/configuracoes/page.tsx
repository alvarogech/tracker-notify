import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { NetworkSettingsForm } from '@/components/admin/NetworkSettingsForm'
import { UsersSettingsList } from '@/components/admin/UsersSettingsList'
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm'
import type { UserRole } from '@/lib/auth/types'

export const metadata: Metadata = { title: 'Configurações' }

interface NetworkRow {
  id: string
  name: string
}

interface ProfileRow {
  id: string
  full_name: string
  email: string
  role: UserRole
  active: boolean
}

const ROLE_ORDER: Record<UserRole, number> = { admin: 0, coordinator: 1, leader: 2, cooperator: 3 }

export default async function AdminConfiguracoesPage() {
  const profile = await requireRole(['admin'])
  const supabase = createClient()

  const [networkRes, profilesRes] = await Promise.all([
    supabase.from('networks').select('id, name').limit(1).maybeSingle(),
    supabase
      .from('profiles')
      .select('id, full_name, email, role, active')
      .eq('pending_approval', false)
      .neq('id', profile.id)
      .order('full_name'),
  ])

  const network = networkRes.data as NetworkRow | null
  const users = ((profilesRes.data ?? []) as unknown as ProfileRow[]).sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.full_name.localeCompare(b.full_name, 'pt-BR')
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          {profile.full_name} · {profile.email}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Rede</h2>
        <NetworkSettingsForm name={network?.name ?? ''} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sua senha</h2>
        <ChangePasswordForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Usuários · {users.length}
        </h2>
        <p className="text-xs text-muted-foreground">
          Solicitações de cadastro de novos líderes ficam em{' '}
          <span className="font-medium text-foreground/80">Solicitações</span>, não aqui.
        </p>
        <UsersSettingsList users={users} />
      </section>

      <section className="space-y-2 rounded-xl border bg-card p-5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/80">Código de convite de líder</p>
        <p>
          Definido pela variável de ambiente <code className="font-mono">LEADER_SIGNUP_CODE</code> no Netlify —
          para trocar, ajuste lá (Site configuration → Environment variables) e faça um novo deploy.
        </p>
      </section>
    </div>
  )
}
