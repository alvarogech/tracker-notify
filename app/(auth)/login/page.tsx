import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { HuiosLogo } from '@/components/brand/HuiosLogo'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex flex-col items-center gap-2">
        <HuiosLogo variant="light" size="lg" />
        <p className="text-huios-cream/50 text-sm tracking-wide">Pastoreio</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="text-center text-xs text-huios-cream/40">
        É líder de GR e ainda não tem acesso?{' '}
        <Link href="/cadastro-lider" className="text-huios-cream/70 hover:text-huios-cream underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
