/**
 * MutationEngine.js
 * The "Self-Modifying" Core of the Beyond Infinity update.
 * Generates procedural JavaScript functions to optimize game loops.
 */

class MutationEngine {
    constructor(game) {
        this.game = game;
        this.activeMutations = [];
        this.generation = 1;
    }

    init() {
        console.log("Mutation Engine: Evolution protocols active.");
    }

    /**
     * Attempts to generate a beneficial code snippet
     * In a real AI scenario, this would write actual code.
     * Here we simulated it by constructing function strings.
     */
    triggerMutation() {
        const type = Math.random() > 0.5 ? "mining" : "energy";
        let codeString = "";
        let description = "";

        // Procedural Logic Generation
        if (type === "mining") {
            // Generate a random multiplier formula
            const factor = (1.1 + Math.random()).toFixed(2);
            codeString = `return baseOutput * ${factor} + (Math.sin(Date.now() / 1000) * 10);`;
            description = `Optimized Drill Algorithm v${this.generation++}`;

            // Inject into game (Simulated override)
            if (this.game.modifiers) {
                this.game.modifiers.mineOutput = parseFloat(factor);
            }
        } else {
            const staticBonus = Math.floor(Math.random() * 50);
            codeString = `return baseEnergy + ${staticBonus}; // Static flux boost`;
            description = `Zero-Point Harvest Protocol v${this.generation++}`;

            if (this.game.modifiers) {
                this.game.modifiers.energyRate = 1.0 + (staticBonus / 100);
            }
        }

        // Store the "Source Code"
        const mutation = {
            id: Date.now(),
            type: type,
            source: codeString,
            desc: description,
            active: true
        };

        this.activeMutations.push(mutation);
        this.game.notify(`System Mutated: ${description}`, "success");
        return mutation;
    }

    getActiveCode() {
        return this.activeMutations.map(m => `// ${m.desc}\n${m.source}`).join('\n\n');
    }
}

window.MutationEngine = MutationEngine;
