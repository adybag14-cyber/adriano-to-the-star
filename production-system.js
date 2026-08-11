class CraftingManager {
    constructor(game) {
        this.game = game;
        this.recipes = {
            'refinery': {
                name: 'Basic Refining',
                input: { minerals: 10, energy: 5 },
                output: { pure_minerals: 5 }, // Stage 1
                time: 10,
                buildingObj: 'refinery'
            },
            'alloy_forge': {
                name: 'Alloy Smelting',
                input: { pure_minerals: 5, energy: 10 },
                output: { alloys: 2 }, // Stage 2
                time: 15,
                buildingObj: 'refinery'
            },
            'chip_fab': {
                name: 'Circuit Assembly',
                input: { alloys: 5, data: 10 },
                output: { circuits: 1 },
                time: 20,
                buildingObj: 'chip_fab'
            },
            // Roadmap Item 201: Multi-stage Refining
            'adv_refinery': {
                name: 'High-Purity Refining',
                input: { pure_minerals: 10, energy: 15, alloys: 2 },
                output: { helium3: 1 }, // Stage 3
                time: 30,
                buildingObj: 'refinery'
            },
            'composite_fab': {
                name: 'Nano-Composite Weaving',
                input: { alloys: 10, circuits: 5, pure_minerals: 5 },
                output: { composite: 2 }, // Stage 4
                time: 40,
                buildingObj: 'chip_fab'
            },
            'recycling_plant': {
                name: 'Resource Reclamation',
                input: { minerals: 20, energy: 10 },
                output: { alloys: 1, circuits: 0.2 }, // Roadmap Item 215
                time: 20,
                buildingObj: 'recycling_plant'
            },
            'alchemist_lab': {
                name: 'Transmutation',
                input: { minerals: 50, energy: 50, data: 10 },
                output: { rare_metals: 2, composite: 1 }, // Roadmap Item 237
                time: 60,
                buildingObj: 'alchemist_lab'
            }
        };

        // Roadmap Item 210: Industrial blueprints with quality tiers
        this.blueprintTiers = {
            1: { name: 'Standard', efficiency: 1.0, costMult: 1.0 },
            2: { name: 'Optimized', efficiency: 1.2, costMult: 1.1 },
            3: { name: 'Advanced', efficiency: 1.5, costMult: 1.3 },
            4: { name: 'Prototype', efficiency: 2.0, costMult: 1.5 }
        };

        // Roadmap Item 212: Automation Tiers
        this.automationTiers = {
            'manual': { name: 'Manual', speed: 1.0, cost: 0 },
            'assisted': { name: 'Semi-Auto', speed: 1.5, cost: 100 },
            'full_ai': { name: 'Full AI', speed: 3.0, cost: 500 }
        };

        // Active crafting jobs: { id: int, recipeKey: str, timeLeft: float }
        this.jobs = [];
        this.autoCrafters = []; // Buildings that auto-craft: { buildingId: int, type: str, progress: float }
        
        // Roadmap Item 202: Logistics Engine Foundation
        this.logisticsNetwork = {
            routes: [], // { from: buildingId, to: buildingId, resource: str, rate: float }
            transporters: [], // Active drone/conveyor animations
            bottlenecks: {} // Roadmap Item 225: Tracking delays
        };

        // Roadmap Item 220: Custom manufacturing recipes
        this.customRecipes = [];

        // Roadmap Item 265 & 266: Logistics Hubs and Inventory AI
        this.logisticsHubs = []; // tileId
        this.inventoryAIActive = false;

        // Roadmap Item 273: Crafting Specialization
        this.specializations = {
            'metallurgy': { level: 1, exp: 0, bonus: 'alloys' },
            'electronics': { name: 'Electronics', level: 1, exp: 0, bonus: 'circuits' },
            'chemistry': { name: 'Chemistry', level: 1, exp: 0, bonus: 'fuel' }
        };

        // Roadmap Item 277: Tooling and Maintenance
        this.toolingCondition = 1.0; // 1.0 = perfect
        
        // Roadmap Item 278 & 279: Coolant and Spare Parts
        this.maintenanceSupplies = {
            coolant: 100,
            spareParts: 100
        };

        // Roadmap Item 281: Shift Management
        this.currentShift = 'DAY'; // DAY, NIGHT
        
        // Roadmap Item 282 & 283: Advanced Control
        this.remoteMiningActive = false;
        this.neuralLinkControl = false;

        // Roadmap Item 276: Standardization vs Customization
        this.industrialStandardLevel = 1.0; // 1.0 = baseline, higher = better standardization

        // Roadmap Item 292-296: Logistics Advanced Tiers
        this.logisticsCertification = 0; // 0-5
        this.standardizedContainers = false;
        this.hyperloopEnabled = false;
        this.pneumaticTubeSystem = false;
        this.intermodalCoordination = false; // Roadmap Item 294
    }

    addLogisticsHub(tileId) {
        // Roadmap Item 265: Logistics Hubs
        if (!this.logisticsHubs.includes(tileId)) {
            this.logisticsHubs.push(tileId);
            this.game.notify("📦 LOGISTICS HUB: Regional distribution center established.", "success");
        }
    }

    enableInventoryAI() {
        // Roadmap Item 266: Inventory management AI
        this.inventoryAIActive = true;
        this.game.notify("🧠 INVENTORY AI: Automated stock level optimization engaged.", "success");
    }

    updateInventoryAI(dt) {
        if (!this.inventoryAIActive) return;
        
        // Inventory AI automatically balances resources or optimizes routes
        if (this.game.day % 2 === 0 && Math.random() < 0.01 * dt) {
            this.game.notify("🧠 INVENTORY AI: Optimized global resource flow for efficiency.", "info");
            // Could add small efficiency bonus to all production
        }
    }

    addCustomRecipe(name, input, output, time) {
        // Roadmap Item 220: Add a player-defined recipe
        const id = `custom_${Date.now()}`;
        const recipe = { id, name, input, output, time, buildingObj: 'factory' };
        this.customRecipes.push(recipe);
        this.game.notify(`🧪 INNOVATION: New custom recipe "${name}" registered!`, "success");
        return id;
    }

    updateSmartFactory(struct, deltaTime) {
        // Roadmap Item 224: Smart-factory optimization logic
        if (!struct.isCrafting) return;
        
        // Efficiency gains from "learning" the process
        if (struct.optimizationLevel === undefined) struct.optimizationLevel = 1.0;
        struct.optimizationLevel = Math.min(2.0, struct.optimizationLevel + 0.0001 * deltaTime);
        
        // Potential bottleneck detection (Roadmap Item 225)
        if (Math.random() < 0.01) {
            const recipe = this.recipes[struct.type];
            if (recipe) {
                for (const res in recipe.input) {
                    if (this.game.resources[res] < recipe.input[res] * 2) {
                        this.logisticsNetwork.bottlenecks[struct.id] = res;
                    }
                }
            }
        }
    }

    init() {
        console.log("Production System Initialized");
    }

    // Roadmap Item 202: Add Logistics Route
    addLogisticsRoute(fromId, toId, resource, rate = 1.0) {
        this.logisticsNetwork.routes.push({ from: fromId, to: toId, resource, rate });
        this.game.notify(`Logistics route established: ${resource} transfer active.`, "success");
    }

    addPipeline(fromId, toId) {
        // Roadmap Item 234: Establish underground pipeline
        this.pipelines.push({ from: fromId, to: toId, status: 'active' });
        this.game.notify("🏗️ PIPELINE: Underground network expanded. Logistics speed increased between sectors.", "success");
    }

    updateLogistics(deltaTime) {
        // Roadmap Item 202: Just-in-time logistics engine
        this.logisticsNetwork.routes.forEach(route => {
            const fromStruct = this.game.structures.find(s => s.id === route.from);
            const toStruct = this.game.structures.find(s => s.id === route.to);

            if (fromStruct && toStruct) {
                // Roadmap Item 234: Pipeline speed boost
                const hasPipeline = this.pipelines.some(p => 
                    (p.from === fromStruct.tileId && p.to === toStruct.tileId) || 
                    (p.from === toStruct.tileId && p.to === fromStruct.tileId)
                );
                
                // Roadmap Item 295: Hyperloop speed boost
                const hasHyperloop = this.hyperloopEnabled && hasPipeline;
                
                // Roadmap Item 296: Pneumatic tube system (for small items like circuits/data)
                const isSmallItem = route.resource === 'circuits' || route.resource === 'data';
                const tubeMult = (this.pneumaticTubeSystem && isSmallItem) ? 2.0 : 1.0;

                // Roadmap Item 293: Standardized containers bonus
                const containerBonus = this.standardizedContainers ? 1.5 : 1.0;
                
                // Roadmap Item 294: Intermodal coordination bonus
                let intermodalBonus = 1.0;
                if (this.intermodalCoordination) {
                    const hasElevator = this.game.structures.some(s => s.type === 'orbital_elevator');
                    const hasHub = this.logisticsHubs.includes(fromStruct.tileId) || this.logisticsHubs.includes(toStruct.tileId);
                    if (hasElevator && hasHub) intermodalBonus = 1.3; // 30% boost for intermodal synergy
                }
                
                const pipelineMult = hasHyperloop ? 5.0 : (hasPipeline ? 2.5 : 1.0);
                const finalLogisticsMult = pipelineMult * containerBonus * intermodalBonus * tubeMult;

                // Roadmap Item 219: Orbital Elevator logistics (reduces costs/delays for space-surface transfers)
                // This is simulated by reducing resource usage for trade missions or orbital transfers
                // In this loop, we apply it as a throughput bonus for the elevator itself
                const elevatorBonus = (fromStruct.type === 'orbital_elevator' || toStruct.type === 'orbital_elevator') ? 2.0 : 1.0;

                // Check if sender has the resource and receiver has space
                const amount = route.rate * finalLogisticsMult * elevatorBonus * deltaTime;
                if (this.game.resources[route.resource] >= amount) {
                    this.game.resources[route.resource] -= amount;
                    // Transfer to building-local storage (simulated by directly increasing production speed for now)
                    // or just moving it back to global but marking it as "moved"
                    this.game.resources[route.resource] += amount; 
                    
                    // Visual feedback: small transporter animation
                    if (Math.random() < 0.05 && !hasPipeline) {
                        const startPos = this.game.getTilePos(fromStruct.tileId);
                        const endPos = this.game.getTilePos(toStruct.tileId);
                        this.spawnTransporterEffect(startPos, endPos, route.resource);
                    }
                }
            }
        });
    }

    spawnTransporterEffect(start, end, resource) {
        // Roadmap Item 202: Visual Transporters
        const effect = {
            id: `trans_${Date.now()}`,
            start,
            end,
            progress: 0,
            resource
        };
        this.logisticsNetwork.transporters.push(effect);
        // Clean up after 2 seconds
        setTimeout(() => {
            this.logisticsNetwork.transporters = this.logisticsNetwork.transporters.filter(t => t.id !== effect.id);
        }, 2000);
    }

    isProducingResource(type, resource) {
        const def = this.game.buildingTypes[type];
        return def && def.output && def.output[resource];
    }

    // Called every game tick (e.g., 1 sec or delta frame)
    update(deltaTime) {
        this.updateLogistics(deltaTime);
        
        // Roadmap Item 281: Determine shift based on game time
        const hour = this.game.timeOfDay;
        const newShift = (hour >= 6 && hour < 18) ? 'DAY' : 'NIGHT';
        if (newShift !== this.currentShift) {
            this.currentShift = newShift;
            this.game.notify(`🕒 INDUSTRIAL CYCLE: Shift change. Now entering ${this.currentShift} operations.`, "info");
        }

        // Roadmap Item 266: Inventory AI processing
        this.updateInventoryAI(deltaTime);

        // Roadmap Item 235: Cryogenic Storage & Food Decay
        this.updateResourceDecay(deltaTime);

        // Roadmap Item 277: Tooling Decay
        this.toolingCondition = Math.max(0, this.toolingCondition - 0.00005 * deltaTime);
        if (this.toolingCondition < 0.2 && Math.random() < 0.01) {
            this.game.notify("🛠️ TOOLING ALERT: Industrial dies are worn. Efficiency reduced by 50%.", "warning");
        }

        // Handle Auto-Crafters (Refineries, Fabs)
        this.game.structures.forEach(struct => {
            const type = struct.type; // 'refinery', 'chip_fab'
            const recipeKey = type; // Simple mapping for now

            if (this.recipes[recipeKey]) {
                const recipe = this.recipes[recipeKey];

                // Roadmap Item 246: Industrial Overclocking
                let overclockMult = 1.0;
                if (struct.overclocked) {
                    overclockMult = 2.0;
                    // Risk of fire/accident increased during overclocking
                    if (Math.random() < 0.001 * deltaTime) {
                        this.triggerIndustrialAccident(struct);
                        this.game.notify(`🔥 OVERCLOCK FAIL: Fire at ${struct.type} due to thermal overload!`, "danger");
                    }
                }

                // Roadmap Item 229: Accident Probability
                const accidentChance = 0.0001 * (1.1 - this.safetyLevel) * deltaTime;
                if (Math.random() < accidentChance) {
                    this.triggerIndustrialAccident(struct);
                }

                // Roadmap Item 210: Tier efficiency
                const tier = struct.blueprintTier || 1;
                const tierDef = this.blueprintTiers[tier];
                
                // Roadmap Item 212: Automation speed
                const autoTier = struct.automationTier || 'manual';
                const autoDef = this.automationTiers[autoTier];

                // Roadmap Item 211: Mass-production bonus
                // (Bonus if multiple buildings of same type exist)
                const count = this.game.structures.filter(s => s.type === type).length;
                const massProdBonus = 1.0 + (count * 0.05); // 5% bonus per building

                // Initialize progress if missing
                if (struct.craftProgress === undefined) struct.craftProgress = 0;

                // Check inputs if starting new cycle
                if (struct.craftProgress <= 0) {
                    if (this.hasResources(recipe.input, tierDef.costMult)) {
                        this.consumeResources(recipe.input, tierDef.costMult);
                        struct.craftProgress = 0.01; // Start
                        struct.isCrafting = true;
                    } else {
                        struct.isCrafting = false;
                    }
                }

                // Advance progress
                if (struct.isCrafting) {
                    const toolingMult = this.toolingCondition > 0.2 ? 1.0 : 0.5;
                    
                    // Roadmap Item 281: Shift efficiency
                    const shiftMult = this.currentShift === 'DAY' ? 1.0 : 0.8; // Night shift is slightly slower without automation
                    
                    // Roadmap Item 283: Neural-link boost
                    const neuralMult = this.neuralLinkControl ? 1.5 : 1.0;

                    // Roadmap Item 282: Remote mining latency
                    let latencyMult = 1.0;
                    if (this.remoteMiningActive && struct.type === 'mine') {
                        latencyMult = 0.7; // 30% penalty for remote signal lag
                    }

                    // Roadmap Item 276: Standardization bonus
                    const standardMult = this.industrialStandardLevel;

                    // Roadmap Item 322: Entropic worlds time-flow reversal
                    let entropicMult = 1.0;
                    if (this.game.planetData?.type === 'Entropic') {
                        // On entropic worlds, time is chaotic. 
                        // Occasionally production can run backwards (consuming output to return input)
                        // Or just halt randomly.
                        if (Math.random() < 0.05) {
                            entropicMult = -0.5; // Reverse production!
                            if (Math.random() < 0.1) {
                                this.game.notify("⏳ ENTROPY: Local timeline reversal detected! Production is running backwards.", "warning");
                            }
                        }
                    }

                    const speed = autoDef.speed * tierDef.efficiency * massProdBonus * overclockMult * toolingMult * shiftMult * neuralMult * latencyMult * standardMult * entropicMult;
                    struct.craftProgress += deltaTime * speed;

                    if (struct.craftProgress < 0) {
                        // Entropy reversed production enough to lose progress
                        struct.craftProgress = 0;
                        struct.isCrafting = false;
                        // Return some inputs? (Simulated reversal)
                        this.game.notify("⏳ ENTROPY: Critical timeline slip. Crafting cycle reset.", "danger");
                    }

                    if (struct.craftProgress >= recipe.time) {
                        // Finish
                        this.produceResources(recipe.output);
                        
                        // Roadmap Item 273: Specialization exp gain
                        const spec = this.getSpecializationForRecipe(recipeKey);
                        if (spec) {
                            spec.exp += 1;
                            if (spec.exp >= spec.level * 100) {
                                spec.level++;
                                this.game.notify(`📈 SPECIALIZATION: ${spec.name || recipeKey} reached Level ${spec.level}!`, "success");
                            }
                        }

                        // Roadmap Item 274: Masterwork Chance
                        if (Math.random() < 0.01 * (spec ? spec.level : 1)) {
                            this.triggerMasterwork(recipe.output);
                        }

                        struct.craftProgress = 0;
                        struct.isCrafting = false;
                        this.game.createEffect(this.game.getTilePos(struct.tileId), new THREE.Vector3(0, 1, 0), 0xffffff);
                    }
                }
            }
        });
    }

    getSpecializationForRecipe(key) {
        if (key === 'refinery') return this.specializations['metallurgy'];
        if (key === 'chip_fab') return this.specializations['electronics'];
        if (key === 'alchemist_lab') return this.specializations['chemistry'];
        return null;
    }

    triggerMasterwork(output) {
        // Roadmap Item 274: Masterwork item generation
        for (const res in output) {
            const bonus = Math.floor(output[res] * 5);
            this.game.resources[res] = (this.game.resources[res] || 0) + bonus;
            this.game.notify(`✨ MASTERWORK: Exceptional quality production! +${bonus} extra ${res} recovered.`, "success");
        }
    }

    performQualityControl() {
        // Roadmap Item 275: Quality control laboratories
        const qcLab = this.game.structures.find(s => s.type === 'lab');
        if (qcLab) {
            this.toolingCondition = Math.min(1.0, this.toolingCondition + 0.2);
            this.game.notify("🔬 QC LAB: Industrial tooling recalibrated and polished.", "info");
        }
    }

    triggerIndustrialAccident(struct) {
        // Roadmap Item 229: Safety regulations and Accidents
        const severity = Math.random();
        if (severity > 0.8) {
            // Critical failure
            struct.condition = (struct.condition || 100) - 50;
            this.game.notify(`💥 CRITICAL ACCIDENT: Explosion at ${struct.type} on tile ${struct.tileId}!`, "danger");
            this.game.createEffect(this.game.getTilePos(struct.tileId), new THREE.Vector3(0, 2, 0), 0xff4444);
        } else {
            // Minor incident
            struct.condition = (struct.condition || 100) - 10;
            this.game.notify(`⚠️ INDUSTRIAL INCIDENT: Minor fire at ${struct.type} node.`, "warning");
        }
        
        // Morale impact
        this.game.colonists.forEach(c => c.morale = Math.max(0, c.morale - 5));
    }

    hasResources(cost, costMult = 1.0) {
        for (const res in cost) {
            if ((this.game.resources[res] || 0) < cost[res] * costMult) return false;
        }
        return true;
    }

    consumeResources(cost, costMult = 1.0) {
        for (const res in cost) {
            this.game.resources[res] -= cost[res] * costMult;
        }
        this.game.updateResourceUI();
    }

    updateResourceDecay(dt) {
        // Roadmap Item 235: Cryogenic storage for biologicals
        // Food decays over time unless cryo-vaults are active
        const cryoActive = this.game.structures.some(s => s.type === 'cryo_vault' && s.condition > 20);
        const decayRate = cryoActive ? 0.01 : 0.2; // 95% reduction with cryo
        
        if (this.game.resources.food > 0) {
            const loss = this.game.resources.food * (decayRate / 100) * dt;
            this.game.resources.food = Math.max(0, this.game.resources.food - loss);
            
            if (!cryoActive && Math.random() < 0.001 * dt) {
                this.game.notify("🍎 SPOILAGE: Food supplies are decaying. Build a Cryo-Vault to preserve them.", "warning");
            }
        }
    }

    produceResources(output) {
        for (const res in output) {
            if (!this.game.resources[res]) this.game.resources[res] = 0;
            this.game.resources[res] += output[res];
            // Check Caps?
            // if (this.game.resources[res] > this.game.caps[res]) ...
        }
        this.game.updateResourceUI();
    }
}
window.CraftingManager = CraftingManager;
