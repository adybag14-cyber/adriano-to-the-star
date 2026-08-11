/**
 * Gravity Well Generator (UPGRADED)
 * Simulates artificial mass shadows to prevent FTL escape.
 */
class GravityWell {
    constructor() {
        this.fieldRadius = 50000; // km
        this.intensity = 1.0;
        this.heatGeneration = 100;
    }

    /**
     * Interdicts all ships in range.
     */
    isShipTrapped(shipPos, generatorPos) {
        const dist = Math.sqrt(
            Math.pow(shipPos.x - generatorPos.x, 2) +
            Math.pow(shipPos.y - generatorPos.y, 2)
        );

        const trapStrength = (this.intensity * 1000) / dist;
        return trapStrength > 0.05; // Ship cannot engage jump drive
    }

    modulateIntensity(delta) {
        this.intensity = Math.max(0.1, Math.min(2.0, this.intensity + delta));
        this.heatGeneration *= this.intensity;
    }
}

if (typeof module !== 'undefined') module.exports = GravityWell;