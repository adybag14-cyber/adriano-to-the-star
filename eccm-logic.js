/**
 * Electronic Counter-Countermeasures (ECCM) (UPGRADED)
 * Advanced signal filtering and anti-jamming resolution logic.
 */
class ECCMLogic {
    constructor() {
        this.filterStrength = 0.8;
        this.frequencyHoppingActive = true;
    }

    /**
     * Counters incoming ECM noise to restore signal clarity.
     */
    counterJamming(noiseLevel, attackerPower) {
        const filtering = noiseLevel * this.filterStrength;
        const residualNoise = noiseLevel - filtering;
        
        // Frequency hopping reduces the impact of narrow-band jamming
        const finalImpact = this.frequencyHoppingActive ? (residualNoise * 0.2) : residualNoise;
        
        return {
            originalNoise: noiseLevel,
            filteredNoise: finalImpact,
            signalRecovery: (noiseLevel - finalImpact) / noiseLevel
        };
    }
}
if (typeof module !== 'undefined') module.exports = ECCMLogic;