import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const waitEvidence = async (page, name) => {
    await expect(page.locator('#planet-3d-title')).toHaveText(name, { timeout: 30000 });
    await expect(page.locator('#engine-mode')).not.toHaveText('Checking the evidence');
};
async function open(page, id, name = id, extra = '') {
    await page.goto(`/database.html?engine=${id}${extra}`, { waitUntil: 'domcontentloaded' });
    await waitEvidence(page, name);
}

test('the original card action opens the correct sibling with source-backed partial constraints', async ({
    page,
}) => {
    const graphics = [];
    page.on('request', (r) => {
        if (/three\.webgpu|terrain-worker|\/renderer\.js/.test(r.url())) graphics.push(r.url());
    });
    await page.goto('/database.html?q=Kepler-227');
    const trigger = page
        .locator('.planet-card[data-record-id="K00752.02"]')
        .getByRole('button', { name: 'View in 3D' });
    await trigger.click();
    await waitEvidence(page, 'Kepler-227 c');
    await expect(page.locator('#engine-mode')).toHaveText('Partially constrained view');
    await expect(page.locator('#engine-panel-evidence')).toContainText('3.04 R⊕');
    await expect(page.locator('#engine-panel-evidence')).toContainText('True mass');
    expect(graphics).toEqual([]);
    await expect(
        page
            .locator('#engine-panel-evidence')
            .getByRole('link', { name: 'NASA Exoplanet Archive — Planetary Systems', exact: true })
    ).toHaveAttribute('href', /pl_name/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#planet-3d-modal')).toHaveCount(0);
    await expect(trigger).toBeFocused();
});

test('F01–F03/F21: real sparse candidate has a usable schematic and no inappropriate generation', async ({
    page,
}, testInfo) => {
    const inappropriate = [];
    page.on('request', (r) => {
        if (
            /three\.webgpu|terrain-worker|\/renderer\.js|CIE_xyz|\/assets\/[a-f0-9]+\.csv/.test(
                r.url()
            )
        )
            inappropriate.push(r.url());
    });
    await open(page, 'K00129.02');
    await expect(page.locator('.engine-status')).toHaveText('candidate');
    await expect(page.locator('#engine-mode')).toContainText('Appearance unknown');
    await expect(page.locator('#engine-disclosure-text')).toContainText('Not to scale');
    await expect(page.locator('#engine-panel-evidence')).toContainText('143.21 days');
    await expect(page.getByRole('button', { name: 'Near surface', exact: true })).toBeDisabled();
    expect(inappropriate).toEqual([]);
    const state = await page.evaluate(() => ({
        radius: window.planet3DViewer.context.packet.physicalRadiusMetres,
        recipe: window.planet3DViewer.context.packet.recipeId,
        mode: window.planet3DViewer.context.packet.decision.mode,
    }));
    expect(state).toEqual({ radius: null, recipe: null, mode: 'identity_placeholder' });
    await page.locator('#canvas-container').focus();
    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'Reset view', exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath('real-sparse-candidate.png') });
});

test('F06/F07: published NIRISS data are plotted with provenance instead of interpreted as visible RGB', async ({
    page,
}) => {
    await open(page, 'nea-wasp-39-b', 'WASP-39 b');
    await page.getByRole('tab', { name: 'Observations', exact: true }).click();
    const panel = page.locator('#engine-panel-observations');
    await expect(panel).toContainText('263 published bins');
    await expect(panel.locator('svg circle')).toHaveCount(263);
    await expect(panel).toContainText('do not measure human-visible reflected colour');
    await expect(panel).toContainText('abundance not imported');
    await expect(
        panel.getByRole('link', { name: 'Pinned publication data and methods' })
    ).toHaveAttribute('href', /0608071e1e70ec7ff12707774ea03ace4b52ea85/);
});

test('F08/F14: alternate parameter solutions remain separate and preserve the reviewed object status', async ({
    page,
}) => {
    await open(page, 'K00752.01', 'Kepler-227 b');
    await page.getByRole('tab', { name: 'Appearance', exact: true }).click();
    const set = page.getByRole('combobox', { name: 'Published parameter solution' });
    await set.selectOption({ label: 'Kepler cumulative transit solution' });
    await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
    await expect(page.locator('#engine-panel-evidence')).toContainText('2.26 R⊕');
    await expect(page.locator('#engine-panel-evidence')).toContainText('793 K');
    await expect(page.locator('.engine-status')).toHaveText('confirmed');
    await page.getByRole('tab', { name: 'Appearance', exact: true }).click();
    const url = await page.locator('#engine-share-url').inputValue();
    expect(url).toContain('solution=');
    await page.goto(url);
    await waitEvidence(page, 'Kepler-227 b');
    await expect(page.locator('#engine-panel-evidence')).toContainText('2.26 R⊕');
});

