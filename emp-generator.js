/**
 * EMP Pulse Generator (UPGRADED)
 * Wide-area electromagnetic interference logic for disabling fleet networks.
 */
class EMPGenerator {
    constructor() {
        this.charge = 0;
    }

    /**
     * Detonates the EMP.
     */
    firePulse(power) {
        return {
            radius: power * 100,
            intensity: power,
            falloff: 0.1, // Intensity drop per km
            duration: power * 2 // Seconds
        };
    }

    getDamageToElectronics(dist, power) {
        return power / Math.max(1, Math.pow(dist, 2));
    }
}
if (typeof module !== 'undefined') module.exports = EMPGenerator;