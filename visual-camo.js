/**
 * Visual Camouflage Array (UPGRADED)
 * Active adaptive optics for masking ships against starfields or planetary surfaces.
 */
class VisualCamo {
    constructor() {
        this.distortionLevel = 0.05;
        this.isActive = false;
    }

    engage(power) {
        this.isActive = true;
        this.distortionLevel = 1 / power;
        return { active: true, fidelity: 1 - this.distortionLevel };
    }

    /**
     * Checks if camouflaged object is spotted by optical sensors.
     */
    checkSpotting(observerSkill, dist) {
        const threshold = observerSkill * (1 / dist);
        return threshold > (1 - this.distortionLevel);
    }
}
if (typeof module !== 'undefined') module.exports = VisualCamo;