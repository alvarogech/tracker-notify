import { test, expect } from '@playwright/test'

// Cenário 10 de docs/ROADMAP.md Fase 10 / CLAUDE.md seção 9. Ao contrário do
// teste de conta pendente em auth.spec.ts, este cenário usa deliberadamente
// um código de convite incorreto — não depende de LEADER_SIGNUP_CODE estar
// configurado no ambiente de teste, então roda sempre.

test.describe('Autocadastro de líder', () => {
  test('/cadastro-lider rejeita envio com código de convite inválido', async ({ page }) => {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`

    await page.goto('/cadastro-lider')
    await page.getByLabel('Código de convite').fill('codigo-de-convite-invalido-e2e')
    await page.getByLabel('Seu nome completo').fill(`Líder Teste E2E ${unique}`)
    await page.getByLabel('E-mail').fill(`e2e.codigo.invalido.${unique}@huios.dev`)
    await page.getByLabel('Senha').fill('SenhaTeste@2026')
    await page.getByLabel('Nome do GR').fill(`GR Teste E2E ${unique}`)
    await page.getByLabel('Dia da semana').selectOption('3')
    await page.getByLabel('Horário').fill('19:00')
    await page.getByLabel('Local (bairro ou endereço)').fill('Bairro de Teste E2E')
    await page.getByRole('button', { name: 'Enviar cadastro' }).click()

    await expect(page.getByText('Código de convite inválido.')).toBeVisible()
    await expect(page).toHaveURL(/\/cadastro-lider$/)
    await expect(page.getByText('Cadastro enviado!')).not.toBeVisible()
  })
})
