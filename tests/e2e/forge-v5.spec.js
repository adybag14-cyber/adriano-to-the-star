import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const forceCPU = (page) =>
    page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            return /webgl/i.test(type) ? null : getContext.call(this, type, ...args);
        };
    });
const errors = (page) => {
    const found = [];
    page.on('pageerror', (error) => found.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') found.push(message.text());
    });
    return found;
};

test('Forge V5 compiles its GPU pipeline and refines close views without shader errors', async ({
    page,
}) => {
    test.setTimeout(120_000);
    // Bounded software-rasterizer workload; the actual shader pipeline and LOD
    // remain enabled. Native-resolution visual/performance QA is independent.
    await page.setViewportSize({ width: 600, height: 360 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const failures = errors(page);
    await page.goto('/experimental/procedural-planets/index.html');
    await page.waitForFunction(() => window.planetForgeV5?.frames > 0);
    expect(await page.evaluate(() => window.planetForgeV5.mode)).toBe('webgl2');
    await expect(page.getByRole('button', { name: 'Resume rotation', exact: true })).toBeVisible();
    const orbital = await page.evaluate(() => window.planetForgeV5.terrain.stats.maxLevel);
    await page.evaluate(() => {
        const forge = window.planetForgeV5;
        forge.camera.position.set(0, 0.1, 1.045);
        forge.controls.update();
        forge.request();
    });
    await page.waitForFunction(
        (level) =>
            window.planetForgeV5.terrain.stats.maxLevel > level &&
            !window.planetForgeV5.terrain.stats.pendingRefinement,
        orbital
    );
    expect(
        await page.evaluate(() => window.planetForgeV5.terrain.stats.allocatedTiles)
    ).toBeLessThanOrEqual(454);
    await page.getByRole('button', { name: 'Reset camera', exact: true }).click();
    await page.getByRole('combobox', { name: 'Planet type' }).selectOption('gas');
    expect(
        await page.evaluate(() => ({
            gas: window.planetForgeV5.uniforms.uGas.value,
            clouds: window.planetForgeV5.clouds.visible,
        }))
    ).toEqual({ gas: 1, clouds: false });
    await page.getByRole('combobox', { name: 'Planet type' }).selectOption('terran');
    await page.getByRole('button', { name: 'Face the daylight', exact: true }).click();
    expect(await page.evaluate(() => window.planetForgeV5.params.day)).toBe(true);
    expect(await page.evaluate(() => window.planetForgeV5.renderer.getContext().getError())).toBe(
        0
    );
    expect(failures).toEqual([]);
});

test('Forge compatibility controls respond and respect reduced motion', async ({ page }) => {
    const failures = errors(page);
    await forceCPU(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/experimental/procedural-planets/index.html');
    await expect(page.locator('#canvas-container')).toHaveAttribute('data-surface-ready', 'true');
    await expect(page.getByRole('button', { name: 'Resume rotation' })).toBeVisible();
    await expect(
        page.getByRole('checkbox', { name: 'Fictional settlement lights' })
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Face the daylight' }).click();
    await page.locator('#roughness').fill('3');
    await expect
        .poll(() => page.evaluate(() => window.planetForgeV5.cpu.generation))
        .toBeGreaterThan(1);
    await expect(page.locator('#canvas-container')).toHaveAttribute('data-surface-ready', 'true');
    expect(await page.evaluate(() => window.planetForgeV5.params.scale)).toBe(3);
    await page.getByRole('button', { name: 'Resume rotation' }).click();
    expect(await page.evaluate(() => window.planetForgeV5.playing)).toBe(true);
    expect(failures).toEqual([]);
});

test('Nebula uses persistent 32-bit fields, functional quality settings and pause', async ({
    page,
}) => {
    await page.setViewportSize({ width: 600, height: 360 });
    const failures = errors(page);
    await page.goto('/experimental/fluid-nebula/index.html');
    await page.waitForFunction(() => window.fluidNebulaV5?.time > 0.1);
    expect(await page.evaluate(() => window.fluidNebulaV5.mode)).toBe('webgl2');
    await page.getByRole('button', { name: 'Pause simulation' }).click();
    const time = await page.evaluate(() => window.fluidNebulaV5.time);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.fluidNebulaV5.time)).toBe(time);
    await page.getByRole('combobox', { name: 'Simulation detail' }).selectOption('balanced');
    const state = await page.evaluate(() => window.fluidNebulaV5.diagnostics());
    expect(state.statePrecision).toBe(32);
    expect(state.grid[0]).toBe(384);
    expect(state.density.invalid).toBe(0);
    expect(state.density.mean).toBeGreaterThan(0.01);
    expect(state.velocity.invalid).toBe(0);
    await page.getByRole('combobox', { name: 'Emission palette' }).selectOption('0');
    expect(await page.evaluate(() => window.fluidNebulaV5.params.palette)).toBe(0);
    expect(await page.evaluate(() => window.fluidNebulaV5.gl.getError())).toBe(0);
    expect(failures).toEqual([]);
});

test('Nebula CPU solver remains interactive with WebGL disabled', async ({ page }) => {
    const failures = errors(page);
    await forceCPU(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/experimental/fluid-nebula/index.html');
    await expect(page.locator('#nebula')).toHaveAttribute('data-renderer', 'cpu-fluid-v5');
    await page.getByRole('button', { name: 'Resume simulation' }).click();
    await expect.poll(() => page.evaluate(() => window.fluidNebulaV5.time)).toBeGreaterThan(0.1);
    await page.getByRole('button', { name: 'Pause simulation' }).click();
    await page.getByRole('combobox', { name: 'Simulation detail' }).selectOption('balanced');
    await page.getByRole('button', { name: 'Reset field' }).click();
    await page.getByRole('button', { name: 'Resume simulation' }).click();
    await expect(page.locator('#nebula-telemetry')).toContainText('96 ×');
    expect(failures).toEqual([]);
});

test('registry previews distinguish spectrum-linked models from explicit unknowns', async ({
    page,
}) => {
    const failures = errors(page);
    await page.goto('/database.html');
    await page.locator('.atmosphere-catalog-toggle').click();
    await page.locator('#atmosphere-catalog-search').fill('Proxima Cen b');
    const generic = page.locator('.atmosphere-model-preview').first();
    await generic.scrollIntoViewIfNeeded();
    await expect(generic).toHaveAttribute('data-preview-kind', 'generic');
    await expect(generic.locator('img')).toHaveCount(0);
    await page.locator('#atmosphere-catalog-search').fill('');
    await page.locator('#atmosphere-catalog-filter').selectOption('spectra');
    const measured = page.locator('.atmosphere-model-preview').first();
    await measured.scrollIntoViewIfNeeded();
    await expect(measured).toHaveAttribute('data-preview-kind', 'spectrum-linked');
    await expect(measured).toHaveAttribute('data-model-version', 'ita-planetary-appearance-v1');
    expect(
        await measured.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0)
    ).toBe(true);
    const layout = await page
        .locator('#atmosphere-catalog-panel')
        .evaluate((node) => ({
            maxHeight: getComputedStyle(node).maxHeight,
            overflow: getComputedStyle(node).overflowY,
        }));
    expect(layout).toEqual({ maxHeight: 'none', overflow: 'visible' });
    expect(failures).toEqual([]);
});

test('content pages keep the homepage navigation on desktop and phone, immersive tools stay exempt', async ({
    page,
}) => {
    for (const route of ['/', '/database.html', '/projects.html', '/about.html', '/privacy.html']) {
        await page.goto(route);
        const header = page.locator('[data-shared-site-header="home-v1"]');
        await expect(header).toHaveCount(1);
        await expect(header.getByRole('link', { name: 'Begin exploration' })).toBeVisible();
        await expect(header.locator('.ita-language-switcher')).toHaveCount(1);
        await page.setViewportSize({ width: 390, height: 844 });
        await header.locator('.mobile-menu summary').click();
        await expect(
            header.getByRole('button', { name: /Menu: open systems atlas/ })
        ).toBeVisible();
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
        ).toBe(true);
        await page.setViewportSize({ width: 1280, height: 720 });
    }
    for (const route of [
        '/education.html',
        '/experimental/procedural-planets/index.html',
        '/experimental/fluid-nebula/index.html',
    ]) {
        await page.goto(route);
        await expect(page.locator('[data-shared-site-header]')).toHaveCount(0);
    }
});

test('indexable V5 labs and the database publish appropriate search metadata', async ({
    page,
    request,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 600, height: 360 });
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const route of [
        '/experimental/procedural-planets/index.html',
        '/experimental/fluid-nebula/index.html',
    ]) {
        await page.goto(route);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
            'content',
            /^index,\s*follow/
        );
        expect(sitemap).toContain(`https://adrianotothestar.com${route}`);
        const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
        expect(
            schema
                .map((text) => JSON.parse(text))
                .some(
                    (value) => value['@type'] === 'WebApplication' && value.softwareVersion === '5'
                )
        ).toBe(true);
    }
    await page.goto('/database.html');
    const dataset = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((nodes) =>
            nodes
                .map((node) => JSON.parse(node.textContent))
                .find((value) => value['@type'] === 'Dataset')
        );
    expect(dataset.description.length).toBeGreaterThanOrEqual(50);
    expect(dataset.distribution.contentUrl).toBe(
        'https://adrianotothestar.com/data/exoplanet-atmospheres.json'
    );
});

test('V5 lab controls pass desktop and mobile accessibility audits', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const viewport of [
        { width: 960, height: 720 },
        { width: 390, height: 844 },
    ]) {
        await page.setViewportSize(viewport);
        for (const route of [
            '/experimental/procedural-planets/index.html',
            '/experimental/fluid-nebula/index.html',
        ]) {
            await page.goto(route);
            const result = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
                .analyze();
            expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
            expect(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
            ).toBe(true);
        }
    }
});
