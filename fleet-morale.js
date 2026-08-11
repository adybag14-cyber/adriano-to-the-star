/**
 * Fleet Morale Monitor (UPGRADED)
 * Models crew psychological state based on combat stress, 
 * supplies, and recent victories.
 */
class FleetMorale {
    constructor() {
        this.baseMorale = 100;
        this.traumaLog = [];
    }

    /**
     * Updates morale based on a battle event.
     */
    processEvent(eventType, casualties) {
        let decay = 0;
        if (eventType === 'DEFEAT') decay = 20;
        if (eventType === 'SHIP_LOST') decay = 10 + (casualties / 100);
        if (eventType === 'VICTORY') decay = -15; // Restoration

        this.baseMorale = Math.max(0, Math.min(100, this.baseMorale - decay));
        return this.baseMorale;
    }

    getPerformanceMultiplier() {
        // Morale < 50 results in a combat penalty
        if (this.baseMorale < 20) return 0.5;
        if (this.baseMorale < 50) return 0.8;
        return 1.0;
    }
}

if (typeof module !== 'undefined') module.exports = FleetMorale;