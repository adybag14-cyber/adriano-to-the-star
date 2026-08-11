/**
 * Tactical Retreat Engine (UPGRADED)
 * AI decision logic for determining when to break engagement and jump to safety.
 */
class TacticalRetreat {
    /**
     * Analyzes combat state to decide if flight is necessary.
     */
    shouldFlee(fleetStrength, enemyStrength, hullIntegrity) {
        const odds = fleetStrength / enemyStrength;
        const condition = hullIntegrity / 100;
        
        const fearFactor = (1 - odds) + (1 - condition);
        
        return {
            flee: fearFactor > 1.2,
            jumpWindow: condition * 10, // Seconds to safely jump
            moraleImpact: -15
        };
    }
}
if (typeof module !== 'undefined') module.exports = TacticalRetreat;