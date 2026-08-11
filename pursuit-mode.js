/**
 * Pursuit Mode Logic (UPGRADED)
 * Navigational overrides for maximizing starship intercept velocity.
 */
class PursuitMode {
    constructor() {
        this.overdriveActive = false;
    }

    /**
     * Engages reactor-unsafe thrust levels to catch a fleeing target.
     */
    engageOverdrive() {
        this.overdriveActive = true;
        return {
            accelerationBonus: 2.5,
            engineWearRate: 5.0,
            heatGen: 250
        };
    }

    calculateTimetoIntercept(dist, targetVel, selfVel) {
        const relativeVel = (selfVel * (this.overdriveActive ? 2.5 : 1.0)) - targetVel;
        return dist / relativeVel;
    }
}
if (typeof module !== 'undefined') module.exports = PursuitMode;