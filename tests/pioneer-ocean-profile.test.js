describe('Pioneer procedural ocean world scenarios', () => {
    beforeAll(() => { require('../planet-generator.js'); });

    function basinCoverage(seed, type) {
        const profile = window.normalizePlanetPhysicalProfile(null, seed, type);
        let wet = 0;
        const count = 600;
        for (let i = 0; i < count; i++) {
            const y = 1 - 2 * (i + 0.5) / count;
            const phi = i * Math.PI * (3 - Math.sqrt(5));
            const radius = Math.sqrt(1 - y * y);
            const height = window.getTerrainHeight(Math.cos(phi) * radius, y, Math.sin(phi) * radius, seed, profile, type);
            if (height < -0.18) wet++;
        }
        return wet / count;
    }

    test.each([1, 42, 12345])('water-rich seed %s has a predominantly submerged surface', seed => {
        const ocean = window.normalizePlanetPhysicalProfile(null, seed, 'ocean');
        const rocky = window.normalizePlanetPhysicalProfile(null, seed, 'planet');
        expect(ocean.waterPotential).toBeGreaterThan(.85);
        expect(ocean.waterPotential).toBeGreaterThan(rocky.waterPotential);
        expect(ocean.liquidWaterPotential).toBeGreaterThan(.5);
        expect(ocean.climateRegime).toBe('ocean-world-scenario');
        expect(basinCoverage(seed, 'ocean')).toBeGreaterThan(.70);
        expect(basinCoverage(seed, 'ocean')).toBeGreaterThan(basinCoverage(seed, 'planet') + .20);
        expect(ocean.resolvedSurfaceData).toBe(false);
        expect(ocean.provenance).toBe('procedural-inference');
    });

    test('explicit irradiation and temperature override the temperate ocean prior', () => {
        const frozen = window.normalizePlanetPhysicalProfile({ insolationEarth:.05, surfaceTemperatureK:150 }, 42, 'ocean');
        const steam = window.normalizePlanetPhysicalProfile({ insolationEarth:25, surfaceTemperatureK:700 }, 42, 'ocean');
        expect(frozen.insolationEarth).toBe(.05);
        expect(steam.insolationEarth).toBe(25);
        expect(frozen.climateRegime).toBe('frozen-ocean-scenario');
        expect(steam.climateRegime).toBe('steam-ocean-scenario');
        expect(frozen.liquidWaterPotential).toBe(0);
        expect(steam.liquidWaterPotential).toBe(0);
    });
});
