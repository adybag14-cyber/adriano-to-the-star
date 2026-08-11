/**
 * Cryo-Sleep Pod Logic (UPGRADED)
 * Biological stasis management for long-haul crews, including thaw-sickness math.
 */
class CryoSleep {
    constructor() {
        this.powerReq = 50; // MW per pod
        this.mortalityRate = 0.0001; // Base risk
    }

    thawCrew(durationMonths) {
        const sicknessRoll = Math.random() * (durationMonths / 12);
        return {
            success: Math.random() > this.mortalityRate,
            thawSickness: sicknessRoll > 0.5,
            recoveryTime: sicknessRoll * 24 // hours
        };
    }
}
if (typeof module !== 'undefined') module.exports = CryoSleep;