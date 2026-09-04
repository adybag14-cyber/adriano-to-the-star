describe('Pioneer deterministic universe residency and navigation', () => {
    let Catalog;
    beforeAll(() => {
        require('../pioneer-universe-streaming.js');
        Catalog = window.PioneerUniverseCatalog;
    });

    test('has 268 million stable system addresses with strict coordinate validation', () => {
        expect(Catalog.capacity).toBe(268435456);
        expect(Catalog.parseAddress('-2048,2047,15').id).toBe('star_-2048,2047_15');
        expect(Catalog.parseAddress('star_0,0_29').index).toBe(29);
        ['2048,0,0', '0,-2049', '1,1,16', 'NaN,0', '0.2,1', '1e3,0', '<script>'].forEach((address) => expect(Catalog.parseAddress(address)).toBeNull());
    });

    test('generation is independent of sector visitation order and serializes only changed worlds', () => {
        const first = new Catalog();
        const second = new Catalog();
        first.loadSector(-913, 722);
        first.loadSector(0, 0);
        second.loadSector(100, -200);
        second.loadSector(-913, 722);
        expect(first.resolve('star_-913,722_7')).toEqual(second.resolve('star_-913,722_7'));
        expect(first.serialize().journal).toEqual([]);
        expect(new Catalog({ seed: 19 }).describeStar('star_-913,722_7')).not.toEqual(first.describeStar('star_-913,722_7'));
        const emptyCatalog = new Catalog();
        const remote = first.describeStar('star_1511,-1212_12');
        expect(emptyCatalog.search(remote.name)[0]).toEqual(remote);
        expect(emptyCatalog.sectors.size).toBe(0);
    });

    test('evicts sector objects while retaining discovery, player names and infrastructure edits', () => {
        const catalog = new Catalog({ maxResidentSectors: 9 });
        const star = catalog.resolve('star_12,44_3');
        star.discovered = true;
        star.name = 'The Long Return';
        star.megastructures = ['relay-27'];
        for (let x = 100; x < 250; x += 1) catalog.loadSector(x, -100);
        expect(catalog.sectors.size).toBe(9);
        expect(catalog.residentStars().length).toBe(144);
        const restored = catalog.resolve(star.id);
        expect(restored).toEqual(star);
        const snapshot = JSON.parse(JSON.stringify(catalog.serialize()));
        expect(snapshot.journal).toHaveLength(1);
        const loaded = new Catalog();
        expect(loaded.restore(snapshot)).toBe(true);
        expect(loaded.resolve(star.id)).toEqual(star);
        expect(loaded.search('long return')[0].id).toBe(star.id);
    });

    test('cross-galaxy routes have real in-range waypoints without materializing the route', () => {
        const catalog = new Catalog();
        const start = catalog.describeStar('star_-2048,-2048_0');
        const destination = catalog.describeStar('star_2047,2047_15');
        const plan = catalog.planRoute(start, destination);
        expect(plan.hops).toBeGreaterThan(1500);
        expect(plan.hops).toBeLessThan(8192);
        expect(plan.estimatedEnergy).toBeGreaterThan(plan.hops * 50);
        expect(catalog.sectors.size).toBe(0);
        const next = catalog.nextWaypoint(start, destination);
        expect(Math.hypot(next.position.x - start.position.x, next.position.y - start.position.y, next.position.z - start.position.z)).toBeLessThanOrEqual(450);
        expect(next.navigationBeacon).toBe(true);
        expect(catalog.nextWaypoint(destination, destination).id).toBe(destination.id);
    });

    test('route progress survives a save and invalid route coordinates are rejected', () => {
        const catalog = new Catalog();
        catalog.route = { destinationId: 'star_114,-992_0', completedHops: 7 };
        const loaded = new Catalog();
        loaded.restore(JSON.parse(JSON.stringify(catalog.serialize())));
        expect(loaded.route).toEqual(catalog.route);
        loaded.restore({ version: 1, journal: [], route: { destinationId: 'star_999999,0_0' } });
        expect(loaded.route).toBeNull();
    });

    test('legacy distant coordinates survive migration without changing the new catalog bounds', () => {
        const catalog = new Catalog();
        const legacy = { id: 'star_15000,21000_1', name: 'Legacy Frontier', seed: 771, position: { x: 1500011, y: 2100010, z: 0 }, discovered: true };
        catalog.remember(legacy, true);
        const restored = new Catalog();
        restored.restore(JSON.parse(JSON.stringify(catalog.serialize())));
        expect(restored.resolve(legacy.id)).toEqual(legacy);
        expect(Catalog.parseAddress(legacy.id)).toBeNull();
    });
});

