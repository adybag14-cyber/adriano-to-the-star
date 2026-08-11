/**
 * Ace Pilot Skill Bonus (UPGRADED)
 * High-tier tactical modifiers for legendary squadron commanders.
 */
class AcePilot {
    constructor(pilotName) {
        this.name = pilotName;
        this.kills = 0;
        this.rank = 'ACE';
    }

    /**
     * Applies buffs to the squadron during an engagement.
     */
    applyCombatBuffs(squadron) {
        return squadron.map(craft => ({
            ...craft,
            evasion: craft.evasion * 1.5,
            criticalChance: craft.criticalChance + 0.1
        }));
    }

    triggerSignatureMove() {
        return 'BARREL_ROLL_STRIKE_ACTIVE';
    }
}
if (typeof module !== 'undefined') module.exports = AcePilot;