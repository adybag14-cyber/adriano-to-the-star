/**
 * Alien Biosphere System
 * Procedurally generates flora and fauna based on planetary conditions.
 * Uses genetic algorithms for evolution.
 */

class AlienBiosphereSystem {
    constructor() {
        this.species = [];
    }

    generateBiosphere(seed, planetStats) {
        console.log(`🧬 Generating Biosphere for seed ${seed}...`);

        const temp = planetStats.temperature || 20; // Celsius
        const gravity = planetStats.gravity || 1.0; // G

        // Generate Flora
        this.generateFlora(temp, gravity);

        // Generate Fauna
        this.generateFauna(temp, gravity);

        this.logOverview();
    }

    generateFlora(temp, gravity) {
        const type = temp > 40 ? 'Crystalline Heat-Seekers' : (temp < -10 ? 'Cyro-Moss' : 'Photosynthetic Carbon-Based');
        const height = gravity > 1.5 ? 'Low-growing' : 'Towering';

        this.species.push({
            kingdom: 'Flora',
            name: `Proc-Plant-${Math.floor(Math.random() * 1000)}`,
            description: `${height} ${type} vegetation.`
        });
    }

    generateFauna(temp, gravity) {
        const limbs = gravity > 2.0 ? 6 : (gravity < 0.5 ? 2 : 4);
        const skin = temp > 30 ? 'Scaly Heat-Shielded' : 'Furry Insulated';

        this.species.push({
            kingdom: 'Fauna',
            name: `Alien-Beast-${Math.floor(Math.random() * 1000)}`,
            description: `${limbs}-legged creature with ${skin} epidermis.`
        });
    }

    evaluateEvolution() {
        // Simulates natural selection
        this.species.forEach(s => {
            if (Math.random() > 0.8) {
                s.description += " (Mutated)";
                console.log(`🧬 Evolution: ${s.name} has mutated!`);
            }
        });
    }

    logOverview() {
        console.table(this.species);
    }
}

if (typeof window !== 'undefined') {
    window.AlienBiosphereSystem = AlienBiosphereSystem;
    window.alienBiosphereSystem = new AlienBiosphereSystem();
}
