'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { signupLeaderAction } from '@/app/(auth)/cadastro-lider/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const inputClass =
  'bg-huios-cream/5 border-huios-cream/20 text-huios-cream placeholder:text-huios-cream/30 focus-visible:ring-huios-green'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar cadastro'}
    </Button>
  )
}

export function LeaderSignupForm() {
  const [state, action] = useFormState(signupLeaderAction, null)

  if (state && 'success' in state) {
    return (
      <div className="rounded-xl border border-huios-cream/10 bg-huios-cream/5 px-6 py-8 text-center space-y-2">
        <p className="text-huios-cream font-semibold">Cadastro enviado!</p>
        <p className="text-huios-cream/60 text-sm leading-relaxed">
          Sua solicitação será analisada pela administração. Você receberá acesso assim que for
          aprovada.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="invite_code" className="text-huios-cream/80">
          Código de convite
        </Label>
        <Input id="invite_code" name="invite_code" placeholder="Fornecido pela coordenação" required className={inputClass} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-huios-cream/80">
          Seu nome completo
        </Label>
        <Input id="full_name" name="full_name" placeholder="Nome do líder" required className={inputClass} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-huios-cream/80">
          E-mail
        </Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" required className={inputClass} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-huios-cream/80">
          Senha
        </Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required className={inputClass} />
      </div>

      <div className="border-t border-huios-cream/10 pt-5 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-huios-cream/40">Dados do GR</p>

        <div className="space-y-2">
          <Label htmlFor="group_name" className="text-huios-cream/80">
            Nome do GR
          </Label>
          <Input id="group_name" name="group_name" placeholder="Ex: GR Vila Nova" required className={inputClass} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="day_of_week" className="text-huios-cream/80">
            Dia da semana
          </Label>
          <select
            id="day_of_week"
            name="day_of_week"
            required
            defaultValue=""
            className="flex h-11 w-full rounded-md border border-huios-cream/20 bg-huios-cream/5 px-3 py-2 text-sm text-huios-cream focus:outline-none focus:ring-2 focus:ring-huios-green"
          >
            <option value="" disabled>
              Selecione
            </option>
            {DAYS.map((day, i) => (
              <option key={day} value={i} className="text-foreground">
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting_time" className="text-huios-cream/80">
            Horário
          </Label>
          <Input id="meeting_time" name="meeting_time" type="time" required className={inputClass} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-huios-cream/80">
            Local (bairro ou endereço)
          </Label>
          <Input id="location" name="location" placeholder="Ex: Setor Norte" required className={inputClass} />
        </div>
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-red-400 text-center">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  )
}
