'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { registerNewVisitor } from '@/app/(leader)/pessoas/[id]/visitante-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Salvando…' : 'Registrar visita'}
    </Button>
  )
}

export function RegisterVisitorForm() {
  const [state, action] = useFormState(registerNewVisitor, undefined)

  if (state && 'warning' in state) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4">
          <p className="text-sm text-status-warning">{state.warning}</p>
        </div>
        <Button asChild className="w-full">
          <Link href={`/pessoas/${state.personId}`}>Ver perfil do visitante</Link>
        </Button>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome completo *</Label>
        <Input id="full_name" name="full_name" placeholder="Nome do visitante" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+5562912345678" />
        <p className="text-xs text-muted-foreground">Formato: +55 + DDD + número</p>
      </div>

      {state && 'error' in state && (
        <p className="text-center text-sm text-destructive">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  )
}
