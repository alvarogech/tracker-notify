import { InstitutionalFooter } from '@/components/brand/InstitutionalFooter'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-huios-dark">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {children}
      </main>
      <InstitutionalFooter variant="dark" />
    </div>
  )
}
