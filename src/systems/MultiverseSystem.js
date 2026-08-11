/**
 * ♾️ Era IV: Multiverse Mechanics - Parallel Dimensions
 * 
 * Enables simulation of multiple universes with variable fundamental constants,
 * allowing players to explore physics variations and alternate realities.
 */

class MultiverseSystem {
    constructor(game) {
        this.game = game;
        this.universes = new Map();
        this.currentUniverse = null;
        this.universeTransitions = [];
        this.constantVariations = {
            G: { min: 0.5, max: 2.0, default: 1.0 }, // Gravitational constant
            c: { min: 0.5, max: 2.0, default: 1.0 }, // Speed of light
            h: { min: 0.1, max: 10.0, default: 1.0 }, // Planck constant
            alpha: { min: 0.001, max: 0.02, default: 0.0073 } // Fine structure constant
        };
        
        console.log("♾️ Multiverse System: Initializing parallel dimensions...");
    }
    
    /**
     * Initialize the multiverse
     */
    async initialize() {
        // Load existing universes from the server
        await this.loadUniverses();
        
        // Create the prime universe if it doesn't exist
        if (!this.universes.has('prime')) {
            this.createPrimeUniverse();
        }
        
        // Set current universe to prime
        this.currentUniverse = this.universes.get('prime');
        
        console.log(`♾️ Multiverse Initialized: ${this.universes.size} universes available`);
    }
    
    /**
     * Create the prime universe (baseline physics)
     */
    createPrimeUniverse() {
        const primeUniverse = {
            id: 'prime',
            name: 'Prime Universe',
            description: 'Baseline physics matching our reality',
            constants: {
                G: 1.0,
                c: 1.0,
                h: 1.0,
                alpha: 0.0073
            },
            properties: {
                gravity: 1.0,
                lightSpeed: 1.0,
                quantumScale: 1.0,
                timeFlow: 1.0,
                entropy: 1.0
            },
            accessibility: 'public',
            population: 0,
            createdAt: Date.now()
        };
        
        this.universes.set('prime', primeUniverse);
        this.saveUniverse(primeUniverse);
    }
    
    /**
     * Create a new universe with randomized constants
     */
    createUniverse(options = {}) {
        const universeId = options.id || this.generateUniverseId();
        
        // Generate random constants within allowed ranges
        const constants = {
            G: this.randomConstant('G'),
            c: this.randomConstant('c'),
            h: this.randomConstant('h'),
            alpha: this.randomConstant('alpha')
        };
        
        // Calculate derived properties
        const properties = this.calculateProperties(constants);
        
        const universe = {
            id: universeId,
            name: options.name || this.generateUniverseName(),
            description: options.description || this.generateUniverseDescription(constants),
            constants: constants,
            properties: properties,
            accessibility: options.accessibility || 'private',
            creator: options.creator || this.game.playerId,
            population: 0,
            createdAt: Date.now()
        };
        
        this.universes.set(universeId, universe);
        this.saveUniverse(universe);
        
        console.log(`♾️ Universe Created: ${universe.name} (${universeId})`);
        
        return universe;
    }
    
    /**
     * Generate a random constant within allowed range
     */
    randomConstant(constantName) {
        const range = this.constantVariations[constantName];
        return range.min + Math.random() * (range.max - range.min);
    }
    
    /**
     * Calculate derived properties from fundamental constants
     */
    calculateProperties(constants) {
        return {
            // Gravity scales with G
            gravity: constants.G,
            
            // Light speed affects communication and travel
            lightSpeed: constants.c,
            
            // Quantum effects scale with h
            quantumScale: constants.h,
            
            // Time flow affected by c (time dilation)
            timeFlow: 1.0 / constants.c,
            
            // Entropy rate affected by alpha
            entropy: constants.alpha / 0.0073,
            
            // Planetary stability
            stability: this.calculateStability(constants),
            
            // Life compatibility
            lifeCompatibility: this.calculateLifeCompatibility(constants)
        };
    }
    
    /**
     * Calculate universe stability based on constants
     */
    calculateStability(constants) {
        // Universe stability decreases with extreme constant variations
        const gVariation = Math.abs(constants.G - 1.0);
        const cVariation = Math.abs(constants.c - 1.0);
        const hVariation = Math.abs(constants.h - 1.0);
        
        const totalVariation = gVariation + cVariation + hVariation;
        
        // Stability decreases with variation
        return Math.max(0, 1.0 - totalVariation / 2.0);
    }
    
    /**
     * Calculate life compatibility
     */
    calculateLifeCompatibility(constants) {
        // Life requires specific ranges of constants
        const gCompatible = constants.G >= 0.5 && constants.G <= 2.0;
        const cCompatible = constants.c >= 0.5 && constants.c <= 2.0;
        const alphaCompatible = constants.alpha >= 0.005 && constants.alpha <= 0.01;
        
        let score = 0;
        if (gCompatible) score += 0.4;
        if (cCompatible) score += 0.4;
        if (alphaCompatible) score += 0.2;
        
        return score;
    }
    
    /**
     * Generate universe name
     */
    generateUniverseName() {
        const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Omega', 'Sigma', 'Tau', 'Phi'];
        const suffixes = ['Verse', 'Realm', 'Dimension', 'Reality', 'Cosmos', 'Existence', 'Plane'];
        const numbers = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        
        return `${prefix}-${suffix} ${number}`;
    }
    
