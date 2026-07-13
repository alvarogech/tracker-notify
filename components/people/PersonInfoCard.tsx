'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Phone, Mail, Calendar, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { updatePersonDataAction } from '@/app/(leader)/pessoas/[id]/dados-actions'

interface Props {
  personId: string
  fullName: string
  phone: string | null
  email: string | null
  birthdate: string | null
  startedAt: string
  type: 'member' | 'visitor'
  archived: boolean
  canEdit: boolean
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar'}
    </Button>
  )
}

export function PersonInfoCard({
  personId,
  fullName,
  phone,
  email,
  birthdate,
  startedAt,
  type,
  archived,
  canEdit,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [state, action] = useFormState(updatePersonDataAction, null)

  useEffect(() => {
    if (state && 'success' in state) setEditing(false)
  }, [state])

  if (editing) {
    return (
      <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
        <input type="hidden" name="person_id" value={personId} />

        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo *</Label>
          <Input id="full_name" name="full_name" defaultValue={fullName} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ''} placeholder="+5562912345678" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={email ?? ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthdate">Data de nascimento</Label>
          <Input id="birthdate" name="birthdate" type="date" defaultValue={birthdate ?? ''} />
        </div>

        {state && 'error' in state && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex gap-2">
          <SubmitButton />
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={type === 'member' ? 'default' : 'secondary'}>
            {type === 'member' ? 'Membro' : 'Visitante'}
          </Badge>
          {archived && (
            <Badge variant="outline" className="text-muted-foreground">
              Arquivado
            </Badge>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Pencil size={13} />
            Editar
          </button>
        )}
      </div>

      <div className="space-y-3 text-sm">
        {phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={15} />
            <span>{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={15} />
            <span>{email}</span>
          </div>
        )}
        {birthdate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={15} />
            <span>{formatDate(birthdate)}</span>
          </div>
        )}
        {!phone && !email && !birthdate && (
          <p className="text-muted-foreground">
            {canEdit ? 'Nenhum contato cadastrado ainda — clique em "Editar" para completar.' : 'Nenhum contato cadastrado.'}
          </p>
        )}
      </div>

      <div className="pt-1 text-xs text-muted-foreground/60">Vinculado em {formatDate(startedAt)}</div>
    </div>
  )
}
