/**
 * Fire Suppression System (UPGRADED)
 * Thermodynamic logic for shipboard fire extinguishing using halon and vacuum venting.
 */
class FireSuppression {
    constructor() {
        this.halonLevel = 100;
        this.ventingActive = false;
    }

    /**
     * Resolves a fire event in a specific ship section.
     */
    extinguish(section, intensity) {
        if (this.ventingActive) {
            section.oxygen = 0;
            return { result: 'FIRE_EXTINGUISHED_VACUUM', casualtyRisk: 0.8 };
        }

        const halonUsed = intensity * 2;
        if (this.halonLevel >= halonUsed) {
            this.halonLevel -= halonUsed;
            return { result: 'FIRE_SUPPRESSED_CHEMICAL', casualtyRisk: 0.1 };
        }

        return { result: 'SUPPRESSION_FAILED_INSUFFICIENT_HALON', casualtyRisk: 0.5 };
    }

    toggleVenting() {
        this.ventingActive = !this.ventingActive;
    }
}
if (typeof module !== 'undefined') module.exports = FireSuppression;