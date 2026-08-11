/**
 * Fleet Commander Experience (UPGRADED)
 * High-fidelity leveling system for military leadership and tactical skills.
 */
class CommanderXP {
    constructor() {
        this.level = 1;
        this.xp = 0;
        this.skillPoints = 0;
    }

    addExperience(amount) {
        this.xp += amount;
        const nextLevel = Math.floor(Math.sqrt(this.xp / 100)) + 1;
        if (nextLevel > this.level) {
            this.level = nextLevel;
            this.skillPoints += 2;
            return 'LEVEL_UP';
        }
        return 'XP_GAINED';
    }
}
if (typeof module !== 'undefined') module.exports = CommanderXP;