/**
 * Artificial Gravity Control (UPGRADED)
 * Logic for maintaining internal gravity and dampening inertial forces.
 */
class GravityGenerator {
    constructor() {
        this.gLevel = 1.0;
        this.dampeningEfficiency = 0.98;
        this.isCompensating = false;
    }

    /**
     * Dampens high-G maneuvers to protect the crew.
     */
    compensateInertia(gForce) {
        this.isCompensating = true;
        const internalForce = gForce * (1 - this.dampeningEfficiency);
        
        if (internalForce > 9.0) return 'INTERNAL_STRUCTURAL_STRESS_WARNING';
        return { compensated: true, feltG: internalForce };
    }

    setGLevel(target) {
        this.gLevel = Math.max(0, Math.min(2.0, target));
    }
}
if (typeof module !== 'undefined') module.exports = GravityGenerator;