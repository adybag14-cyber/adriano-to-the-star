import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/./);
});

test('check for main elements', async ({ page }) => {
  await page.goto('/');

  // Check if some common element exists, e.g., a header or a main container
  const body = page.locator('body');
  await expect(body).toBeVisible();
});
