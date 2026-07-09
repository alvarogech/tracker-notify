import { test, expect, type Page } from '@playwright/test'
import { login } from './support/login'
import { SEED_USERS } from './support/seed-users'

// Cenários 5-6 de docs/ROADMAP.md Fase 10 / CLAUDE.md seção 9.

function uniqueMarker(label: string) {
  return `E2E ${label} ${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

// Data futura o bastante para nunca colidir com as reuniões passadas do
// seed (todas há semanas) e para sempre estar dentro do prazo de 48h de
// isReportWithinDeadline (lib/business-rules/absences.ts), já que a
// regra só compara now - scheduledAt <= 48h — uma reunião futura satisfaz
// isso trivialmente.
function futureDateInput() {
  const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

async function createMeeting(page: Page, notes: string, time: string) {
  await page.goto('/reunioes/nova')
  await page.getByLabel('Data da reunião *').fill(futureDateInput())
  await page.getByLabel('Horário *').fill(time)
  await page.getByLabel('Observações').fill(notes)
  await page.getByRole('button', { name: 'Criar reunião' }).click()
  await page.waitForURL(/\/reunioes$/)
}

test.describe('Reuniões', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SEED_USERS.leaderNorte.email, SEED_USERS.leaderNorte.password)
  })

  test('líder cria uma nova reunião e ela aparece na lista de /reunioes', async ({ page }) => {
    const marker = uniqueMarker('nova-reuniao')

    await createMeeting(page, marker, '19:30')

    await expect(page).toHaveURL(/\/reunioes$/)
    await expect(page.getByText(marker)).toBeVisible()
  })

  test('líder registra frequência e envia relatório; relatório fica bloqueado após o envio', async ({
    page,
  }) => {
    const marker = uniqueMarker('chamada')

    await createMeeting(page, marker, '20:15')

    // Entra na reunião recém-criada a partir da lista
    await page.getByText(marker).click()
    await expect(page.getByRole('heading', { name: 'Reunião' })).toBeVisible()

    // Marca ao menos uma presença (suficiente para habilitar salvar/enviar —
    // submitReport exige count >= 1 em attendance_records)
    await page.getByRole('button', { name: 'Presente' }).first().click()
    await page.getByRole('button', { name: 'Salvar rascunho' }).click()
    await expect(page.getByText('Chamada salva.')).toBeVisible()

    await Promise.all([
      page.waitForURL(/\/reunioes$/),
      page.getByRole('button', { name: 'Enviar relatório' }).click(),
    ])

    // Reabre a mesma reunião: relatório enviado deve estar bloqueado para
    // edição — os controles de chamada (Salvar rascunho / Enviar relatório)
    // não devem mais existir, substituídos pela visão somente leitura
    // "Frequência" (app/(leader)/reunioes/[id]/page.tsx)
    await page.getByText(marker).click()
    await expect(page.getByText('Relatório enviado')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Frequência' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Salvar rascunho' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Enviar relatório' })).toHaveCount(0)
  })
})
