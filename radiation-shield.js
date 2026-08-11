/**
 * Radiation Shielding Core (UPGRADED)
 * Tracks cumulative ionizing radiation dose and manages magnetic shield strength.
 */
class RadiationShield {
    constructor() {
        this.magneticFieldStrength = 1.0;
        this.cumulativeDose = 0; // millisieverts
        this.shieldStability = 1.0;
    }

    /**
     * Deflects solar or cosmic radiation.
     */
    deflect(ambientRad) {
        const penetration = ambientRad * (1 - this.magneticFieldStrength);
        this.cumulativeDose += penetration;
        
        // High dose impacts crew efficiency
        const efficiencyPenalty = this.cumulativeDose > 500 ? 0.2 : 0;
        
        return {
            penetration,
            totalDose: this.cumulativeDose,
            penalty: efficiencyPenalty
        };
    }

    rechargeShield(power) {
        this.magneticFieldStrength = Math.min(1.0, this.magneticFieldStrength + (power * 0.01));
    }
}
if (typeof module !== 'undefined') module.exports = RadiationShield;