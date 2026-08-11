/**
 * Stealth Fleet Logic (UPGRADED)
 * Aggregates group heat and radar signatures to calculate fleet-wide detection risks.
 */
class StealthFleet {
    constructor() {
        this.aggregateSignature = 0;
        this.passiveBafflingActive = false;
    }

    /**
     * Calculates the total detectable signature of a ship group.
     */
    calculateFleetSignature(ships) {
        let totalHeat = 0;
        let totalRCS = 0;

        ships.forEach(s => {
            totalHeat += s.heatOutput || 100;
            totalRCS += s.radarCrossSection || 50;
        });

        const groupingPenalty = Math.log(ships.size + 1);
        this.aggregateSignature = (totalHeat + totalRCS) * groupingPenalty;

        if (this.passiveBafflingActive) this.aggregateSignature *= 0.4;

        return this.aggregateSignature;
    }

    isDetected(enemyScannerPower, distance) {
        const threshold = (enemyScannerPower / Math.pow(distance, 2)) * 1000;
        return threshold > this.aggregateSignature;
    }
}
if (typeof module !== 'undefined') module.exports = StealthFleet;
