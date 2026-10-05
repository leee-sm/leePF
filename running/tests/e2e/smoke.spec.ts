import { expect, test } from '@playwright/test'

test('home, running, baby, and health are reachable without external APIs', async ({ page, request }) => {
  const health = await request.get('/api/health')
  expect(health.ok()).toBeTruthy()
  await expect(health.json()).resolves.toMatchObject({ status: 'UP' })

  await page.goto('/')
  await expect(page).toHaveTitle(/LifeRun|Running|러닝/i)
  await page.goto('/running')
  await expect(page).toHaveURL(/\/running/)
  await page.goto('/baby')
  await expect(page).toHaveURL(/\/baby/)
})
