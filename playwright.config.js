import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://adrianotothestar.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
