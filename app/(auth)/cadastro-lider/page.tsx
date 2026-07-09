import type { Metadata } from 'next'
import Link from 'next/link'
import { LeaderSignupForm } from '@/components/auth/LeaderSignupForm'
import { HuiosLogo } from '@/components/brand/HuiosLogo'

export const metadata: Metadata = { title: 'Cadastro de líder' }

export default function CadastroLiderPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex flex-col items-center gap-2">
        <HuiosLogo variant="light" size="lg" />
        <p className="text-huios-cream/60 text-sm tracking-wide">Cadastro de líder e GR</p>
      </div>
      <LeaderSignupForm />
      <p className="text-center text-xs text-huios-cream/60">
        Já tem acesso?{' '}
        <Link href="/login" className="text-huios-cream/70 hover:text-huios-cream underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
