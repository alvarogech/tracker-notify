'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateNetworkName } from '@/app/(admin)/admin/configuracoes/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar'}
    </Button>
  )
}

export function NetworkSettingsForm({ name }: { name: string }) {
  const [state, action] = useFormState(updateNetworkName, null)

  return (
    <form action={action} className="space-y-3 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="network_name">Nome da rede</Label>
        <Input id="network_name" name="name" defaultValue={name} required />
      </div>

      {state && 'error' in state && <p className="text-sm text-destructive">{state.error}</p>}
      {state && 'success' in state && <p className="text-sm text-huios-green">Salvo.</p>}

      <SubmitButton />
    </form>
  )
}
