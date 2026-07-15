'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[app/error.tsx]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-bold">Ocorreu um erro</h1>
      <p className="max-w-md text-sm text-muted-foreground">{error.message || 'Erro sem mensagem (redigida em produção).'}</p>
      {error.digest && <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        Tentar novamente
      </button>
    </div>
  )
}
