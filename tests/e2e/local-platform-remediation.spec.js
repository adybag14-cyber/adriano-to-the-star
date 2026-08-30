import { test, expect } from '@playwright/test';

const EXPECTED_ORIGIN = new URL(process.env.BASE_URL || 'http://127.0.0.1:8095').origin;

test.describe('browser-local platform remediation', () => {
  test('file vault uploads, searches, deletes, and reports browser-local storage', async ({ page }) => {
    await page.goto('/file-storage.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.localMissionVault?.db));
    await page.evaluate(async () => {
      await window.localMissionVault.addFiles([new File(['stellar notes'], 'stellar-notes.txt', { type: 'text/plain' })]);
    });
    await expect(page.locator('.file-card')).toHaveCount(1);
    await expect(page.locator('#storage-used')).not.toHaveText('0 B');
    await page.locator('#search-files').fill('missing');
    await expect(page.locator('#files-list')).toContainText('No matching files');
    await page.locator('#search-files').fill('stellar');
    await expect(page.locator('.file-card')).toContainText('stellar-notes.txt');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: /Delete stellar-notes/i }).click();
    await page.locator('#search-files').fill('');
    await expect(page.locator('#files-list')).toContainText('vault is empty');
  });

  test('newsletter plan is honest, local, editable, and removable', async ({ page }) => {
    await page.goto('/newsletter.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#newsletter-email').fill('reader@example.test');
    await page.locator('#newsletter-frequency').selectOption('monthly');
    await page.locator('#newsletter-form').evaluate(form => form.requestSubmit());
    await expect(page.locator('#newsletter-status')).toContainText('No subscription or network request was made');
    await expect(page.locator('#newsletter-saved-plan')).toContainText('reader@example.test');
    await expect(page.locator('#newsletter-saved-plan')).toContainText('Delivery is disabled');
    await page.locator('#remove-newsletter-plan').click();
    await expect(page.locator('#newsletter-saved-plan')).toContainText('No browser-local plan');
  });

  test('local messaging creates a thread and saves a private draft', async ({ page }) => {
    await page.goto('/messaging.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => window.authManager.register('Navigator', 'navigator@example.test', 'twelve-characters', 'Navigator'));
    await expect(page.locator('#messaging-interface')).toBeVisible();
    await page.locator('#new-message-btn').click();
    await page.locator('#new-thread-contact').fill('Research partner');
    await page.locator('.ita-new-thread-dialog form').evaluate(form => form.requestSubmit());
    await expect(page.locator('#chat-user-name')).toHaveText('Research partner');
    await page.locator('#message-input').fill('Review the parallax assumptions.');
    await page.locator('#send-message-btn').click();
    await expect(page.locator('#messages-container')).toContainText('Review the parallax assumptions.');
    await expect(page.locator('.messaging-boundary')).toContainText('do not reach another person');
  });

  test('secure notebook creates, encrypts, locks, and unlocks locally', async ({ page }) => {
    await page.goto('/secure-chat.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => window.authManager.register('Cipher', 'cipher@example.test', 'twelve-characters', 'Cipher'));
    await page.locator('#manage-keys-btn').click();
    await expect(page.locator('#key-setup-modal')).toHaveClass(/active/);
    await page.locator('#key-password').fill('correct-horse-battery');
    await page.locator('#key-password-confirm').fill('correct-horse-battery');
    await page.locator('#generate-keys-btn').click();
    await expect(page.locator('#message-input')).toBeEnabled({ timeout: 10_000 });
    await page.locator('#message-input').fill('Encrypted observation log');
    await page.locator('#send-btn').click();
    await expect(page.locator('#messages-container')).toContainText('Encrypted observation log');
    await page.locator('#manage-keys-btn').click();
    await expect(page.locator('#message-input')).toBeDisabled();
    await page.locator('#manage-keys-btn').click();
    await page.locator('#import-password').fill('correct-horse-battery');
    await page.locator('#unlock-keys-btn').click();
    await expect(page.locator('#messages-container')).toContainText('Encrypted observation log', { timeout: 10_000 });
  });

  test('dashboard, badges, and catalogue analytics use real browser/snapshot values', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('planet-claims', JSON.stringify([{ kepid: 8120608, planetName: 'Kepler-186 f', status: 'active', createdAt: new Date().toISOString() }]));
      localStorage.setItem('favorites', JSON.stringify([{ id: 'proxima-b' }]));
      localStorage.setItem('planet-trends', JSON.stringify([{ id: 'view-1', timestamp: new Date().toISOString() }]));
    });
    await page.goto('/dashboard.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#stat-total')).toHaveText('1');
    await expect(page.locator('#claims-container')).toContainText('Kepler-186 f');
    await page.goto('/badges.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.badge-card.earned')).not.toHaveCount(0);
    await page.getByRole('button', { name: 'Earned' }).click();
    await expect(page.locator('.badge-card:visible')).not.toHaveCount(0);
    await page.goto('/database-analytics.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.database-stat-grid')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.database-stat-grid article').first()).toContainText(/9,5\d{2}|9,564/);
    await expect(page.locator('#database-analytics-status')).toHaveText('Analysis complete.');
  });

  test('main database streams one same-origin 9,564-row catalogue and searches it', async ({ page }) => {
    const externalRequests = [];
    const duplicateCatalogueRequests = [];
    const database3DRequests = [];
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.origin !== EXPECTED_ORIGIN) externalRequests.push(request.url());
      if (/kepler_data_parsed\.js/i.test(url.pathname)) duplicateCatalogueRequests.push(request.url());
      if (/(?:three\.min\.js|OrbitControls-r128\.js|planet-3d-viewer\.js)$/i.test(url.pathname)) {
        database3DRequests.push(url.pathname.split('/').pop());
      }
    });
    await page.goto('/database.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.databaseInstance?.allData?.length === 9564, null, { timeout: 20_000 });
    expect(await page.evaluate(() => window.databaseInstance.allData.length)).toBe(9564);
    expect(duplicateCatalogueRequests).toEqual([]);
    expect(externalRequests).toEqual([]);
    expect(database3DRequests).toEqual([]);
    expect(await page.evaluate(() => ({
      three: Boolean(window.THREE),
      viewer: Boolean(window.Planet3DViewer),
      loader: typeof window.ensureDatabase3D,
    }))).toEqual({ three: false, viewer: false, loader: 'function' });
    await page.locator('#planet-search').fill('Kepler-227');
    await expect(page.locator('.planet-card').first()).toContainText('Kepler-227', { timeout: 5_000 });
    await expect(page.locator('#search-count')).toContainText(/result/i);

    const view3DButton = page.getByRole('button', { name: /View in 3D/i }).first();
    await expect(view3DButton).toBeVisible();
    await view3DButton.click();
    await expect(page.locator('#planet-3d-modal')).toBeVisible({ timeout: 10_000 });
    expect(database3DRequests).toEqual(['three.min.js', 'OrbitControls-r128.js', 'planet-3d-viewer.js']);
    await page.locator('#close-3d-btn').click();
    await expect(page.locator('#planet-3d-modal')).toHaveCount(0);
  });

  test('static API console searches the shipped Kepler JSONL data', async ({ page }) => {
    const externalRequests = [];
    page.on('request', request => { if (new URL(request.url()).origin !== new URL(page.url() || 'http://127.0.0.1').origin) externalRequests.push(request.url()); });
    await page.goto('/api.html', { waitUntil: 'domcontentloaded' });
    externalRequests.length = 0;
    await page.locator('#api-console-query').fill('Kepler-227');
    await page.locator('#api-console-send').click();
    await expect(page.locator('#api-console-output')).toContainText('Kepler-227 b', { timeout: 15_000 });
    await expect(page.locator('#api-console-output')).toContainText('same-origin-static-snapshot');
    expect(externalRequests).toEqual([]);
  });

  test('marketplace tabs/pagination and exchange simulator controls work without wallet access', async ({ page }) => {
    await page.goto('/marketplace.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.listing-card')).toHaveCount(18);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.marketplace-pager')).toContainText('Page 2 of 2');
    await page.getByRole('tab', { name: /Rentals/ }).click();
    await expect(page.locator('#rentals-container')).toContainText('Rental mission models');
    await page.getByRole('tab', { name: /Investments/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: /Crowdfunding/ })).toHaveAttribute('aria-selected', 'true');

    await page.goto('/service-page/galaxy-object-trading.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.object-card')).toHaveCount(6);
    const card = page.locator('.object-card').first();
    await card.locator('input').fill('999');
    await card.locator('button').click();
    await expect(page.locator('#exchange-status-text')).toContainText('999 fictional credits');
    await expect(page.locator('script[src*="ethers"]')).toHaveCount(0);
  });

  test('mission planner saves a route and exports a calendar event', async ({ page }) => {
    await page.goto('/book-online.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#mission-experience').selectOption('tracker');
    await page.locator('#mission-focus').selectOption('astrometry');
    await page.locator('#mission-duration').selectOption('60');
    await page.locator('#mission-plan-form').evaluate(form => form.requestSubmit());
    await expect(page.locator('#mission-plan-output')).toContainText('Stellar Neighbourhood Tracker');
    await page.locator('#save-mission-plan').click();
    await expect(page.locator('#mission-plan-status')).toContainText('No reservation was created');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-mission-plan').click();
    expect((await downloadPromise).suggestedFilename()).toBe('ita-mission-session.ics');
  });

  test('Brotli2 profiler is bounded, cancellable, and completes off the UI thread', async ({ page }) => {
    await page.goto('/brotli2-memory-profiler.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#profile-size').selectOption('4096');
    await page.locator('#run-memory-profile').click();
    await expect(page.locator('#status')).toContainText(/Complete|Circuit breaker/, { timeout: 12_000 });
    const status = await page.locator('#status').textContent();
    expect(status).toContain('Complete');
    await expect(page.locator('#profile-results')).toContainText('Verified');
    await expect(page.locator('#export-memory-profile')).toBeEnabled();
  });

  test('PWA manifest assets are truthful and service worker has no legacy CDN proxy', async ({ page, request }) => {
    await page.goto('/offline.html', { waitUntil: 'domcontentloaded' });
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toMatch(/manifest\.json\?v=/);
    const manifestUrl = new URL(manifestHref, page.url());
    const manifestResponse = await request.get(manifestUrl.toString());
    expect(manifestResponse.ok()).toBe(true);
    const manifest = await manifestResponse.json();
    expect(manifest.screenshots).toBeUndefined();
    expect(manifest.icons.map(icon => icon.sizes)).toEqual(['192x192', '512x512']);
    expect(manifest.icons.every(icon => new URL(icon.src, manifestUrl).searchParams.has('v'))).toBe(true);
    const iconSources = manifest.icons.map(icon => new URL(icon.src, manifestUrl).toString());
    const dimensions = await page.evaluate(async sources => Promise.all(sources.map(src => new Promise(resolve => {
      const image = new Image(); image.onload = () => resolve(`${image.naturalWidth}x${image.naturalHeight}`); image.src = src;
    }))), iconSources);
    expect(dimensions).toEqual(['192x192', '512x512']);
    const worker = await (await request.get(`/sw.js${manifestUrl.search}`)).text();
    expect(worker).not.toMatch(/leaningtech|cjrtnc|\/lt\/|\/lts\//i);
    expect(worker).toContain("url.origin !== self.location.origin");
  });
});
