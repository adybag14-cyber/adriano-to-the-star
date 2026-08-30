import { test, expect } from '@playwright/test';

test.describe('privacy centre and nearby star tracker', () => {
  test('privacy centre is complete, navigable, and transparent about storage', async ({ page }) => {
    const response = await page.goto('/privacy.html', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Privacy Centre/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://adrianotothestar.com/privacy.html');
    await expect(page.locator('main#main-content')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Privacy, without a black box.');
    for (const id of ['scope', 'data-map', 'browser-storage', 'optional-services', 'third-parties', 'retention', 'rights', 'children', 'security', 'contact', 'changes']) {
      await expect(page.locator(`#${id}`), `privacy section ${id}`).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /GitLab Privacy Statement/ })).toHaveAttribute('href', /gitlab\.com\/privacy/);
    await expect(page.getByRole('link', { name: /Cloudflare Privacy Policy/ })).toHaveAttribute('href', /cloudflare\.com\/privacypolicy/);
    await expect(page.getByRole('link', { name: /UK Information Commissioner/ })).toHaveAttribute('href', /ico\.org\.uk/);

    await page.getByRole('button', { name: 'Inspect browser storage' }).click();
    await expect(page.locator('#storage-check-result')).toContainText('No stored values were read or transmitted.');
    await expect(page.locator('#storage-check-result')).toContainText('Local storage entries:');

    const structuredData = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(() => JSON.parse(structuredData || '')).not.toThrow();
    const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, year: document.querySelector('[data-current-year]')?.textContent }));
    expect(layout.overflow).toBeLessThanOrEqual(2);
    expect(layout.year).toBe(String(new Date().getFullYear()));
  });

  test('tracker loads a same-origin snapshot without runtime archive queries', async ({ page }) => {
    const scienceRequests = [];
    page.on('request', request => {
      if (/exoplanetarchive\.ipac\.caltech\.edu\/TAP|gea\.esac\.esa\.int\/tap/i.test(request.url())) scienceRequests.push(request.url());
    });
    const response = await page.goto('/tracker.html', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await page.waitForFunction(() => document.body.dataset.trackerReady === 'true', null, { timeout: 20_000 });
    await expect(page.locator('#tracker-react-root')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('[data-testid="tracker-scene"] canvas')).toBeVisible();
    await expect(page.locator('#tracker-static-fallback')).toBeHidden();
    expect(scienceRequests).toEqual([]);

    const dataRequest = await page.evaluate(async () => {
      const response = await fetch('data/tracker/stellar-neighborhood.json');
      const data = await response.json();
      return { url: response.url, schemaVersion: data.schemaVersion, stars: data.stars.length, discoveries: data.nasaDiscoveries.length, runtimeNetwork: data.updatePolicy.runtimeNetwork };
    });
    expect(new URL(dataRequest.url).origin).toBe(new URL(page.url()).origin);
    expect(dataRequest.schemaVersion).toBe(1);
    expect(dataRequest.stars).toBeGreaterThanOrEqual(240);
    expect(dataRequest.discoveries).toBe(30);
    expect(dataRequest.runtimeNetwork).toContain('same-origin');
  });

  test('tracker search, system selection, tutorial, and NASA discovery filters work', async ({ page }) => {
    await page.goto('/tracker.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.dataset.trackerReady === 'true', null, { timeout: 20_000 });

    await page.locator('#tracker-search').fill('Proxima');
    await expect(page.getByRole('status').filter({ hasText: /scene systems visible/ })).toContainText('1 of');
    await page.getByRole('button', { name: /Proxima Cen/ }).click();
    await expect(page.locator('#tracker-detail-title')).toHaveText('Proxima Cen');
    await expect(page.locator('.tracker-planets')).toContainText('Proxima Cen b');

    const canvas = page.locator('.tracker-canvas');
    await canvas.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('+');
    await page.keyboard.press('Home');
    await expect(canvas).toBeFocused();

    await page.getByRole('button', { name: 'Open field tutorial' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('dialog')).toContainText('Interrogate selection effects');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.getByRole('tab', { name: 'NASA mission discoveries' }).click();
    await expect(page.locator('#discoveries-panel')).toBeVisible();
    await page.locator('#discovery-search').fill('TOI');
    await expect(page.getByRole('status').filter({ hasText: /discoveries shown/ })).toBeVisible();
    await page.locator('#discovery-method').selectOption({ label: 'Transit' });
    await expect(page.locator('.tracker-discovery-card').first()).toBeVisible();
  });

  test('privacy and tracker remain visible without horizontal overflow at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/privacy.html', '/tracker.html']) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), path).toBeLessThan(400);
      if (path.includes('tracker')) await page.waitForFunction(() => document.body.dataset.trackerReady === 'true', null, { timeout: 20_000 });
      const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight }));
      expect(layout.overflow, `${path} mobile horizontal overflow`).toBeLessThanOrEqual(2);
      expect(layout.scrollHeight, `${path} should provide a scrollable document`).toBeGreaterThan(layout.clientHeight);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    }
  });

  test('tracker source contains no client-side credential gate', async ({ request }) => {
    const response = await request.get('/tracker.html');
    expect(response.status()).toBeLessThan(400);
    const source = await response.text();
    expect(source).not.toMatch(/PASSWORD_HASH|tracker-password|Unlock Tracker|current-password|Invalid credentials/i);
    expect(source).toContain('data/tracker/stellar-neighborhood.json');
  });
});
