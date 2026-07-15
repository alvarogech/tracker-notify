'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateOwnGroup } from '@/app/(leader)/configuracoes/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

interface Group {
  id: string
  name: string
  day_of_week: number | null
  meeting_time: string | null
  location: string | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar alterações'}
    </Button>
  )
}

export function GroupScheduleForm({ group }: { group: Group }) {
  const [state, action] = useFormState(updateOwnGroup, null)

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do GR</Label>
        <Input id="name" name="name" defaultValue={group.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="day_of_week">Dia da semana</Label>
        <select
          id="day_of_week"
          name="day_of_week"
          required
          defaultValue={group.day_of_week ?? ''}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="" disabled>
            Selecione
          </option>
          {DAYS.map((day, i) => (
            <option key={day} value={i}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting_time">Horário</Label>
        <Input
          id="meeting_time"
          name="meeting_time"
          type="time"
          defaultValue={group.meeting_time?.slice(0, 5) ?? ''}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Local</Label>
        <Input id="location" name="location" defaultValue={group.location ?? ''} placeholder="Ex: Setor Norte" />
      </div>

      {state && 'error' in state && <p className="text-sm text-destructive">{state.error}</p>}
      {state && 'success' in state && <p className="text-sm text-huios-green">Dados do GR atualizados.</p>}

      <SubmitButton />
    </form>
  )
}
