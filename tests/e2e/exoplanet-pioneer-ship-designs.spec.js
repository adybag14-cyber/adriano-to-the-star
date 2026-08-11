import { test, expect } from '@playwright/test';

// Override with BASE_URL env when your dev server runs on a different port/host.
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

test.describe('Exoplanet Pioneer - Ship Designs', () => {
    test.beforeEach(async ({ page }) => {
        // Mock external feeds to avoid network flakiness/warnings
        await page.route('**/exoplanetarchive.ipac.caltech.edu/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { pl_name: 'PW-1', disc_year: 2024, hostname: 'PW-Host', sy_dist: 12.3, pl_rade: 1.1, pl_bmasse: 1.0 }
                ])
            });
        });
        await page.route('**/api.nasa.gov/planetary/apod**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    title: 'Mock APOD',
                    explanation: 'Mock APOD explanation.',
                    url: 'https://example.com/apod.jpg'
                })
            });
        });
        await page.route('**/ll.thespacedevs.com/2.2.0/launch/upcoming/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    results: [
                        { name: 'Mock Launch', window_start: new Date().toISOString(), pad: { name: 'Mock Pad' }, url: 'https://example.com/launch' }
                    ]
                })
            });
        });
        await page.route('**/api.spaceflightnewsapi.net/v4/articles/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    results: [
                        { title: 'Mock Space News', summary: 'Mock summary', url: 'https://example.com/news', newsSite: 'MockSite' }
                    ]
                })
            });
        });
    });

    test('xr buttons gate correctly when XR unsupported', async ({ page }) => {
        test.setTimeout(90_000);

        // Default browser context: no XR support; ensure buttons reflect that
        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'load', timeout: 60000 });

        // Open viewer via UI button
        await page.click('#ep-open-planet-viewer');
        await page.waitForSelector('#planet-3d-modal', { timeout: 20000 });

        const vrVisible = await page.isVisible('#vr-mode-btn');
        const arVisible = await page.isVisible('#ar-mode-btn');
        const cardboardVisible = await page.isVisible('#cardboard-btn');

        expect(vrVisible).toBeFalsy();
        expect(arVisible).toBeFalsy();
        expect(cardboardVisible).toBeTruthy();
    });

    test('ar placeholder shows when AR requested without support', async ({ page }) => {
        test.setTimeout(90_000);

        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'load', timeout: 60000 });
        await page.click('#ep-open-planet-viewer');
        await page.waitForSelector('#planet-3d-modal', { timeout: 20000 });

        const arEnabled = await page.$eval('#ar-mode-btn', (btn) => !btn.disabled);
        if (arEnabled) {
            await page.click('#ar-mode-btn');
        } else {
            // Invoke placeholder directly when AR is disabled/unsupported
            await page.evaluate(() => {
                const viewer = window.__planetViewer || window.planet3DViewer || null;
                if (viewer && typeof viewer.showARPlaceholder === 'function') {
                    viewer.showARPlaceholder();
                }
            });
        }
        await page.waitForTimeout(500); // allow banner/placeholder render

        const placeholderVisible = await page.isVisible('#ar-placeholder');
        expect(placeholderVisible).toBeTruthy();
    });

    test('ship designs persist across save + reload', async ({ page }) => {
        test.setTimeout(4 * 60 * 1000);

        await page.addInitScript(() => {
            try {
                const sentinel = '__pw_ep_ship_designs_cleared__';
                if (!sessionStorage.getItem(sentinel)) {
                    localStorage.removeItem('ep_save_v2');
                    sessionStorage.setItem(sentinel, '1');
                }
            } catch (e) {}
        });

        page.on('pageerror', (err) => {
            console.log('PAGE ERROR:', String(err));
        });

        page.on('console', (msg) => {
            const type = msg.type();
            if (type === 'error' || type === 'warning') {
                console.log(`PAGE ${type.toUpperCase()}:`, msg.text());
            }
        });

        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'load', timeout: 60000 });
        await page.waitForFunction(
            () => window.game && window.game.shipDesigner && window.game.shipDesigner.modules && typeof window.ShipDesign === 'function',
            null,
            { timeout: 60000 }
        );

        const beforeReload = await page.evaluate(() => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            if (!game.shipDesigner) throw new Error('window.game.shipDesigner was not available');
            if (!game.shipDesigner.modules) throw new Error('window.game.shipDesigner.modules was not available');
            if (typeof window.ShipDesign !== 'function') throw new Error('window.ShipDesign was not available');
            if (typeof game.saveGame !== 'function') throw new Error('window.game.saveGame was not available');

            const modules = game.shipDesigner.modules;
            const pick = (primaryId, fallbackPrefix) => {
                if (modules[primaryId]) return modules[primaryId];
                const key = Object.keys(modules).find((k) => k.startsWith(fallbackPrefix));
                return key ? modules[key] : null;
            };

            const hull = pick('hull_interceptor', 'hull_');
            const engine = pick('eng_ion', 'eng_');
            const weapon = pick('wep_laser', 'wep_');
            const shield = modules['mod_shield_basic'] || modules['mod_shield_heavy'] || modules['mod_shield_regenerative'] || null;

            if (!hull || !engine) throw new Error('Could not pick required hull/engine modules');

            const design = new window.ShipDesign('PW Test Design', hull, engine, weapon ? [weapon] : [], shield ? [shield] : []);

            if (typeof game.shipDesigner.saveDesign === 'function') game.shipDesigner.saveDesign(design);
            else if (Array.isArray(game.shipDesigner.designs)) game.shipDesigner.designs.push(design);
            else game.shipDesigner.designs = [design];

            game.saveGame({ silent: true });

            const savedRaw = localStorage.getItem('ep_save_v2');
            const saved = savedRaw ? JSON.parse(savedRaw) : null;
            const savedDesigns = saved && Array.isArray(saved.shipDesigns) ? saved.shipDesigns : [];

            return {
                designId: design.id,
                designName: design.name,
                savedDesigns
            };
        });

        expect(beforeReload.savedDesigns.length).toBeGreaterThan(0);
        expect(beforeReload.savedDesigns[0].id).toBe(beforeReload.designId);
        expect(beforeReload.savedDesigns[0].hullId).toBeTruthy();
        expect(beforeReload.savedDesigns[0].engineId).toBeTruthy();
        expect(beforeReload.savedDesigns[0].hull).toBeUndefined();
        expect(beforeReload.savedDesigns[0].engine).toBeUndefined();

        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'load', timeout: 60000 });
        await page.waitForSelector('#ep-data-overlay', { timeout: 60000 });

        // Toggle overlay and check controls
        await page.click('#ep-data-toggle');

        await page.evaluate(() => window.game.loadGame());

        const afterReload = await page.evaluate((designId) => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            if (!game.shipDesigner) throw new Error('window.game.shipDesigner was not available');

            const designs = Array.isArray(game.shipDesigner.designs) ? game.shipDesigner.designs : [];
            const found = designs.find((d) => d && String(d.id) === String(designId));

            return {
                count: designs.length,
                found: found
                    ? {
                        id: found.id,
                        name: found.name,
                        hullId: found.hull && found.hull.id ? String(found.hull.id) : null,
                        engineId: found.engine && found.engine.id ? String(found.engine.id) : null,
                        weaponIds: Array.isArray(found.weapons) ? found.weapons.map((w) => (w && w.id ? String(w.id) : null)).filter(Boolean) : [],
                        shieldIds: Array.isArray(found.shields) ? found.shields.map((s) => (s && s.id ? String(s.id) : null)).filter(Boolean) : []
                    }
                    : null
            };
        }, beforeReload.designId);

        expect(afterReload.count).toBeGreaterThan(0);
        expect(afterReload.found).toBeTruthy();
        expect(afterReload.found.id).toBe(beforeReload.designId);
        expect(afterReload.found.name).toBe(beforeReload.designName);
        expect(afterReload.found.hullId).toBeTruthy();
        expect(afterReload.found.engineId).toBeTruthy();
    });

    test('fleet ships persist across save + reload', async ({ page }) => {
        test.setTimeout(4 * 60 * 1000);

        await page.addInitScript(() => {
            try {
                const sentinel = '__pw_ep_fleet_cleared__';
                if (!sessionStorage.getItem(sentinel)) {
                    localStorage.removeItem('ep_save_v2');
                    sessionStorage.setItem(sentinel, '1');
                }
            } catch (e) {}
        });

        page.on('pageerror', (err) => {
            console.log('PAGE ERROR:', String(err));
        });

        page.on('console', (msg) => {
            const type = msg.type();
            if (type === 'error' || type === 'warning') {
                console.log(`PAGE ${type.toUpperCase()}:`, msg.text());
            }
        });

        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'load', timeout: 60000 });
        await page.waitForFunction(
            () => window.game && window.game.shipDesigner && window.game.shipDesigner.modules && typeof window.ShipDesign === 'function',
            null,
            { timeout: 60000 }
        );

        const beforeReload = await page.evaluate(() => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            if (!game.shipDesigner) throw new Error('window.game.shipDesigner was not available');
            if (!game.shipDesigner.modules) throw new Error('window.game.shipDesigner.modules was not available');
            if (typeof window.ShipDesign !== 'function') throw new Error('window.ShipDesign was not available');
            if (typeof game.saveGame !== 'function') throw new Error('window.game.saveGame was not available');
            if (typeof game.buildShipFromDesign !== 'function') throw new Error('window.game.buildShipFromDesign was not available');

            const modules = game.shipDesigner.modules;
            const pick = (primaryId, fallbackPrefix) => {
                if (modules[primaryId]) return modules[primaryId];
                const key = Object.keys(modules).find((k) => k.startsWith(fallbackPrefix));
                return key ? modules[key] : null;
            };

            const hull = pick('hull_interceptor', 'hull_');
            const engine = pick('eng_ion', 'eng_');
            const weapon = pick('wep_laser', 'wep_');
            const shield = modules['mod_shield_basic'] || modules['mod_shield_heavy'] || modules['mod_shield_regenerative'] || null;

            if (!hull || !engine) throw new Error('Could not pick required hull/engine modules');

            const design = new window.ShipDesign('PW Fleet Test Design', hull, engine, weapon ? [weapon] : [], shield ? [shield] : []);

            if (!game.resources) game.resources = {};
            const ensureResource = (key, amount) => {
                const current = (typeof game.resources[key] === 'number' && Number.isFinite(game.resources[key])) ? game.resources[key] : 0;
                game.resources[key] = Math.max(current, amount);
            };
            ensureResource('alloys', 999999);
            ensureResource('energy', 999999);
            ensureResource('circuits', 999999);
            if (design.cost && typeof design.cost === 'object') {
                Object.keys(design.cost).forEach((key) => {
                    const raw = design.cost[key];
                    if (typeof raw !== 'number' || !Number.isFinite(raw)) return;
                    const need = Math.max(0, Math.floor(raw));
                    if (need <= 0) return;
                    ensureResource(key, 999999);
                });
            }

            if (typeof game.shipDesigner.saveDesign === 'function') game.shipDesigner.saveDesign(design);
            else if (Array.isArray(game.shipDesigner.designs)) game.shipDesigner.designs.push(design);
            else game.shipDesigner.designs = [design];

            const ship = game.buildShipFromDesign(design);
            if (!ship) throw new Error('buildShipFromDesign returned null');

            game.saveGame({ silent: true });

            const savedRaw = localStorage.getItem('ep_save_v2');
            const saved = savedRaw ? JSON.parse(savedRaw) : null;
            const savedShips = saved && Array.isArray(saved.ships) ? saved.ships : [];

            return {
                designId: design.id,
                shipId: ship.id,
                shipName: ship.name,
                savedShips
            };
        });

        expect(beforeReload.savedShips.length).toBeGreaterThan(0);
        const savedShip = beforeReload.savedShips.find((s) => s && String(s.id) === String(beforeReload.shipId));
        expect(savedShip).toBeTruthy();
        expect(savedShip.id).toBe(beforeReload.shipId);
        expect(savedShip.designId).toBe(beforeReload.designId);
        expect(savedShip.design).toBeUndefined();

        await page.reload({ waitUntil: 'load', timeout: 60000 });
        await page.waitForFunction(() => window.game && typeof window.game.loadGame === 'function', null, { timeout: 60000 });
        await page.evaluate(() => window.game.loadGame());

        const afterReload = await page.evaluate((shipId) => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            const ships = Array.isArray(game.ships) ? game.ships : [];
            const found = ships.find((s) => s && String(s.id) === String(shipId));

            return {
                count: ships.length,
                found: found
                    ? {
                        id: found.id,
                        name: found.name,
                        designId: found.designId,
                        designRefId: found.design && found.design.id ? String(found.design.id) : null
                    }
                    : null
            };
        }, beforeReload.shipId);

        expect(afterReload.count).toBeGreaterThan(0);
        expect(afterReload.found).toBeTruthy();
        expect(afterReload.found.id).toBe(beforeReload.shipId);
        expect(afterReload.found.name).toBe(beforeReload.shipName);
        expect(afterReload.found.designId).toBe(beforeReload.designId);
        expect(afterReload.found.designRefId).toBe(beforeReload.designId);
    });

    test('can build ship from saved design via Fleet UI', async ({ page }) => {
        test.setTimeout(4 * 60 * 1000);

        await page.addInitScript(() => {
            try {
                const sentinel = '__pw_ep_fleet_build_cleared__';
                if (!sessionStorage.getItem(sentinel)) {
                    localStorage.removeItem('ep_save_v2');
                    sessionStorage.setItem(sentinel, '1');
                }
            } catch (e) {}
        });

        page.on('pageerror', (err) => {
            console.log('PAGE ERROR:', String(err));
        });

        page.on('console', (msg) => {
            const type = msg.type();
            if (type === 'error' || type === 'warning') {
                console.log(`PAGE ${type.toUpperCase()}:`, msg.text());
            }
        });

        await page.goto(`${BASE_URL}/exoplanet-pioneer.html`, { waitUntil: 'load', timeout: 60000 });
        await page.waitForFunction(
            () => window.game && window.game.shipDesigner && window.game.shipDesigner.modules && window.game.fleetManager && typeof window.ShipDesign === 'function',
            null,
            { timeout: 60000 }
        );

        const saved = await page.evaluate(() => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            if (!game.shipDesigner || !game.shipDesigner.modules) throw new Error('window.game.shipDesigner.modules was not available');
            if (!game.fleetManager || typeof game.fleetManager.openFleetUI !== 'function') throw new Error('window.game.fleetManager was not available');
            if (typeof window.ShipDesign !== 'function') throw new Error('window.ShipDesign was not available');
            if (typeof game.saveGame !== 'function') throw new Error('window.game.saveGame was not available');

            const modules = game.shipDesigner.modules;
            const pick = (primaryId, fallbackPrefix) => {
                if (modules[primaryId]) return modules[primaryId];
                const key = Object.keys(modules).find((k) => k.startsWith(fallbackPrefix));
                return key ? modules[key] : null;
            };

            const findByCostKey = (prefix, costKey) => {
                const key = Object.keys(modules).find((k) => {
                    if (!k.startsWith(prefix)) return false;
                    const m = modules[k];
                    if (!m || !m.cost || typeof m.cost !== 'object') return false;
                    const raw = m.cost[costKey];
                    return typeof raw === 'number' && Number.isFinite(raw) && raw > 0;
                });
                return key ? modules[key] : null;
            };

            const hull = pick('hull_interceptor', 'hull_');
            const engine = modules['eng_slipspace'] || findByCostKey('eng_', 'unknown_material') || pick('eng_ion', 'eng_');
            const weapon = pick('wep_laser', 'wep_');
            const shield = modules['mod_shield_basic'] || modules['mod_shield_heavy'] || modules['mod_shield_regenerative'] || null;
            if (!hull || !engine) throw new Error('Could not pick required hull/engine modules');

            const design = new window.ShipDesign('PW Fleet Build UI Design', hull, engine, weapon ? [weapon] : [], shield ? [shield] : []);

            if (!game.resources) game.resources = {};
            const ensureResource = (key, amount) => {
                const current = (typeof game.resources[key] === 'number' && Number.isFinite(game.resources[key])) ? game.resources[key] : 0;
                game.resources[key] = Math.max(current, amount);
            };

            const cost = (design.cost && typeof design.cost === 'object') ? design.cost : {};
            Object.keys(cost).forEach((key) => {
                const raw = cost[key];
                if (typeof raw !== 'number' || !Number.isFinite(raw)) return;
                const need = Math.max(0, Math.floor(raw));
                if (need <= 0) return;
                ensureResource(key, 999999);
            });

            const extraKey = Object.keys(cost).find((key) => {
                if (key === 'alloys' || key === 'energy' || key === 'circuits') return false;
                const raw = cost[key];
                return typeof raw === 'number' && Number.isFinite(raw) && raw > 0;
            }) || null;

            if (typeof game.shipDesigner.saveDesign === 'function') game.shipDesigner.saveDesign(design);
            else if (Array.isArray(game.shipDesigner.designs)) game.shipDesigner.designs.push(design);
            else game.shipDesigner.designs = [design];

            game.saveGame({ silent: true });

            return {
                designId: design.id,
                extraKey,
                extraNeed: extraKey ? Math.max(0, Math.floor(cost[extraKey])) : 0
            };
        });

        await page.reload({ waitUntil: 'load', timeout: 60000 });
        await page.waitForFunction(() => window.game && typeof window.game.loadGame === 'function', null, { timeout: 60000 });
        await page.evaluate(() => window.game.loadGame());

        await page.evaluate(() => {
            if (window.game) window.game.isPaused = true;
            if (window.game && window.game.fleetManager) window.game.fleetManager.openFleetUI();
        });

        await page.waitForSelector('#ep-fleet-modal', { state: 'visible', timeout: 60000 });
        await page.waitForSelector('#ep-fleet-build-design', { state: 'attached', timeout: 60000 });

        await page.selectOption('#ep-fleet-build-design', { value: String(saved.designId) });

        const beforeBuild = await page.evaluate((extraKey) => {
            const ships = Array.isArray(window.game && window.game.ships) ? window.game.ships : [];
            const resources = window.game && window.game.resources ? window.game.resources : {};
            const extraHave = extraKey ? resources[extraKey] : null;
            return { shipCount: ships.length, extraHave };
        }, saved.extraKey);

        await page.click('#ep-fleet-modal button[onclick="window.game.fleetManager.buildShipFromSelectedDesign()"]');

        await page.waitForFunction(
            (count) => window.game && Array.isArray(window.game.ships) && window.game.ships.length > count,
            beforeBuild.shipCount,
            { timeout: 60000 }
        );

        const afterBuild = await page.evaluate(({ designId, extraKey }) => {
            const ships = Array.isArray(window.game && window.game.ships) ? window.game.ships : [];
            const resources = window.game && window.game.resources ? window.game.resources : {};
            const matching = ships.filter((s) => s && String(s.designId) === String(designId));
            return {
                shipCount: ships.length,
                builtCount: matching.length,
                builtShipId: matching.length ? matching[matching.length - 1].id : null,
                builtDesignId: matching.length ? matching[matching.length - 1].designId : null,
                extraHave: extraKey ? resources[extraKey] : null
            };
        }, { designId: saved.designId, extraKey: saved.extraKey });

        expect(afterBuild.shipCount).toBeGreaterThan(beforeBuild.shipCount);
        expect(afterBuild.builtCount).toBeGreaterThan(0);
        expect(afterBuild.builtDesignId).toBe(saved.designId);

        if (saved.extraKey && typeof beforeBuild.extraHave === 'number') {
            expect(typeof afterBuild.extraHave).toBe('number');
            expect(afterBuild.extraHave).toBe(beforeBuild.extraHave - saved.extraNeed);
        }
    });
});
