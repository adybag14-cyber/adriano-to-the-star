/**
 * MultiverseGenerators.js
 * Handles procedural generation for alternate universes.
 */

class MultiverseGenerators {
    static generateMirrorState(gameState) {
        console.log("Generating Mirror Universe...");
        const mirrorState = {
            factions: {},
            npcs: [],
            physicsModifier: 1.2 // Roadmap Item 319: Variable Physics
        };

        // Invert Factions
        if (gameState.factionManager && gameState.factionManager.factions) {
            for (const [id, faction] of Object.entries(gameState.factionManager.factions)) {
                mirrorState.factions[id] = {
                    ...faction,
                    name: this.invertName(faction.name),
                    description: `Mirror version of ${faction.name}.`,
                    alignment: -(faction.alignment || 0), // Invert alignment
                    ideology: this.invertIdeology(faction.ideology) // Item 320
                };
            }
        }

        return mirrorState;
    }

    static invertIdeology(ideology) {
        const map = {
            'Expansionist': 'Isolationist',
            'Technocracy': 'Primitivism',
            'Corporate': 'Communal',
            'Peaceful': 'Militaristic',
            'Hostile': 'Altruistic'
        };
        return map[ideology] || 'Strange';
    }

    static invertName(name) {
        const prefixes = ['Dark', 'Evil', 'Mirror', 'Anti-', 'Nega-'];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return `${randomPrefix}${name}`;
    }

    static generateVoidState() {
        // Roadmap Item 321: The Void (Pure Energy dimension)
        return {
            isVoid: true,
            energyDensity: 5.0, // High energy, low matter
            oxygenDecay: 2.0, // Harsh environment
            floatingStructures: [],
            visibility: 0.2
        };
    }

    static generateEntropicState() {
        // Roadmap Item 322: Entropic worlds (Reverse time flow)
        return {
            timeFlow: -1.0, 
            decayRate: -0.5, // Things "heal" over time but knowledge is lost
            entropyLevel: 100
        };
    }
}

window.MultiverseGenerators = MultiverseGenerators;
