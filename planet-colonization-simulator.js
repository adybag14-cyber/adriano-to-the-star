/**
 * Planet Colonization Simulator
 * Simulate building colonies on planets
 */

class PlanetColonizationSimulator {
    constructor() {
        this.colonies = [];
        this.resources = {};
        this.currentColony = null;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        this.loadColonies();
        this.isInitialized = true;
        console.log('🏗️ Planet Colonization Simulator initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tc_ol_on_iz_at_io_ns_im_ul_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadColonies() {
        try {
            const stored = localStorage.getItem('planet-colonies');
            if (stored) {
                this.colonies = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading colonies:', error);
        }
    }

    saveColonies() {
        try {
            localStorage.setItem('planet-colonies', JSON.stringify(this.colonies));
        } catch (error) {
            console.error('Error saving colonies:', error);
        }
    }

    /**
     * Start colonization of a planet
     */
    startColonization(planetData) {
        const colony = {
            id: `colony-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            planetId: planetData.kepid,
            planetName: planetData.kepler_name || planetData.kepoi_name,
            startedAt: new Date().toISOString(),
            population: 0,
            buildings: [],
            resources: {
                energy: 1000,
                materials: 500,
                food: 200,
                water: 300,
                oxygen: 1000
            },
            status: 'founding', // founding, established, thriving, advanced
            research: {
                level: 1,
                points: 0
            }
        };

        this.colonies.push(colony);
        this.currentColony = colony;
        this.saveColonies();

        return colony;
    }

    /**
     * Build a structure
     */
    buildStructure(colonyId, structureType) {
        const colony = this.colonies.find(c => c.id === colonyId);
        if (!colony) return false;

        const structures = {
            'habitat': { cost: { materials: 100, energy: 50 }, population: 10 },
            'power-plant': { cost: { materials: 150, energy: 0 }, energy: 200 },
            'farm': { cost: { materials: 80, energy: 30 }, food: 50 },
            'research-lab': { cost: { materials: 200, energy: 100 }, research: 10 },
            'water-extractor': { cost: { materials: 120, energy: 50 }, water: 30 },
            'oxygen-generator': { cost: { materials: 100, energy: 60 }, oxygen: 50 }
        };

        const structure = structures[structureType];
        if (!structure) return false;

        // Check if can afford
        const canAfford = Object.entries(structure.cost).every(
            ([resource, amount]) => colony.resources[resource] >= amount
        );

        if (!canAfford) {
            return { success: false, message: 'Insufficient resources' };
        }

        // Deduct costs
        Object.entries(structure.cost).forEach(([resource, amount]) => {
            colony.resources[resource] -= amount;
        });

        // Add structure
        colony.buildings.push({
            type: structureType,
            builtAt: new Date().toISOString(),
            level: 1
        });

        // Apply benefits
        if (structure.population) colony.population += structure.population;
        if (structure.energy) colony.resources.energy += structure.energy;
        if (structure.food) colony.resources.food += structure.food;
        if (structure.water) colony.resources.water += structure.water;
        if (structure.oxygen) colony.resources.oxygen += structure.oxygen;
        if (structure.research) colony.research.points += structure.research;

        this.updateColonyStatus(colony);
        this.saveColonies();

        return { success: true, colony };
    }

    /**
     * Update colony status
     */
    updateColonyStatus(colony) {
        if (colony.population >= 1000) {
            colony.status = 'advanced';
        } else if (colony.population >= 500) {
            colony.status = 'thriving';
        } else if (colony.population >= 100) {
            colony.status = 'established';
        } else {
            colony.status = 'founding';
        }
    }

    /**
     * Simulate colony growth
     */
    simulateGrowth(colonyId, timeDelta = 1) {
        const colony = this.colonies.find(c => c.id === colonyId);
        if (!colony) return;

        // Resource production
        colony.buildings.forEach(building => {
            if (building.type === 'power-plant') {
                colony.resources.energy += 20 * timeDelta;
            }
            if (building.type === 'farm') {
                colony.resources.food += 10 * timeDelta;
            }
            if (building.type === 'water-extractor') {
                colony.resources.water += 5 * timeDelta;
            }
            if (building.type === 'oxygen-generator') {
                colony.resources.oxygen += 10 * timeDelta;
            }
        });

        // Population growth (requires food and water)
        if (colony.resources.food > 0 && colony.resources.water > 0) {
            const growthRate = Math.min(
                colony.resources.food / 100,
                colony.resources.water / 50
            );
            colony.population += growthRate * timeDelta;
        }

        // Resource consumption
        colony.resources.food -= colony.population * 0.1 * timeDelta;
        colony.resources.water -= colony.population * 0.05 * timeDelta;
        colony.resources.oxygen -= colony.population * 0.02 * timeDelta;
        colony.resources.energy -= colony.buildings.length * 5 * timeDelta;

        // Ensure resources don't go negative
        Object.keys(colony.resources).forEach(key => {
            colony.resources[key] = Math.max(0, colony.resources[key]);
        });

        this.updateColonyStatus(colony);
        this.saveColonies();
    }

    /**
     * Render colonization simulator
     */
    renderSimulator(containerId, planetData = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const colony = planetData 
            ? this.colonies.find(c => c.planetId === planetData.kepid)
            : this.currentColony;

        container.innerHTML = `
            <div class="colonization-simulator" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🏗️ Planet Colonization Simulator</h3>
                
                ${!colony ? this.renderStartColonization(planetData) : this.renderColony(colony)}
            </div>
        `;

        this.setupSimulatorEventListeners(planetData);
    }

    renderStartColonization(planetData) {
        if (!planetData) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">Select a planet to start colonization</p>';
        }

        return `
            <div class="start-colonization" style="text-align: center;">
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 2rem;">
                    Start colonizing ${planetData.kepler_name || `Kepler-${planetData.kepid}`}!
                </p>
                <button id="start-colony-btn" class="btn-primary" style="padding: 1rem 2rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600; font-size: 1.1rem;">
                    🚀 Found Colony
                </button>
            </div>
        `;
    }

    renderColony(colony) {
        return `
            <div class="colony-dashboard">
                <div class="colony-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 1rem; background: rgba(0, 0, 0, 0.4); border-radius: 10px;">
                    <div>
                        <h4 style="color: #ba944f; margin: 0 0 0.5rem 0;">${colony.planetName}</h4>
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Status: <span style="color: #4ade80; font-weight: 600;">${colony.status}</span></div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Population</div>
                        <div style="color: #4ade80; font-size: 2rem; font-weight: bold;">${Math.floor(colony.population)}</div>
                    </div>
                </div>

                <div class="resources-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    ${Object.entries(colony.resources).map(([resource, amount]) => `
                        <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; text-align: center;">
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: capitalize;">${resource}</div>
                            <div style="color: #ba944f; font-size: 1.5rem; font-weight: 600;">${Math.floor(amount)}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="buildings-section" style="margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Buildings (${colony.buildings.length})</h4>
                    <div class="buildings-list" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${colony.buildings.length > 0 
                            ? colony.buildings.map(b => `
                                <span style="padding: 0.5rem 1rem; background: rgba(74, 144, 226, 0.2); border: 1px solid rgba(74, 144, 226, 0.5); border-radius: 6px; color: #4a90e2;">
                                    ${b.type.replace('-', ' ')}
                                </span>
                            `).join('')
                            : '<p style="color: rgba(255, 255, 255, 0.5);">No buildings yet</p>'
                        }
                    </div>
                </div>

                <div class="build-options">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Build Structures</h4>
                    <div class="build-buttons" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        <button class="build-btn" data-structure="habitat" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            🏠 Habitat
                        </button>
                        <button class="build-btn" data-structure="power-plant" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            ⚡ Power Plant
                        </button>
                        <button class="build-btn" data-structure="farm" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            🌾 Farm
                        </button>
                        <button class="build-btn" data-structure="research-lab" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            🔬 Research Lab
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupSimulatorEventListeners(planetData) {
        const startBtn = document.getElementById('start-colony-btn');
        if (startBtn && planetData) {
            startBtn.addEventListener('click', () => {
                this.startColonization(planetData);
                this.renderSimulator('colonization-container', planetData);
            });
        }

        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const structureType = btn.dataset.structure;
                const colony = planetData 
                    ? this.colonies.find(c => c.planetId === planetData.kepid)
                    : this.currentColony;
                
                if (colony) {
                    const result = this.buildStructure(colony.id, structureType);
                    if (result.success) {
                        this.renderSimulator('colonization-container', planetData);
                    } else {
                        alert(result.message || 'Failed to build structure');
                    }
                }
            });
        });
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.PlanetColonizationSimulator = PlanetColonizationSimulator;
    window.planetColonizationSimulator = new PlanetColonizationSimulator();
}

