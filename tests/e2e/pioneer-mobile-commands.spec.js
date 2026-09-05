import { test, expect } from '@playwright/test';
import { installPioneerFunctionalProfile, applyPioneerFunctionalProfile, forceSwiftShader, swiftShaderLaunchOptions } from './helpers/pioneer-functional-profile.js';

if (forceSwiftShader) test.use({ launchOptions: swiftShaderLaunchOptions });
test.use({ actionTimeout: 15_000 });

for (const { width, height } of [{ width: 390, height: 844 }, { width: 320, height: 844 }, { width: 568, height: 518 }]) {
    test(`mobile HUD and More commands work at ${width}x${height}`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width, height });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await installPioneerFunctionalProfile(page);
        await page.goto('/exoplanet-pioneer.html', { waitUntil: 'domcontentloaded' });
        await applyPioneerFunctionalProfile(page);
        await page.waitForFunction(() => window.game?.runtime?.frameCount > 2, null, { timeout: 60_000 });
        if (await page.locator('#ep-tutorial-skip').isVisible()) await page.locator('#ep-tutorial-skip').click();
        await page.getByRole('button', { name: 'Pause', exact: true }).click();

        const bottomTargets = '#ep-build-menu button, #ep-touch-controls button, .ep-back-btn, #ep-btn-cinematic-toggle';
        const assertBottomTargets = async () => {
            const viewport = page.viewportSize();
            const targets = await page.locator(bottomTargets).evaluateAll(nodes => nodes.map(node => {
                const box = node.getBoundingClientRect();
                return { name: node.getAttribute('aria-label') || node.textContent.trim(), x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height,
                    hit: node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)) };
            }));
            for (const target of targets) {
                expect(target.hit, `${target.name} accepts its real center pointer`).toBe(true);
                expect(target.width, target.name).toBeGreaterThanOrEqual(44);
                expect(target.height, target.name).toBeGreaterThanOrEqual(44);
                expect(target.x, target.name).toBeGreaterThanOrEqual(0);
                expect(target.y, target.name).toBeGreaterThanOrEqual(0);
                expect(target.right, target.name).toBeLessThanOrEqual(viewport.width);
                expect(target.bottom, target.name).toBeLessThanOrEqual(viewport.height);
            }
            for (let index = 0; index < targets.length; index += 1) {
                for (const other of targets.slice(index + 1)) {
                    const target = targets[index];
                    expect(target.x < other.right && target.right > other.x && target.y < other.bottom && target.bottom > other.y,
                        `${target.name} must not overlap ${other.name}`).toBe(false);
                }
            }
        };
        await assertBottomTargets();
        for (const [type, name] of [['solar', 'Solar Array'], ['hab', 'Habitat Dome'], ['mine', 'Auto-Miner']]) {
            const button = page.locator(`#ep-build-menu [data-building-type="${type}"]`);
            await button.click();
            await expect(button).toHaveAttribute('aria-pressed', 'true');
            await expect(page.locator('#ep-placement-title')).toContainText(name);
            await expect.poll(() => page.evaluate(() => window.game.selectedInventoryItem)).toBe(type);
            await assertBottomTargets();
            await page.getByRole('button', { name: 'ESC', exact: true }).click();
            await expect(page.locator('#ep-placement-hint')).toBeHidden();
        }
        const cameraState = () => page.evaluate(() => ({
            position: window.game.camera.position.toArray(),
            distance: window.game.camera.position.distanceTo(window.game.controls.target),
            minimum: window.game.controls.minDistance, maximum: window.game.controls.maxDistance
        }));
        for (const name of ['Rotate planet left', 'Rotate planet right', 'Zoom planet camera in', 'Zoom planet camera out']) {
            const before = await cameraState();
            await page.getByRole('button', { name, exact: true }).click();
            await expect.poll(async () => (await cameraState()).position).not.toEqual(before.position);
            const after = await cameraState();
            if (name.endsWith('in')) expect(after.distance).toBeLessThan(before.distance);
            if (name.endsWith('out')) expect(after.distance).toBeGreaterThan(before.distance);
            expect(after.distance).toBeGreaterThanOrEqual(after.minimum - 0.01);
            expect(after.distance).toBeLessThanOrEqual(after.maximum + 0.01);
        }
        const touchSession = await page.context().newCDPSession(page);
        const center = { x: width / 2, y: height > 600 ? height * 0.45 : height * 0.47 };
        const beforePinch = await cameraState();
        const touches = spread => [{ x: center.x - spread, y: center.y, id: 0 }, { x: center.x + spread, y: center.y, id: 1 }];
        await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches(20) });
        for (const spread of [24, 28, 32, 36, 40]) {
            await touchSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(spread) });
        }
        await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(async () => (await cameraState()).distance).toBeLessThan(beforePinch.distance - 1);
        await touchSession.detach();
        await page.screenshot({ path: test.info().outputPath(`bottom-hud-${width}.png`) });

        if (width === 390) {
            // Real rotation preserves the existing touch surface beyond 680px.
            await page.setViewportSize({ width: 844, height: 390 });
            await assertBottomTargets();
            for (const type of ['solar', 'hab', 'mine']) {
                const button = page.locator(`#ep-build-menu [data-building-type="${type}"]`);
                await button.click();
                await expect(button).toHaveAttribute('aria-pressed', 'true');
                await expect.poll(() => page.evaluate(() => window.game.selectedInventoryItem)).toBe(type);
                await assertBottomTargets();
                await page.getByRole('button', { name: 'ESC', exact: true }).click();
            }
            for (const name of ['Rotate planet left', 'Rotate planet right', 'Zoom planet camera in', 'Zoom planet camera out']) {
                const before = await cameraState();
                await page.getByRole('button', { name, exact: true }).click();
                await expect.poll(async () => (await cameraState()).position).not.toEqual(before.position);
                const after = await cameraState();
                if (name.endsWith('in')) expect(after.distance).toBeLessThan(before.distance);
                if (name.endsWith('out')) expect(after.distance).toBeGreaterThan(before.distance);
                expect(after.distance).toBeGreaterThanOrEqual(after.minimum - 0.01);
                expect(after.distance).toBeLessThanOrEqual(after.maximum + 0.01);
            }
            const rotatedSession = await page.context().newCDPSession(page);
            const beforeRotatedPinch = await cameraState();
            const rotatedTouches = spread => [{ x: 422 - spread, y: 132, id: 0 }, { x: 422 + spread, y: 132, id: 1 }];
            await rotatedSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: rotatedTouches(20) });
            for (const spread of [24, 28, 32, 36, 40]) await rotatedSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: rotatedTouches(spread) });
            await rotatedSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await expect.poll(async () => (await cameraState()).distance).toBeLessThan(beforeRotatedPinch.distance - 1);
            await rotatedSession.detach();
            // The compact status rail scrolls; its unique objective action remains real.
            const objective = page.locator('#ep-colony-path-action');
            await objective.scrollIntoViewIfNeeded();
            await objective.click();
            await expect.poll(() => page.evaluate(() => window.game.selectedInventoryItem)).toBe('solar');
            await page.getByRole('button', { name: 'ESC', exact: true }).click();
            await page.screenshot({ path: test.info().outputPath('rotated-bottom-hud-844x390.png') });
            await page.setViewportSize({ width, height });
        }

        const more = page.getByRole('button', { name: 'More operations', exact: true });
        const flight = page.getByRole('region', { name: 'Flight commands', exact: true });
        const drawer = page.locator('#ep-ops-drawer');
        const openFlight = async name => {
            await more.click();
            await expect(more).toHaveAttribute('aria-expanded', 'true');
            await expect(flight).toBeVisible();
            const button = flight.getByRole('button', { name, exact: true });
            await expect(button).toBeVisible();
            const box = await button.boundingBox();
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(width);
            await button.click();
            await expect(drawer).toBeHidden();
            // Combat intentionally hides the entire colony command deck.
            await expect(page.locator('#ep-btn-ops')).toHaveAttribute('aria-expanded', 'false');
        };

        await openFlight('Galaxy View');
        const galaxy = page.locator('#ep-galaxy-map-modal');
        await expect(galaxy).toBeVisible();
        await expect(galaxy.getByRole('heading', { name: 'Galactic Chart' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(galaxy).toBeHidden();
        await expect(more).toBeFocused();

        await openFlight('Agent Missions');
        const missions = page.locator('#ep-missions-modal');
        await expect(missions).toBeVisible();
        await expect(page.locator('#ep-missions-content')).not.toBeEmpty();
        await page.keyboard.press('Escape');
        await expect(missions).toBeHidden();
        await expect(more).toBeFocused();

        await openFlight('Open Mission Control tutorial');
        await expect(page.locator('#ep-tutorial')).toBeVisible();
        await assertBottomTargets();
        await page.locator('#ep-tutorial-next').click();
        await expect(page.locator('#ep-tutorial-progress')).toHaveText('2/7');
        await page.locator('#ep-tutorial-skip').click();
        await expect(page.locator('#ep-tutorial')).toBeHidden();
        await expect(more).toBeFocused();

        await openFlight('Launch Fighters');
        await expect(page.locator('#combat-hud')).toBeVisible({ timeout: 30_000 });
        await expect(page.locator('#combat-touch-controls')).toBeVisible();
        const retreat = page.getByRole('button', { name: 'Retreat from Combat', exact: true });
        await expect(retreat).toBeFocused();
        await page.screenshot({ path: test.info().outputPath(`combat-${width}.png`) });
        await retreat.click();
        await expect(page.locator('#combat-hud')).toBeHidden();
        await expect(page.locator('#ep-ui')).toBeVisible();
        await expect(more).toBeFocused();

        // Breakpoint changes move the same original nodes back in desktop order.
        await page.setViewportSize({ width: 1440, height: 1000 });
        await expect(page.locator('.ep-command-primary #ep-btn-galaxy')).toBeVisible();
        await expect(page.locator('.ep-command-primary #ep-btn-missions')).toBeVisible();
        await expect(page.locator('.ep-command-primary #ep-btn-tutorial')).toBeVisible();
        await expect(page.locator('.ep-command-primary .ep-command-combat')).toBeVisible();
        await expect(page.locator('#ep-btn-galaxy')).toHaveCount(1);
        await page.setViewportSize({ width, height });
        await more.click();
        await expect(flight.locator('button')).toHaveCount(4);
        await page.screenshot({ path: test.info().outputPath(`flight-menu-${width}.png`) });
        expect(errors).toEqual([]);
    });
}
