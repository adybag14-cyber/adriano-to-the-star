import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8095';

async function openMissionsModal(page) {
    await page.waitForSelector('#ep-ui', { state: 'visible', timeout: 60000 });
    await page.waitForSelector('#ep-btn-missions', { timeout: 30000 });

    await page.click('#ep-btn-missions', { timeout: 15000, force: true });

    await page.waitForFunction(() => {
        const modal = document.getElementById('ep-missions-modal');
        if (!modal) return false;
        const display = getComputedStyle(modal).display;
        return display !== 'none' && display !== '';
    }, null, { timeout: 30000 });

    await page.waitForSelector('#ep-missions-content', { timeout: 30000 });
}

test.describe('Exoplanet Pioneer - Agent Missions', () => {
    test('missions modal shows standing/LP/store and combat wins increment on victory', async ({ page }) => {
        test.setTimeout(4 * 60 * 1000);

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
        await openMissionsModal(page);

        const missionsText = await page.locator('#ep-missions-content').innerText();
        expect(missionsText).toContain('Standing:');
        expect(missionsText).toContain('LP:');
        expect(missionsText).toContain('Loyalty Store');

        const hasBuyButton = await page.evaluate(() => {
            const root = document.getElementById('ep-missions-content');
            if (!root) return false;
            const buttons = Array.from(root.querySelectorAll('button'));
            return buttons.some((b) => String(b.textContent || '').trim().toLowerCase() === 'buy');
        });
        expect(hasBuyButton).toBeTruthy();

        const before = await page.evaluate(() => {
            const wins = window.game?.agentMissions?.stats?.combatWins;
            const safeWins = (typeof wins === 'number' && Number.isFinite(wins)) ? wins : 0;
            const cur = window.game?.getAgentMissionProgress
                ? (window.game.getAgentMissionProgress('combat_patrol')?.current ?? null)
                : null;
            return {
                wins: safeWins,
                progress: (typeof cur === 'number' && Number.isFinite(cur)) ? cur : null
            };
        });

        await page.evaluate(() => {
            if (!window.game || typeof window.game.retreatFromCombat !== 'function') {
                throw new Error('window.game.retreatFromCombat was not available');
            }
            window.game.retreatFromCombat({ outcome: 'victory', reward: {} });
        });

        const expectedWins = before.wins + 1;

        await page.waitForFunction(
            (expected) => {
                const wins = window.game?.agentMissions?.stats?.combatWins;
                return typeof wins === 'number' && Number.isFinite(wins) && wins === expected;
            },
            expectedWins,
            { timeout: 30000 }
        );

        await page.waitForFunction(
            (expected) => {
                const el = document.getElementById('ep-missions-content');
                if (!el) return false;
                return String(el.textContent || '').includes(`Combat victories recorded: ${expected}`);
            },
            expectedWins,
            { timeout: 30000 }
        );

        const after = await page.evaluate(() => {
            const wins = window.game?.agentMissions?.stats?.combatWins;
            const safeWins = (typeof wins === 'number' && Number.isFinite(wins)) ? wins : 0;
            const cur = window.game?.getAgentMissionProgress
                ? (window.game.getAgentMissionProgress('combat_patrol')?.current ?? null)
                : null;
            return {
                wins: safeWins,
                progress: (typeof cur === 'number' && Number.isFinite(cur)) ? cur : null
            };
        });

        expect(after.wins).toBe(expectedWins);
        if (after.progress !== null) {
            expect(after.progress).toBe(expectedWins);
        }
    });

    test('mission offers refresh by day, respect cooldowns, and persist across reload', async ({ page }) => {
        test.setTimeout(4 * 60 * 1000);

        await page.addInitScript(() => {
            try {
                const sentinel = '__pw_ep_missions_cleared__';
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
        await openMissionsModal(page);

        const initial = await page.evaluate(() => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            game.updateAgentMissions({ silent: true });
            const dayRaw = (typeof game.day === 'number' && Number.isFinite(game.day)) ? Math.floor(game.day) : 1;
            const day = Math.max(1, dayRaw);
            const offers = Array.isArray(game.agentMissions?.offers) ? game.agentMissions.offers.map((o) => ({ ...o })) : [];
            const lastOfferDay = (typeof game.agentMissions?.lastOfferDay === 'number' && Number.isFinite(game.agentMissions.lastOfferDay)) ? Math.floor(game.agentMissions.lastOfferDay) : 0;
            return { day, lastOfferDay, offers };
        });

        expect(initial.offers.length).toBeGreaterThan(0);
        expect(initial.lastOfferDay).toBe(initial.day);
        expect(initial.offers.every((o) => o && o.offeredAtDay === initial.day)).toBeTruthy();

        const rotated = await page.evaluate((day) => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            const newDay = day + 1;
            game.day = newDay;
            game.updateAgentMissions({ silent: true });
            const offers = Array.isArray(game.agentMissions?.offers) ? game.agentMissions.offers.map((o) => ({ ...o })) : [];
            const lastOfferDay = (typeof game.agentMissions?.lastOfferDay === 'number' && Number.isFinite(game.agentMissions.lastOfferDay)) ? Math.floor(game.agentMissions.lastOfferDay) : 0;
            return { day: newDay, lastOfferDay, offers };
        }, initial.day);

        expect(rotated.lastOfferDay).toBe(rotated.day);
        expect(rotated.offers.length).toBeGreaterThan(0);
        expect(rotated.offers.every((o) => o && o.offeredAtDay === rotated.day)).toBeTruthy();

        const cooldownEffect = await page.evaluate(() => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            game.updateAgentMissions({ silent: true });

            const dayRaw = (typeof game.day === 'number' && Number.isFinite(game.day)) ? Math.floor(game.day) : 1;
            const day = Math.max(1, dayRaw);

            const defs = game.agentMissionDefs || (typeof game.getAgentMissionDefinitions === 'function' ? game.getAgentMissionDefinitions() : {});
            const ids = Object.keys(defs);
            if (ids.length === 0) throw new Error('No agent mission definitions found');

            const scoreFor = (id) => {
                let h = 2166136261;
                const s = `${day}|${id}`;
                for (let i = 0; i < s.length; i++) {
                    h ^= s.charCodeAt(i);
                    h = Math.imul(h, 16777619);
                }
                return h >>> 0;
            };

            const sorted = ids.slice().sort((a, b) => scoreFor(b) - scoreFor(a));
            const topId = sorted[0];

            if (!game.agentMissions) throw new Error('agentMissions missing');
            if (!game.agentMissions.cooldowns || typeof game.agentMissions.cooldowns !== 'object') game.agentMissions.cooldowns = {};

            game.agentMissions.cooldowns[topId] = day + 50;
            game.agentMissions.lastOfferDay = day - 1;
            game.updateAgentMissions({ silent: true });
            const offersWithCooldown = Array.isArray(game.agentMissions.offers) ? game.agentMissions.offers.map((o) => o.missionId) : [];

            delete game.agentMissions.cooldowns[topId];
            game.agentMissions.lastOfferDay = day - 1;
            game.updateAgentMissions({ silent: true });
            const offersWithoutCooldown = Array.isArray(game.agentMissions.offers) ? game.agentMissions.offers.map((o) => o.missionId) : [];

            return { day, topId, offersWithCooldown, offersWithoutCooldown };
        });

        expect(cooldownEffect.offersWithoutCooldown).toContain(cooldownEffect.topId);
        expect(cooldownEffect.offersWithCooldown).not.toContain(cooldownEffect.topId);

        const claimResult = await page.evaluate(() => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');

            game.updateAgentMissions({ silent: true });
            if (!game.agentMissions) throw new Error('agentMissions missing');
            game.agentMissions.standing = 999;

            const dayRaw = (typeof game.day === 'number' && Number.isFinite(game.day)) ? Math.floor(game.day) : 1;
            const day = Math.max(1, dayRaw);

            const offer = Array.isArray(game.agentMissions.offers) ? game.agentMissions.offers[0] : null;
            if (!offer || !offer.missionId) throw new Error('No mission offers to accept');
            const missionId = String(offer.missionId);

            game.acceptAgentMission(missionId);

            if (missionId === 'build_outpost') {
                if (!Array.isArray(game.structures)) game.structures = [];
                while (game.structures.length < 10) game.structures.push({});
            } else if (missionId === 'grow_population') {
                if (!Array.isArray(game.colonists)) game.colonists = [];
                while (game.colonists.length < 12) {
                    game.colonists.push({
                        id: `test_${Date.now()}_${Math.random()}`,
                        name: 'Test Colonist',
                        job: 'unemployed',
                        morale: 100,
                        traits: [],
                        needs: { hunger: 100, oxygen: 100, rest: 100 }
                    });
                }
            } else if (missionId === 'research_cache') {
                if (!game.resources) game.resources = {};
                game.resources.data = 999;
            } else if (missionId === 'combat_patrol') {
                if (typeof game.retreatFromCombat !== 'function') throw new Error('retreatFromCombat missing');
                game.retreatFromCombat({ outcome: 'victory', reward: {} });
                game.retreatFromCombat({ outcome: 'victory', reward: {} });
            } else if (missionId === 'pilot_training') {
                const defs = game.pilotSkillDefs || (typeof game.getPilotSkillDefinitions === 'function' ? game.getPilotSkillDefinitions() : {});
                const keys = Object.keys(defs);
                if (!game.pilotSkills || typeof game.pilotSkills !== 'object') game.pilotSkills = { skills: {}, active: null, queue: [] };
                if (!game.pilotSkills.skills || typeof game.pilotSkills.skills !== 'object') game.pilotSkills.skills = {};
                if (keys.length >= 2) {
                    game.pilotSkills.skills[keys[0]] = { level: 5 };
                    game.pilotSkills.skills[keys[1]] = { level: 1 };
                } else {
                    game.pilotSkills.skills.test = { level: 6 };
                }
            }

            game.claimAgentMissionReward();

            const active = game.agentMissions.active;
            const cooldownUntilRaw = (game.agentMissions.cooldowns && typeof game.agentMissions.cooldowns[missionId] === 'number' && Number.isFinite(game.agentMissions.cooldowns[missionId]))
                ? Math.floor(game.agentMissions.cooldowns[missionId])
                : 0;
            const cooldownUntil = Math.max(0, cooldownUntilRaw);
            const offersAfter = Array.isArray(game.agentMissions.offers) ? game.agentMissions.offers.map((o) => ({ ...o })) : [];

            game.saveGame({ silent: true });
            return { day, missionId, active, cooldownUntil, offersAfter };
        });

        expect(claimResult.active).toBeNull();
        expect(claimResult.cooldownUntil).toBe(claimResult.day + 2);

        await page.reload({ waitUntil: 'load', timeout: 60000 });
        await page.waitForFunction(() => window.game && typeof window.game.loadGame === 'function', null, { timeout: 60000 });
        await page.evaluate(() => window.game.loadGame());
        await openMissionsModal(page);

        const afterReload = await page.evaluate((missionId) => {
            const game = window.game;
            if (!game) throw new Error('window.game was not available');
            game.updateAgentMissions({ silent: true });

            const dayRaw = (typeof game.day === 'number' && Number.isFinite(game.day)) ? Math.floor(game.day) : 1;
            const day = Math.max(1, dayRaw);
            const cooldownUntilRaw = (game.agentMissions?.cooldowns && typeof game.agentMissions.cooldowns[missionId] === 'number' && Number.isFinite(game.agentMissions.cooldowns[missionId]))
                ? Math.floor(game.agentMissions.cooldowns[missionId])
                : 0;
            const cooldownUntil = Math.max(0, cooldownUntilRaw);
            return { day, cooldownUntil };
        }, claimResult.missionId);

        expect(afterReload.day).toBe(claimResult.day);
        expect(afterReload.cooldownUntil).toBe(claimResult.cooldownUntil);
    });
});
