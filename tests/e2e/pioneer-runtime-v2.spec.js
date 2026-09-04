/* global game, Storage, DOMException */
import { test, expect } from '@playwright/test';
import { installPioneerFunctionalProfile, applyPioneerFunctionalProfile, forceSwiftShader, swiftShaderLaunchOptions } from './helpers/pioneer-functional-profile.js';

if (forceSwiftShader) test.use({ launchOptions: swiftShaderLaunchOptions });

test.describe('Pioneer engine v2 player outcomes', () => {
    test.beforeEach(async ({ page }) => {
        await installPioneerFunctionalProfile(page);
        await page.goto('/exoplanet-pioneer.html', { waitUntil: 'domcontentloaded' });
        await applyPioneerFunctionalProfile(page);
        await page.waitForFunction(() => window.game?.runtime?.frameCount > 2, null, { timeout: 60_000 });
        const tutorial = page.locator('#ep-tutorial-skip');
        if (await tutorial.isVisible()) await tutorial.click();
    });

    test('pause stops colony consumption while orbit, galaxy and cinematic controls remain usable', async ({ page }) => {
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        const before = await page.evaluate(() => ({ food: game.resources.food, oxygen: game.resources.oxygen, time: game.timeOfDay, frames: game.runtime.frameCount, camera: game.camera.position.toArray() }));
        await page.waitForTimeout(1400);
        await page.mouse.move(650, 380);
        await page.mouse.down();
        await page.mouse.move(810, 395, { steps: 12 });
        await page.mouse.up();
        const after = await page.evaluate(() => ({ food: game.resources.food, oxygen: game.resources.oxygen, time: game.timeOfDay, frames: game.runtime.frameCount, camera: game.camera.position.toArray() }));
        expect(after.food).toBe(before.food);
        expect(after.oxygen).toBe(before.oxygen);
        expect(after.time).toBe(before.time);
        expect(after.frames).toBeGreaterThan(before.frames);
        expect(after.camera).not.toEqual(before.camera);
        await page.locator('#ep-btn-galaxy').click();
        await expect(page.locator('#ep-galaxy-map-modal')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('#ep-galaxy-map-modal')).toBeHidden();
        expect(await page.evaluate(() => game.timeScale)).toBe(0);
        await page.locator('#ep-btn-cinematic-toggle').click();
        await expect(page.locator('#ep-ui')).toHaveClass(/ep-cinematic/);
        await page.keyboard.press('Escape');
        await expect(page.locator('#ep-ui')).not.toHaveClass(/ep-cinematic/);
        await page.getByRole('button', { name: '1x speed', exact: true }).click();
        await expect.poll(() => page.evaluate(() => game.timeOfDay)).not.toBe(before.time);
    });

    test('portrait framing keeps the planet in view and graphics survive repeated resizing', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(500);
        const portrait = await page.evaluate(() => {
            const camera = game.camera;
            const halfFov = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
            return { fits: Math.asin(54 / camera.position.length()) < halfFov, width: document.documentElement.scrollWidth, viewport: innerWidth, frames: game.runtime.frameCount };
        });
        expect(portrait.fits).toBe(true);
        expect(portrait.width).toBeLessThanOrEqual(portrait.viewport + 1);
        await page.setViewportSize({ width: 1440, height: 1000 });
        await expect.poll(() => page.evaluate(() => game.runtime.frameCount)).toBeGreaterThan(portrait.frames);
        expect(errors).toEqual([]);
    });

    test('breadcrumb occupies drawer space and never covers the resource command row', async ({ page }) => {
        for (const viewport of [{width:1280,height:720},{width:390,height:844}]) {
            await page.setViewportSize(viewport);
            const breadcrumb = page.locator('#ep-ops-drawer > .ita-breadcrumb');
            await expect(breadcrumb).toHaveCount(1);
            await expect(breadcrumb).not.toBeVisible();
            await page.locator('#ep-btn-ops').click();
            await expect(breadcrumb).toBeVisible();
            await expect(breadcrumb).toHaveAttribute('aria-label', 'Breadcrumb');
            await expect(breadcrumb.locator('[aria-current="page"]')).toContainText('Exoplanet Pioneer');
            const boxes = await page.evaluate(() => {
                const nav = document.querySelector('#ep-ops-drawer > .ita-breadcrumb');
                const rect = nav.getBoundingClientRect();
                const resource = document.getElementById('ep-res-panel').getBoundingClientRect();
                const commands = document.querySelector('.ep-command-primary').getBoundingClientRect();
                const intersects = other => rect.left < other.right && rect.right > other.left && rect.top < other.bottom && rect.bottom > other.top;
                const home = nav.querySelector('a'); const hit = home.getBoundingClientRect();
                return {overlap:intersects(resource)||intersects(commands),inside:rect.left>=0&&rect.right<=innerWidth&&rect.top>=0&&rect.bottom<=innerHeight,homeHit:home.contains(document.elementFromPoint(hit.x+hit.width/2,hit.y+hit.height/2))};
            });
            expect(boxes).toEqual({overlap:false,inside:true,homeHit:true});
            await expect(breadcrumb.getByRole('link',{name:'Home',exact:true})).toHaveAttribute('href','/');
            await page.locator('#ep-btn-ops').click();
        }
        await page.reload({waitUntil:'domcontentloaded'});
        await applyPioneerFunctionalProfile(page);
        await page.waitForFunction(() => window.game?.runtime?.frameCount > 2);
        await expect(page.locator('#ep-ops-drawer > .ita-breadcrumb')).toHaveCount(1);
        await page.locator('#ep-btn-ops').click();
        await page.locator('#ep-ops-drawer .ita-breadcrumb a').click();
        await expect(page).toHaveURL(new RegExp(`${new URL(process.env.BASE_URL || 'https://adrianotothestar.com').origin.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/$`));
    });

    test('speed changes hide a stale resource rate until a real matching-speed sample arrives', async ({ page }) => {
        const before = await page.evaluate(() => {
            game.runtime.suspend();
            game.setTimeSpeed(4, { bypassSafety: true, silent: true });
            game.colonyTick();
            return { revision: game.resourceRateSample.revision, foodRate: game.resourceRates.food };
        });
        await expect(page.locator('[data-resource="food"] .ep-res-rate')).toBeVisible();
        await page.getByRole('button', { name: '1x speed', exact: true }).click();
        await expect(page.locator('[data-resource="food"] .ep-res-rate')).toHaveCount(0);
        const after = await page.evaluate(() => {
            game.colonyTick();
            return { revision: game.resourceRateSample.revision, speed: game.resourceRateSample.speed, foodRate: game.resourceRates.food };
        });
        expect(after.revision).toBeGreaterThan(before.revision);
        expect(after.speed).toBe(1);
        expect(after.foodRate * 10).toBeCloseTo(before.foodRate, 6);
        await expect(page.locator('[data-resource="food"] .ep-res-rate')).toBeVisible();
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        await expect(page.locator('[data-resource="food"] .ep-res-rate')).toHaveCount(0);
    });

    test('a rejected save reports failure and leaves the previous saved colony intact', async ({ page }) => {
        const result = await page.evaluate(() => {
            game.setTimeSpeed(0, { silent: true });
            const first = game.saveGame({ silent: true });
            const previous = localStorage.getItem('ep_save_v2');
            const original = Storage.prototype.setItem;
            Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
            let rejected;
            try { rejected = game.saveGame(); } finally { Storage.prototype.setItem = original; }
            return { first, rejected, unchanged: previous === localStorage.getItem('ep_save_v2') };
        });
        expect(result).toEqual({ first: true, rejected: false, unchanged: true });
        await expect(page.locator('#ep-notifications')).toContainText('Save could not be written');
    });

    test('idle observation is non-blocking and never claims unearned rewards', async ({ page }) => {
        await page.evaluate(() => game.dream.enterDream());
        await expect(page.locator('#dream-overlay')).toContainText('OBSERVATION MODE');
        const bounds = await page.locator('#dream-overlay').boundingBox();
        expect(bounds.height).toBeLessThan(180);
        await page.locator('#ep-btn-tech').click();
        await expect(page.locator('#ep-tech-modal')).toBeVisible();
        await expect(page.locator('#dream-overlay')).toBeHidden();
    });

    test('command drawer panels open with real data and close by keyboard', async ({ page }) => {
        test.setTimeout(120000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        for (const [action, modal] of [['roster', 'roster'], ['recruit', 'recruit'], ['legal', 'legal'], ['factions', 'faction'], ['xeno', 'xenodex'], ['fleet', 'fleet'], ['skills', 'skills'], ['archaeology', 'archaeology'], ['signals', 'signals'], ['chatter', 'chatter'], ['profile', 'profile'], ['stocks', 'stocks'], ['logistics', 'logistics'], ['cloud', 'cloud']]) {
            await page.locator('#ep-btn-ops').click();
            await page.locator(`#ep-btn-${action}`).click();
            const dialog = page.locator(`#ep-${modal}-modal`);
            await expect(dialog).toBeVisible();
            expect((await dialog.innerText()).trim().length).toBeGreaterThan(20);
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
        }
        expect(errors).toEqual([]);
    });

    test('recruitment completes and catalog analysis uses a sourced record with saved progress', async ({ page }) => {
        await page.evaluate(() => { game.setTimeSpeed(0, { silent: true }); game.basePopulationCap += 2; game.resources.credits = 1000; });
        const before = await page.evaluate(() => game.colonists.length);
        await page.locator('#ep-btn-ops').click();
        await page.locator('#ep-btn-recruit').click();
        await page.locator('[data-recruit="engineer"]').click();
        expect(await page.evaluate(() => ({ count: game.colonists.length, job: game.colonists.at(-1).job, credits: game.resources.credits }))).toEqual({ count: before + 1, job: 'engineer', credits: 850 });
        await page.keyboard.press('Escape');
        await page.locator('#ep-btn-missions').click();
        await page.locator('#ep-archive-analyze').click();
        await expect(page.locator('#ep-cs-data-display')).toContainText('Proxima Cen b');
        await expect(page.locator('#ep-cs-data-display a')).toHaveAttribute('href', /exoplanetarchive.ipac.caltech.edu/);
        expect(await page.evaluate(() => game.reviewedArchivePlanets)).toContain('proxima-cen-b');
        await page.evaluate(() => game.saveGame({ silent: true }));
        expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ep_save_v2')).reviewedArchivePlanets)).toContain('proxima-cen-b');
    });
});
