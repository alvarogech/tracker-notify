'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateOwnPassword } from '@/app/account-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Salvando…' : 'Alterar senha'}
    </Button>
  )
}

export function ChangePasswordForm() {
  const [state, action] = useFormState(updateOwnPassword, null)

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar nova senha</Label>
        <Input id="confirm" name="confirm" type="password" placeholder="••••••••" required minLength={6} />
      </div>

      {state && 'error' in state && <p className="text-sm text-destructive">{state.error}</p>}
      {state && 'success' in state && <p className="text-sm text-huios-green">Senha alterada com sucesso.</p>}

      <SubmitButton />
    </form>
  )
}
