/**
 * Heatsink Cooling Logic (UPGRADED)
 * Manages active cooling systems and consumable heatsink ejectors.
 */
class HeatsinkLogic {
    constructor() {
        this.activeCoolant = 100; // %
        this.ejectableSinks = 3;
    }

    /**
     * Consumes a heatsink to instantly drop weapon heat.
     */
    ejectSink() {
        if (this.ejectableSinks <= 0) return { success: false, error: 'NO_SINKS_REMAINING' };
        this.ejectableSinks--;
        return { success: true, heatReduction: 500 };
    }

    rechargeCoolant(power) {
        this.activeCoolant = Math.min(100, this.activeCoolant + (power * 0.05));
    }
}
if (typeof module !== 'undefined') module.exports = HeatsinkLogic;