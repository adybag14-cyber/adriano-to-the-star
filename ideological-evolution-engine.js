/**
 * 🏛️ EXOPLANET PIONEER: IDEOLOGICAL EVOLUTION ENGINE
 * Item 1006: Faction-level ideological evolution based on environmental scarcity.
 */

class IdeologicalEvolutionEngine {
    constructor() {
        this.factionIdeologies = {
            "SOL_FEDERATION": { collectivism: 0.5, militantism: 0.2, industrialism: 0.8 },
            "VOID_ALLIANCE": { collectivism: 0.9, militantism: 0.1, industrialism: 0.3 }
        };
        console.log("🏛️ Political Engine: Ideological state vectors synchronized.");
    }

    /**
     * Evolve a faction's ideology based on resource scarcity.
     */
    processScarcity(factionId, resourceType, scarcityLevel) {
        const ideology = this.factionIdeologies[factionId];
        if (!ideology) return;

        if (scarcityLevel > 0.8) {
            // High scarcity breeds militantism and collectivism (survival)
            ideology.militantism = Math.min(1.0, ideology.militantism + 0.05);
            ideology.collectivism = Math.min(1.0, ideology.collectivism + 0.02);
            console.log(`[POLITICS] Faction ${factionId} becoming more MILITANT due to ${resourceType} shortage.`);
        }
        
        this.fireEvent("IDEOLOGY_SHIFTED", { faction: factionId, current: ideology });
    }

    fireEvent(type, data) {
        window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
}

export const ideologicalEvolution = new IdeologicalEvolutionEngine();
window.ideologicalEvolution = ideologicalEvolution;
