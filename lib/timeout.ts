// Supabase Auth (getUser()) pode ficar lento ou travar com cookie de sessão
// expirado/inválido — sem timeout, isso consome o orçamento de execução da
// function até estourar. Trata timeout como falha (chamador decide o fallback).
export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}
