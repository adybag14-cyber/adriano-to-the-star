/**
 * TechTreeSystem.js
 * 
 * Implements a non-linear research progression system.
 * Nodes form a directed graph of dependencies.
 */

class TechTreeSystem {
    constructor(game) {
        this.game = game;
        this.researchPoints = 0;
        this.unlockedTechs = new Set(['landing_logistics']); // Default starting tech

        // Define the Tech Tree
        this.nodes = {
            'landing_logistics': {
                name: 'Landing Logistics',
                desc: 'Basic protocols for establishing a foothold.',
                cost: 0,
                prereqs: [],
                unlocks: ['Basic Structures']
            },
            'basic_mining': {
                name: 'Basic Mining',
                desc: 'Techniques for extracting surface ore.',
                cost: 50,
                prereqs: ['landing_logistics'],
                unlocks: ['Mines']
            },
            'hydroponics': {
                name: 'Hydroponics',
                desc: 'Soil-less farming for harsh environments.',
                cost: 75,
                prereqs: ['landing_logistics'],
                unlocks: ['Farms']
            },
            'construction_protocols': {
                name: 'Construction Protocols',
                desc: 'Advanced blueprints for housing.',
                cost: 100,
                prereqs: ['landing_logistics'],
                unlocks: ['Larger Habitats']
            },
            'advanced_power': {
                name: 'Advanced Power',
                desc: 'High-efficiency solar tracking.',
                cost: 200,
                prereqs: ['basic_mining'],
                unlocks: ['Solar Arrays II']
            },
            'industrial_processing': {
                name: 'Industrial Processing',
                desc: 'Automated refinement of raw ore.',
                cost: 300,
                prereqs: ['advanced_power', 'construction_protocols'],
                unlocks: ['factories'] // key mechanic: factories needed for higher tier goods
            },
            'xenobiology': {
                name: 'Xenobiology',
                desc: 'Study of alien flora and fauna.',
                cost: 150,
                prereqs: ['hydroponics'],
                unlocks: ['Labs']
            },
            'deep_core_mining': {
                name: 'Deep Core Mining',
                desc: 'Drilling tech for underground resources.',
                cost: 500,
                prereqs: ['industrial_processing'],
                unlocks: ['Deep Mines']
            },
            'atmospheric_scrubbing': {
                name: 'Atmospheric Scrubbing',
                desc: 'Machines to purify the air.',
                cost: 800,
                prereqs: ['industrial_processing', 'xenobiology'],
                unlocks: ['Terraforming']
            }
        };
    }

    /**
     * Unlock a technology if affordable and prerequisites are met.
     */
    unlock(techId) {
        if (this.unlockedTechs.has(techId)) return { success: false, reason: 'Already unlocked' };

        const tech = this.nodes[techId];
        if (!tech) return { success: false, reason: 'Unknown technology' };

        if (this.researchPoints < tech.cost) return { success: false, reason: 'Insufficient Research Points' };

        // Check prerequisites
        for (const pre of tech.prereqs) {
            if (!this.unlockedTechs.has(pre)) return { success: false, reason: `Requires ${this.nodes[pre].name}` };
        }

        this.researchPoints -= tech.cost;
        this.unlockedTechs.add(techId);

        this.game.notify(`Research Complete: ${tech.name}`, 'success');
        this.game.updateUI(); // Refresh UI to show new unlocks
        return { success: true };
    }

    isUnlocked(techId) {
        return this.unlockedTechs.has(techId);
    }

    // Check if a building type is allowed by current tech
    canBuild(structureType) {
        // Mapping structures to required tech
        const requirements = {
            'mine': 'basic_mining',
            'farm': 'hydroponics',
            'solar': 'landing_logistics',
            'hab': 'landing_logistics',
            'factory': 'industrial_processing',
            'lab': 'xenobiology',
            'deep_miner': 'deep_core_mining'
        };

        const required = requirements[structureType];
        if (!required) return true; // No requirement for basic stuff not listed
        return this.isUnlocked(required);
    }

    getRequirementName(structureType) {
        const requirements = {
            'mine': 'basic_mining',
            'farm': 'hydroponics',
            'factory': 'industrial_processing',
            'lab': 'xenobiology',
            'deep_miner': 'deep_core_mining'
        };
        const reqId = requirements[structureType];
        return reqId ? this.nodes[reqId].name : null;
    }

    generateRP(amount) {
        this.researchPoints += amount;
    }

    exportState() {
        return {
            researchPoints: this.researchPoints,
            unlockedTechs: Array.from(this.unlockedTechs)
        };
    }

    importState(data) {
        if (!data) return;
        this.researchPoints = data.researchPoints || 0;
        this.unlockedTechs = new Set(data.unlockedTechs || ['landing_logistics']);
    }
}

window.TechTreeSystem = TechTreeSystem;