describe('Pioneer universe travel and save compatibility', () => {
    let manager;
    let game;
    beforeAll(() => {
        global.PhysicsContext = { PRESETS: { PRIME: { name: 'Prime Universe' } } };
        require('../universe-manager.js');
        require('../local-system-view.js');
    });
    beforeEach(() => {
        game = {
            currentSystemId: 'kepler_186f', currentWorldSeed: 12345, day: 1,
            resources: { energy: 100000, credits: 100000, data: 100, dark_matter: 20 },
            systemStates: { kepler_186f: { seed: 12345, structures: [{ id: 'home-port' }] } },
            notify: jest.fn(), updateResourceUI: jest.fn(), recordColonyEvent: jest.fn(), saveGame: jest.fn(),
            executeWarp: jest.fn((star, invasion, costs) => {
                if (game.isOnMoon || game.resources.energy < costs.energy || game.resources.credits < costs.credits) return false;
                game.resources.energy -= costs.energy;
                game.resources.credits -= costs.credits;
                game.currentSystemId = star.id;
                game.currentWorldSeed = star.seed;
                return true;
            })
        };
        manager = new window.UniverseManager(game);
        // Unit travel tests exercise actual generation and charging; canvas rendering belongs to browser verification.
        manager.renderGalaxyMap = jest.fn();
        manager.openGalaxyMap = jest.fn();
    });

    test('keeps legacy home IDs and original colony state while sectors ignore the visited world seed', () => {
        const home = manager.getCurrentStar();
        expect(home.id).toBe('star_0,0_0');
        manager.prepareSystemArrival(home);
        expect(game.systemStates[home.id]).toBe(game.systemStates.kepler_186f);
        manager.generateGalacticSector(18, 19);
        const expected = JSON.parse(JSON.stringify(manager.resolveGalaxyStar('star_18,19_5')));
        game.currentWorldSeed = 998877;
        for (let x = 20; x < 60; x += 1) manager.generateGalacticSector(x, 90);
        expect(manager.resolveGalaxyStar('star_18,19_5')).toEqual(expected);
        expect(manager.galacticMap.stars.length).toBeLessThanOrEqual(416);
    });

    test('a plotted route performs world transitions and charges each real jump, then restores', () => {
        const destination = manager.resolveGalaxyStar('star_22,24_0');
        expect(manager.plotGalaxyRoute(destination.id)).toBe(true);
        const energy = game.resources.energy;
        expect(manager.jumpGalaxyRoute()).toBe(true);
        expect(game.currentSystemId).not.toBe('kepler_186f');
        expect(game.resources.energy).toBeLessThan(energy);
        expect(manager.streaming.route.completedHops).toBe(1);
        const snapshot = JSON.parse(JSON.stringify(manager.serializeGalacticState()));
        const reloaded = new window.UniverseManager(game);
        reloaded.renderGalaxyMap = jest.fn();
        expect(reloaded.restoreGalacticState(snapshot)).toBe(true);
        expect(reloaded.getCurrentStar().id).toBe(game.currentSystemId);
        expect(reloaded.streaming.route.destinationId).toBe(destination.id);
        expect(reloaded.streaming.route.completedHops).toBe(1);
    });

    test('expedition completes instead of charging then presenting an impossible normal warp', () => {
        const original = { ...game.resources };
        expect(manager.initiateIntergalacticJump()).toBe(true);
        expect(game.executeWarp).toHaveBeenCalledTimes(1);
        expect(game.currentSystemId).not.toBe('kepler_186f');
        expect(game.resources.energy).toBe(original.energy - 5000);
        expect(game.resources.credits).toBe(original.credits - 10000);
        expect(game.resources.dark_matter).toBe(original.dark_matter - 10);
    });

    test('blocked departure never consumes expedition fuel or currency', () => {
        const original = { ...game.resources };
        game.isOnMoon = true;
        expect(manager.initiateIntergalacticJump()).toBe(false);
        expect(game.resources).toEqual(original);
        expect(game.executeWarp).not.toHaveBeenCalled();
    });

    test('legacy migration offers a free, real return without discarding the distant world', () => {
        expect(manager.isLegacyRecoveryAvailable()).toBe(false);
        expect(manager.recoverLegacyWorld()).toBe(false);
        const legacy = { id: 'star_15000,16000_0', name: 'Legacy Colony', seed: 771, discovered: true, position: { x: 1500000, y: 1600000, z: 0 } };
        manager.streaming.remember(legacy, true);
        game.currentSystemId = legacy.id;
        game.systemStates[legacy.id] = { seed: 771, structures: [{ id: 'retained-distant-port' }] };
        game.resources.energy = 0;
        game.resources.credits = 0;
        manager.syncResidentGalaxy();
        expect(manager.streaming.planRoute(legacy, manager.resolveGalaxyStar('star_0,0_0'))).toBeNull();
        expect(manager.isLegacyRecoveryAvailable()).toBe(true);
        expect(manager.recoverLegacyWorld()).toBe(true);
        expect(game.currentSystemId).toBe('star_0,0_0');
        expect(game.resources.energy).toBe(0);
        expect(game.resources.credits).toBe(0);
        expect(game.systemStates[legacy.id].structures).toEqual([{ id: 'retained-distant-port' }]);
        expect(manager.streaming.describeStar(legacy.id)).toEqual(legacy);
        expect(manager.isLegacyRecoveryAvailable()).toBe(false);
    });

    test('local orbital worlds resolve to their host and preserve surveys across systems', () => {
        game.universe = manager;
        game.localSystemExplorer = new window.LocalSystemExplorer(game);
        const explorer = game.localSystemExplorer;
        const remote = manager.resolveGalaxyStar('star_12,-7_0');
        game.currentSystemId = remote.id;
        manager.onSystemArrival(remote);
        expect(explorer.system.id).toBe(remote.id);
        expect(explorer.system.planets.length).toBe(remote.planetCount);
        const target = explorer.system.planets[1];
        explorer.selectBody(target.id);
        explorer.surveySelected();
        expect(explorer.state.surveyed[target.id]).toBe(true);
        expect(explorer.visitSelectedOrbit()).toBe(true);
        expect(game.currentSystemId).toBe(target.id);
        expect(manager.getCurrentStar().id).toBe(remote.id);
        expect(game.currentWorldSeed).toBe(target.seed);
        const state = JSON.parse(JSON.stringify(explorer.serialize()));
        const restored = new window.LocalSystemExplorer(game);
        restored.restore(state);
        expect(restored.system.id).toBe(remote.id);
        expect(restored.state.visited[target.id]).toBe(true);
        expect(restored.state.activeBodyId).toBe(target.id);
        game.currentSystemId = 'kepler_186f';
        explorer.syncSystem();
        expect(explorer.system.id).toBe('kepler_186');
        game.currentSystemId = target.id;
        explorer.syncSystem();
        expect(explorer.state.visited[target.id]).toBe(true);
    });
});
