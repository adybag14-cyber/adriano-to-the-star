/** Browser-side provisioning for the expedition fixture; never changes survival or probe logic. */
export function provisionPioneerGalaxyExpansion({ crewOnly = false } = {}) {
    const game = window.game;
    const keys = crewOnly ? ['food', 'oxygen'] : ['energy', 'data', 'credits', 'alloys', 'circuits', 'food', 'oxygen'];
    const before = Object.fromEntries(keys.map(key => [key, Number(game.resources[key] || 0)]));
    for (const key of keys) {
        game.caps[key] = Math.max(Number(game.caps[key] || 0), 10000);
        game.resources[key] = Math.max(Number(game.resources[key] || 0), 5000);
    }
    game.updateResourceUI();
    return {
        before,
        after: Object.fromEntries(keys.map(key => [key, game.resources[key]])),
        caps: Object.fromEntries(keys.map(key => [key, game.caps[key]])),
        colonists: game.colonists.length,
        paused: game.isPaused,
        speed: game.timeScale,
        runwayAtTen: game.getSimulationRunway(10)
    };
}
