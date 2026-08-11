/**
 * 🏛️ EXOPLANET PIONEER: MEGASTRUCTURES SYSTEM (FULL IMPLEMENTATION)
 * Part of Megablock 5: Type IV Civilization & Kardashev Scaling
 * 
 * Manages the construction, energy harvesting, and physics of 
 * stellar-scale engineering projects.
 */

class MegastructuresSystem {
    constructor() {
        this.structures = new Map(); // starId -> StructureInstance
        this.types = {
            'dyson_swarm': { 
                name: 'Dyson Swarm', 
                phases: ['Satellite Deployment', 'Transmission Mesh', 'Global Collector'],
                energyMultiplier: 500,
                cost: { credits: 50000, material: 1e20 },
                requirement: 'STAR_SYSTEM'
            },
            'orbital_ring': { 
                name: 'Orbital Ring', 
                phases: ['Tether Launch', 'Ring Stabilization', 'Habitation Modules'],
                energyMultiplier: 50,
                cost: { credits: 25000, material: 5e18 },
                requirement: 'PLANET'
            },
            'stellar_engine': { 
                name: 'Stellar Engine', 
                phases: ['Thruster Assembly', 'Mirror Array', 'Relativistic Calibration'],
                energyMultiplier: -1000, // Consumes massive energy
                cost: { credits: 500000, material: 1e24 },
                requirement: 'STAR_SYSTEM'
            }
        };
        this.init();
    }

    async init() {
        console.log('🏛️ Megastructures Engine Online: Constructing the Future.');
        // Hook into existing economy if available
        this.economy = window.economySystem || null;
    }

    /**
     * Item 4002: Dyson Shell Construction Logic
     */
    async startProject(starId, typeKey) {
        if (this.structures.has(starId)) throw new Error("Project already exists here.");
        const type = this.types[typeKey];
        
        const instance = {
            id: starId,
            type: typeKey,
            name: type.name,
            currentPhase: 0,
            phaseProgress: 0,
            isCompleted: false,
            energyOutput: 0,
            startTime: Date.now()
        };

        this.structures.set(starId, instance);
        this._applyCost(type.cost);
        console.log(`[ENGINEERING] Initialized ${type.name} at ${starId}. Phase 1: ${type.phases[0]}`);
        
        this.fireEvent("PROJECT_STARTED", instance);
        return instance;
    }

    /**
     * Item 4001: Energy Output Scaling
     * Calculates energy based on star luminosity (simulated via starId/database).
     */
    calculateOutput(starId) {
        const project = this.structures.get(starId);
        if (!project || !project.isCompleted) return 0;

        // Star physics simulation: Hotter stars (Kepler data) yield more energy
        let baseLuminosity = 1.0; 
        if (window.KEPLER_DATABASE) {
            const star = window.KEPLER_DATABASE.allPlanets.find(p => p.kepid == starId);
            // Rough heuristic: higher score = higher potential
            baseLuminosity = star ? (star.score + 0.5) : 1.0;
        }

        const multiplier = this.types[project.type].energyMultiplier;
        return baseLuminosity * multiplier;
    }

    update(dt) {
        this.structures.forEach(project => {
            if (!project.isCompleted) {
                // Item 4002: Construction Progress
                project.phaseProgress += 0.05 * dt; // Progress speed
                
                if (project.phaseProgress >= 100) {
                    project.phaseProgress = 0;
                    project.currentPhase++;
                    
                    const type = this.types[project.type];
                    if (project.currentPhase >= type.phases.length) {
                        project.isCompleted = true;
                        project.energyOutput = this.calculateOutput(project.id);
                        this.fireEvent("PROJECT_COMPLETED", project);
                    } else {
                        console.log(`[ENGINEERING] ${project.name} entered phase ${project.currentPhase + 1}: ${type.phases[project.currentPhase]}`);
                    }
                }
            }
        });
    }

    _applyCost(cost) {
        if (this.economy && this.economy.playerResources) {
            this.economy.playerResources.credits -= cost.credits;
        }
    }

    fireEvent(type, data) {
        window.dispatchEvent(new CustomEvent(`MEGA_${type}`, { detail: data }));
    }
}

window.megastructuresSystem = new MegastructuresSystem();