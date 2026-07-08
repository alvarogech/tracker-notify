import type { Metadata } from 'next'
import { HuiosLogo } from '@/components/brand/HuiosLogo'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { getCurrentProfile } from '@/lib/auth/server'

export const metadata: Metadata = { title: 'Acesso desativado' }

export default async function AcessoDesativadoPage() {
  const profile = await getCurrentProfile()
  const pending = profile?.pending_approval ?? false

  return (
    <div className="w-full max-w-sm space-y-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <HuiosLogo variant="light" size="lg" />
      </div>

      <div className="rounded-xl border border-huios-cream/10 bg-huios-cream/5 px-6 py-8 space-y-4">
        <p className="text-huios-cream font-semibold text-lg">
          {pending ? 'Cadastro em análise' : 'Acesso desativado'}
        </p>
        <p className="text-huios-cream/60 text-sm leading-relaxed">
          {pending
            ? 'Seu cadastro e o do seu GR foram recebidos e estão aguardando aprovação da administração. Você receberá acesso assim que forem aprovados.'
            : 'Sua conta está temporariamente desativada. Entre em contato com a coordenação HUIOS para reativar o acesso.'}
        </p>
        <div className="pt-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
