import type { Page } from '@playwright/test'

// LoginForm (components/auth/LoginForm.tsx) faz POST tradicional para
// /api/auth/login — aguardamos a navegação de resposta, não uma chamada XHR.
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await Promise.all([
    page.waitForURL((url) => url.pathname !== '/login'),
    page.getByRole('button', { name: 'Entrar' }).click(),
  ])
}
