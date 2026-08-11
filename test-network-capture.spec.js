import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Desktop Chrome'],
});

test('test', async ({ page }) => {
  await page.goto('http://localhost:8000/starsector.html');
});