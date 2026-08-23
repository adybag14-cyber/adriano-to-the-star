import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

const PLANETS = [
    ['Mercury', 'images/textures/mercury.jpg'],
    ['Venus', 'images/textures/venus.jpg'],
    ['Earth', 'images/textures/earth-blue-marble-2048.jpg'],
    ['Mars', 'images/textures/mars.jpg'],
    ['Jupiter', 'images/textures/jupiter.jpg'],
    ['Saturn', 'images/textures/saturn.jpg'],
    ['Uranus', 'images/textures/uranus.jpg'],
    ['Neptune', 'images/textures/neptune.jpg']
];

test.describe('Education planet surface regression', () => {
    test('keeps local planet imagery rendered across normal planet switching', async ({ page }) => {
        const consoleErrors = [];
        const pageErrors = [];
        const localFailures = [];
        const localBadResponses = [];

        page.on('console', (message) => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('pageerror', (error) => pageErrors.push(String(error)));
        page.on('requestfailed', (request) => {
            if (request.url().startsWith(BASE_URL)) {
                localFailures.push(`${request.url()} ${request.failure()?.errorText || ''}`);
            }
        });
        page.on('response', (response) => {
            if (response.url().startsWith(BASE_URL) && response.status() >= 400) {
                localBadResponses.push(`${response.status()} ${response.url()}`);
            }
        });

        await page.goto(`${BASE_URL}/education.html?textureRegression=1`, {
            waitUntil: 'domcontentloaded',
            timeout: 45_000
        });

        await page.waitForFunction(() => Boolean(window.viewer?.planetMesh), null, { timeout: 20_000 });
        await page.waitForFunction(
            () => window.viewer?.currentPlanet === 'Earth' && Boolean(window.viewer?.planetMesh?.userData?.surfaceImage),
            null,
            { timeout: 30_000 }
        );

        for (const [planet, expectedSource] of PLANETS) {
            await page.evaluate(name => window.viewer.loadPlanet(name), planet);

            await page.waitForFunction(
                (name) => window.viewer?.currentPlanet === name && Boolean(window.viewer?.planetMesh?.userData?.surfaceImage),
                planet,
                { timeout: 30_000 }
            );
            await page.waitForTimeout(1_000);

            const state = await page.evaluate(() => {
                const viewer = window.viewer;
                const mesh = viewer.planetMesh;
                const meta = mesh.userData.surfaceImage;
                return {
                    active: viewer.active,
                    contextLost: viewer.renderer.getContext().isContextLost(),
                    source: meta?.src || '',
                    sourceWidth: meta?.width || 0,
                    sourceHeight: meta?.height || 0,
                    nativeTexture: meta?.nativeTexture === true,
                    hasTextureMap: Boolean(mesh.material.map),
                    anisotropy: meta?.anisotropy || 0,
                    hasAtmosphere: viewer.currentPlanet !== 'Earth' || Boolean(viewer.atmosphereMesh),
                    hasClouds: viewer.currentPlanet !== 'Earth' || Boolean(viewer.cloudMesh),
                    drawCalls: viewer.renderer.info.render.calls,
                    triangles: viewer.renderer.info.render.triangles
                };
            });

            expect(state.active).toBe(true);
            expect(state.contextLost).toBe(false);
            expect(state.source).toContain(expectedSource);
            expect(state.sourceWidth).toBeGreaterThan(64);
            expect(state.sourceHeight).toBeGreaterThan(64);
            expect(state.nativeTexture).toBe(true);
            expect(state.hasTextureMap).toBe(true);
            expect(state.anisotropy).toBeGreaterThan(0);
            expect(state.hasAtmosphere).toBe(true);
            expect(state.hasClouds).toBe(true);
            expect(state.drawCalls).toBeGreaterThan(0);
            expect(state.triangles).toBeGreaterThan(10_000);
        }

        expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
        expect(pageErrors, pageErrors.join('\n')).toEqual([]);
        expect(localFailures, localFailures.join('\n')).toEqual([]);
        expect(localBadResponses, localBadResponses.join('\n')).toEqual([]);
    });
});
