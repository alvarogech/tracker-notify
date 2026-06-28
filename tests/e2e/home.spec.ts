import { test, expect } from '@playwright/test'

test('página inicial carrega com marca HUIOS', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Pastoreio HUIOS/)
})
