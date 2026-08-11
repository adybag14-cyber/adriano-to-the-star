/**
 * Entropy Manager
 * Phase 8: Chrono-Trigger
 * Simulates accelerated aging and de-aging of planetary bodies.
 */

class EntropyManager {
    constructor() {
        this.planetaryAge = {}; // Map of planet_id -> age_years
    }

    accelerateEntropy(planetId, years) {
        console.log(`⏳ Accelerating entropy for ${planetId} by ${years} years.`);

        if (!this.planetaryAge[planetId]) this.planetaryAge[planetId] = 0;
        this.planetaryAge[planetId] += years;

        this.updateVisuals(planetId);
    }

    reverseEntropy(planetId, years) {
        console.log(`✨ Reversing entropy for ${planetId} by ${years} years.`);

        if (!this.planetaryAge[planetId]) this.planetaryAge[planetId] = 0;
        this.planetaryAge[planetId] = Math.max(0, this.planetaryAge[planetId] - years);

        this.updateVisuals(planetId);
    }

    updateVisuals(planetId) {
        const age = this.planetaryAge[planetId];
        let state = "Primordial";

        if (age > 1000) state = "Habitable";
        if (age > 1000000) state = "Civilized";
        if (age > 1000000000) state = "Barren/Red Dwarf";

        console.log(`🪐 ${planetId} State: ${state} (Age: ${age} years)`);

        // If we had a shader, we would update uniforms here
        // e.g. planetMaterial.uniforms.age.value = age;
    }
}

if (typeof window !== 'undefined') {
    window.EntropyManager = EntropyManager;
    window.entropyManager = new EntropyManager();
}
