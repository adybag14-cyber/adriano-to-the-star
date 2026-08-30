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

  test('Spanish and English can round-trip with version-matched landing copy', async ({ page }) => {
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
    await expect(page.locator('.ita-language-toggle')).toHaveAttribute('aria-label', /English \(EN\)/);
    await page.evaluate(() => window.i18n().setLanguage('es'));
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('[data-i18n="hero.line1"]')).not.toHaveText('THE UNIVERSE IS');
    await expect(page.locator('.ita-language-toggle')).toHaveAttribute('aria-label', /Español \(ES\)/);
    expect(requests.some(url => /\/translations\/en\.json\?v=/.test(url)), 'versioned English translation request').toBeTruthy();
    expect(requests.some(url => /\/translations\/es\.json\?v=/.test(url)), 'versioned Spanish translation request').toBeTruthy();
  });

  test('landing theme menu supports keyboard-ready selection and persistence', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    const toggle = page.locator('#theme-toggle-btn');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-haspopup', 'menu');
    await toggle.click();
    await expect(page.locator('#theme-selector-menu')).toBeVisible();
    await page.locator('.theme-option[data-theme="dark"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-label', /Current theme: Deep contrast/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#theme-toggle-btn').click();
    await page.locator('.theme-option[data-theme="cosmic"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cosmic');
    for (const route of ['/education.html', '/projects.html', '/stellar-ai.html']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#theme-toggle-btn'), `${route} theme control`).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'cosmic');
    }
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

  test('Earth uses native NASA surface detail with independent clouds and atmosphere', async ({ page }) => {
    await page.goto('/education.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (
      window.viewer?.currentPlanet === 'Earth'
      && Boolean(window.viewer?.planetMesh?.userData?.surfaceImage)
      && Boolean(window.viewer?.cloudMesh?.material?.map)
      && Boolean(window.viewer?.atmosphereMesh?.material?.isShaderMaterial)
    ));
    const state = await page.evaluate(() => ({
      surface: window.viewer.planetMesh.userData.surfaceImage,
      map: Boolean(window.viewer.planetMesh.material.map),
      vertexColours: Boolean(window.viewer.planetMesh.geometry.attributes.color),
      clouds: Boolean(window.viewer.cloudMesh?.material?.map),
      atmosphere: Boolean(window.viewer.atmosphereMesh?.material?.isShaderMaterial),
      toneMapping: window.viewer.renderer.toneMapping,
      triangles: window.viewer.renderer.info.render.triangles
    }));
    expect(state.surface.src).toContain('images/textures/earth-blue-marble-2048.jpg');
    expect(state.surface.width).toBe(2048);
    expect(state.surface.height).toBe(1024);
    expect(state.surface.nativeTexture).toBe(true);
    expect(state.map).toBe(true);
    expect(state.vertexColours).toBe(false);
    expect(state.clouds).toBe(true);
    expect(state.atmosphere).toBe(true);
    expect(state.triangles).toBeGreaterThan(20_000);
  });

  test('Star Maps supports search, selection, routes, zoom, and keyboard navigation', async ({ page }) => {
    await page.goto('/star-maps.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#star-map-container')).toHaveAttribute('data-star-map-ready', 'true');
    await expect(page.locator('#star-map')).toBeVisible();
    await page.locator('#stellar-map-search').fill('TRAPPIST-1');
    await expect(page.locator('#stellar-map-name')).toHaveText('TRAPPIST-1');
    await expect(page.locator('#star-map-container')).toHaveAttribute('data-star-map-selected', 'trappist-1');
    await expect(page.locator('#stellar-map-education')).toHaveAttribute('href', /education\.html\?target=TRAPPIST-1/i);
    const before = await page.locator('#stellar-map-coordinates').textContent();
    await page.locator('#stellar-map-zoom-in').click();
    await expect(page.locator('#stellar-map-coordinates')).not.toHaveText(before || '');
    await page.locator('#stellar-map-routes').click();
    await expect(page.locator('#stellar-map-routes')).toHaveAttribute('aria-pressed', 'false');
    await page.locator('#star-map').focus();
    await page.keyboard.press('r');
    await expect(page.locator('#stellar-map-coordinates')).toContainText('100%');
  });

  test('Stellar AI keeps controls separated and never downloads Bonsai before consent', async ({ page }) => {
    const modelRequests = [];
    page.on('request', request => {
      if (/esm\.sh\/bitgpu|huggingface\.co\/(?:prism-ml|onnx-community)|cdn\.jsdelivr\.net\/gh\/stfurkan\/bitgpu/i.test(request.url())) modelRequests.push(request.url());
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/stellar-ai.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#stellar-chat-shell')).toBeVisible();
    await expect(page.locator('#bonsai-local-panel')).toBeVisible();
    await expect(page.locator('#cosmic-music-player')).toBeVisible();
    await expect(page.locator('#theme-toggle-btn')).toBeVisible();
    expect(modelRequests).toEqual([]);
    const boxes = await page.evaluate(() => {
      const ids = ['model-selector', 'metrics-btn', 'clear-chat-btn', 'export-chat-btn', 'message-input', 'send-btn'];
      return Object.fromEntries(ids.map(id => {
        const rect = document.getElementById(id).getBoundingClientRect();
        return [id, { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }];
      }));
    });
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    expect(overlaps(boxes['model-selector'], boxes['metrics-btn'])).toBe(false);
    expect(overlaps(boxes['metrics-btn'], boxes['clear-chat-btn'])).toBe(false);
    expect(overlaps(boxes['clear-chat-btn'], boxes['export-chat-btn'])).toBe(false);
    expect(overlaps(boxes['message-input'], boxes['send-btn'])).toBe(false);

    const floatingControlsOverlap = () => page.evaluate(() => {
      const player = document.getElementById('cosmic-music-player').getBoundingClientRect();
      const theme = document.getElementById('theme-toggle-btn').getBoundingClientRect();
      return player.left < theme.right && player.right > theme.left && player.top < theme.bottom && player.bottom > theme.top;
    });
    expect(await floatingControlsOverlap()).toBe(false);

    await page.locator('#minimize-player').click();
    await expect(page.locator('#player-content')).toBeVisible();
    expect(await floatingControlsOverlap()).toBe(false);

    await page.locator('#minimize-player').click();
    await expect(page.locator('#player-content')).toBeHidden();
    expect(await floatingControlsOverlap()).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
    expect(await floatingControlsOverlap()).toBe(false);

    await page.locator('#minimize-player').click();
    await expect(page.locator('#player-content')).toBeVisible();
    expect(await floatingControlsOverlap()).toBe(false);
    expect(modelRequests).toEqual([]);
  });

  test('Analytics renders a labelled browser-local snapshot without waiting for account data', async ({ page }) => {
    await page.goto('/analytics-dashboard.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.analytics-overview')).toBeVisible({ timeout: 2_000 });
    await expect(page.locator('#analytics-account-status')).toContainText(/local browser data only/i);
    await expect(page.locator('.analytics-metric-card')).toHaveCount(4);
    await expect(page.locator('.analytics-data-note')).toContainText(/no sample numbers/i);
  });

  test('Space Dashboard renders the build-cached snapshot while live feeds are unavailable', async ({ page }) => {
    const feedRequests = [];
    page.on('request', request => {
      if (/\/data\/space-feeds\.json/.test(request.url())) feedRequests.push(request.url());
    });
    await page.route('**/*', route => {
      const requestOrigin = new URL(route.request().url()).origin;
      return requestOrigin === BASE_ORIGIN ? route.continue() : route.abort();
    });
    await page.goto('/space-dashboard.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#space-data-loading')).toBeHidden();
    await expect(page.locator('#space-data-content')).toBeVisible();
    await expect(page.locator('#space-data-content .exoplanet-item')).not.toHaveCount(0);
    await expect(page.locator('#space-data-content .launch-item')).not.toHaveCount(0);
    await expect(page.locator('#space-data-content .news-item')).not.toHaveCount(0);
    expect(feedRequests.some(url => /\/data\/space-feeds\.json\?v=[A-Za-z0-9._-]+$/.test(url)), 'release-versioned space feed request').toBeTruthy();
    expect(await page.locator('#space-data-content').innerText()).not.toMatch(/[\u0080-\u009f\ufffd]/u);
  });

  test('Projects preflight and filtering work without contacting deployment services', async ({ page }) => {
    const externalPosts = [];
    page.on('request', request => { if (request.method() !== 'GET' && !request.url().startsWith('http://127.0.0.1')) externalPosts.push(request.url()); });
    await page.goto('/projects.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.project-card')).toHaveCount(11);
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
