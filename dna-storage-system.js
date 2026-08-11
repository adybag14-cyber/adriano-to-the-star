/**
 * DNAStorageSystem.js
 * Manages the encoding of game state into synthetic DNA strings (ATCG).
 * Also handles "mutation" simulation for long-term storage degradation.
 */

class DNAStorageSystem {
    constructor(game) {
        this.game = game;
    }

    /**
     * Encodes a simple object into a DNA string.
     * We purposefully use a lossy "Prestige" encoding for the Time Capsule,
     * focusing on permanent buffs rather than exact state restoration.
     */
    encodePrestige(stats) {
        // Format: [GEN_ID]:[TECH_LEVEL]:[RESOURCES_SCORE]
        // mapped to DNA bases.
        const data = `${stats.gen}|${stats.tech}|${stats.score}`;

        // Simple visualization encoding
        let dna = "";
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i);
            const bases = ['A', 'T', 'C', 'G'];
            // Map char to 4 bases
            dna += bases[(charCode >> 6) & 3];
            dna += bases[(charCode >> 4) & 3];
            dna += bases[(charCode >> 2) & 3];
            dna += bases[charCode & 3];
        }

        // Add padding/junk DNA for visuals
        for (let i = 0; i < 20; i++) {
            dna += ['A', 'T', 'C', 'G'][Math.floor(Math.random() * 4)];
        }

        return dna;
    }

    /**
     * Introduces random mutations to a DNA string.
     * @param {string} dna 
     * @param {number} rate 0.0 to 1.0
     */
    mutate(dna, rate) {
        let mutated = "";
        const bases = ['A', 'T', 'C', 'G'];
        for (const char of dna) {
            if (Math.random() < rate) {
                mutated += bases[Math.floor(Math.random() * 4)];
            } else {
                mutated += char;
            }
        }
        return mutated;
    }
}

window.DNAStorageSystem = DNAStorageSystem;
