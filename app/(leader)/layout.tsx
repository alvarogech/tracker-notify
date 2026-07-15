import { AppBrandHeader } from '@/components/brand/AppBrandHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { requireRole } from '@/lib/auth/server'

export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['leader', 'coordinator', 'admin'])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppBrandHeader showLogout settingsHref="/configuracoes" />
      <main className="flex-1 px-4 py-6 pb-20 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
