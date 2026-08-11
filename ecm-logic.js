/**
 * Electronic Countermeasures (ECM) (UPGRADED)
 * Signal disruption and "ghost" signature generation for void warfare.
 */
class ECMLogic {
    constructor() {
        this.powerOutput = 500; // MW
        this.activeJamming = false;
        this.frequency = 12.5; // GHz
    }

    /**
     * Attempts to break a target's weapon lock.
     */
    scrambleLock(attackerSensorPower, distance) {
        const noiseFloor = (this.powerOutput / Math.pow(distance, 2)) * 1000;
        const signalToNoise = attackerSensorPower / (1 + noiseFloor);
        
        const lockBroken = signalToNoise < 1.5;
        return {
            success: lockBroken,
            disruptionLevel: noiseFloor,
            snr: signalToNoise
        };
    }

    generateDecoySignature() {
        return {
            heat: Math.random() * 5000,
            radarCrossSection: 'CAPITAL_CLASS',
            ttl: 60 // 60 seconds
        };
    }
}

if (typeof module !== 'undefined') module.exports = ECMLogic;