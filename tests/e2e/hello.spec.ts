import { expect, test } from '@playwright/test';

test('shows the greeting', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Fairy' })).toBeVisible();
  await expect(page.getByText('Olá do banco de dados!')).toBeVisible();
});

test('shows Carregando while the greeting loads', async ({ page }) => {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/hello', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/');
  await expect(page.getByText('Carregando…')).toBeVisible();
  release();
  await expect(page.getByText('Olá do banco de dados!')).toBeVisible();
  await expect(page.getByText('Carregando…')).toBeHidden();
});

test('retries after an error', async ({ page }) => {
  await page.route('**/hello', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        type: 'service_unavailable',
        title: 'Service unavailable',
        status: 503,
      }),
    }),
  );
  await page.goto('/');
  await expect(page.getByText('Não foi possível carregar.')).toBeVisible();

  await page.unroute('**/hello');
  await page.getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(page.getByText('Olá do banco de dados!')).toBeVisible();
  await expect(page.getByText('Não foi possível carregar.')).toBeHidden();
});
