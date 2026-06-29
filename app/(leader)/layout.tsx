import { AppBrandHeader } from '@/components/brand/AppBrandHeader'
import { requireRole } from '@/lib/auth/server'

export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['leader', 'coordinator', 'admin'])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppBrandHeader />
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
