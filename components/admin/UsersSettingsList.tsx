'use client'

import { useState, useTransition } from 'react'
import { KeyRound } from 'lucide-react'
import { setProfileActive, setProfileRole, resetProfilePassword } from '@/app/(admin)/admin/configuracoes/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/auth/types'

const ROLE_LABELS: Record<UserRole, string> = {
  leader: 'Líder',
  coordinator: 'Coordenação',
  admin: 'Admin',
  cooperator: 'Cooperador',
}

interface UserRow {
  id: string
  full_name: string
  email: string
  role: UserRole
  active: boolean
}

function UserRowItem({ user }: { user: UserRow }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null)

  function handleToggleActive() {
    setError(null)
    startTransition(async () => {
      const result = await setProfileActive(user.id, !user.active)
      if (result && 'error' in result) setError(result.error)
    })
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setError(null)
    const role = e.target.value as UserRole
    startTransition(async () => {
      const result = await setProfileRole(user.id, role)
      if (result && 'error' in result) setError(result.error)
    })
  }

  function handleResetPassword() {
    if (!confirm(`Gerar uma nova senha temporária para ${user.full_name}? A senha atual deixará de funcionar.`)) return
    setError(null)
    setRevealedPassword(null)
    startTransition(async () => {
      const result = await resetProfilePassword(user.id)
      if ('error' in result) setError(result.error)
      else setRevealedPassword(result.password)
    })
  }

  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        {!user.active && (
          <Badge variant="outline" className="shrink-0 text-muted-foreground">
            Inativo
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={user.role}
          onChange={handleRoleChange}
          disabled={isPending}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>

        <Button size="sm" variant="outline" onClick={handleToggleActive} disabled={isPending}>
          {user.active ? 'Desativar' : 'Reativar'}
        </Button>

        <Button size="sm" variant="outline" onClick={handleResetPassword} disabled={isPending}>
          <KeyRound size={12} />
          Redefinir senha
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {revealedPassword && (
        <div className="rounded-lg bg-status-warning/10 px-3 py-2 text-xs text-status-warning">
          Nova senha: <code className="font-mono font-semibold">{revealedPassword}</code> — repasse com segurança,
          ela só aparece uma vez aqui.
        </div>
      )}
    </div>
  )
}

export function UsersSettingsList({ users }: { users: UserRow[] }) {
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <UserRowItem key={u.id} user={u} />
      ))}
      {users.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
      )}
    </div>
  )
}
