import { test, expect } from '@playwright/test';
import { SITE_PAGES, canonicalUrl } from '../../scripts/site-pages.mjs';

const PROJECT_TARGETS = [
  'experimental/webgpu-galaxy/galaxy-sim.html',
  'experimental/procedural-planets/index.html',
  'experimental/fluid-nebula/index.html',
  'experimental/sentient-browser/hal-interface.html',
  'experimental/holographic-xr/surface-explorer.html',
  'experimental/holographic-xr/ar-star-chart.html',
  'experimental/connected-cosmos/cosmic-radio.html',
  'experimental/connected-cosmos/p2p-network.html',
  'experimental/native-integration/captains-log.html',
  'experimental/native-integration/telemetry.html'
];
const BASE_ORIGIN = new URL(process.env.BASE_URL || 'https://adrianotothestar.com').origin;

test.describe('production site overhaul', () => {
  test('all 46 public pages load, expose metadata and breadcrumbs, and scroll without layout overflow', async ({ page }) => {
    test.setTimeout(10 * 60 * 1000);
    for (const entry of SITE_PAGES) {
      const response = await page.goto(`/${entry.path}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      expect(response?.status(), `${entry.path} response`).toBeLessThan(400);
      if (entry.path === 'starsector.html') continue;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonicalUrl(entry));
      await expect(page.locator('meta[name="description"]')).toHaveCount(1);
      await expect(page.locator('.ita-breadcrumb')).toHaveCount(1);
      await page.evaluate(() => scrollTo(0, Math.floor(document.documentElement.scrollHeight / 2)));
      await page.waitForTimeout(25);
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src)
      }));
      expect(layout.overflow, `${entry.path} horizontal overflow`).toBeLessThanOrEqual(2);
      expect(layout.brokenImages, `${entry.path} broken images`).toEqual([]);
    }
  });

  test('all public pages remain usable at a 390px mobile breakpoint', async ({ page }) => {
    test.setTimeout(10 * 60 * 1000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const entry of SITE_PAGES) {
      const response = await page.goto(`/${entry.path}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      expect(response?.status(), `${entry.path} mobile response`).toBeLessThan(400);
      if (entry.path === 'starsector.html') continue;
      const initial = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      }));
      expect(initial.overflow, `${entry.path} mobile horizontal overflow`).toBeLessThanOrEqual(2);
      if (initial.scrollHeight > initial.clientHeight + 4) {
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(20);
        expect(await page.evaluate(() => scrollY), `${entry.path} mobile document scroll`).toBeGreaterThan(0);
      }
    }
  });

  test('Spanish can switch back to the version-matched English landing copy', async ({ page }) => {
    const requests = [];
    page.on('request', request => { if (/\/translations\/(?:en|es)\.json/.test(request.url())) requests.push(request.url()); });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.i18n?.().ready);
    await page.evaluate(() => window.i18n().setLanguage('es'));
    await expect(page.locator('[data-i18n="hero.line1"]')).not.toHaveText('THE UNIVERSE IS');
    await page.evaluate(() => window.i18n().setLanguage('en'));
    await expect(page.locator('[data-i18n="hero.line1"]')).toHaveText('THE UNIVERSE IS');
    await expect(page.locator('[data-i18n="hero.line2"]')).toHaveText('NOW A DESTINATION.');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(requests.some(url => /\/translations\/en\.json\?v=/.test(url)), 'versioned English translation request').toBeTruthy();
  });

  test('Education exposes all eight local planet textures', async ({ page }) => {
    await page.goto('/education.html', { waitUntil: 'domcontentloaded' });
    for (const planet of ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']) {
      await page.locator(`[data-education-planet="${planet}"]`).click();
      await expect(page.locator('#planet-name')).toHaveText(new RegExp(`^${planet}$`, 'i'));
      await page.waitForFunction(name => window.viewer?.currentPlanet === name && Boolean(window.viewer?.planetMesh?.userData?.surfaceImage), planet);
      const texture = await page.evaluate(() => window.viewer.planetMesh.userData.surfaceImage.src);
      expect(texture, `${planet} texture should be local`).not.toMatch(/^https?:/);
    }
  });

  test('Space Dashboard renders the build-cached snapshot while live feeds are unavailable', async ({ page }) => {
    await page.route('https://**/*', route => route.abort());
    await page.goto('/space-dashboard.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#space-data-loading')).toBeHidden();
    await expect(page.locator('#space-data-content')).toBeVisible();
    await expect(page.locator('#space-data-content .exoplanet-item')).not.toHaveCount(0);
    await expect(page.locator('#space-data-content .launch-item')).not.toHaveCount(0);
  });

  test('Projects preflight and filtering work without contacting deployment services', async ({ page }) => {
    const externalPosts = [];
    page.on('request', request => { if (request.method() !== 'GET' && !request.url().startsWith('http://127.0.0.1')) externalPosts.push(request.url()); });
    await page.goto('/projects.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.project-card')).toHaveCount(10);
    await expect(page.locator('#readiness-summary')).toContainText('/ 5 available');
    await page.locator('[data-filter="immersive"]').click();
    await expect(page.locator('.project-card:visible')).toHaveCount(2);
    await page.locator('#project-search').fill('serial');
    await expect(page.locator('.project-card:visible')).toHaveCount(0);
    await page.locator('[data-filter="device"]').click();
    await expect(page.locator('.project-card:visible')).toHaveCount(1);
    expect(externalPosts).toEqual([]);
  });

  test('all ten project labs load with explicit runtime boundaries and no missing local assets', async ({ page }) => {
    test.setTimeout(4 * 60 * 1000);
    for (const target of PROJECT_TARGETS) {
      const localProblems = [];
      const onResponse = response => {
        if (new URL(response.url()).origin === BASE_ORIGIN && response.status() >= 400) {
          localProblems.push(`${response.status()} ${response.url()}`);
        }
      };
      page.on('response', onResponse);
      const response = await page.goto(`/${target}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      expect(response?.status(), `${target} response`).toBeLessThan(400);
      await expect(page.locator('.ita-lab-disclosure')).toHaveCount(1);
      await page.locator('.ita-lab-disclosure summary').click();
      await expect(page.locator('.ita-lab-disclosure a')).toHaveAttribute('href', '../../projects.html');
      await page.waitForTimeout(150);
      page.off('response', onResponse);
      expect(localProblems, `${target} same-origin failures`).toEqual([]);
    }
  });
});
