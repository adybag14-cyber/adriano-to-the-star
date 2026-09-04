/* global game */
import { test, expect } from '@playwright/test';

async function openLocalSystem(page) {
    if (!(await page.locator('#ep-btn-system').isVisible())) await page.locator('#ep-btn-ops').click();
    await page.locator('#ep-btn-system').click();
}

test.describe('Pioneer streamed universe player outcomes', () => {
    test.setTimeout(120000);
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('ep_tutorial_complete_v1', '1'));
        await page.goto('/exoplanet-pioneer.html', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.game?.planetMesh && window.game?.universe?.streaming && window.game.localSystemExplorer, null, { timeout: 60000 });
        const tutorial = page.locator('#ep-tutorial-skip');
        if (await tutorial.isVisible()) await tutorial.click();
        // An expedition provisioning fixture keeps this focused on travel and persistence, not resource production time.
        await page.evaluate(() => {
            game.setTimeSpeed(0, { silent: true });
            Object.assign(game.resources, { energy: 100000, credits: 100000, data: 10000 });
            game.updateResourceUI();
        });
    });

    test('coordinate route travels, local transfer replaces the 3D world, and returning restores the saved world', async ({ page }, testInfo) => {
        const failures = [];
        page.on('pageerror', (error) => failures.push(error.message));
        await page.locator('#ep-btn-galaxy').click();
        await page.locator('#ep-galaxy-address').fill('2,2,0');
        await page.locator('#ep-galaxy-navigation button[type="submit"]').click();
        await expect(page.locator('#ep-star-details')).toContainText('2,2_0');
        await page.locator('[data-galaxy-action="route"]').click();
        await expect(page.locator('#ep-galaxy-route-jump')).toBeEnabled();
        await page.screenshot({ path: testInfo.outputPath('coordinate-route.png') });
        await page.locator('#ep-galaxy-route-jump').click();
        await expect.poll(() => page.evaluate(() => game.currentSystemId)).toBe('star_2,2_0');
        await page.locator('[data-galaxy-action="close"]').click();
        const before = await page.evaluate(() => ({ seed: game.currentWorldSeed, mesh: game.planetMesh.uuid, name: game.universe.getCurrentStar().name, energy: game.resources.energy }));
        await openLocalSystem(page);
        await expect(page.locator('#ep-local-system-modal')).toContainText(before.name);
        await expect(page.locator('#ep-local-system-modal')).not.toContainText('Kepler-186 System');
        await page.screenshot({ path: testInfo.outputPath('generated-local-system.png') });
        await page.locator('#ep-local-system-body').selectOption('star_2,2_0_planet_1');
        await page.locator('[data-local-system-action="survey"]').click();
        await page.locator('[data-local-system-action="visit"]').click();
        await expect(page.locator('#ep-local-system-modal')).toBeHidden();
        await expect.poll(() => page.evaluate(() => game.currentSystemId)).toBe('star_2,2_0_planet_1');
        const after = await page.evaluate(() => ({ seed: game.currentWorldSeed, mesh: game.planetMesh.uuid, host: game.universe.getCurrentStar().id, savedPrimary: game.systemStates['star_2,2_0']?.tiles?.length, energy: game.resources.energy }));
        expect(after.seed).not.toBe(before.seed);
        expect(after.mesh).not.toBe(before.mesh);
        expect(after.host).toBe('star_2,2_0');
        expect(after.savedPrimary).toBe(1000);
        expect(after.energy).toBeLessThan(before.energy);
        await page.screenshot({ path: testInfo.outputPath('transferred-world.png') });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.game?.currentSystemId === 'star_2,2_0_planet_1' && game.planetMesh);
        expect(await page.evaluate(() => game.currentWorldSeed)).toBe(after.seed);
        await openLocalSystem(page);
        await page.locator('#ep-local-system-body').selectOption('star_2,2_0');
        await page.locator('[data-local-system-action="visit"]').click();
        await expect.poll(() => page.evaluate(() => game.currentSystemId)).toBe('star_2,2_0');
        expect(await page.evaluate(() => game.currentWorldSeed)).toBe(before.seed);
        expect(await page.evaluate(() => game.systemStates['star_2,2_0_planet_1'].tiles.length)).toBe(1000);
        expect(failures).toEqual([]);
    });

    test('chart home alias preserves the original catalog climate and surface after a roundtrip and reload', async ({ page }) => {
        const captureWorld = async () => page.evaluate(() => {
            const positions = game.planetMesh.geometry.attributes.position.array;
            const indices = Array.from({ length: 19 }, (_, i) => Math.floor((positions.length - 3) * (i + 1) / 20 / 3) * 3);
            return {
                profile: JSON.parse(JSON.stringify(game.planetMesh.userData.terrain.physicalProfile)),
                vertices: indices.flatMap(index => Array.from(positions.slice(index, index + 3))),
                seed: game.currentWorldSeed
            };
        });
        const original = await captureWorld();
        expect(original.profile.provenance).toBe('catalog-constrained');
        await page.locator('#ep-btn-galaxy').click();
        await page.locator('#ep-galaxy-address').fill('2,2,0');
        await page.locator('#ep-galaxy-navigation button[type="submit"]').click();
        await page.locator('[data-galaxy-action="route"]').click();
        await page.locator('#ep-galaxy-route-jump').click();
        await expect.poll(() => page.evaluate(() => game.currentSystemId)).toBe('star_2,2_0');
        await page.locator('[data-galaxy-action="home"]').click();
        await page.locator('[data-galaxy-action="route"]').click();
        await page.locator('#ep-galaxy-route-jump').click();
        await expect.poll(() => page.evaluate(() => game.currentSystemId)).toBe('star_0,0_0');
        expect(await captureWorld()).toEqual(original);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.game?.planetMesh && game.currentSystemId === 'star_0,0_0');
        expect(await captureWorld()).toEqual(original);
    });

    test('legacy distant save returns home through the migration corridor without fuel or losing colony state', async ({ page }, testInfo) => {
        const failures = [];
        page.on('pageerror', (error) => failures.push(error.message));
        const legacyId = 'star_15000,16000_0';
        const before = await page.evaluate((id) => {
            game.saveGame({ silent: true });
            const saved = JSON.parse(localStorage.getItem('ep_save_v2'));
            const legacy = { id, name: 'Legacy Far Colony', seed: 771, type: 'G-Type', discoveryStatus: 'Single', discovered: true, hazards: [], position: { x: 1500000, y: 1600000, z: 0 } };
            saved.currentSystemId = id;
            saved.resources.energy = 0;
            saved.resources.credits = 0;
            saved.systemStates[id] = { ...saved.systemStates.kepler_186f, seed: 771 };
            saved.galaxyState.version = 2;
            delete saved.galaxyState.streaming;
            saved.galaxyState.stars.push(legacy);
            saved.galaxyState.sectors.push('15000,16000');
            game.loadGameData(saved, { silent: true });
            game.tiles[17].reserves = { iron: 731, copper: 43 };
            game.saveGame({ silent: true });
            return { state: JSON.parse(JSON.stringify(game.systemStates[id])), homeSeed: game.systemStates.kepler_186f.seed, mesh: game.planetMesh.uuid };
        }, legacyId);
        expect(await page.evaluate(() => game.currentSystemId)).toBe(legacyId);
        await page.locator('#ep-btn-galaxy').click();
        const recovery = page.getByRole('button', { name: 'Return to home · no fee', exact: true });
        await expect(recovery).toBeVisible();
        await expect(recovery).toBeEnabled();
        await expect(page.locator('[data-galaxy-action="route"]')).toBeDisabled();
        await expect(page.locator('#ep-galaxy-route-status')).toContainText('Legacy save coordinate');
        await page.screenshot({ path: testInfo.outputPath('legacy-recovery-corridor.png') });
        await recovery.click();
        await expect.poll(() => page.evaluate(() => game.currentSystemId)).toBe('star_0,0_0');
        const after = await page.evaluate((id) => ({
            state: JSON.parse(JSON.stringify(game.systemStates[id])),
            saved: JSON.parse(localStorage.getItem('ep_save_v2')).systemStates[id],
            seed: game.currentWorldSeed, mesh: game.planetMesh.uuid,
            energy: game.resources.energy, credits: game.resources.credits,
            retained: game.universe.streaming.describeStar(id)?.name
        }), legacyId);
        expect(after.state).toEqual(before.state);
        expect(after.saved).toEqual(before.state);
        expect(after.seed).toBe(before.homeSeed);
        expect(after.mesh).not.toBe(before.mesh);
        expect(after.energy).toBe(0);
        expect(after.credits).toBe(0);
        expect(after.retained).toBe('Legacy Far Colony');
        await page.locator('#ep-btn-galaxy').click();
        await expect(recovery).toBeHidden();
        expect(failures).toEqual([]);
    });

    test('mobile orbital navigation is keyboard accessible and does not overflow', async ({ page }, testInfo) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openLocalSystem(page);
        const select = page.locator('#ep-local-system-body');
        await expect(select).toHaveValue('kepler_186f');
        await page.locator('#ep-local-system-canvas').focus();
        await page.keyboard.press('ArrowLeft');
        await expect(select).toHaveValue('kepler_186e');
        await expect(page.locator('#ep-local-system-panel')).toContainText('Kepler-186e');
        const bounds = await page.locator('#ep-local-system-modal .ep-modal').evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, width: innerWidth, scroll: element.scrollWidth, client: element.clientWidth };
        });
        expect(bounds.left).toBeGreaterThanOrEqual(-1);
        expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1);
        expect(bounds.scroll).toBeLessThanOrEqual(bounds.client + 1);
        await page.screenshot({ path: testInfo.outputPath('local-system-mobile.png') });
        await page.keyboard.press('Escape');
        await expect(page.locator('#ep-local-system-modal')).toBeHidden();
    });
});
