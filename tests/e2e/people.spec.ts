import { test, expect } from '@playwright/test'
import { login } from './support/login'
import { SEED_USERS } from './support/seed-users'

// Cenários 7-8 de docs/ROADMAP.md Fase 10 / CLAUDE.md seção 9.

function uniqueName(label: string) {
  return `Pessoa E2E ${label} ${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

test.describe('Pessoas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SEED_USERS.leaderNorte.email, SEED_USERS.leaderNorte.password)
  })

  test('líder adiciona uma nova pessoa (/pessoas/nova) e ela aparece na lista', async ({
    page,
  }) => {
    const fullName = uniqueName('membro')

    await page.goto('/pessoas/nova')
    await page.getByLabel('Nome completo *').fill(fullName)
    await page.getByRole('button', { name: 'Salvar' }).click()

    // createPersonAction redireciona para /pessoas em caso de sucesso
    await page.waitForURL(/\/pessoas$/)
    await expect(page.getByText(fullName)).toBeVisible()
  })

  test('líder registra um novo visitante e ele aparece em /pessoas', async ({ page }) => {
    const fullName = uniqueName('visitante')

    await page.goto('/pessoas/nova-visita')
    await page.getByLabel('Nome completo *').fill(fullName)
    await page.getByRole('button', { name: 'Registrar visita' }).click()

    // registerNewVisitor não redireciona automaticamente em caso de sucesso
    // simples (sem duplicidade detectada) — navega manualmente para
    // conferir que o visitante foi persistido e aparece na lista do GR.
    await page.goto('/pessoas')
    await expect(page.getByText(fullName)).toBeVisible()
  })
})
