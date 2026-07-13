'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteGroupCascade } from '@/app/(coordination)/coordenacao/actions'
import { Button } from '@/components/ui/button'

interface Props {
  groupId: string
  groupName: string
}

export function CascadeDeleteGroupButton({ groupId, groupName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    const typed = prompt(
      `Isso apaga PERMANENTEMENTE o GR "${groupName}" e tudo vinculado a ele (reuniões, casos, pessoas exclusivas deste GR etc). Não pode ser desfeito.\n\nPara confirmar, digite o nome exato do GR:`
    )
    if (typed !== groupName) {
      if (typed !== null) setError('Nome digitado não confere — nada foi excluído.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await deleteGroupCascade(groupId)
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
        className="text-destructive border-destructive/30 hover:bg-destructive/10"
      >
        <Trash2 size={12} />
        Excluir tudo (GR de teste)
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
