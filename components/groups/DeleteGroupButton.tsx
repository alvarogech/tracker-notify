'use client'

import { useState, useTransition } from 'react'
import { deleteGroup } from '@/app/(coordination)/coordenacao/actions'
import { Button } from '@/components/ui/button'

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm('Excluir este GR permanentemente? Esta ação não pode ser desfeita.')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteGroup(groupId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleDelete}
        disabled={isPending}
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
      >
        Excluir
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
