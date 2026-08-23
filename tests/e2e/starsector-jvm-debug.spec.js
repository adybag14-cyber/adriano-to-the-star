import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const STARSECTOR_QUICK_URL = 'https://adybag14-cyber.github.io/starsectorquick/launch.html?autostart=1';

test.describe('Starsector launcher handoff', () => {
    test('redirects the legacy Starsector route to StarsectorQuick', async ({ page }) => {
        await page.route('https://adybag14-cyber.github.io/starsectorquick/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: '<!doctype html><title>StarsectorQuick test target</title><main>redirect reached</main>'
            });
        });

        const response = await page.goto(`${BASE_URL}/starsector.html`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        expect(response?.status()).toBe(200);
        await expect.poll(() => page.url(), { timeout: 10000 }).toBe(STARSECTOR_QUICK_URL);
        await expect(page.getByText('redirect reached')).toBeVisible();
    });
});
