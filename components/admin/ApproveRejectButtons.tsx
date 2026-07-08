'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { approveLeaderSignup, rejectLeaderSignup } from '@/app/(admin)/admin/solicitacoes/actions'

export function ApproveRejectButtons({ profileId }: { profileId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(() => {
      approveLeaderSignup(profileId)
    })
  }

  function handleReject() {
    if (!confirm('Rejeitar esta solicitação? O cadastro será excluído permanentemente.')) return
    startTransition(() => {
      rejectLeaderSignup(profileId)
    })
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove} disabled={isPending} className="flex-1">
        Aprovar
      </Button>
      <Button size="sm" variant="outline" onClick={handleReject} disabled={isPending} className="flex-1">
        Rejeitar
      </Button>
    </div>
  )
}
