/**
 * 🧬 EXOPLANET PIONEER: GENETIC MEMORY PRESTIGE SYSTEM
 * Item 7008: Infinite NG+ attribute inheritance.
 * 
 * This system allows players to pass down "Memetic Fragments" to 
 * future simulation iterations after an Omega Point reset.
 */

class GeneticMemoryPrestige {
    constructor() {
        this.memeticFragments = this.loadMemory();
        this.generation = parseInt(localStorage.getItem('ep_generation') || 1);
        
        console.log(`🧬 Genetic Memory: Generation ${this.generation} sync complete.`);
    }

    loadMemory() {
        const data = localStorage.getItem('ep_genetic_memory');
        return data ? JSON.parse(data) : {
            cognitiveBoost: 0,    // Increases research speed
            industrialEfficiency: 0, // Reduces build costs
            diplomaticCharisma: 0, // Better NPC relations
            realityStability: 0    // Reduces paradox buildup
        };
    }

    saveMemory() {
        localStorage.setItem('ep_genetic_memory', JSON.stringify(this.memeticFragments));
        localStorage.setItem('ep_generation', this.generation);
    }

    /**
     * Called during the Omega Point Apotheosis to calculate inheritance.
     */
    calculateInheritance(finalStats) {
        console.log("🧬 Calculating memetic inheritance for next generation...");
        
        // Example: 1% of total knowledge becomes a cognitive boost
        const knowledgeGain = Math.floor((finalStats.knowledge || 0) / 1000);
        this.memeticFragments.cognitiveBoost += knowledgeGain;

        // Example: Every 10 planets colonized adds industrial efficiency
        const industrialGain = Math.floor((finalStats.planetsColonized || 0) / 10);
        this.memeticFragments.industrialEfficiency += industrialGain;

        this.generation++;
        this.saveMemory();
        
        return this.memeticFragments;
    }

    getModifier(type) {
        const base = this.memeticFragments[type] || 0;
        // logarithmic scaling to prevent infinite OP-ness early on
        return 1 + (Math.log10(base + 1) * 0.1); 
    }

    applyModifiers(game) {
        if (!game.modifiers) game.modifiers = {};
        
        game.modifiers.researchSpeed = this.getModifier('cognitiveBoost');
        game.modifiers.buildCost = 1 / this.getModifier('industrialEfficiency');
        game.modifiers.charisma = this.getModifier('diplomaticCharisma');
        game.modifiers.stability = this.getModifier('realityStability');
        
        console.log("🧬 Genetic Modifiers Applied:", game.modifiers);
    }
}

export const geneticMemory = new GeneticMemoryPrestige();
window.geneticMemory = geneticMemory;
