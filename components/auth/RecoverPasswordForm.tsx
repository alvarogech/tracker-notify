'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { recoverPasswordAction } from '@/app/(auth)/login/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar link de recuperação'}
    </Button>
  )
}

export function RecoverPasswordForm() {
  const [state, action] = useFormState(recoverPasswordAction, null)

  if (state?.success) {
    return (
      <div className="rounded-xl border border-huios-cream/10 bg-huios-cream/5 px-6 py-8 text-center space-y-3">
        <p className="text-huios-cream font-semibold">E-mail enviado</p>
        <p className="text-huios-cream/60 text-sm leading-relaxed">
          Verifique sua caixa de entrada e siga as instruções para redefinir a senha.
        </p>
        <Link href="/login" className="block text-sm text-huios-cream/50 hover:text-huios-cream/80 transition-colors pt-2">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <p className="text-huios-cream/60 text-sm text-center leading-relaxed">
        Informe seu e-mail para receber um link de recuperação de senha.
      </p>

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

      {state?.error && (
        <p className="text-sm text-red-400 text-center">{state.error}</p>
      )}

      <SubmitButton />

      <Link
        href="/login"
        className="block text-center text-xs text-huios-cream/40 hover:text-huios-cream/70 transition-colors"
      >
        Voltar para o login
      </Link>
    </form>
  )
}
