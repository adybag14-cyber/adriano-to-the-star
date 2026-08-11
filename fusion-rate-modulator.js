/**
 * Fusion Rate Modulator
 * Controls the core fusion intensity of a star for engineering purposes
 */
class FusionRateModulator {
    constructor() {
        this.currentModulation = 1.0; // 1.0 = standard solar fusion
        this.isSafetyLocked = true;
    }

    modulate(delta) {
        if (this.isSafetyLocked) return this.currentModulation;
        this.currentModulation += delta;
        this.currentModulation = Math.max(0.8, Math.min(1.5, this.currentModulation));
        return this.currentModulation;
    }

    calculateStarLuminosity(baseLuminosity) {
        return baseLuminosity * Math.pow(this.currentModulation, 4);
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = FusionRateModulator;
