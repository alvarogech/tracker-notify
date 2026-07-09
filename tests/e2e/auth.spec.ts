import { test, expect } from '@playwright/test'
import { login } from './support/login'
import { SEED_USERS } from './support/seed-users'

// Cenários 1-4 de docs/ROADMAP.md Fase 10 / CLAUDE.md seção 9 ("Fluxos E2E
// críticos — 10 cenários com Playwright"). Requer `pnpm dev` rodando contra
// um banco Supabase local semeado exatamente como supabase/seed.sql produz
// (ver docs/DECISIONS.md) — NUNCA rodar contra credenciais de produção.

test.describe('Autenticação', () => {
  test('login com credenciais válidas redireciona para a área do papel (líder → /inicio)', async ({
    page,
  }) => {
    await login(page, SEED_USERS.leaderNorte.email, SEED_USERS.leaderNorte.password)

    await expect(page).toHaveURL(/\/inicio$/)
    await expect(page.getByRole('heading', { name: SEED_USERS.leaderNorte.fullName })).toBeVisible()
  })

  test('login com credenciais inválidas mostra erro e permanece em /login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(SEED_USERS.leaderNorte.email)
    await page.getByLabel('Senha').fill('senha-incorreta-teste')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  })

  test('conta pendente de aprovação é redirecionada para /acesso-desativado', async ({ page }) => {
    test.skip(
      !process.env.LEADER_SIGNUP_CODE,
      'Requer LEADER_SIGNUP_CODE configurado no ambiente de teste — ver docs/DECISIONS.md'
    )

    const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const email = `e2e.pendente.${unique}@huios.dev`

    await page.goto('/cadastro-lider')
    await page.getByLabel('Código de convite').fill(process.env.LEADER_SIGNUP_CODE!)
    await page.getByLabel('Seu nome completo').fill(`Líder Pendente E2E ${unique}`)
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill('SenhaTeste@2026')
    await page.getByLabel('Nome do GR').fill(`GR Pendente E2E ${unique}`)
    await page.getByLabel('Dia da semana').selectOption('2')
    await page.getByLabel('Horário').fill('19:00')
    await page.getByLabel('Local (bairro ou endereço)').fill('Bairro de Teste E2E')
    await page.getByRole('button', { name: 'Enviar cadastro' }).click()

    await expect(page.getByText('Cadastro enviado!')).toBeVisible()

    await page.goto('/login')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill('SenhaTeste@2026')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/acesso-desativado$/)
    await expect(page.getByText('Cadastro em análise')).toBeVisible()
  })

  test('visita não autenticada a rota protegida (/pessoas) redireciona para /login', async ({
    page,
  }) => {
    await page.goto('/pessoas')

    await expect(page).toHaveURL(/\/login$/)
  })
})
