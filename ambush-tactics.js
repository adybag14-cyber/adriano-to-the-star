/**
 * Ambush Tactics Hub (UPGRADED)
 * Specialized logic for pre-planned strikes using celestial cover (Nebulae, Pulsars).
 */
class AmbushTactics {
    /**
     * Calculates the damage bonus for a surprise strike.
     */
    getAmbushMultiplier(stealthLevel, environmentType) {
        let envBonus = 1.0;
        if (environmentType === 'NEBULA') envBonus = 1.5;
        if (environmentType === 'ASTEROID_FIELD') envBonus = 1.25;

        return stealthLevel * envBonus * 2.0;
    }

    triggerSurprise(fleet) {
        return fleet.map(s => ({ ...s, firstStrike: true, accuracy: 1.0 }));
    }
}
if (typeof module !== 'undefined') module.exports = AmbushTactics;