/**
 * Tactical Siege Blockade
 * Logic for strangling planetary trade and resource flow.
 */
class SiegeBlockade {
    constructor() {
        this.patrolRoutes = [];
        this.interceptionLog = [];
    }

    interceptRunner(runnerSpeed, fleetSensorPower) {
        const detectionChance = fleetSensorPower / (runnerSpeed * 0.1);
        const success = Math.random() < detectionChance;
        
        if (success) {
            this.interceptionLog.push({ timestamp: Date.now(), result: 'CARGO_SEIZED' });
        }
        return success;
    }

    getStarvationModifier(daysActive) {
        return Math.min(0.5, daysActive * 0.01);
    }
}

if (typeof module !== 'undefined') module.exports = SiegeBlockade;
