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

const luminance = hex => {
  const channels = hex.replace('#', '').match(/.{2}/g).map(value => Number.parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const contrastRatio = (foreground, background) => {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

test.describe('production site overhaul', () => {
  test('about page stays concise and publishes no personal biography or plan', async ({ page }) => {
    const response = await page.goto('/about.html', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'ABOUT THE PROJECT' })).toBeVisible();
    const mainText = await page.locator('main').innerText();
    const wordCount = mainText.trim().split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeLessThanOrEqual(70);
    expect(mainText).not.toMatch(/About Me|My Story|Britain|Oxford|Cambridge|Biomedical|Chemistry|Metropolitan|MI[456]|police|secret service|criminal record|founder|roadmap|long-term vision|programme of study|prime minister/i);
    const markup = await page.locator('html').innerHTML();
    expect(markup).not.toMatch(/contact@|twitter\.com|facebook\.com|universal-simulation-hub|void-warfare-engine|metaphysics-apotheosis/i);
    await expect(page.getByRole('link', { name: 'Explore the database' })).toHaveAttribute('href', 'database.html');
    await expect(page.getByRole('link', { name: 'Open the stellar tracker' })).toHaveAttribute('href', 'tracker.html');
    await expect(page.getByRole('link', { name: 'Read the privacy notice' })).toHaveAttribute('href', 'privacy.html');
    await page.waitForFunction(() => window.i18n?.().ready);
    const breadcrumbHome = page.locator('.ita-breadcrumb a').first();
    const breadcrumbCurrent = page.locator('.ita-breadcrumb [aria-current="page"]');
    await page.evaluate(() => window.i18n().setLanguage('es'));
    await expect(breadcrumbHome).toHaveText('Inicio');
    await expect(breadcrumbCurrent).toHaveText('SOBRE EL PROYECTO');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SOBRE EL PROYECTO');
    await expect(page.locator('[data-i18n="pages.aboutExperience.body1"]')).toContainText('datos astronómicos públicos');
    await expect(page.getByRole('link', { name: 'Lee el aviso de privacidad' })).toHaveAttribute('href', 'privacy.html');
    await expect(page.getByRole('link', { name: 'Aviso de privacidad', exact: true })).toHaveAttribute('href', 'privacy.html');
    await page.evaluate(() => window.i18n().setLanguage('en'));
    await expect(breadcrumbHome).toHaveText('Home');
    await expect(breadcrumbCurrent).toHaveText('ABOUT THE PROJECT');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ABOUT THE PROJECT');
    await expect(page.locator('[data-i18n="pages.aboutExperience.body1"]')).toContainText('public astronomy data');
    await expect(page.getByRole('link', { name: 'Read the privacy notice' })).toHaveAttribute('href', 'privacy.html');
    await expect(page.getByRole('link', { name: 'Privacy notice', exact: true })).toHaveAttribute('href', 'privacy.html');
  });

  test('all 47 public pages load, expose one shared flight field, metadata and breadcrumbs, and scroll without layout overflow', async ({ page }) => {
    test.setTimeout(10 * 60 * 1000);
    for (const entry of SITE_PAGES) {
      const response = await page.goto(`/${entry.path}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      expect(response?.status(), `${entry.path} response`).toBeLessThan(400);
      if (entry.path === 'starsector.html') continue;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonicalUrl(entry));
      await expect(page.locator('meta[name="description"]')).toHaveCount(1);
      await expect(page.locator('.ita-breadcrumb')).toHaveCount(1);
      await expect(page.locator('link[data-ita-universe-shell][href*="ita-universe-shell.css?v="]')).toHaveCount(1);
      await expect(page.locator('script[data-ita-universe-shell][src*="ita-universe-shell.js?v="]')).toHaveCount(1);
      await page.waitForFunction(() => window.__itaUniverseShellLoaded === true);
      const flightField = page.locator('[data-ita-flight-field]');
      await expect(flightField, `${entry.path} shared flight canvas`).toHaveCount(1);
      await expect(flightField).toHaveAttribute('data-render-mode', 'forward-flight');
      await expect(flightField).toHaveAttribute('data-motion', 'forward-z');
      const flightMetrics = await flightField.evaluate(node => ({
        position: getComputedStyle(node).position,
        pointerEvents: getComputedStyle(node).pointerEvents,
        width: node.width,
        height: node.height,
        stars: Number(node.dataset.starCount)
      }));
      expect(flightMetrics.position, `${entry.path} flight canvas position`).toBe('fixed');
      expect(flightMetrics.pointerEvents, `${entry.path} flight canvas input isolation`).toBe('none');
      expect(flightMetrics.width, `${entry.path} flight canvas width`).toBeGreaterThan(0);
      expect(flightMetrics.height, `${entry.path} flight canvas height`).toBeGreaterThan(0);
      expect(flightMetrics.stars, `${entry.path} flight star count`).toBeGreaterThanOrEqual(72);
      expect(flightMetrics.stars, `${entry.path} flight star count`).toBeLessThanOrEqual(196);
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

  test('landing telemetry stays legible and decorative hero art stays out of the accessibility tree', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.planet-system')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.planet img')).toHaveCount(0);
    await expect(page.locator('.planet-texture')).toHaveCSS('background-image', /bg-large\.jpg/);
    await expect(page.locator('.telemetry small').first()).toHaveCSS('color', 'rgb(197, 200, 216)');
    await expect(page.locator('.telemetry').first()).toHaveCSS('background-color', 'rgba(5, 7, 13, 0.94)');
    await expect(page.locator('.stage-caption span').last()).toHaveCSS('color', 'rgb(197, 200, 216)');
    await expect(page.locator('.desktop-nav [data-atlas-trigger]')).toHaveAttribute('aria-label', /^Menu: open systems atlas$/i);
    await expect(page.locator('.scroll-cue')).toHaveAttribute('aria-label', /Scroll to traverse/i);
  });

  test('landing CTAs retain contrast and the passenger scene is code-native deep space', async ({ page }) => {
    const sandyImageRequests = [];
    page.on('request', request => {
      if (/\/images\/image_2\.jpg(?:\?|$)/i.test(request.url())) sandyImageRequests.push(request.url());
    });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__itaUniverseShellLoaded === true);

    const primaryButtons = page.locator('a.button.button-primary');
    await expect(primaryButtons).toHaveCount(2);
    for (const button of await primaryButtons.all()) {
      await expect(button).toHaveCSS('color', 'rgb(234, 252, 255)');
      const background = await button.evaluate(node => getComputedStyle(node).backgroundImage);
      expect(background).toContain('rgb(18, 49, 60)');
      expect(background).toContain('rgb(37, 38, 77)');
      expect(background).not.toContain('rgb(255, 255, 255)');
      await button.hover();
      await expect(button).toHaveCSS('color', 'rgb(234, 252, 255)');
    }

    const palette = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        foreground: style.getPropertyValue('--landing-cta-ink').trim(),
        start: style.getPropertyValue('--landing-cta-start').trim(),
        end: style.getPropertyValue('--landing-cta-end').trim()
      };
    });
    expect(Math.min(contrastRatio(palette.foreground, palette.start), contrastRatio(palette.foreground, palette.end))).toBeGreaterThanOrEqual(7);

    await expect(page.locator('.passage-image')).toHaveCount(0);
    await expect(page.locator('.passage-cosmos')).toHaveAttribute('aria-hidden', 'true');
    await page.locator('.passage-section').scrollIntoViewIfNeeded();
    await expect(page.locator('.passage-world')).toBeVisible();
    expect(sandyImageRequests).toEqual([]);

    await expect(page.locator('#stellar-field')).toHaveCount(0);
    await expect(page.locator('#db-stellar-field')).toHaveCount(0);
    await expect(page.locator('.ita-universe-fx')).toHaveCount(1);
    await expect(page.locator('#ita-cosmic-field')).toHaveAttribute('data-render-mode', 'forward-flight');
    await expect(page.locator('#ita-cosmic-field')).toHaveAttribute('data-motion', 'forward-z');
    await expect(page.locator('#ita-cosmic-field')).toHaveCSS('display', 'block');
    const firstFrame = await page.locator('#ita-cosmic-field').evaluate(node => node.toDataURL());
    await page.waitForTimeout(350);
    expect(await page.locator('#ita-cosmic-field').evaluate(node => node.toDataURL())).not.toBe(firstFrame);
    const canvas = await page.evaluate(() => {
      const node = document.getElementById('ita-cosmic-field');
      const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
      let paintedSamples = 0;
      for (let index = 3; index < pixels.length; index += 64) {
        if (pixels[index] > 0) paintedSamples += 1;
      }
      return { paintedSamples, width: node.width, height: node.height, starCount: Number(node.dataset.starCount) };
    });
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(canvas.paintedSamples).toBeGreaterThan(20);
    expect(canvas.starCount).toBeGreaterThanOrEqual(72);
  });

  test('reduced motion keeps the forward-flight identity as one painted static frame', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__itaUniverseShellLoaded === true);
    const canvas = page.locator('#ita-cosmic-field');
    await expect(canvas).toHaveAttribute('data-render-mode', 'static-starfield');
    await expect(canvas).toHaveAttribute('data-motion', 'forward-z');
    await expect(canvas).toHaveCSS('display', 'block');
    await expect(page.locator('#stellar-field')).toHaveCount(0);
    await expect(page.locator('.passage-nebula')).toHaveCSS('animation-name', 'none');
    const firstFrame = await canvas.evaluate(node => node.toDataURL());
    await page.waitForTimeout(250);
    expect(await canvas.evaluate(node => node.toDataURL())).toBe(firstFrame);
    await expect(page.locator('[data-ita-flight-field]')).toHaveCount(1);
  });

  test('a live reduced-motion preference change pauses and resumes the shared renderer', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/privacy.html', { waitUntil: 'domcontentloaded' });
    const canvas = page.locator('#ita-cosmic-field');
    await expect(canvas).toHaveAttribute('data-render-mode', 'forward-flight');
    const movingFrame = await canvas.evaluate(node => node.toDataURL());
    await page.waitForTimeout(300);
    expect(await canvas.evaluate(node => node.toDataURL())).not.toBe(movingFrame);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(canvas).toHaveAttribute('data-render-mode', 'static-starfield');
    const staticFrame = await canvas.evaluate(node => node.toDataURL());
    await page.waitForTimeout(300);
    expect(await canvas.evaluate(node => node.toDataURL())).toBe(staticFrame);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(canvas).toHaveAttribute('data-render-mode', 'forward-flight');
    const resumedFrame = await canvas.evaluate(node => node.toDataURL());
    await page.waitForTimeout(300);
    expect(await canvas.evaluate(node => node.toDataURL())).not.toBe(resumedFrame);
  });

  test('landing theme menu supports keyboard-ready selection and persistence', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    const toggle = page.locator('#theme-toggle-btn');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-haspopup', 'menu');
    await toggle.click();
    await expect(page.locator('#theme-selector-menu')).toBeVisible();
    expect(await page.locator('#theme-toggle-container').innerText()).not.toMatch(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u);
    await expect(page.locator('.theme-option .theme-icon')).toHaveCount(2);
    for (const icon of await page.locator('.theme-option .theme-icon').all()) await expect(icon).toHaveAttribute('aria-hidden', 'true');
    const cosmicVisual = await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      accent: getComputedStyle(document.documentElement).getPropertyValue('--ita-cyan').trim(),
      fieldOpacity: getComputedStyle(document.getElementById('ita-cosmic-field')).opacity
    }));
    await page.locator('.theme-option[data-theme="dark"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-label', /Current theme: Deep contrast/);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(0, 0, 0)');
    const contrastVisual = await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      accent: getComputedStyle(document.documentElement).getPropertyValue('--ita-cyan').trim(),
      fieldOpacity: getComputedStyle(document.getElementById('ita-cosmic-field')).opacity
    }));
    expect(contrastVisual).not.toEqual(cosmicVisual);
    expect(contrastVisual.accent).not.toBe(cosmicVisual.accent);
    expect(Number(contrastVisual.fieldOpacity)).toBeGreaterThan(Number(cosmicVisual.fieldOpacity));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(0, 0, 0)');
    await page.locator('#theme-toggle-btn').click();
    await page.locator('.theme-option[data-theme="cosmic"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cosmic');
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(1, 2, 8)');
    for (const route of ['/education.html', '/projects.html', '/stellar-ai.html']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#theme-toggle-btn'), `${route} theme control`).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'cosmic');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/database.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#theme-toggle-btn')).toBeVisible();
    const mobileThemeBox = await page.locator('#theme-toggle-btn').boundingBox();
    expect(mobileThemeBox?.width).toBeGreaterThanOrEqual(44);
    expect(mobileThemeBox?.width).toBeLessThanOrEqual(52);
    expect(mobileThemeBox?.height).toBeGreaterThanOrEqual(44);
    expect(mobileThemeBox?.height).toBeLessThanOrEqual(52);
    await expect(page.locator('#theme-toggle-btn')).toHaveCSS('border-radius', '50%');
    await page.locator('#theme-toggle-btn').click();
    await page.locator('.theme-option[data-theme="dark"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(0, 0, 0)');
    const mobileControlsOverlap = await page.evaluate(() => {
      const theme = document.getElementById('theme-toggle-btn').getBoundingClientRect();
      const player = document.getElementById('cosmic-music-player').getBoundingClientRect();
      return theme.left < player.right && theme.right > player.left && theme.top < player.bottom && theme.bottom > player.top;
    });
    expect(mobileControlsOverlap).toBe(false);
    await page.locator('#minimize-player').click();
    await expect(page.locator('#player-content')).toBeVisible();
    await expect(page.locator('#minimize-player')).not.toHaveClass(/is-minimized/);
    const mobilePlayerGeometry = await page.evaluate(() => {
      const box = id => {
        const rect = document.getElementById(id).getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      };
      const theme = document.getElementById('theme-toggle-btn').getBoundingClientRect();
      const player = document.getElementById('cosmic-music-player').getBoundingClientRect();
      return {
        minimize: box('minimize-player'), previous: box('prev-track'), play: box('play-pause'), next: box('next-track'), loop: box('loop-toggle'),
        overlapsTheme: theme.left < player.right && theme.right > player.left && theme.top < player.bottom && theme.bottom > player.top
      };
    });
    expect(mobilePlayerGeometry.minimize.width).toBe(38);
    expect(mobilePlayerGeometry.minimize.height).toBe(38);
    expect(mobilePlayerGeometry.previous.width).toBe(40);
    expect(mobilePlayerGeometry.previous.height).toBe(40);
    expect(mobilePlayerGeometry.play.width).toBe(48);
    expect(mobilePlayerGeometry.play.height).toBe(48);
    expect(mobilePlayerGeometry.next.width).toBe(40);
    expect(mobilePlayerGeometry.next.height).toBe(40);
    expect(mobilePlayerGeometry.loop.width).toBe(18);
    expect(mobilePlayerGeometry.loop.height).toBe(18);
    expect(mobilePlayerGeometry.overlapsTheme).toBe(false);
  });

  test('phase-one primary headings are free of decorative emoji', async ({ page }) => {
    for (const route of [
      '/ai-metrics-dashboard.html', '/ai-predictions.html', '/blog.html', '/book-online.html', '/dashboard.html',
      '/database-analytics.html', '/file-storage.html', '/messaging.html', '/secure-chat.html', '/stellar-ai.html'
    ]) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(await page.locator('h1').first().innerText(), route).not.toMatch(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u);
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
    await expect(page.locator('#stellar-map-education')).toHaveAttribute('href', /education\.html\?target=TRAPPIST-1%20e/i);
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
    expect(await page.locator('.ita-player-brand').innerText()).not.toMatch(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u);
    expect(await page.locator('.ita-player-volume-row').innerText()).not.toMatch(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u);
    expect(await page.locator('#download-track').innerText()).not.toMatch(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u);
    await expect(page.locator('.ita-player-icon')).not.toHaveCount(0);
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
