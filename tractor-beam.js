/**
 * Tractor Beam Logic (UPGRADED)
 * Physics-based gravitational tethering for towing and capturing objects.
 */
class TractorBeam {
    constructor() {
        this.activeTethers = new Map();
    }

    /**
     * Establishes a gravitational link.
     */
    attach(targetId, targetMass, distance) {
        const forceRequired = targetMass * (1 / Math.pow(distance, 2));
        if (forceRequired > 10000) return { success: false, error: 'INSUFFICIENT_GRAV_POWER' };

        this.activeTethers.set(targetId, { mass: targetMass, dist: distance });
        return { success: true, tension: forceRequired };
    }

    /**
     * Calculates the pull-back velocity.
     */
    calculatePull(targetId, power) {
        const tether = this.activeTethers.get(targetId);
        if (!tether) return 0;
        
        return power / tether.mass;
    }
}
if (typeof module !== 'undefined') module.exports = TractorBeam;