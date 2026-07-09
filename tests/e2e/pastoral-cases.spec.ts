import { test, expect } from '@playwright/test'
import { login } from './support/login'
import { SEED_USERS } from './support/seed-users'

// Cenário 9 de docs/ROADMAP.md Fase 10 / CLAUDE.md seção 9 — contraparte de
// UI do cenário 5 de supabase/tests/database/03_coordinator_admin_access.test.sql:
// a coordenação enxerga /casos de toda a rede, incluindo um GR que não lidera
// (a própria coordenação não lidera GR nenhum).

test.describe('Casos de pastoreio — visão da coordenação', () => {
  test('sessão de coordenação vê em /casos um caso de um GR que não lidera', async ({ page }) => {
    await login(page, SEED_USERS.coordinator.email, SEED_USERS.coordinator.password)

    await page.goto('/casos')

    // Caso fixo do seed: Fernanda Castro, GR Norte (supabase/seed.sql,
    // id 60000000-0000-0000-0000-000000000001) — a coordenação não lidera
    // nenhum GR, então qualquer caso visível já demonstra a visão
    // multi-GR; conferimos também que o nome do GR aparece (showGroupName
    // só é true para papéis != leader — app/(leader)/casos/page.tsx).
    const caseCard = page.getByRole('link').filter({ hasText: 'Fernanda Castro' })
    await expect(caseCard).toBeVisible()
    await expect(caseCard).toContainText('GR Norte')
  })
})
