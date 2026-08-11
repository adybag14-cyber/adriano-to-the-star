/**
 * TimeCapsuleManager.js
 * Manages the "Million Year Jump" (Prestige) mechanic.
 * Resets the game but keeps "Genetic Memory" (permanent multipliers).
 */

class TimeCapsuleManager {
    constructor(game) {
        this.game = game;
        this.generation = 1;
        this.geneticBuffs = {
            resourceMul: 1.0,
            techSpeed: 1.0
        };
    }

    init() {
        // Load existing prestige data if any
        const savedGen = localStorage.getItem('ep_generation');
        const savedBuffs = localStorage.getItem('ep_genetic_buffs');

        if (savedGen) this.generation = parseInt(savedGen);
        if (savedBuffs) this.geneticBuffs = JSON.parse(savedBuffs);

        if (this.generation > 1) {
            console.log(`Welcome back, Pioneer. Generation ${this.generation}.`);
            // Apply buffs
            this.applyBuffs();
        }
    }

    applyBuffs() {
        // Apply buffs to game state
        if (this.game.applyGeneticMemory) {
            this.game.applyGeneticMemory();
        }

        // For simplicity, we'll just inject a notification for now, 
        // the game loop logic would need to check this.geneticBuffs.
        if (this.game.toggleLoading) { // Check if UI is ready
            setTimeout(() => {
                this.game.notify(`🧬 Genetic Memory Active: Gen ${this.generation}`, "success");
                this.game.notify(`Production x${this.geneticBuffs.resourceMul.toFixed(1)}`, "info");
            }, 2000);
        }
    }

    encodeCurrentState() {
        const score = Math.floor(this.game.resources.energy + this.game.resources.minerals + (this.game.resources.knowledge * 10));
        const tech = Object.keys(this.game.technologies || {}).length;

        return {
            gen: this.generation,
            tech: tech,
            score: score
        };
    }

    triggerTimeJump() {
        if (!confirm("⚠️ WARNING: MILLION YEAR JUMP ⚠️\n\nThis will RESET your universe.\nOnly your DNA (Genetic Memory) will survive.\n\nYou will gain permanent multipliers based on your current progress.\n\nAre you sure?")) {
            return;
        }

        const state = this.encodeCurrentState();

        // calculate new buffs
        const scoreBonus = state.score / 10000; // 10000 res = +10%?
        // Simple formula:
        const nextMul = this.geneticBuffs.resourceMul + (state.score * 0.00001);

        const nextBuffs = {
            resourceMul: nextMul,
            techSpeed: this.geneticBuffs.techSpeed + 0.1
        };

        const nextGen = this.generation + 1;

        // Save new stats
        localStorage.setItem('ep_generation', nextGen);
        localStorage.setItem('ep_genetic_buffs', JSON.stringify(nextBuffs));

        // Generate DNA for visuals before reloading
        let dna = "ATCG";
        if (this.game.dna) {
            dna = this.game.dna.encodePrestige(state);
        }

        // Visual effect then reload
        this.game.notify("🧬 ENCODING GENOME...", "warning");
        this.game.notify("⌛ JUMPING 1,000,000 YEARS...", "error");

        document.body.style.transition = "opacity 3s";
        document.body.style.opacity = "0";

        setTimeout(() => {
            location.reload();
        }, 3000);
    }
}

window.TimeCapsuleManager = TimeCapsuleManager;
