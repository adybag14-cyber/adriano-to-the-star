/**
 * Turret Rotation Speed (UPGRADED)
 * Physics solver for weapon tracking, traverse rates, and target leading accuracy.
 */
class TurretTracking {
    constructor(traverseRate = 45) {
        this.degPerSec = traverseRate; // Traverse speed
        this.currentBearing = 0;
    }

    /**
     * Calculates time required to rotate to target angle.
     */
    calculateTimeToTarget(targetAngle) {
        const delta = Math.abs(targetAngle - this.currentBearing);
        const shortestPath = delta > 180 ? 360 - delta : delta;
        return shortestPath / this.degPerSec;
    }

    updateBearing(deltaTime, targetAngle) {
        const delta = targetAngle - this.currentBearing;
        const step = Math.sign(delta) * this.degPerSec * deltaTime;
        this.currentBearing += (Math.abs(step) > Math.abs(delta)) ? delta : step;
        return this.currentBearing;
    }
}
if (typeof module !== 'undefined') module.exports = TurretTracking;