test('F11: a verified cached release remains usable when refresh fails', async ({ page }) => {
    await open(page, 'K00129.02');
    await page.route('**/data/exoplanet-engine/**', (route) => route.abort('failed'));
    await page.evaluate(async () => {
        await window.planet3DViewer.loadObject('K00129.02');
    });
    await expect(page.locator('#engine-panel-evidence')).toContainText('compatible cached release');
    await expect(page.locator('.engine-status')).toHaveText('candidate');
    await expect(
        page
            .locator('#engine-panel-evidence')
            .getByRole('link', { name: 'Kepler Objects of Interest — Cumulative Table' })
    ).toBeVisible();
});

test('F12/F22: a damaged packet produces an integrity state without invented science', async ({
    page,
}) => {
    await page.route('**/packets/*.json', async (route) => {
        const response = await route.fetch();
        const body = await response.json();
        body.evidence.object.canonicalName = 'Tampered identity';
        await route.fulfill({ response, json: body });
    });
    await page.goto('/database.html?engine=K00129.02');
    await expect(page.locator('#engine-mode')).toHaveText('Evidence unavailable', {
        timeout: 30000,
    });
    await expect(page.locator('#engine-panel-evidence')).toContainText('hash mismatch');
    await expect(page.locator('#engine-disclosure-text')).toContainText('loading/integrity');
    expect(await page.evaluate(() => window.planet3DViewer.context)).toBe(null);
});

test('F19: closing a pending source request prevents a stale scene from returning', async ({
    page,
}) => {
    let release;
    const pending = new Promise((resolve) => {
        release = resolve;
    });
    await page.route('**/packets/*.json', async (route) => {
        await pending;
        await route.continue();
    });
    try {
        await page.goto('/database.html?engine=K00129.02');
        await expect(page.locator('#close-3d-btn')).toBeVisible();
        await page.locator('#close-3d-btn').click();
        release();
        await expect(page.locator('#planet-3d-modal')).toHaveCount(0);
        await page.waitForTimeout(150);
        expect(await page.evaluate(() => window.planet3DViewer.isOpen)).toBe(false);
    } finally {
        release();
    }
});

test('F21: evidence and disclosures remain accessible on desktop and phone', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const viewport of [
        { width: 1280, height: 800 },
        { width: 390, height: 844 },
    ]) {
        await page.setViewportSize(viewport);
        await open(page, 'K00129.02');
        const result = await new AxeBuilder({ page })
            .include('#planet-3d-modal')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
        expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
        expect(
            await page
                .locator('#planet-3d-modal')
                .evaluate((e) => e.scrollWidth <= e.clientWidth + 1)
        ).toBe(true);
        await page.getByRole('tab', { name: 'Appearance', exact: true }).focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('tab', { name: 'Observations', exact: true })).toHaveAttribute(
            'aria-selected',
            'true'
        );
        await page.keyboard.press('Escape');
        await expect(page.locator('#planet-3d-modal')).toHaveCount(0);
    }
});

