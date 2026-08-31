import { expect, test } from '@playwright/test';

const collectFailures = page => {
  const failures = [];
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  return failures;
};

test.describe('NASA-backed Planetary OS appearance models', () => {
  test('routes Barnard system to a real planet and exposes all four worlds', async ({ page }) => {
    const failures = collectFailures(page);
    const dataRequests = [];
    page.on('request', request => {
      if (/data\/exoplanet-(?:appearance-core|appearance-index|atmospheres)\.json/i.test(request.url())) dataRequests.push(request.url());
    });
    await page.goto('/star-maps.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#stellar-map-search').fill("Barnard's Star");
    await expect(page.locator('#stellar-map-name')).toHaveText("Barnard's Star");
    await expect(page.locator('#stellar-map-planets')).toHaveText('4');
    await expect(page.locator('#stellar-map-education')).toHaveAttribute('href', /education\.html\?target=Barnard%20b$/);
    await expect(page.locator('#stellar-map-education')).toHaveText('Open Barnard b in Planetary OS');

    await page.goto('/education.html?target=Barnard%20b', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (
      window.viewer?.currentPlanet === 'Barnard b'
      && window.viewer?.planetMesh?.userData?.surfaceImage?.proceduralTexture === true
    ), null, { timeout: 30_000 });

    const state = await page.evaluate(() => ({
      name: window.viewer.currentPlanet,
      surface: window.viewer.planetMesh.userData.surfaceImage,
      model: window.viewer.planetMesh.userData.planetaryModel,
      atmosphere: Boolean(window.viewer.atmosphereMesh),
      cloud: Boolean(window.viewer.cloudMesh)
    }));
    expect(state.name).toBe('Barnard b');
    expect(state.surface.width).toBeGreaterThanOrEqual(768);
    expect(state.surface.height).toBe(state.surface.width / 2);
    expect(state.surface.nativeTexture).toBe(false);
    expect(state.surface.modelVersion).toMatch(/^ita-planetary-appearance-v1$/);
    expect(state.surface.evidenceClass).toBe('bulk-constrained');
    expect(state.surface.spatialConstraint).toBe('none');
    expect(state.model.planetName).toBe('Barnard b');
    expect(state.model.physical.massQualifier).toMatch(/minimum mass/i);
    expect(state.model.physical.radiusKind).toBe('archive-calculated');
    expect(state.model.evidence.spectraCount).toBe(0);
    expect(state.model.evidence.species).toEqual([]);
    expect(state.atmosphere).toBe(true);
    expect(state.cloud).toBe(false);

    await expect(page.locator('#planet-name')).toHaveText('BARNARD B');
    await expect(page.locator('#planet-context-label')).toContainText(/model-generated/i);
    await expect(page.locator('#planet-spectrum-status')).toContainText(/no planetary atmosphere spectrum/i);
    await expect(page.locator('#planet-model-summary')).toContainText(/not a resolved photograph/i);
    await expect(page.locator('#education-system-worlds')).toBeVisible();
    await expect(page.locator('#education-world-select option')).toHaveCount(4);
    await expect(page.locator('#planet-source-links a').first()).toHaveAttribute('href', /exoplanetarchive\.ipac\.caltech\.edu/);

    const firstTexture = state.surface.src;
    await page.locator('#education-world-select').selectOption({ label: 'Barnard c' });
    await page.waitForFunction(() => window.viewer?.currentPlanet === 'Barnard c' && window.viewer?.planetMesh?.userData?.surfaceImage?.planetId === 'barnard-c');
    const secondTexture = await page.evaluate(() => window.viewer.planetMesh.userData.surfaceImage.src);
    expect(secondTexture).not.toBe(firstTexture);
    expect(dataRequests.some(url => /exoplanet-appearance-core\.json/i.test(url))).toBe(true);
    expect(dataRequests.some(url => /exoplanet-appearance-index\.json/i.test(url))).toBe(false);
    expect(dataRequests.some(url => /exoplanet-atmospheres\.json/i.test(url))).toBe(false);
    expect(failures).toEqual([]);
  });

  test('legacy host routes resolve visibly to a planet and non-planet targets do not become spheres', async ({ page }) => {
    const failures = collectFailures(page);
    await page.goto("/education.html?target=Barnard%27s%20Star", { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.viewer?.currentPlanet === 'Barnard b', null, { timeout: 30_000 });
    await expect(page.locator('#planet-name')).toHaveText('BARNARD B');
    await expect(page.locator('#education-world-select option')).toHaveCount(4);

    await page.evaluate(() => window.viewer.loadPlanet('Sirius'));
    await expect(page.locator('#planet-name')).toHaveText('SIRIUS');
    await expect(page.locator('#planet-surface')).toHaveText('Not rendered');
    expect(await page.evaluate(() => window.viewer.currentPlanet)).toBeNull();
    expect(failures).toEqual([]);
  });

  test('database publishes the nearby evidence registry without visitor-time NASA requests', async ({ page }) => {
    const failures = collectFailures(page);
    const externalScienceRequests = [];
    page.on('request', request => {
      if (/exoplanetarchive\.ipac\.caltech\.edu\/(?:TAP|cgi-bin)/i.test(request.url())) externalScienceRequests.push(request.url());
    });
    await page.goto('/database.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#atmosphere-catalog-panel')).toBeVisible();
    await expect(page.locator('#atmosphere-catalog-list .atmosphere-model-card').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#atmosphere-catalog-summary')).toContainText(/systems.*planets/i);
    const registryLayout = await page.evaluate(() => {
      const panel = document.getElementById('atmosphere-catalog-panel').getBoundingClientRect();
      const player = document.getElementById('cosmic-music-player')?.getBoundingClientRect();
      return {
        separatedFromPlayerRail: player ? panel.right <= player.left + 1 : true
      };
    });
    expect(registryLayout.separatedFromPlayerRail).toBe(true);
    const totals = await page.evaluate(() => ({
      systems: window.__exoplanetAtmosphereCatalog?.systems?.length || 0,
      planets: window.__exoplanetAtmosphereCatalog?.systems?.reduce((sum, system) => sum + (system.planets?.length || 0), 0) || 0
    }));
    expect(totals.systems).toBeGreaterThanOrEqual(200);
    expect(totals.planets).toBeGreaterThanOrEqual(350);
    const barnardCard = page.locator('.atmosphere-model-card', { hasText: 'Barnard b' }).first();
    await expect(barnardCard).toBeVisible();
    await expect(barnardCard).toContainText(/No atmospheric spectrum|None in snapshot/i);
    await expect(barnardCard.getByRole('link', { name: 'Open in Planetary OS' })).toHaveAttribute('href', /education\.html\?target=Barnard%20b/);
    await page.locator('#atmosphere-catalog-filter').selectOption('spectra');
    await expect(page.locator('#atmosphere-catalog-list .atmosphere-model-card').first()).toBeVisible();
    expect(externalScienceRequests).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('keeps the evidence controls readable and inside a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/education.html?target=Barnard%20b', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.viewer?.planetMesh?.userData?.surfaceImage?.proceduralTexture === true, null, { timeout: 30_000 });
    const floatingOverlaps = await page.evaluate(() => {
      const overlay = document.getElementById('data-overlay').getBoundingClientRect();
      const intersects = selector => {
        const node = document.querySelector(selector);
        if (!node) return false;
        const rect = node.getBoundingClientRect();
        return !(overlay.right <= rect.left || overlay.left >= rect.right || overlay.bottom <= rect.top || overlay.top >= rect.bottom);
      };
      return {
        language: intersects('body > .ita-language-switcher'),
        theme: intersects('#theme-toggle-container'),
        player: intersects('#cosmic-music-player')
      };
    });
    expect(floatingOverlaps).toEqual({ language: false, theme: false, player: false });
    await page.locator('#education-menu-toggle').click();
    await expect(page.locator('#ui-sidebar')).toHaveClass(/active/);
    await page.locator('#education-world-select').scrollIntoViewIfNeeded();
    await expect(page.locator('#education-world-select')).toBeInViewport();
    const geometry = await page.evaluate(() => {
      const overlay = document.getElementById('data-overlay').getBoundingClientRect();
      const select = document.getElementById('education-world-select').getBoundingClientRect();
      return {
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        overlay: { left: overlay.left, right: overlay.right, width: overlay.width },
        select: { left: select.left, right: select.right, height: select.height }
      };
    });
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.overlay.left).toBeGreaterThanOrEqual(0);
    expect(geometry.overlay.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.select.left).toBeGreaterThanOrEqual(0);
    expect(geometry.select.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.select.height).toBeGreaterThanOrEqual(40);
  });
});
