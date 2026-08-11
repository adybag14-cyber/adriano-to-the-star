class TerraformingManager {
    constructor(game) {
        this.game = game;

        // Planet Stats (0-100 Scale)
        this.stats = {
            temperature: 20, // Too cold (-50C to 50C mapped)
            atmosphere: 10,  // Thin
            water: 5,        // Dry
            biomass: 0,      // Barren
            pressure: 10,    // 0.1 ATM
            coreTemp: 30,    // Internal heat
            magnetism: 20,   // Radiation protection
            erosion: 0       // Soil/terrain wear
        };

        // Target ideal stats for Earth-like
        this.ideals = {
            temperature: 50, // ~15C
            atmosphere: 50,  // 1 ATM
            water: 60,       // 60% Coverage
            biomass: 80,     // Thriving
            pressure: 50,    // 1.0 ATM
            coreTemp: 50,    // Stable mantle
            magnetism: 60,   // Standard G-type protection
            erosion: 10      // Natural cycle
        };

        this.rate = {
            temperature: 0,
            atmosphere: 0,
            water: 0,
            biomass: 0,
            pressure: 0,
            coreTemp: 0,
            magnetism: 0,
            erosion: 0
        };

        this.currentWeather = null;
        this.weatherTimer = 60; // Start with 60s safe time
        this.habitability = 0;
    }

    init() {
        console.log("Terraforming System Initiated");
        this.createOverlay();
        
        // Roadmap Item 508 & 509: Species Designer Foundations
        this.dnaArchive = [];
        this.faunaEvolutionPool = [];
        
        // Roadmap Item 511: Invasive species tracking
        this.invasiveSpecies = [];
        
        // Roadmap Item 513: Soil nutrient levels
        this.nutrients = {
            nitrogen: 10,
            phosphorus: 10,
            potassium: 10
        };

        // Roadmap Item 517: Animal domestication
        this.domesticatedSpecies = [];
        
        // Roadmap Item 518: Alien biosphere analysis (Xenodex)
        this.xenodex = [];

        // Roadmap Item 521: Climate tipping points
        this.tippingPoints = {
            albedo: 0, // 0-1 range
            thermal_runaway: false
        };

        // Roadmap Item 522: Polar ice caps
        this.iceCaps = 50; // % coverage

        // Roadmap Item 523: Ocean currents
        this.oceanCurrentIntensity = 1.0;

        // Roadmap Item 531: Migration patterns
        this.migrationPaths = [];
        
        // Roadmap Item 532: Evolutionary arms race
        this.faunaAggression = 0.1;
        
        // Roadmap Item 533: Pandemics
        this.pathogenLevel = 0;

        // Roadmap Item 534: Genetic preservation (Seed Vaults)
        this.seedVault = [];
        
        // Roadmap Item 535: Cloning facilities
        this.cloningActive = false;
        
        // Roadmap Item 536: Synthetic meat production
        this.syntheticMeatOutput = 0;

        // Roadmap Item 537: Bio-fuel industry
        this.bioFuelLevel = 0;
        
        // Roadmap Item 538: Organic construction
        this.organicStructures = [];
        
        // Roadmap Item 539: Neural-link with animals
        this.beastMasteryLevel = 0;
        
        // Roadmap Item 540: Ecosystem Health Score
        this.ecosystemHealth = 100;

        // Roadmap Item 541: Soil acidity
        this.soilPH = 7.0; // Neutral
        
        // Roadmap Item 543 & 544: Pollution
        this.pollution = {
            light: 0,
            sound: 0,
            wasteWater: 0
        };

        // Roadmap Item 546: Land reclamation
        this.reclaimedLand = 0; // % of planet
        
        // Roadmap Item 549: Atmospheric drones
        this.aeroWhalesActive = 0;
        
        // Roadmap Item 550: Biological contamination
        this.elevatorContaminationRisk = 0;

        // Roadmap Item 551: Cross-planet species transplantation
        this.offworldSpecies = [];
        
        // Roadmap Item 553: Bio-weapons
        this.bioWeaponDevelopmentActive = false;
        
        // Roadmap Item 555: Urban greening
        this.urbanGreeningLevel = 0;
        
        // Roadmap Item 556: Seasonal visuals
        this.seasonalCycle = 0; // 0-1 range

        // Roadmap Item 561: Desertification levels
        this.desertification = 0; // % coverage
        
        // Roadmap Item 563: Swarm events
        this.swarmIntensity = 0;
        
        // Roadmap Item 565: Underwater bases
        this.underwaterBases = [];

        // Roadmap Item 566: Thermal vent life
        this.thermalVentLifeActive = false;
        
        // Roadmap Item 570: Silicon-based life
        this.siliconLifeLevel = 0;

        // Roadmap Item 571: Ammonia-based life
        this.ammoniaLifeActive = false;
        
        // Roadmap Item 572: Plasma-based life
        this.plasmaLifeActive = false;
        
        // Roadmap Item 573: Gaseous life
        this.gaseousLifeActive = false;

        // Roadmap Item 581: Bio-diversity tracking
        this.biodiversityScore = 0;
        
        // Roadmap Item 584: Planetary Spirit (Gaia)
        this.planetarySpiritAwakened = false;
        this.spiritBondLevel = 0;
        
        // Roadmap Item 586: Global Consciousness
        this.globalConsciousnessActive = false;

        // Roadmap Item 591: Hibernation tech
        this.hibernationActive = false;
        
        // Roadmap Item 597: Genetic Heritage
        this.geneticHeritage = [];
        
        // Roadmap Item 600: Transcendence
        this.transcendenceProgress = 0;
    }

    // Roadmap Item 508: Flora species designer (DNA splicing)
    designFlora(dnaSequence, name) {
        if (this.game.resources.data < 200) return;
        this.game.resources.data -= 200;
        const newSpecies = {
            id: 'flora_' + Date.now(),
            name: name,
            dna: dnaSequence,
            type: 'flora',
            bonus: dnaSequence.includes('AGTC') ? 'oxygen' : 'biomass'
        };
        this.dnaArchive.push(newSpecies);
        this.game.notify(`🧬 DNA SPLICED: New flora species "${name}" added to archive.`, "success");
        return newSpecies;
    }

    // Roadmap Item 509: Fauna evolution simulator
    updateFaunaEvolution(delta) {
        if (this.stats.biomass < 30) return;
        
        if (Math.random() < 0.005 * delta) {
            const mutation = Math.random() > 0.5 ? 'predator' : 'prey';
            this.faunaEvolutionPool.push({
                type: mutation,
                generation: 1,
                timestamp: Date.now()
            });
            this.game.notify(`🐾 EVOLUTION: A new ${mutation} species has emerged in the ecosystem!`, "info");
        }

        // Roadmap Item 511: Invasive species logic
        if (this.faunaEvolutionPool.length > 5 && Math.random() < 0.001 * delta) {
            const species = this.faunaEvolutionPool[Math.floor(Math.random() * this.faunaEvolutionPool.length)];
            if (!species.invasive) {
                species.invasive = true;
                this.invasiveSpecies.push(species);
                this.game.notify(`⚠️ INVASIVE SPECIES: A ${species.type} population is destabilizing the food chain!`, "warning");
            }
        }
    }

    // Roadmap Item 513: Soil nutrient modeling
    updateNutrients(delta) {
        if (this.stats.biomass < 10) return;
        
        // Natural depletion by biomass growth
        this.nutrients.nitrogen -= this.stats.biomass * 0.0001 * delta;
        this.nutrients.phosphorus -= this.stats.biomass * 0.00005 * delta;
        
        // Replenishment from buildings
        const hasComposter = this.game.structures.some(s => s.type === 'composter' && s.condition > 50);
        if (hasComposter) {
            this.nutrients.nitrogen += 0.01 * delta;
            this.nutrients.phosphorus += 0.005 * delta;
        }

        // Limit range
        for (const k in this.nutrients) {
            this.nutrients[k] = Math.max(0, Math.min(100, this.nutrients[k]));
        }

        // Impact on biomass growth rate
        if (this.nutrients.nitrogen < 5 || this.nutrients.phosphorus < 5) {
            this.rate.biomass -= 0.05;
            if (Math.random() < 0.001 * delta) {
                this.game.notify("🍂 SOIL DEPLETION: Nutrient levels are critically low. Biomass growth stalling.", "warning");
            }
        }
    }

    // Roadmap Item 517: Animal domestication
    domesticateSpecies(speciesId) {
        const species = this.faunaEvolutionPool.find(s => s.id === speciesId || s.timestamp === speciesId);
        if (species && !species.domesticated) {
            species.domesticated = true;
            this.domesticatedSpecies.push(species);
            this.game.notify(`🐄 DOMESTICATION: The ${species.type} has been successfully domesticated for colony use.`, "success");
            this.rate.biomass += 0.02; // Controlled growth
        }
    }

    // Roadmap Item 518: Alien biosphere analysis
    analyzeBiosphere() {
        if (this.stats.biomass < 5) return;
        const scanData = {
            timestamp: Date.now(),
            biomass: this.stats.biomass,
            habitability: this.habitability,
            speciesCount: this.faunaEvolutionPool.length + this.dnaArchive.length
        };
        this.xenodex.push(scanData);
        this.game.notify("🔬 XENODEX: Planetary biosphere scan complete. Data added to archive.", "info");
        
        // Roadmap Item 519: Rare plant discovery
        if (Math.random() < 0.1) {
            this.game.notify("🌸 RARE PLANT: Sensors detected a unique floral specimen with potential medicinal properties!", "success");
            this.game.resources.data += 100;
        }
    }

    // Roadmap Item 521: Climate tipping points
    updateClimateTippingPoints(delta) {
        // Albedo effect: ice reflects heat
        this.tippingPoints.albedo = (this.iceCaps / 100) * 0.3;
        this.rate.temperature -= this.tippingPoints.albedo * 0.1;

        if (this.stats.temperature > 80 && !this.tippingPoints.thermal_runaway) {
            this.tippingPoints.thermal_runaway = true;
            this.game.notify("🔥 TIPPING POINT: Thermal runaway detected. Temperature rising uncontrollably!", "danger");
        }
        if (this.tippingPoints.thermal_runaway) {
            this.rate.temperature += 0.1 * delta;
        }
    }

    // Roadmap Item 522: Polar ice caps
    updatePolarIceCaps(delta) {
        if (this.stats.temperature > 60) {
            this.iceCaps = Math.max(0, this.iceCaps - 0.1 * delta);
            if (this.iceCaps > 0) this.rate.water += 0.05 * delta; // Melting adds water
        } else if (this.stats.temperature < 30) {
            this.iceCaps = Math.min(100, this.iceCaps + 0.1 * delta);
        }
    }

    // Roadmap Item 523: Ocean currents
    updateOceanCurrents(delta) {
        if (this.stats.water < 30) {
            this.oceanCurrentIntensity = Math.max(0, this.oceanCurrentIntensity - 0.01 * delta);
            return;
        }
        // Currents stabilize temperature
        const diff = 50 - this.stats.temperature;
        this.rate.temperature += diff * 0.001 * this.oceanCurrentIntensity;
    }

    // Roadmap Item 531: Migration patterns
    updateMigrationPatterns(delta) {
        if (this.faunaEvolutionPool.length < 3) return;
        if (Math.random() < 0.001 * delta) {
            this.migrationPaths.push({
                species: this.faunaEvolutionPool[0].type,
                timestamp: Date.now(),
                direction: Math.random() * Math.PI * 2
            });
            if (this.migrationPaths.length > 10) this.migrationPaths.shift();
            this.game.notify("🦒 MIGRATION: Fauna species are moving to more favorable biomes.", "info");
        }
    }

    // Roadmap Item 532: Evolutionary arms race
    updateArmsRace(delta) {
        if (this.faunaEvolutionPool.length > 0) {
            // As colony grows, fauna becomes more aggressive/resilient
            const colonyPower = this.game.structures.length * 0.01;
            this.faunaAggression += colonyPower * 0.0001 * delta;
            
            if (this.faunaAggression > 0.5 && Math.random() < 0.0001 * delta) {
                this.game.notify("🦖 ARMS RACE: Local fauna adapting to colony presence. Aggression levels rising!", "warning");
            }
        }
    }

    // Roadmap Item 534: Seed Vaults
    backupGeneticData(species) {
        if (!this.seedVault.find(s => s.id === species.id)) {
            this.seedVault.push(species);
            this.game.notify(`💾 SEED VAULT: Genetic data for ${species.name} backed up.`, "success");
        }
    }

    // Roadmap Item 535: Cloning facilities
    runCloningCycle() {
        if (this.cloningActive && this.game.resources.energy > 100) {
            this.game.resources.energy -= 100;
            if (this.seedVault.length > 0 && Math.random() < 0.05) {
                const species = this.seedVault[Math.floor(Math.random() * this.seedVault.length)];
                this.game.notify(`🧬 CLONING: Successfully resurrected ${species.name} population.`, "success");
                this.rate.biomass += 0.05;
            }
        }
    }

    // Roadmap Item 537: Bio-fuel industry
    updateBioFuel(delta) {
        const refineries = this.game.structures.filter(s => s.type === 'bio_refinery' && s.condition > 50).length;
        if (refineries > 0 && this.stats.biomass > 20) {
            this.bioFuelLevel += refineries * 0.05 * delta;
            this.rate.biomass -= refineries * 0.01; // Consumes biomass
            this.game.resources.energy += refineries * 2 * delta;
        }
    }

    // Roadmap Item 538: Organic construction
    growOrganicStructure(type) {
        if (this.stats.biomass < 50 || this.stats.water < 40) return;
        const newOrg = {
            id: 'org_' + Date.now(),
            type: type,
            health: 100,
            growth: 0
        };
        this.organicStructures.push(newOrg);
        this.game.notify(`🌱 ORGANIC GROWTH: A new ${type} structure has begun to grow from local flora!`, "success");
    }

    // Roadmap Item 539: Neural-link beast mastery
    applyBeastMastery(amount) {
        this.beastMasteryLevel = Math.min(100, this.beastMasteryLevel + amount);
        if (this.beastMasteryLevel > 50) {
            this.faunaAggression = Math.max(0, this.faunaAggression - 0.05); // Taming effect
        }
    }

    // Roadmap Item 541: Terraforming side effects
    updateSoilAcidity(delta) {
        // High industrial activity or acid rain increases acidity
        const industryCount = this.game.structures.filter(s => s.type === 'mine' || s.type === 'fusion').length;
        if (this.currentWeather === 'acid_rain') this.soilPH -= 0.01 * delta;
        this.soilPH -= industryCount * 0.0005 * delta;
        
        // Natural recovery or treatment
        const hasLimingPlant = this.game.structures.some(s => s.type === 'liming_plant' && s.condition > 50);
        if (hasLimingPlant) this.soilPH += 0.005 * delta;
        else this.soilPH += 0.0001 * delta;

        this.soilPH = Math.max(3.0, Math.min(9.0, this.soilPH));
        
        if (this.soilPH < 5.0 || this.soilPH > 8.5) {
            this.rate.biomass -= 0.03;
            if (Math.random() < 0.0005 * delta) {
                this.game.notify("🧪 SOIL TOXICITY: PH levels are detrimental to local flora.", "warning");
            }
        }
    }

    // Roadmap Item 542: Volcanic soil fertility
    updateVolcanicSoil(delta) {
        if (this.currentWeather === 'earthquake' || this.stats.coreTemp > 80) {
            // Ash deposits increase nutrients long-term but damage biomass short-term
            this.nutrients.potassium += 0.02 * delta;
            this.rate.biomass -= 0.05; // Damage from heat/ash
            if (Math.random() < 0.001 * delta) {
                this.game.notify("🌋 VOLCANIC FERTILITY: Volcanic ash is enriching the soil with minerals.", "info");
            }
        }
    }

    // Roadmap Item 543 & 544: Pollution impacts
    updatePollutionEffects(delta) {
        const colonySize = this.game.structures.length;
        this.pollution.light = colonySize * 0.5;
        this.pollution.sound = colonySize * 0.3;
        
        if (this.pollution.light > 50) {
            this.rate.biomass -= 0.01; // Photosynthesis disruption
        }
        if (this.pollution.sound > 40) {
            this.faunaAggression += 0.001 * delta; // Stressing fauna
        }
    }

    // Roadmap Item 546: Land reclamation
    reclaimLand(delta) {
        const reclaimers = this.game.structures.filter(s => s.type === 'land_reclaimer' && s.condition > 50).length;
        if (reclaimers > 0 && this.stats.water > 10) {
            this.reclaimedLand += reclaimers * 0.01 * delta;
            this.stats.water -= reclaimers * 0.005 * delta;
            this.rate.biomass += reclaimers * 0.02;
        }
    }

    // Roadmap Item 547 & 548: Artificial islands and floating cities
    buildFloatingStructure(type) {
        if (this.stats.water < 50) return;
        this.game.notify(`🏙️ FLOATING CITY: Construction of ${type} started on planetary oceans.`, "success");
        // Morale/Population capacity bonus foundation
    }

    // Roadmap Item 549: Atmospheric mining drones (Aero-whales)
    updateAeroWhales(delta) {
        const hangar = this.game.structures.find(s => s.type === 'whale_hangar' && s.condition > 50);
        if (hangar) {
            this.aeroWhalesActive = 5;
            this.rate.atmosphere += 0.05;
            this.game.resources.gas += 10 * delta;
        }
    }

    // Roadmap Item 551: Cross-planet species transplantation
    importSpecies(speciesData) {
        if (!this.offworldSpecies.find(s => s.id === speciesData.id)) {
            this.offworldSpecies.push(speciesData);
            this.game.notify(`🚀 IMPORT: Offworld species ${speciesData.name} introduced to local biosphere.`, "info");
            this.rate.biomass += 0.05;
        }
    }

    // Roadmap Item 552: Hybrid species creation
    createHybrid(speciesA, speciesB) {
        if (this.game.resources.data < 500) return;
        this.game.resources.data -= 500;
        const hybrid = {
            id: `hybrid_${Date.now()}`,
            name: `${speciesA.name}-${speciesB.name} Hybrid`,
            type: 'hybrid',
            bonus: (speciesA.bonus || 'growth') + '-' + (speciesB.bonus || 'resilience')
        };
        this.dnaArchive.push(hybrid);
        this.game.notify(`🧬 HYBRIDIZATION: Successfully created ${hybrid.name}.`, "success");
        return hybrid;
    }

    // Roadmap Item 553: Bio-weapon development
    developBioWeapon() {
        if (this.bioWeaponDevelopmentActive) return;
        this.bioWeaponDevelopmentActive = true;
        this.game.notify("☣️ RESEARCH: High-risk biological agent development authorized. Moral standing affected.", "danger");
        // Reputation/Moral impact foundation
    }

    // Roadmap Item 554: Pheromone traps
    updatePheromoneTraps(delta) {
        const trapCount = this.game.structures.filter(s => s.type === 'pheromone_trap' && s.condition > 50).length;
        if (trapCount > 0 && this.faunaAggression > 0.1) {
            this.faunaAggression -= trapCount * 0.005 * delta;
            this.game.resources.data += trapCount * 0.1 * delta; // Research from trapped pests
        }
    }

    // Roadmap Item 555: Urban greening
    updateUrbanGreening(delta) {
        const parks = this.game.structures.filter(s => s.type === 'xenopark' && s.condition > 50).length;
        this.urbanGreeningLevel = parks * 5;
        if (parks > 0) {
            this.rate.biomass += parks * 0.01;
            // Morale boost foundation
        }
    }

    // Roadmap Item 556 & 557: Seasonal and plant logic
    updateSeasonalEffects(delta) {
        this.seasonalCycle = (this.seasonalCycle + 0.0001 * delta) % 1.0;
        const isWinter = this.seasonalCycle > 0.75;
        const isAutumn = this.seasonalCycle > 0.5 && this.seasonalCycle <= 0.75;
        
        if (isAutumn) {
            // Deciduous logic: shedding leaves
            this.rate.biomass -= 0.02;
            if (Math.random() < 0.0001) this.game.notify("🍂 AUTUMN: Flora enters dormancy cycle. Biomass growth slowed.", "info");
        }
        if (isWinter) {
            this.rate.temperature -= 0.1;
            this.rate.biomass -= 0.05;
        }
    }

    // Roadmap Item 558: Roots vs Structures
    updateRootInterference(delta) {
        if (this.stats.biomass > 80) {
            const structures = this.game.structures;
            if (structures.length > 0 && Math.random() < 0.001 * delta) {
                const target = structures[Math.floor(Math.random() * structures.length)];
                target.health = Math.max(0, (target.health || 100) - 1);
                this.game.notify(`🌳 ROOT INTRUSION: Expanding flora roots are damaging ${target.type}!`, "warning");
            }
        }
    }

    // Roadmap Item 559: Cave ecosystems
    updateCaveEcosystems(delta) {
        if (this.stats.pressure > 60) {
            this.rate.biomass += 0.02; // Underground life expansion
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🔦 CAVE LIFE: Bioluminescent organisms discovered in subterranean caverns.", "info");
            }
        }
    }

    // Roadmap Item 561: Desertification prevention
    updateDesertification(delta) {
        if (this.stats.temperature > 70 && this.stats.water < 20) {
            this.desertification += 0.01 * delta;
            this.rate.biomass -= 0.02;
            if (this.desertification > 50 && Math.random() < 0.0005 * delta) {
                this.game.notify("🏜️ DESERTIFICATION: Arid conditions are permanently claiming fertile land!", "warning");
            }
        } else {
            this.desertification = Math.max(0, this.desertification - 0.005 * delta);
        }
    }

    // Roadmap Item 562: Sand-worm analogs
    updateSandWormActivity(delta) {
        if (this.desertification > 40 && Math.random() < 0.0001 * delta) {
            this.game.notify("🪱 SAND-WORM: Massive subterranean organisms detected moving through desert sectors.", "warning");
            // Damage foundations of nearby buildings
            const target = this.game.structures[Math.floor(Math.random() * this.game.structures.length)];
            if (target) target.health = Math.max(0, (target.health || 100) - 5);
        }
    }

    // Roadmap Item 563: Swarm events
    updateSwarms(delta) {
        if (this.stats.biomass > 40 && Math.random() < 0.00005 * delta) {
            this.swarmIntensity = 10;
            this.game.notify("🦗 SWARM: Locust-like organisms are consuming vast tracts of biomass!", "danger");
        }
        if (this.swarmIntensity > 0) {
            this.rate.biomass -= 0.1;
            this.swarmIntensity -= 0.01 * delta;
        }
    }

    // Roadmap Item 564: Bird flight physics
    updateAtmosphericLife(delta) {
        if (this.stats.atmosphere > 30) {
            // High atmosphere pressure enables larger flying organisms
            const density = this.stats.pressure / 100;
            if (density > 0.8 && Math.random() < 0.0001 * delta) {
                this.game.notify("🦅 MEGA-FAUNA: Giant avian-analogs sighted gliding on thermal updrafts.", "info");
            }
        }
    }

    // Roadmap Item 566: Deep-sea thermal vent life
    updateThermalVentLife(delta) {
        if (this.stats.water > 60 && this.stats.coreTemp > 70) {
            this.thermalVentLifeActive = true;
            this.rate.biomass += 0.04;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🌋 THERMAL VENTS: Unique chemosynthetic ecosystems discovered near deep-sea vents.", "info");
            }
        }
    }

    // Roadmap Item 567: Bioluminescent ocean waves
    updateBioluminescentWaves(delta) {
        if (this.stats.water > 50 && this.stats.biomass > 40) {
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🌊 BIOLUMINESCENCE: Planetary oceans are glowing with biological light!", "info");
                // Morale boost foundation
            }
        }
    }

    // Roadmap Item 568: Pressure-resistant biology
    applyPressureResistance(amount) {
        // Increases habitability in high-pressure worlds
        this.pressureResistanceLevel = (this.pressureResistanceLevel || 0) + amount;
    }

    // Roadmap Item 569: Extremophile research
    runExtremophileResearch(delta) {
        if (this.stats.temperature > 80 || this.stats.temperature < 10) {
            this.game.resources.data += 0.05 * delta;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🧪 EXTREMOPHILES: Researching life in extreme conditions. High-value data acquired!", "info");
            }
        }
    }

    // Roadmap Item 571: Ammonia-based biospheres
    updateAmmoniaLife(delta) {
        if (this.stats.temperature < 15 && this.stats.atmosphere > 60) {
            this.ammoniaLifeActive = true;
            this.rate.biomass += 0.03;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🧊 AMMONIA LIFE: Cryo-biospheres detected in liquid ammonia pools.", "info");
            }
        }
    }

    // Roadmap Item 572: Plasma-based life
    updatePlasmaLife(delta) {
        if (this.stats.coreTemp > 90 && this.stats.magnetism > 80) {
            this.plasmaLifeActive = true;
            this.game.resources.energy += 5 * delta;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("☀️ PLASMA LIFE: High-energy entities detected within the planetary magnetic web.", "success");
            }
        }
    }

    // Roadmap Item 573: Gaseous life forms
    updateGaseousLife(delta) {
        if (this.game.planetData?.type === 'Gas Giant' && this.stats.atmosphere > 80) {
            this.gaseousLifeActive = true;
            this.rate.biomass += 0.05;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🎈 GAS LIFE: Mass clusters of buoyant organisms detected in the upper cloud layers.", "info");
            }
        }
    }

    // Roadmap Item 574: Crystalline flora
    updateCrystallineFlora(delta) {
        if (this.stats.pressure > 90) {
            this.rate.biomass += 0.02;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("💎 CRYSTAL FLORA: Geometric structures matching biological growth patterns detected.", "info");
            }
        }
    }

    // Roadmap Item 575: Metallic-shelled fauna
    updateMetallicFauna(delta) {
        if (this.game.resources.minerals > 5000 && this.stats.biomass > 20) {
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🦾 METAL FAUNA: Local organisms are incorporating planetary ores into their biology.", "info");
                // Salvage bonus foundation
            }
        }
    }

    // Roadmap Item 576 & 577: Specialized life
    updateSpecializedLife(delta) {
        if (this.stats.biomass > 30) {
            if (this.currentWeather === 'ion_storm' && Math.random() < 0.001) {
                this.game.notify("🔊 SONIC PLANTS: Flora detected resonating with atmospheric vibrations.", "info");
            }
            if (this.game.modifiers.gravity > 2.0 && Math.random() < 0.001) {
                this.game.notify("⚖️ GRAVITY SENSORS: Fauna observed navigating via local mass-concentration shifts.", "info");
            }
        }
    }

    // Roadmap Item 578: Electric eels analogs
    updateElectricLife(delta) {
        const reefCount = this.game.structures.filter(s => s.type === 'coral_array' && s.condition > 50).length;
        if (reefCount > 0 && this.stats.water > 50) {
            this.game.resources.energy += reefCount * 0.5 * delta;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("⚡ BIO-POWER: Harnessing discharge from electric-eel analogs in planetary reefs.", "success");
            }
        }
    }

    // Roadmap Item 579: Genetic "Memory" puzzles
    solveGeneticMemory(dna) {
        if (dna.includes('MEM')) {
            this.game.notify("🧠 GENETIC MEMORY: Ancient navigational data extracted from flora DNA!", "success");
            this.game.resources.data += 1000;
        }
    }

    // Roadmap Item 581: Bio-diversity grants
    calculateBiodiversity() {
        const totalSpecies = this.dnaArchive.length + this.faunaEvolutionPool.length + this.offworldSpecies.length;
        this.biodiversityScore = Math.min(100, totalSpecies * 5);
        if (this.biodiversityScore > 80 && Math.random() < 0.001) {
            this.game.notify("🏆 BIO-DIVERSITY: Galactic conservation grant awarded for high planetary species richness!", "success");
            this.game.resources.credits += 2000;
        }
    }

    // Roadmap Item 582: Galactic Zoo
    captureForZoo(speciesId) {
        const species = this.faunaEvolutionPool.find(s => s.id === speciesId || s.timestamp === speciesId);
        if (species) {
            this.game.notify(`🎪 ZOO: Specimen of ${species.type} captured for the Galactic Exhibition.`, "success");
            this.game.resources.credits += 500;
            // Remove from pool foundation
        }
    }

    // Roadmap Item 583: Eco-terrorism
    updateEcoThreats(delta) {
        if (this.stats.erosion > 70 || this.pollution.wasteWater > 50) {
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("💣 SABOTAGE: Eco-terrorist cell detected! Industrial structures under threat.", "danger");
                const target = this.game.structures.find(s => s.type === 'mine' || s.type === 'fusion');
                if (target) target.condition = Math.max(0, target.condition - 30);
            }
        }
    }

    // Roadmap Item 584: Planetary Spirit
    updatePlanetarySpirit(delta) {
        if (this.stats.biomass > 90 && this.habitability > 90) {
            this.spiritBondLevel += 0.001 * delta;
            if (this.spiritBondLevel > 10 && !this.planetarySpiritAwakened) {
                this.planetarySpiritAwakened = true;
                this.game.notify("🌍 GAIA AWAKENED: The planetary biosphere has achieved a state of unified spirit.", "success");
            }
        }
    }

    // Roadmap Item 585: Biosphere communication
    communicateWithBiosphere() {
        if (this.planetarySpiritAwakened) {
            this.game.notify("📡 COMMUNION: Received telepathic feedback from the collective flora.", "success");
            this.game.resources.data += 500;
        }
    }

    // Roadmap Item 586: Global Consciousness
    updateGlobalConsciousness(delta) {
        if (this.planetarySpiritAwakened && this.game.resources.data > 5000) {
            this.globalConsciousnessActive = true;
            this.rate.biomass += 0.1; // Biosphere self-optimization
        }
    }

    // Roadmap Item 587: Bio-mechanical integration
    applyBioMechUpgrade() {
        if (this.stats.biomass > 50 && this.game.resources.circuits > 1000) {
            this.game.notify("🦾 BIO-MECH: Cybernetic interfaces integrated into local flora root-networks.", "success");
            // Production speed bonus foundation
        }
    }

    // Roadmap Item 588: Living ships
    growLivingShip() {
        if (this.stats.biomass > 80 && this.game.resources.exotic_matter > 5) {
            this.game.notify("🛸 ORGANIC HULL: A living vessel is being gestated in the biomass pools.", "success");
            // Item 469 connection
        }
    }

    // Roadmap Item 589: Biological computers
    updateBioComputers(delta) {
        const bioLabs = this.game.structures.filter(s => s.type === 'wetware_lab' && s.condition > 50).length;
        if (bioLabs > 0) {
            this.game.resources.data += bioLabs * 2 * delta;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🧠 WETWARE: Biological neural-networks outperforming traditional silicon processors.", "success");
            }
        }
    }

    // Roadmap Item 591: Hibernation tech
    toggleHibernation(active) {
        this.hibernationActive = active;
        this.game.notify(`❄️ HIBERNATION: Colony sleep cycles ${active ? 'activated' : 'deactivated'}. Energy consumption reduced by 80%.`, "info");
        // Update game loop consumption foundations
    }

    // Roadmap Item 592-595: Genetic modifications
    applyGeneticMod(modType) {
        const mods = {
            'uv_skin': 'Protects colonists from radiation damage.',
            'lung_filter': 'Enables breathing in toxic atmospheres.',
            'gills': 'Enables underwater colonization.',
            'wings': 'Increases mobility on low-G worlds.'
        };
        if (mods[modType]) {
            this.game.notify(`🧬 GMOD: ${modType.toUpperCase()} mutation successfully applied to colony population. ${mods[modType]}`, "success");
            // Habitability impact foundation
        }
    }

    // Roadmap Item 596: Bio-feedback
    updateBioFeedback(delta) {
        if (this.stats.biomass > 70 && this.habitability > 80) {
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🧘 BIO-FEEDBACK: Natural biomes are synchronized with colony neural-rhythms. Morale is peaking.", "success");
            }
        }
    }

    // Roadmap Item 597: Genetic "Heritage" tracker
    logGeneticHeritage(species) {
        this.geneticHeritage.push({
            id: species.id,
            ancestor: species.ancestor || 'root',
            timestamp: Date.now()
        });
    }

    // Roadmap Item 598: Evolutionary "Fast-Forward" artifacts
    useEvolutionArtifact() {
        if (this.game.resources.exotic_matter < 1) return;
        this.game.resources.exotic_matter -= 1;
        this.game.notify("🌀 ARTIFACT: Spacetime anomaly accelerating local evolutionary cycles!", "success");
        for (let i = 0; i < 10; i++) this.updateFaunaEvolution(100);
    }

    // Roadmap Item 599: The "Great Harvest" event
    triggerGreatHarvest() {
        if (this.stats.biomass > 95 && this.habitability > 90) {
            this.game.notify("🌾 GREAT HARVEST: Planetary yields have reached a golden age. Massive resource windfall!", "success");
            this.game.resources.food += 10000;
            this.game.resources.credits += 5000;
        }
    }

    // Roadmap Item 600: Total biospheric transcendence
    updateTranscendence(delta) {
        if (this.planetarySpiritAwakened && this.globalConsciousnessActive) {
            this.transcendenceProgress += 0.0001 * delta;
            if (this.transcendenceProgress >= 1.0) {
                this.game.notify("🌌 TRANSCENDENCE: The planet and its inhabitants have ascended beyond material existence.", "success");
                this.game.victory?.trigger('BIOLOGICAL');
            }
        }
    }

    // Roadmap Item 512: Pollination cycles
    updatePollination(delta) {
        if (this.stats.biomass > 20) {
            const pollinationRate = (this.stats.biomass / 100) * 0.05;
            this.rate.biomass += pollinationRate * delta;
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("🐝 POLLINATION: Flora species are cross-pollinating, accelerating biomass growth.", "info");
            }
        }
    }

    // Roadmap Item 533: Pathogen and pandemic logic
    updatePathogens(delta) {
        if (this.pathogenLevel > 0) {
            this.pathogenLevel = Math.max(0, this.pathogenLevel - 0.01 * delta);
            this.rate.biomass -= 0.1 * (this.pathogenLevel / 100);
        }
        
        if (this.stats.biomass > 60 && Math.random() < 0.00005 * delta) {
            this.pathogenLevel = 20 + Math.random() * 30;
            this.game.notify("☣️ PATHOGEN: A biological contagion is spreading through the local ecosystem!", "danger");
        }
    }

    // Roadmap Item 536: Synthetic meat production
    updateSyntheticMeat(delta) {
        const labs = this.game.structures.filter(s => s.type === 'synth_meat_lab' && s.condition > 50).length;
        if (labs > 0) {
            const production = labs * 5 * delta;
            this.game.resources.food += production;
            this.syntheticMeatOutput = production;
        }
    }

    // Roadmap Item 540: Ecosystem Health Calculation
    calculateEcosystemHealth() {
        let health = 100;
        health -= (100 - this.habitability) * 0.2;
        health -= this.pathogenLevel;
        health -= (this.pollution.light + this.pollution.sound + this.pollution.wasteWater) * 0.1;
        this.ecosystemHealth = Math.max(0, Math.min(100, health));
    }

    // Roadmap Item 544: Waste water management
    updateWasteWater(delta) {
        const industry = this.game.structures.filter(s => s.type === 'mine' || s.type === 'fusion').length;
        this.pollution.wasteWater += industry * 0.01 * delta;
        
        const treatment = this.game.structures.filter(s => s.type === 'water_treatment' && s.condition > 50).length;
        this.pollution.wasteWater = Math.max(0, this.pollution.wasteWater - treatment * 0.05 * delta);
        
        if (this.pollution.wasteWater > 50) {
            this.rate.water -= 0.02;
            if (Math.random() < 0.0005 * delta) {
                this.game.notify("🚱 WATER POLLUTION: Untreated waste water is contaminating planetary aquifers.", "warning");
            }
        }
    }

    // Roadmap Item 550: Space elevator contamination risk
    updateElevatorContamination(delta) {
        const hasElevator = this.game.structures.some(s => s.type === 'space_elevator');
        if (hasElevator) {
            this.elevatorContaminationRisk = Math.min(100, this.elevatorContaminationRisk + 0.001 * delta);
            if (this.elevatorContaminationRisk > 50 && Math.random() < 0.0001 * delta) {
                this.game.notify("🛸 CONTAMINATION: Risk of offworld biological exchange detected at the space elevator.", "warning");
            }
        }
    }

    // Roadmap Item 570: Silicon-based life evolution
    updateSiliconLife(delta) {
        if (this.game.planetData?.type === 'Volcanic' && this.stats.coreTemp > 80) {
            this.siliconLifeLevel = Math.min(100, this.siliconLifeLevel + 0.01 * delta);
            if (this.siliconLifeLevel > 50 && Math.random() < 0.0001 * delta) {
                this.game.notify("💎 SILICON LIFE: Non-carbon based organisms are crystallizing in the magma flows.", "info");
            }
        }
    }

    // Roadmap Item 560: High-altitude life forms
    updateHighAltitudeLife(delta) {
        if (this.stats.atmosphere > 70 && this.stats.pressure > 60) {
            if (Math.random() < 0.0001 * delta) {
                this.game.notify("☁️ SKY-LIFE: Rare organisms detected floating in the upper stratosphere.", "info");
                this.rate.biomass += 0.01;
            }
        }
    }

    update(delta) {
        // Roadmap Item 169: AI-driven terraforming strategies
        this.applyAIStrategy();

        // Roadmap Item 391 & 392: End of Time / Cosmic Fate
        this.applyCosmicEntropy(delta);

        // 1. Recalculate Rates based on buildings
        this.recalculateRates();

        // 2. Weather Events (Random)
        this.handleWeather(delta);

        // 2.5 Evolution & Life (Roadmap 509)
        this.updateFaunaEvolution(delta);

        // 2.6 Pollination & Nutrients (Roadmap 512, 513)
        this.updatePollination(delta);
        this.updateNutrients(delta);

        // 2.7 Climate & Oceans (Roadmap 521, 522, 523)
        this.updateClimateTippingPoints(delta);
        this.updatePolarIceCaps(delta);
        this.updateOceanCurrents(delta);

        // 2.8 Migration & Evolution (Roadmap 531, 532, 533)
        this.updateMigrationPatterns(delta);
        this.updateArmsRace(delta);
        this.updatePathogens(delta);

        // 2.9 Bio-Engineering (Roadmap 535, 536)
        this.runCloningCycle();
        this.updateSyntheticMeat(delta);
        this.updateBioFuel(delta);

        // 2.10 Health & Stability (Roadmap 540)
        this.calculateEcosystemHealth();
        this.updateSoilAcidity(delta);
        this.updateVolcanicSoil(delta);
        this.updatePollutionEffects(delta);
        this.updateWasteWater(delta);

        // 2.11 Advanced Projects (Roadmap 546-550)
        this.reclaimLand(delta);
        this.updateAeroWhales(delta);
        this.updateElevatorContamination(delta);

        // 2.12 Planetary Ecology (Roadmap 551-560)
        this.updatePheromoneTraps(delta);
        this.updateUrbanGreening(delta);
        this.updateSeasonalEffects(delta);
        this.updateRootInterference(delta);
        this.updateCaveEcosystems(delta);
        this.updateHighAltitudeLife(delta);

        // 2.13 Extreme Biospheres (Roadmap 561-565)
        this.updateDesertification(delta);
        this.updateSandWormActivity(delta);
        this.updateSwarms(delta);
        this.updateAtmosphericLife(delta);

        // 2.14 Deep Sea & Exotic Life (Roadmap 566-570)
        this.updateThermalVentLife(delta);
        this.updateBioluminescentWaves(delta);
        this.runExtremophileResearch(delta);
        this.updateSiliconLife(delta);

        // 2.15 Exotic Biospheres II (Roadmap 571-580)
        this.updateAmmoniaLife(delta);
        this.updatePlasmaLife(delta);
        this.updateGaseousLife(delta);
        this.updateCrystallineFlora(delta);
        this.updateMetallicFauna(delta);
        this.updateSpecializedLife(delta);
        this.updateElectricLife(delta);

        // 2.16 Planetary Consciousness (Roadmap 581-590)
        this.calculateBiodiversity();
        this.updateEcoThreats(delta);
        this.updatePlanetarySpirit(delta);
        this.updateGlobalConsciousness(delta);
        this.updateBioComputers(delta);

        // 2.17 Transcendence (Roadmap 591-600)
        this.updateBioFeedback(delta);
        this.updateTranscendence(delta);

        // 3. Apply Rates
        for (const key in this.stats) {
            let change = this.rate[key] * delta;

            // Weather modifiers
            if (this.currentWeather === 'sandstorm' && key === 'temperature') change -= 0.5 * delta;
            if (this.currentWeather === 'solar_flare' && key === 'temperature') change += 1.0 * delta;

            this.stats[key] += change;
            this.stats[key] = Math.max(0, Math.min(100, this.stats[key]));
        }

        this.calculateHabitability();
        this.updateVisuals();
        this.updateUI();
    }

    handleWeather(delta) {
        // Roadmap Item 323: High-G Structural Stress
        if (this.game.modifiers.gravity > 1.5) {
            this.game.structures.forEach(s => {
                if (!s.reinforced && Math.random() < 0.001 * delta) {
                    s.health = Math.max(0, (s.health || 100) - 1);
                    if (Math.random() < 0.05) {
                        this.game.notify(`🏗️ HIGH-G STRESS: ${s.type} is buckling under extreme gravity!`, "warning");
                    }
                }
            });
        }

        // Roadmap Item 322: Entropic World Logic
        if (this.game.planetData?.type === 'Entropic') {
            // Time flows backwards or oddly
            if (Math.random() < 0.01 * delta) {
                this.game.notify("⏳ ENTROPY: Time dilation detected. Production cycles reversed temporarily.", "warning");
                // Effect handled in production loop
            }
        }

        // Roadmap Item 371: Asteroid Impact Events
        if (Math.random() < 0.00002 * delta) {
            this.triggerWeather('asteroid_impact', 5);
        }

        // Roadmap Item 327: Diamond Rain (Icy Giants)
        if (this.game.planetData?.type === 'Ice' && Math.random() < 0.0001 * delta) {
            this.triggerWeather('diamond_rain', 30);
        }

        // Roadmap Item 336: Exotic Particle Storms
        if (Math.random() < 0.00005 * delta) {
            this.triggerWeather('exotic_storm', 15);
        }

        if (this.currentWeather) {
            this.weatherTimer -= delta;
            if (this.weatherTimer <= 0) {
                this.notifyWeatherEnd(this.currentWeather);
                this.currentWeather = null;
                this.weatherTimer = Math.random() * 60 + 60; // Cooldown 1-2 min
            }
        } else {
            this.weatherTimer -= delta;
            if (this.weatherTimer <= 0) {
                const rand = Math.random();
                if (rand < 0.15) this.triggerWeather('sandstorm', 20);
                else if (rand < 0.25) this.triggerWeather('solar_flare', 10);
                else if (rand < 0.35 && this.stats.atmosphere > 30) this.triggerWeather('acid_rain', 15);
                else if (rand < 0.45 && this.stats.temperature < 30) this.triggerWeather('blizzard', 25);
                else if (rand < 0.55 && this.stats.atmosphere > 40) this.triggerWeather('ion_storm', 12);
                else if (rand < 0.65 && this.stats.coreTemp > 70) this.triggerWeather('earthquake', 5);
                else this.weatherTimer = 30; // Retry later
            }
        }
    }

    triggerWeather(type, duration) {
        // Protection check: Magnetism reduces solar/ion storm impact
        if ((type === 'solar_flare' || type === 'ion_storm') && this.stats.magnetism > 70) {
            this.game.notify(`🛡️ Magnetic field deflected ${type.replace('_',' ')}!`, "success");
            return;
        }

        // Roadmap Item 8: Seismic Activity
        if (type === 'earthquake') {
            this.game.notify("🌋 Seismic activity detected! Ground tremors imminent.", "warning");
            // Damage buildings slightly
            if (this.game.structures) {
                this.game.structures.forEach(s => {
                    s.health = Math.max(0, (s.health || 100) - (Math.random() * 5 + 5));
                });
            }
        }

        this.currentWeather = type;
        this.weatherTimer = duration;
        console.log(`Weather Event: ${type} started.`);

        let msg = "";
        let color = "warning";
        if (type === 'sandstorm') msg = "⚠️ Sandstorm approaching! Solar efficiency dropping.";
        if (type === 'solar_flare') msg = "⚠️ Solar Flare detected! Temperature rising.";
        if (type === 'acid_rain') { msg = "⚠️ Acid Rain! Structure corrosion Imminent."; this.rate.erosion += 0.5; }
        if (type === 'blizzard') msg = "❄️ Severe Blizzard! Energy consumption peaking.";
        if (type === 'ion_storm') { msg = "⚡ Ion Storm! Communication and radar offline."; color = "danger"; }
        if (type === 'diamond_rain') { msg = "💎 DIAMOND RAIN: Extreme pressure causing carbon crystallization. Massive resource bonus, but lethal to structures!"; color = "success"; }
        if (type === 'exotic_storm') { msg = "🌀 EXOTIC STORM: Strange particles are warping local physics. Technology output increased, but energy grids unstable."; color = "warning"; }
        if (type === 'asteroid_impact') { msg = "☄️ ASTEROID IMPACT: A large object has struck the surface! Significant damage detected."; color = "danger"; }

        this.game.notify(msg, color);

        // Apply immediate effects
        if (type === 'sandstorm') {
            if (this.game.modifiers) this.game.modifiers.solarOutput = 0.5;
            if (this.game.scene.fog) this.game.scene.fog.density = 0.05;
        }
        if (type === 'blizzard') {
            if (this.game.scene.fog) this.game.scene.fog.density = 0.08;
        }
        if (type === 'diamond_rain') {
            this.game.resources.minerals += 500;
            if (this.game.structures) {
                this.game.structures.forEach(s => s.health = Math.max(0, (s.health || 100) - 10));
            }
        }
        if (type === 'exotic_storm') {
            if (this.game.modifiers) this.game.modifiers.researchOutput = 2.0;
            this.game.resources.energy = Math.max(0, this.game.resources.energy - 50);
        }
        if (type === 'asteroid_impact') {
            // Roadmap Item 371: Massive damage and environmental shift
            this.stats.temperature += 10;
            this.stats.atmosphere -= 5;
            if (this.game.structures) {
                this.game.structures.forEach(s => {
                    s.health = Math.max(0, (s.health || 100) - 30);
                });
            }
            this.game.createEffect(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 10, 0), 0xff4400);
        }
    }

    notifyWeatherEnd(type) {
        this.game.notify(`Weather Event: ${type} ended.`, "success");
        // Reset effects
        if (type === 'sandstorm' || type === 'blizzard') {
            if (this.game.modifiers) this.game.modifiers.solarOutput = 1.0; 
            if (this.game.scene.fog) this.game.scene.fog.density = 0.005;
        }
        if (type === 'exotic_storm') {
            if (this.game.modifiers) this.game.modifiers.researchOutput = 1.0;
        }
        if (type === 'acid_rain') {
            this.rate.erosion -= 0.5;
        }
    }

    recalculateRates() {
        // Reset rates
        this.rate = { temperature: 0, atmosphere: 0, water: 0, biomass: 0, pressure: 0, coreTemp: 0, magnetism: 0, erosion: 0 };

        // Roadmap Item 328: Tidally Locked Extremes
        if (this.game.planetData?.type === 'Tidally Locked') {
            // One side eternal day, one side eternal night. 
            // This causes massive temperature imbalances and thermal winds (erosion).
            this.rate.temperature += 0.5; // Eternal sun side heating
            this.rate.erosion += 0.1; // Thermal winds
        }

        // Roadmap Item 325: Gas Giant Dynamics
        if (this.game.planetData?.type === 'Gas Giant') {
            this.rate.atmosphere += 0.2; // Massive gas accretion
            this.rate.pressure += 0.1;
        }

        // Roadmap Item 326: Liquid Methane Seas (Titan-like)
        if (this.game.planetData?.type === 'Ocean' && this.stats.temperature < 20) {
            this.rate.water += 0.05; // Methane condensation
            if (Math.random() < 0.001) {
                this.game.notify("🌊 CH4 DETECTION: Hydrocarbon seas are expanding in the extreme cold.", "info");
            }
        }

        // Tidal Force Effects (Roadmap Item 7)
        // If system has moons, they cause tidal heating and erosion
        const moonCount = this.game.currentSystemId % 3; // Deterministic moon count for now
        if (moonCount > 0) {
            this.rate.coreTemp += 0.005 * moonCount; // Tidal heating
            this.rate.erosion += 0.01 * moonCount;   // Tidal wear
        }

        // Natural Decay/Recovery
        if (this.stats.atmosphere > 0) this.rate.atmosphere -= 0.005; // Leakage
        if (this.stats.erosion > 0) this.rate.erosion -= 0.01; // Settlement

        // Scan buildings
        if (!this.game.structures) return;

        for (const s of this.game.structures) {
            // Apply rates per building type
            if (s.type === 'oxy') {
                this.rate.atmosphere += 0.05;
                this.rate.pressure += 0.02;
            }
            if (s.type === 'mine') {
                this.rate.temperature += 0.01;
                this.rate.coreTemp += 0.005; // Friction/drilling heat
                this.rate.erosion += 0.02; // Excavation wear
                
                // Roadmap Item 216: Deep core mining risks
                if (s.level > 2) {
                    this.rate.coreTemp += 0.02;
                    if (this.stats.coreTemp > 80 && Math.random() < 0.01) {
                        this.game.notify("🌋 MAGMA BREACH: Deep core mining has destabilized the crust!", "danger");
                        this.triggerWeather('earthquake', 10);
                    }
                }
            }
            if (s.type === 'fusion') {
                this.rate.temperature += 0.1;
                this.rate.pressure += 0.05;
                this.rate.magnetism += 0.05; // Fusion reactors generate fields
            }
            if (s.type === 'injector') {
                // Roadmap Item 501: Atmospheric Injector
                this.rate.atmosphere += 0.1;
                this.rate.pressure += 0.05;
                // Minor reduction in core temp as it pulls energy/gases
                this.rate.coreTemp -= 0.005;
            }

            // Roadmap Item 502: Greenhouse gas regulation
            if (s.type === 'greenhouse_regulator' && s.condition > 50) {
                this.rate.temperature += 0.2;
                this.rate.atmosphere += 0.1;
                this.rate.pressure += 0.1;
            }

            // Roadmap Item 503: Orbital mirror arrays
            if (s.type === 'orbital_mirror' && s.condition > 50) {
                this.rate.temperature += 0.5;
            }

            // Roadmap Item 505: Tectonic stabilizers
            if (s.type === 'tectonic_stabilizer' && s.condition > 50) {
                this.rate.erosion -= 0.2;
                this.rate.coreTemp -= 0.1;
            }

            // Roadmap Item 506: Planetary Magnetizer
            if (s.type === 'planetary_magnetizer' && s.condition > 50) {
                this.rate.magnetism += 0.3;
            }

            // Roadmap Item 507: Synthetic Bacteria Vat
            if (s.type === 'bacteria_vat' && s.condition > 50) {
                this.rate.biomass += 0.1;
                this.rate.atmosphere += 0.02; // Biological outgassing
            }

            // Roadmap Item 510: Ecosystem Synergy
            if (this.stats.biomass > 50 && this.stats.water > 40 && this.stats.atmosphere > 40) {
                this.rate.biomass += 0.05; // Natural expansion
            }

            // Roadmap Item 514: Irrigation and canal networks
            if (s.type === 'irrigation_network' && s.condition > 50) {
                this.rate.biomass += 0.08;
                this.rate.erosion += 0.01; // Water flow wear
            }

            // Roadmap Item 515: Hydroponics vs Open-air farming
            if (s.type === 'hydroponics_bay' && s.condition > 50) {
                this.rate.biomass += 0.12; // High efficiency
                // Consumes more energy than regular farm
            }

            // Roadmap Item 516: Genetically modified crops
            if (s.type === 'gmo_farm' && s.condition > 50) {
                this.rate.biomass += 0.15;
                // Higher resilience to radiation (logic in habitability)
            }

            // Roadmap Item 525: Desalination plants
            if (s.type === 'desalination_plant' && s.condition > 50) {
                this.rate.water += 0.05;
                // Reduces soil salinity over time (Foundation for future soil salinity stat)
            }

            // Roadmap Item 526: Atmosphere scrubbers
            if (s.type === 'atmo_scrubber' && s.condition > 50) {
                this.rate.atmosphere += 0.02;
                this.rate.pressure -= 0.01;
                // Removes toxic gases (logic in habitability)
            }

            // Roadmap Item 527: Bioluminescent flora
            if (s.type === 'biolum_garden' && s.condition > 50) {
                this.rate.biomass += 0.03;
                // Increases night-time visibility/morale (Foundation)
            }

            // Roadmap Item 528: Carnivorous plants
            if (s.type === 'carnivorous_patch' && s.condition > 50) {
                this.rate.biomass += 0.02;
                // Acts as colony defense against fauna (Foundation)
            }

            // Roadmap Item 529: Giant fungus biomes
            if (s.type === 'fungal_growth' && s.condition > 50) {
                this.rate.atmosphere += 0.04;
                this.rate.biomass += 0.05;
                // Oxygen generation in dark areas (Foundation)
            }

            // Roadmap Item 530: Coral reef analogs
            if (s.type === 'coral_array' && s.condition > 50 && this.stats.water > 30) {
                this.rate.biomass += 0.06;
                this.rate.water += 0.01; // Water purification
            }

            // Roadmap Item 217: Gas giant atmospheric harvesting
            if (s.type === 'gas_siphon') {
                this.rate.atmosphere -= 0.05; // Thinning for harvesting
                this.rate.pressure -= 0.02;
            }
        }
    }

    applyAIStrategy() {
        // Roadmap Item 169: AI-driven terraforming strategies
        // The system automatically adjusts building efficiency or focuses on specific stats
        if (!this.aiStrategy) this.aiStrategy = 'BALANCE';
        
        if (this.game.day % 10 === 0) {
            if (this.stats.temperature < 30) this.aiStrategy = 'HEATING';
            else if (this.stats.atmosphere < 30) this.aiStrategy = 'THICKENING';
            else this.aiStrategy = 'BALANCE';
            
            console.log(`🌍 TERRAFORMING AI: Strategy set to ${this.aiStrategy}`);
        }

        // Apply strategy modifiers
        if (this.aiStrategy === 'HEATING') this.rate.temperature += 0.02;
        if (this.aiStrategy === 'THICKENING') this.rate.atmosphere += 0.02;
    }

    applyCosmicEntropy(delta) {
        // Roadmap Item 391: Galactic 'End of Time' event
        // Roadmap Item 392: Big Crunch vs Big Freeze scenarios
        if (this.game.day > 500) {
            const scenario = this.game.currentSystemId % 2 === 0 ? 'FREEZE' : 'CRUNCH';
            if (scenario === 'FREEZE') {
                this.rate.temperature -= 0.05;
                if (Math.random() < 0.001) this.game.notify("🌌 COSMIC FATE: Big Freeze detected. The universe is cooling to absolute zero.", "danger");
            } else {
                this.rate.temperature += 0.05;
                if (Math.random() < 0.001) this.game.notify("🌌 COSMIC FATE: Big Crunch detected. Spacetime is contracting.", "danger");
            }
        }
    }

    calculateHabitability() {
        // Ideal: Temp 50, Atmo 50, Water 60, Bio 80, Pres 50, Core 50, Mag 60

        let score = 100;
        
        // Roadmap Item 325: Gas Giant Habitability
        if (this.game.planetData?.type === 'Gas Giant') {
            score -= 50; // Inherently less habitable for humans
        }

        // Roadmap Item 337: Gravity Wave Detection
        if (this.game.resources.data > 1000 && Math.random() < 0.005) {
            this.game.notify("📡 GRAVITY WAVE: Local sensors detected a significant ripple in spacetime. High-precision data acquired!", "success");
            this.game.resources.data += 200;
        }

        // Temperature Impact
        if (this.stats.temperature < 20 || this.stats.temperature > 80) score -= 20;
        
        // Atmosphere Impact
        if (this.stats.atmosphere < 20) score -= 40; 
        
        // Water/Ocean Impact (Roadmap Item 24: Sub-surface Oceans)
        const hasSubSurfaceOcean = this.stats.temperature < 25 && this.stats.coreTemp > 60;
        if (hasSubSurfaceOcean && this.stats.water < 30) {
            // High core temp melted internal ice!
            this.stats.water += 0.1; 
            this.game.notify("🔬 Sub-surface ocean detected! Internal heat melting crustal ice.", "info");
        }

        if (this.stats.water < 10 && !hasSubSurfaceOcean) score -= 10;
        
        // Biomass Impact
        if (this.stats.biomass < 10) score -= 10;

        // Pressure Impact (Item 3)
        if (this.stats.pressure < 20 || this.stats.pressure > 80) score -= 15;

        // Radiation/Magnetism Impact (Item 9: Radiation Belts)
        const radiationLevel = Math.max(0, 100 - this.stats.magnetism - (this.stats.atmosphere * 0.5));
        if (radiationLevel > 50) {
            score -= (radiationLevel - 50) * 0.5;
            if (Math.random() < 0.01) {
                this.game.notify("☢️ Warning: High radiation levels detected! Shielding insufficient.", "danger");
            }
        }

        if (this.stats.magnetism < 30) score -= 15;

        this.habitability = Math.max(0, score);
    }

    modifyParameter(param, amount) {
        if (this.stats[param] !== undefined) {
            this.stats[param] += amount;
            this.updateUI();
        }
    }

    setRate(param, rate) {
        if (this.rate[param] !== undefined) {
            this.rate[param] = rate;
        }
    }

    updateVisuals() {
        if (!this.game.planetMesh || !this.game.planetMesh.material.uniforms) return;

        const uniforms = this.game.planetMesh.material.uniforms;

        // Biomass -> Grass Color
        const bio = this.stats.biomass / 100;
        const r = 0.6 * (1 - bio) + 0.1 * bio;
        const g = 0.5 * (1 - bio) + 0.6 * bio;
        const b = 0.3 * (1 - bio) + 0.1 * bio;

        if (uniforms.colorGrass) {
            uniforms.colorGrass.value.setRGB(r, g, b);
        }

        // Temperature -> Water Color
        const temp = this.stats.temperature / 100;
        if (uniforms.colorWater) {
            if (temp < 0.3) {
                uniforms.colorWater.value.setHex(0xdbeafe);
            } else {
                uniforms.colorWater.value.setHex(0x1e3a8a);
            }
        }

        // Atmosphere Opacity
        if (this.game.cloudMesh && this.game.cloudMesh.material) {
            const atmo = this.stats.atmosphere / 100;
            this.game.cloudMesh.material.opacity = Math.max(0.1, atmo);
        }
    }

    createOverlay() {
        const ui = document.createElement('div');
        ui.id = 'ep-terraforming-panel';
        ui.style.cssText = `
            position: absolute;
            top: 60px;
            right: 10px;
            width: 200px;
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid #38bdf8;
            border-radius: 8px;
            padding: 10px;
            color: white;
            font-family: 'Segoe UI', sans-serif;
            display: none;
            pointer-events: auto;
        `;
        ui.innerHTML = `<h3>Planetary Status</h3><div id='ep-tf-content'></div>`;
        document.body.appendChild(ui);
        this.panel = ui;
    }

    updateUI() {
        const content = document.getElementById('ep-tf-content');
        if (!content) return;

        // Add arrows for rates
        const rateStr = (r) => r > 0 ? `<span style="color:#4ade80">▲</span>` : (r < 0 ? `<span style="color:#f87171">▼</span>` : '');

        // Determine Habitability Label
        let habLabel = "Uninhabitable 💀";
        let habColor = "#ef4444";
        if (this.habitability > 80) { habLabel = "Earth-Like 🌍"; habColor = "#4ade80"; }
        else if (this.habitability > 50) { habLabel = "Harsh ⚠️"; habColor = "#fbbf24"; }
        else if (this.habitability > 20) { habLabel = "Lethal ☢️"; habColor = "#f87171"; }

        content.innerHTML = `
            <div style="margin-bottom:10px; text-align:center; padding:5px; background:${habColor}22; border:1px solid ${habColor}; border-radius:4px;">
                <div style="font-size:0.8rem; color:${habColor}">Habitability</div>
                <div style="font-size:1.1rem; font-weight:bold; color:${habColor}">${Math.floor(this.habitability)}%</div>
                <div style="font-size:0.8rem;">${habLabel}</div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.75rem;">
                <div>
                    <label>🌡️ Temp: ${Math.floor(this.stats.temperature)}% ${rateStr(this.rate.temperature)}</label>
                    <div style="width:100%; height:4px; background:#334155; border-radius:2px;">
                        <div style="width:${this.stats.temperature}%; height:100%; background:#f87171; border-radius:2px;"></div>
                    </div>
                </div>
                <div>
                    <label>🌬️ Atmo: ${Math.floor(this.stats.atmosphere)}% ${rateStr(this.rate.atmosphere)}</label>
                    <div style="width:100%; height:4px; background:#334155; border-radius:2px;">
                        <div style="width:${this.stats.atmosphere}%; height:100%; background:#94a3b8; border-radius:2px;"></div>
                    </div>
                </div>
                <div>
                    <label>💧 Water: ${Math.floor(this.stats.water)}% ${rateStr(this.rate.water)}</label>
                    <div style="width:100%; height:4px; background:#334155; border-radius:2px;">
                        <div style="width:${this.stats.water}%; height:100%; background:#38bdf8; border-radius:2px;"></div>
                    </div>
                </div>
                <div>
                    <label>🌿 Bio: ${Math.floor(this.stats.biomass)}% ${rateStr(this.rate.biomass)}</label>
                    <div style="width:100%; height:4px; background:#334155; border-radius:2px;">
                        <div style="width:${this.stats.biomass}%; height:100%; background:#4ade80; border-radius:2px;"></div>
                    </div>
                </div>
                <div>
                    <label>⚖️ Pres: ${Math.floor(this.stats.pressure)}% ${rateStr(this.rate.pressure)}</label>
                    <div style="width:100%; height:4px; background:#334155; border-radius:2px;">
                        <div style="width:${this.stats.pressure}%; height:100%; background:#a78bfa; border-radius:2px;"></div>
                    </div>
                </div>
                <div>
                    <label>🔥 Core: ${Math.floor(this.stats.coreTemp)}% ${rateStr(this.rate.coreTemp)}</label>
                    <div style="width:100%; height:4px; background:#334155; border-radius:2px;">
                        <div style="width:${this.stats.coreTemp}%; height:100%; background:#fb923c; border-radius:2px;"></div>
                    </div>
                </div>
                <div>
                    <label>🧲 Mag: ${Math.floor(this.stats.magnetism)}% ${rateStr(this.rate.magnetism)}</label>
                    <div style="width:100%; height:4px; background:#334155; border-radius:2px;">
                        <div style="width:${this.stats.magnetism}%; height:100%; background:#22d3ee; border-radius:2px;"></div>
                    </div>
                </div>
                <div>
                    <label>🏜️ Ero: ${Math.floor(this.stats.erosion)}% ${rateStr(this.rate.erosion)}</label>
                    <div style="width:100%; height:4px; background:#334155; border-radius:2px;">
                        <div style="width:${this.stats.erosion}%; height:100%; background:#94a3b8; border-radius:2px;"></div>
                    </div>
                </div>
            </div>
            
            ${this.currentWeather ? `<div style="margin-top:10px; background:#ef444444; padding:5px; border-radius:4px; font-size:0.8rem; text-align:center; border:1px solid #ef4444;">⚠️ ${this.currentWeather.toUpperCase()}</div>` : ''}
        `;
    }

    toggleUI() {
        if (this.panel.style.display === 'none') {
            this.panel.style.display = 'block';
            this.updateUI();
        } else {
            this.panel.style.display = 'none';
        }
    }
}

window.TerraformingManager = TerraformingManager;
