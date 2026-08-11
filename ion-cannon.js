/**
 * Ion Cannon Disable Logic (UPGRADED)
 * Complex simulation of ionic discharge impacting shipboard electronic systems.
 */
class IonCannon {
    constructor() {
        this.dischargePower = 5000; // Gigajoules
        this.ionicDensity = 1.0;
    }

    /**
     * Calculates the duration and severity of a system shutdown.
     */
    calculateShutdown(targetECCM, targetSize) {
        const effectivePower = this.dischargePower * (1 - (targetECCM / 100));
        const shutdownDuration = (effectivePower / targetSize) * 10; // Seconds
        
        return {
            duration: shutdownDuration,
            subsystemsImpacted: ['NAVIGATION', 'WEAPONS', 'SHIELDS'],
            rebootComplexity: shutdownDuration * 0.5
        };
    }

    checkArcedCurrent(nearbyShips) {
        return nearbyShips.filter(s => s.distance < 500); // Chain lightning effect
    }
}
if (typeof module !== 'undefined') module.exports = IonCannon;