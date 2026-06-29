'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createPersonAction } from '@/app/(leader)/pessoas/nova/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar'}
    </Button>
  )
}

export function AddPersonForm() {
  const [state, action] = useFormState(createPersonAction, null)

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome completo *</Label>
        <Input id="full_name" name="full_name" placeholder="Nome da pessoa" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+5562912345678" />
        <p className="text-xs text-muted-foreground">Formato: +55 + DDD + número</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="opcional@email.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthdate">Data de nascimento</Label>
        <Input id="birthdate" name="birthdate" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo de vínculo</Label>
        <select
          id="type"
          name="type"
          defaultValue="member"
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="member">Membro</option>
          <option value="visitor">Visitante</option>
        </select>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive text-center">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  )
}
