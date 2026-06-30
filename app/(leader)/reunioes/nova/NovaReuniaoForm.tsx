'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createMeeting } from '../actions'

interface Props {
  groupId: string
  groupName: string
}

export function NovaReuniaoForm({ groupId, groupName }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const date = (form.elements.namedItem('date') as HTMLInputElement).value
    const time = (form.elements.namedItem('time') as HTMLInputElement).value
    const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value

    if (!date || !time) {
      setError('Data e horário são obrigatórios.')
      return
    }

    // -03:00 = America/Sao_Paulo standard offset (DST handled server-side via timestamptz)
    const scheduledAt = `${date}T${time}:00-03:00`

    startTransition(async () => {
      const result = await createMeeting(groupId, scheduledAt, notes)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/reunioes')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        GR: <span className="font-medium text-foreground">{groupName}</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Data da reunião *</Label>
        <Input id="date" name="date" type="date" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="time">Horário *</Label>
        <Input id="time" name="time" type="time" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Observações opcionais sobre esta reunião"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Criando…' : 'Criar reunião'}
      </Button>
    </form>
  )
}
