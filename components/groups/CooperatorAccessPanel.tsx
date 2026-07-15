'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { grantCooperatorAccess, setCooperatorAccessActive } from '@/app/(leader)/pessoas/[id]/cooperator-access-actions'

interface CooperatorAccessPanelProps {
  personId: string
  groupId: string
  email: string | null
  access: { active: boolean; createdAt: string } | null
}

export function CooperatorAccessPanel({ personId, groupId, email, access }: CooperatorAccessPanelProps) {
  const [emailInput, setEmailInput] = useState(email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleGrant() {
    setError(null)
    setPassword(null)
    startTransition(async () => {
      const result = await grantCooperatorAccess(personId, groupId, emailInput)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setPassword(result.password)
      router.refresh()
    })
  }

  function handleToggleActive(active: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await setCooperatorAccessActive(personId, groupId, active)
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Acesso ao sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {access ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <KeyRound size={15} className="text-muted-foreground" />
              <span>{access.active ? 'Acesso ativo' : 'Acesso desativado'}</span>
            </div>
            <p className="text-xs text-muted-foreground">Concedido em {formatDate(access.createdAt)}</p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              size="sm"
              variant="ghost"
              className={access.active ? 'text-destructive hover:text-destructive' : ''}
              disabled={isPending}
              onClick={() => handleToggleActive(!access.active)}
            >
              {access.active ? 'Desativar acesso' : 'Reativar acesso'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Conceda um login para esta pessoa ajudar a alimentar Reuniões e Pessoas deste GR.
            </p>

            <div className="space-y-2">
              <Label htmlFor="cooperator_email">E-mail</Label>
              <Input
                id="cooperator_email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {password && (
              <div className="rounded-lg bg-status-warning/10 px-3 py-2 text-xs text-status-warning">
                Senha temporária: <code className="font-mono font-semibold">{password}</code> — repasse com
                segurança, ela só aparece uma vez aqui.
              </div>
            )}

            <Button size="sm" disabled={isPending || !emailInput} onClick={handleGrant}>
              <KeyRound size={14} />
              Conceder acesso ao sistema
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
