/**
 * Admiral Leadership Bonus (UPGRADED)
 * Algorithmic modifiers for fleet performance based on command XP and traits.
 */
class AdmiralLeadership {
    constructor(name, rank, traits = []) {
        this.name = name;
        this.rank = rank;
        this.traits = traits; // e.g., 'TACTICIAN', 'LOGISTICIAN', 'INSPIRING'
        this.xp = 0;
    }

    /**
     * Calculates the active bonus for a given fleet.
     */
    getFleetModifiers() {
        const base = 1.0;
        const rankMod = (this.xp / 10000) * 0.1;
        
        const mods = {
            attack: base + rankMod,
            defense: base + rankMod,
            logistics: base + rankMod
        };

        if (this.traits.includes('TACTICIAN')) mods.attack += 0.15;
        if (this.traits.includes('LOGISTICIAN')) mods.logistics += 0.25;
        if (this.traits.includes('INSPIRING')) mods.defense += 0.1;

        return mods;
    }

    addExperience(amount) {
        this.xp += amount;
        if (this.xp > 5000 && this.rank === 'CAPTAIN') this.rank = 'COMMODORE';
    }
}
if (typeof module !== 'undefined') module.exports = AdmiralLeadership;