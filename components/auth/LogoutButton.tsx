'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button variant="outline" onClick={handleLogout} className="border-huios-cream/20 text-huios-cream/60 hover:text-huios-cream hover:bg-huios-cream/10">
      Sair da conta
    </Button>
  )
}
