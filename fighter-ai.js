/**
 * Fighter Pilot AI (UPGRADED)
 * Autonomous tactical decision engine for squadron craft.
 */
class FighterAI {
    constructor(experience = 'ROOKIE') {
        this.xp = experience; // ROOKIE, VETERAN, ACE
        this.targetingPriority = 'CLOSEST';
        this.energyManagement = 'BALANCED';
    }

    /**
     * Decides next maneuver based on combat context.
     */
    decideManeuver(enemies, health, ammo) {
        if (health < 20) return 'EVASIVE_RETREAT';
        if (ammo === 0) return 'RETURN_TO_CARRIER';

        const mods = { 'ROOKIE': 0.5, 'VETERAN': 0.8, 'ACE': 1.2 };
        const confidence = Math.random() * mods[this.xp];

        if (confidence > 0.7) return 'AGGRESSIVE_INTERCEPT';
        return 'MAINTAIN_ESCORT_WING';
    }

    calculateEvasion(incomingFireAngle) {
        const baseEvasion = this.xp === 'ACE' ? 0.4 : 0.1;
        return Math.random() < baseEvasion;
    }
}

if (typeof module !== 'undefined') module.exports = FighterAI;