test.describe('bounded software-renderer functional checks', () => {
    test.use({ viewport: { width: 640, height: 480 }, deviceScaleFactor: 0.25 });
    test('F15/F16/F18/F20: WebGL2 renders rocky and gas scenarios with valid navigation boundaries', async ({
        page,
    }, testInfo) => {
        test.setTimeout(180000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => {
            if (m.type() === 'error' && /shader|WebGL|pipeline|NaN/i.test(m.text()))
                errors.push(m.text());
        });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await open(
            page,
            'K00752.01',
            'Kepler-227 b',
            '&scenario=airless-rocky&backend=webgl2&quality=Low'
        );
        await page.waitForFunction(
            () => window.planet3DViewer?.renderer?.ready,
            {},
            { timeout: 60000 }
        );
        const before = await page.evaluate(() => ({
            id: window.planet3DViewer.recipe.id,
            status: window.planet3DViewer.context.evidence.object.existence.status,
            backend: window.planet3DViewer.renderer.backend,
            atmosphere: window.planet3DViewer.recipe.atmosphere.pressurePa,
            terrainLevel: window.planet3DViewer.renderer.terrain.diagnostics().maximumLevel,
        }));
        expect(before.backend).toBe('WebGL2');
        expect(before.atmosphere).toBe(0);
        await page.getByRole('button', { name: 'Near surface', exact: true }).click();
        await page.waitForFunction(
            (level) => window.planet3DViewer.renderer.terrain.diagnostics().maximumLevel > level,
            before.terrainLevel,
            { timeout: 60000 }
        );
        const terrain = await page.evaluate(() =>
            window.planet3DViewer.renderer.terrain.diagnostics()
        );
        expect(terrain.residentTiles).toBeLessThanOrEqual(120);
        expect(terrain.pendingTiles).toBeLessThanOrEqual(8);
        await page.waitForFunction(
            () =>
                window.planet3DViewer.renderer.settleFrames <= 0 &&
                window.planet3DViewer.renderer.terrain.pending.size === 0,
            {},
            { timeout: 60000 }
        );
        const orientation = await page.evaluate(async () => {
            const source = await window.planet3DViewer.renderer.captureCanvas(),
                c = document.createElement('canvas');
            c.width = source.width;
            c.height = source.height;
            const g = c.getContext('2d');
            g.drawImage(source, 0, 0);
            const sample = (y) => {
                const p = g.getImageData(
                    Math.floor(c.width / 2),
                    Math.floor(c.height * y),
                    1,
                    1
                ).data;
                return p[0] + p[1] + p[2];
            };
            return { sky: sample(0.2), ground: sample(0.8) };
        });
        expect(orientation.ground).toBeGreaterThan(orientation.sky + 15);
        const settled = await page.evaluate(() => window.planet3DViewer.renderer.frame);
        await page.waitForTimeout(150);
        expect(await page.evaluate(() => window.planet3DViewer.renderer.frame)).toBe(settled);
        await page.getByRole('button', { name: 'Reset view', exact: true }).click();
        await page.locator('#engine-quality').selectOption('Medium');
        expect(await page.evaluate(() => window.planet3DViewer.recipe.id)).toBe(before.id);
        await page.screenshot({ path: testInfo.outputPath('rocky-webgl2-functional.png') });
        // Restore the declared software functional preset after exercising quality changes.
        await page.locator('#engine-quality').selectOption('Low');
        await page.getByRole('tab', { name: 'Appearance', exact: true }).click();
        await page.locator('#engine-scenario').selectOption('volatile-rich');
        await page.waitForFunction(
            () =>
                window.planet3DViewer?.renderer?.ready &&
                window.planet3DViewer.renderer.frame > 2 &&
                window.planet3DViewer.recipe.family === 'volatile-rich',
            {},
            { timeout: 60000 }
        );
        await expect(
            page.getByRole('button', { name: 'Near surface', exact: true })
        ).toBeDisabled();
        expect(await page.evaluate(() => window.planet3DViewer.recipe.solidSurface)).toBe(false);
        expect(
            await page.evaluate(
                () => window.planet3DViewer.renderer.diagnostics().compatibilityLayers
            )
        ).toEqual(['clouds', 'atmosphere']);
        expect(errors).toEqual([]);
        await testInfo.attach('gas-functional-diagnostics', {
            body: JSON.stringify(
                await page.evaluate(() => window.planet3DViewer.renderer.diagnostics()),
                null,
                2
            ),
            contentType: 'application/json',
        });
        await page.screenshot({ path: testInfo.outputPath('gas-webgl2-functional.png') });
    });
    test('F17/F21: sandbox opt-in, replay seeds and capture metadata retain the speculative label', async ({
        page,
    }) => {
        test.setTimeout(120000);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await open(page, 'K00129.02', undefined, '&backend=webgl2&quality=Low');
        await page.getByRole('tab', { name: 'Appearance', exact: true }).click();
        await page.locator('#engine-scenario').selectOption('sandbox');
        await expect(page.locator('#engine-mode')).toHaveText('Speculative example');
        await page.waitForFunction(
            () => window.planet3DViewer?.renderer?.ready,
            {},
            { timeout: 60000 }
        );
        const before = await page.evaluate(() =>
            JSON.stringify(window.planet3DViewer.context.evidence)
        );
        await page
            .getByRole('spinbutton', { name: 'Assumed reference temperature (K)', exact: true })
            .fill('850');
        await page
            .getByRole('spinbutton', { name: 'Assumed gravity (m/s²)', exact: true })
            .fill('6.5');
        await page.getByRole('button', { name: 'Apply hypothesis', exact: true }).click();
        await page.waitForFunction(
            () =>
                window.planet3DViewer?.renderer?.ready &&
                window.planet3DViewer.recipe.referenceTemperature === 850
        );
        const replay = await page.evaluate(() => ({
            url: window.planet3DViewer.shareURL(),
            recipe: window.planet3DViewer.recipe.id,
        }));
        await page.goto(replay.url);
        await page.waitForFunction(() => window.planet3DViewer?.renderer?.ready);
        expect(await page.evaluate(() => window.planet3DViewer.recipe.id)).toBe(replay.recipe);
        expect(await page.evaluate(() => window.planet3DViewer.recipe.referenceGravity)).toBe(6.5);
        await page.getByRole('tab', { name: 'Appearance', exact: true }).click();
        const downloads = [];
        page.on('download', (d) => downloads.push(d));
        await page.locator('#engine-capture').click();
        await expect.poll(() => downloads.length).toBe(2);
        const sidecar = downloads.find((d) => d.suggestedFilename().endsWith('.json'));
        const stream = await sidecar.createReadStream();
        const buffers = [];
        for await (const chunk of stream) buffers.push(chunk);
        const metadata = JSON.parse(Buffer.concat(buffers).toString());
        expect(metadata.decision.mode).toBe('speculative_sandbox');
        expect(metadata.object.existence.status).toBe('candidate');
        expect(metadata.recipe.assumptions.length).toBeGreaterThan(3);
        await page.locator('#engine-scenario').selectOption('schematic');
        await expect(page.locator('#engine-mode')).toContainText('Appearance unknown');
        expect(
            await page.evaluate(() => JSON.stringify(window.planet3DViewer.context.evidence))
        ).toBe(before);
    });
    test('F18: GPU failure keeps scientific classification, assumptions and citations usable', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
            const original = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (type, ...args) {
                if (['webgl', 'webgl2', 'experimental-webgl', 'webgpu'].includes(type)) return null;
                return original.call(this, type, ...args);
            };
        });
        await open(page, 'K00752.01', 'Kepler-227 b', '&scenario=airless-rocky&quality=Low');
        await expect(page.locator('#engine-scene-notice')).toContainText('Graphics unavailable', {
            timeout: 30000,
        });
        await expect(page.locator('#engine-mode')).toHaveText('Partially constrained view');
        await expect(page.locator('.engine-status')).toHaveText('confirmed');
        await expect(
            page.locator('#engine-panel-evidence').getByRole('link', {
                name: 'NASA Exoplanet Archive — Planetary Systems',
                exact: true,
            })
        ).toBeVisible();
    });
    test('liquid and terrain use compatible curved depth on WebGL2', async ({ page }, testInfo) => {
        test.setTimeout(90000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await open(
            page,
            'nea-trappist-1-e',
            'TRAPPIST-1 e',
            '&scenario=ocean&backend=webgl2&quality=Low'
        );
        await page.waitForFunction(
            () =>
                window.planet3DViewer?.renderer?.ready && window.planet3DViewer.renderer.frame > 2,
            {},
            { timeout: 60000 }
        );
        const state = await page.evaluate(async () => {
            const v = window.planet3DViewer;
            await v.renderer.captureCanvas();
            return {
                liquid: v.recipe.liquid,
                terrainDepth: Boolean(v.renderer.material.depthNode),
                liquidDepth: Boolean(v.renderer.liquid.material.depthNode),
                status: v.context.evidence.object.existence.status,
            };
        });
        expect(state).toEqual({
            liquid: 'liquid water',
            terrainDepth: true,
            liquidDepth: true,
            status: 'confirmed',
        });
        expect(errors).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath('ocean-webgl2.png') });
        await page.getByRole('button', { name: 'System context', exact: true }).click();
        const shared = await page.evaluate(() => window.planet3DViewer.shareURL());
        expect(new URL(shared).searchParams.get('frame')).toBe('system');
        await page.goto(shared);
        await page.waitForFunction(
            () =>
                window.planet3DViewer?.renderer?.ready && window.planet3DViewer.renderer.systemMode,
            {},
            { timeout: 60000 }
        );
        expect(
            await page.evaluate(() => window.planet3DViewer.renderer.diagnostics().coordinateFrame)
        ).toContain('System AU frame');
    });
});