    /**
     * Generate universe description
     */
    generateUniverseDescription(constants) {
        const descriptions = [];
        
        if (constants.G > 1.5) {
            descriptions.push('Hyper-gravitational reality with crushing forces');
        } else if (constants.G < 0.7) {
            descriptions.push('Low-gravity environment with fragile structures');
        }
        
        if (constants.c > 1.5) {
            descriptions.push('Superluminal physics with instantaneous communication');
        } else if (constants.c < 0.7) {
            descriptions.push('Subluminal reality with severe time dilation');
        }
        
        if (constants.h > 5.0) {
            descriptions.push('Macro-quantum effects visible at planetary scales');
        } else if (constants.h < 0.3) {
            descriptions.push('Quantum effects nearly nonexistent');
        }
        
        return descriptions.join('. ') || 'Baseline physics variant';
    }
    
    /**
     * Generate unique universe ID
     */
    generateUniverseId() {
        return `universe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Switch to a different universe
     */
    async switchUniverse(universeId) {
        const targetUniverse = this.universes.get(universeId);
        
        if (!targetUniverse) {
            throw new Error('Universe not found');
        }
        
        // Record transition
        const transition = {
            from: this.currentUniverse.id,
            to: universeId,
            timestamp: Date.now(),
            player: this.game.playerId
        };
        
        this.universeTransitions.push(transition);
        
        // Update current universe
        this.currentUniverse = targetUniverse;
        
        // Apply universe physics to game
        this.applyUniversePhysics(targetUniverse);
        
        // Save transition
        await this.saveTransition(transition);
        
        console.log(`♾️ Universe Switch: ${transition.from} → ${transition.to}`);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('UNIVERSE_SWITCHED', {
            detail: {
                fromUniverse: this.universes.get(transition.from),
                toUniverse: targetUniverse,
                transition: transition
            }
        }));
        
        return transition;
    }
    
    /**
     * Apply universe physics to game systems
     */
    applyUniversePhysics(universe) {
        // Update physics constants in game
        if (this.game.physics) {
            this.game.physics.setGravity(universe.properties.gravity);
            this.game.physics.setLightSpeed(universe.properties.lightSpeed);
            this.game.physics.setTimeFlow(universe.properties.timeFlow);
        }
        
        // Update quantum effects
        if (this.game.quantum) {
            this.game.quantum.setScale(universe.properties.quantumScale);
        }
        
        // Update entropy rate
        if (this.game.entropy) {
            this.game.entropy.setRate(universe.properties.entropy);
        }
        
        // Update planetary stability
        if (this.game.planets) {
            this.game.planets.setStability(universe.properties.stability);
        }
    }
    
    /**
     * Load universes from server
     */
    async loadUniverses() {
        try {
            const response = await fetch('/api/multiverse/universes');
            const data = await response.json();
            
            for (const universe of data.universes) {
                this.universes.set(universe.id, universe);
            }
        } catch (error) {
            console.error('Failed to load universes:', error);
        }
    }
    
    /**
     * Save universe to server
     */
    async saveUniverse(universe) {
        try {
            const response = await fetch('/api/multiverse/universes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(universe)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save universe:', error);
            return null;
        }
    }
    
    /**
     * Save transition to server
     */
    async saveTransition(transition) {
        try {
            const response = await fetch('/api/multiverse/transitions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transition)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to save transition:', error);
            return null;
        }
    }
    
    /**
     * Get universe by ID
     */
    getUniverse(universeId) {
        return this.universes.get(universeId);
    }
    
    /**
     * Get all accessible universes
     */
    getAccessibleUniverses() {
        return Array.from(this.universes.values())
            .filter(universe => universe.accessibility === 'public' || universe.creator === this.game.playerId);
    }
    
    /**
     * Get current universe info
     */
    getCurrentUniverseInfo() {
        if (!this.currentUniverse) {
            return null;
        }
        
        return {
            id: this.currentUniverse.id,
            name: this.currentUniverse.name,
            description: this.currentUniverse.description,
            constants: this.currentUniverse.constants,
            properties: this.currentUniverse.properties,
            stability: this.currentUniverse.properties.stability,
            lifeCompatibility: this.currentUniverse.properties.lifeCompatibility
        };
    }
    
    /**
     * Calculate physics differences between two universes
     */
    compareUniverses(universeId1, universeId2) {
        const u1 = this.universes.get(universeId1);
        const u2 = this.universes.get(universeId2);
        
        if (!u1 || !u2) {
            throw new Error('One or both universes not found');
        }
        
        const differences = {};
        
        for (const constant in u1.constants) {
            const diff = (u2.constants[constant] - u1.constants[constant]) / u1.constants[constant];
            differences[constant] = {
                diff: diff,
                percentChange: (diff * 100).toFixed(2) + '%'
            };
        }
        
        return {
            universe1: u1.name,
            universe2: u2.name,
            differences: differences,
            compatibility: this.calculateCompatibility(u1, u2)
        };
    }
    
    /**
     * Calculate compatibility between two universes
     */
    calculateCompatibility(u1, u2) {
        const totalDiff = Object.values(u1.constants).reduce((sum, val, idx) => {
            const otherVal = Object.values(u2.constants)[idx];
            return sum + Math.abs(val - otherVal) / val;
        }, 0);
        
        return Math.max(0, 1.0 - totalDiff / Object.keys(u1.constants).length);
    }
    
    /**
     * Get transition history
     */
    getTransitionHistory(limit = 100) {
        return this.universeTransitions.slice(-limit);
    }
}

// Expose for use
if (typeof window !== 'undefined') {
    window.MultiverseSystem = MultiverseSystem;
}
