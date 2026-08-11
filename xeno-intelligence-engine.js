/**
 * Xeno-Intelligence & Biological Simulation Core (XIBSC) - ULTIMATE STANDARD
 * 
 * An expert-tier engine for simulating non-human life and intelligence.
 * Unifies: alien-biology, alien-language-decoder, population-growth, 
 * and biological stressors.
 */

class XenoIntelligenceEngine {
    constructor() {
        this.species = new Map();
        this.translationMatrix = {
            phonemes: 0,
            semanticNodes: new Map(),
            culturalDrift: 0.0
        };
        this.demographics = {
            history: [],
            globalVigor: 1.0
        };
    }

    // =========================================================================
    // 1. GENETIC DRIFT & METABOLIC ADAPTATION
    // =========================================================================

    /**
     * Models cellular adaptation to environmental stressors.
     */
    simulateAdaptation(speciesId, environment, deltaTime) {
        const s = this.species.get(speciesId);
        if (!s) return null;

        const tempStress = Math.abs(environment.temp - s.optima.temp) / s.optima.tolerance;
        const radStress = environment.radiation * (1 - s.resistance.rad);
        
        const totalStress = (tempStress * 0.5) + (radStress * 0.5);
        
        // Bayesian Adaptation: Species attempts to shift optima towards stressor
        if (totalStress > 0.3) {
            const shift = (environment.temp - s.optima.temp) * 0.01 * deltaTime;
            s.optima.temp += shift;
            s.viability -= (totalStress * 0.05 * deltaTime);
        }

        return { viability: s.viability, currentStress: totalStress };
    }

    // =========================================================================
    // 2. LINGUISTIC DECIPHERING & SEMANTIC MAPPING
    // =========================================================================

    /**
     * Translates alien signals by mapping phonemes to semantic concepts.
     */
    decipherSignal(signal, cpuPower) {
        const entropy = this.calculateShannonEntropy(signal);
        const progress = (cpuPower / (entropy * 1000));
        
        this.translationMatrix.phonemes += progress;
        
        if (this.translationMatrix.phonemes > 100) {
            const conceptId = `CONCEPT-${this.translationMatrix.semanticNodes.size}`;
            this.translationMatrix.semanticNodes.set(conceptId, { precision: 0.1 });
        }

        const completion = Math.min(1.0, this.translationMatrix.phonemes / 5000);
        return { status: completion >= 1.0 ? 'DECIPHERED' : 'ANALYZING', progress: completion };
    }

    calculateShannonEntropy(data) {
        const freqs = {};
        for (let char of data) freqs[char] = (freqs[char] || 0) + 1;
        return Object.values(freqs).reduce((sum, f) => {
            const p = f / data.length;
            return sum - p * Math.log2(p);
        }, 0);
    }

    // =========================================================================
    // 3. POPULATION DYNAMICS (VERHULST MODEL)
    // =========================================================================

    tickPopulation(popData, health, food, deltaTime) {
        // Carrying capacity K modified by planetary health and resource scarcity
        const K = popData.maxCap * health * Math.min(1.0, food / 100);
        const r = popData.growthRate;
        const P = popData.currentPop;

        const growth = r * P * (1 - P / Math.max(1, K));
        popData.currentPop += growth * deltaTime;

        return { newPop: popData.currentPop, scarcityIndex: 1 - (food / 100) };
    }
}

if (typeof window !== 'undefined') window.xenoIntelligenceEngine = new XenoIntelligenceEngine();
if (typeof module !== 'undefined') module.exports = XenoIntelligenceEngine;