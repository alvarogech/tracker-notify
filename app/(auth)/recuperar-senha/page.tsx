import type { Metadata } from 'next'
import { RecoverPasswordForm } from '@/components/auth/RecoverPasswordForm'
import { HuiosLogo } from '@/components/brand/HuiosLogo'

export const metadata: Metadata = { title: 'Recuperar senha' }

export default function RecoverPasswordPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex flex-col items-center gap-2">
        <HuiosLogo variant="light" size="lg" />
        <p className="text-huios-cream/60 text-sm tracking-wide">Pastoreio</p>
      </div>
      <RecoverPasswordForm />
    </div>
  )
}
