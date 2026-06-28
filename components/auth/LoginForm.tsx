'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from '@/app/(auth)/login/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar'}
    </Button>
  )
}

export function LoginForm() {
  const [state, action] = useFormState(loginAction, null)

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-huios-cream/80">
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          required
          className="bg-huios-cream/5 border-huios-cream/20 text-huios-cream placeholder:text-huios-cream/30 focus-visible:ring-huios-green"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-huios-cream/80">
            Senha
          </Label>
          <Link
            href="/recuperar-senha"
            className="text-xs text-huios-cream/50 hover:text-huios-cream/80 transition-colors"
          >
            Esqueci a senha
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="bg-huios-cream/5 border-huios-cream/20 text-huios-cream placeholder:text-huios-cream/30 focus-visible:ring-huios-green"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400 text-center">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  )
}
