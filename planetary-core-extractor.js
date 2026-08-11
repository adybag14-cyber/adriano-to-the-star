/**
 * Planetary Core Extractor
 * Advanced drill for harvesting high-density materials from planetary cores
 */
class PlanetaryCoreExtractor {
    constructor() {
        this.depth = 0; // km
        this.temperature = 293; // Kelvin
        this.isDrilling = false;
    }

    drill(targetDepth) {
        this.isDrilling = true;
        const interval = setInterval(() => {
            this.depth += 1;
            this.temperature += 50;
            if (this.depth >= targetDepth || this.temperature > 6000) {
                this.isDrilling = false;
                clearInterval(interval);
            }
        }, 1000);
    }

    harvest() {
        if (this.depth < 1000) return null;
        return { nickel: 500, iron: 2000, iridium: 50 };
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = PlanetaryCoreExtractor;
