import type { Metadata } from 'next'
import { HuiosLogo } from '@/components/brand/HuiosLogo'
import { LogoutButton } from '@/components/auth/LogoutButton'

export const metadata: Metadata = { title: 'Acesso desativado' }

export default function AcessoDesativadoPage() {
  return (
    <div className="w-full max-w-sm space-y-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <HuiosLogo variant="light" size="lg" />
      </div>

      <div className="rounded-xl border border-huios-cream/10 bg-huios-cream/5 px-6 py-8 space-y-4">
        <p className="text-huios-cream font-semibold text-lg">Acesso desativado</p>
        <p className="text-huios-cream/60 text-sm leading-relaxed">
          Sua conta está temporariamente desativada. Entre em contato com a coordenação HUIOS para
          reativar o acesso.
        </p>
        <div className="pt-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
