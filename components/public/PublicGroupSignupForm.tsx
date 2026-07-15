'use client'

import { useState, useTransition } from 'react'
import { submitPublicGroupSignup } from '@/app/grs/[id]/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const NEW_OPTION = '__new__'

const inputClass =
  'bg-huios-cream/5 border-huios-cream/20 text-huios-cream placeholder:text-huios-cream/30 focus-visible:ring-huios-green'

interface PersonOption {
  id: string
  full_name: string
}

interface Props {
  groupId: string
  people: PersonOption[]
}

export function PublicGroupSignupForm({ groupId, people }: Props) {
  const [personId, setPersonId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error: string } | { success: true } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fullName = (form.elements.namedItem('full_name') as HTMLInputElement | null)?.value ?? ''
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const birthdate = (form.elements.namedItem('birthdate') as HTMLInputElement).value

    startTransition(async () => {
      const res = await submitPublicGroupSignup(groupId, {
        personId: personId === NEW_OPTION ? '' : personId,
        full_name: personId === NEW_OPTION ? fullName : '',
        phone,
        email,
        birthdate,
      })
      setResult(res)
    })
  }

  if (result && 'success' in result) {
    return (
      <div className="space-y-2 rounded-xl border border-huios-cream/10 bg-huios-cream/5 px-6 py-8 text-center">
        <p className="font-semibold text-huios-cream">Dados enviados!</p>
        <p className="text-sm text-huios-cream/60">Obrigado por completar seu cadastro.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="person" className="text-huios-cream/80">
          Seu nome
        </Label>
        <select
          id="person"
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          required
          className="flex h-11 w-full rounded-md border border-huios-cream/20 bg-huios-cream/5 px-3 py-2 text-sm text-huios-cream focus:outline-none focus:ring-2 focus:ring-huios-green"
        >
          <option value="" disabled>
            Selecione seu nome
          </option>
          {people.map((p) => (
            <option key={p.id} value={p.id} className="text-foreground">
              {p.full_name}
            </option>
          ))}
          <option value={NEW_OPTION} className="text-foreground">
            Meu nome não está na lista
          </option>
        </select>
      </div>

      {personId === NEW_OPTION && (
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-huios-cream/80">
            Nome completo
          </Label>
          <Input id="full_name" name="full_name" required className={inputClass} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-huios-cream/80">
          Telefone
        </Label>
        <Input id="phone" name="phone" type="tel" placeholder="+5562912345678" className={inputClass} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-huios-cream/80">
          E-mail
        </Label>
        <Input id="email" name="email" type="email" className={inputClass} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthdate" className="text-huios-cream/80">
          Data de nascimento
        </Label>
        <Input id="birthdate" name="birthdate" type="date" className={inputClass} />
      </div>

      {result && 'error' in result && <p className="text-center text-sm text-red-400">{result.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending || !personId}>
        {isPending ? 'Enviando…' : 'Enviar'}
      </Button>
    </form>
  )
}
