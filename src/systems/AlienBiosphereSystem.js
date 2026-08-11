/**
 * 🌱 ALIEN BIOSPHERE EVOLUTION SYSTEM
 * Era II: The Living Cosmos - The Intelligence Explosion
 * 
 * Procedural flora and fauna that evolve based on planetary conditions
 * including gravity, radiation, atmosphere, and climate.
 */

import * as THREE from 'three';

class AlienBiosphereSystem {
    constructor(game) {
        this.game = game;
        this.species = new Map();
        this.ecosystems = new Map();
        this.evolutionHistory = new Map();
        
        this.mutationRate = 0.1;
        this.generationTime = 1000; // Time between generations in seconds
        this.lastEvolutionUpdate = 0;
        
        this.planetaryFactors = {
            gravity: 1.0,
            radiation: 1.0,
            temperature: 20,
            atmosphere: {
                oxygen: 0.21,
                co2: 0.0004,
                nitrogen: 0.78,
                pressure: 1.0
            },
            waterCoverage: 0.7
        };
        
        this.biomass = new Map();
        this.foodChains = new Map();
        
        this.visuals = new Map();
        
        console.log('🌱 Alien Biosphere Evolution: Initialized');
    }

    /**
     * Initialize the biosphere system
     */
    initialize(config = {}) {
        Object.assign(this.planetaryFactors, config.planetaryFactors || {});
        
        this.generateInitialSpecies(config.initialSpecies || 10);
        this.generateInitialEcosystems(config.initialEcosystems || 3);
    }

    /**
     * Generate initial species
     */
    generateInitialSpecies(count) {
        const types = ['plant', 'herbivore', 'carnivore', 'omnivore', 'decomposer'];
        
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            this.createSpecies(`species_${i}`, {
                type,
                name: this.generateSpeciesName(type),
                generation: 0
            });
        }
    }

    /**
     * Generate a species name
     */
    generateSpeciesName(type) {
        const prefixes = ['Xeno', 'Astra', 'Nova', 'Terra', 'Flora', 'Fauna', 'Chrono', 'Psycho'];
        const suffixes = {
            plant: ['phyte', 'bloom', 'fern', 'moss', 'vine', 'tree', 'flower', 'fungus'],
            herbivore: ['vore', 'grazer', 'browser', 'forager', 'herd', 'pod', 'swarm'],
            carnivore: ['predator', 'hunter', 'stalker', 'beast', 'fang', 'claw', 'raptor'],
            omnivore: ['scavenger', 'opportunist', 'gatherer', 'nomad', 'wanderer', 'feeder'],
            decomposer: ['rotter', 'fungus', 'mold', 'bacteria', 'recycler', 'cleaner']
        };
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffixList = suffixes[type] || suffixes.plant;
        const suffix = suffixList[Math.floor(Math.random() * suffixList.length)];
        
        return `${prefix}${suffix}`;
    }

    /**
     * Create a new species
     */
    createSpecies(speciesId, config) {
        const species = {
            id: speciesId,
            name: config.name || 'Unknown Species',
            type: config.type || 'plant',
            generation: config.generation || 0,
            parentSpecies: config.parentSpecies || null,
            
            // Physical traits
            size: config.size || Math.random() * 2 + 0.5,
            mass: config.mass || Math.random() * 100 + 10,
            color: config.color || new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
            shape: config.shape || this.generateShape(config.type),
            
            // Adaptations
            adaptations: config.adaptations || this.generateAdaptations(config.type),
            
            // Environmental tolerances
            tolerances: config.tolerances || {
                temperature: { min: -10, max: 40, optimal: 20 },
                gravity: { min: 0.5, max: 2.0, optimal: 1.0 },
                radiation: { min: 0, max: 10, optimal: 1.0 },
                pressure: { min: 0.5, max: 2.0, optimal: 1.0 }
            },
            
            // Population dynamics
            population: config.population || Math.floor(Math.random() * 1000) + 100,
            carryingCapacity: config.carryingCapacity || 5000,
            birthRate: config.birthRate || 0.1,
            deathRate: config.deathRate || 0.05,
            
            // Diet
            diet: config.diet || this.generateDiet(config.type),
            
            // Behavior
            behavior: config.behavior || this.generateBehavior(config.type),
            
            // Genetic diversity
            geneticDiversity: config.geneticDiversity || 0.5,
            
            // Evolution
            fitness: 0,
            evolutionaryPressure: 0,
            
            createdAt: Date.now(),
            lastUpdated: Date.now()
        };
        
        this.species.set(speciesId, species);
        this.biomass.set(speciesId, species.population * species.mass);
        
        return species;
    }

    /**
     * Generate shape for species
     */
    generateShape(type) {
        const shapes = {
            plant: ['tree', 'bush', 'vine', 'flower', 'mushroom', 'crystal', 'sphere'],
            herbivore: ['quadruped', 'biped', 'hexapod', 'slug', 'bird', 'fish'],
            carnivore: ['quadruped', 'biped', 'hexapod', 'serpent', 'avian', 'aquatic'],
            omnivore: ['quadruped', 'biped', 'hexapod', 'amorphous', 'multi-form'],
            decomposer: ['fungus', 'bacteria_colony', 'slug', 'worm', 'spore_cloud']
        };
        
        const typeShapes = shapes[type] || shapes.plant;
        return typeShapes[Math.floor(Math.random() * typeShapes.length)];
    }

    /**
     * Generate adaptations for species
     */
    generateAdaptations(type) {
        const allAdaptations = [
            'photosynthesis', 'chemosynthesis', 'bioluminescence',
            'thermal_regulation', 'water_retention', 'radiation_resistance',
            'high_gravity_adaptation', 'low_gravity_adaptation',
            'camouflage', 'mimicry', 'toxin_production', 'armor',
            'speed', 'endurance', 'strength', 'intelligence',
            'social_behavior', 'pack_hunting', 'herding',
            'burrowing', 'climbing', 'swimming', 'flying',
            'hibernation', 'estivation', 'migration',
            'symbiosis', 'parasitism', 'commensalism'
        ];
        
        const typeSpecific = {
            plant: ['photosynthesis', 'chemosynthesis', 'bioluminescence', 'water_retention', 'toxin_production'],
            herbivore: ['herding', 'speed', 'endurance', 'camouflage', 'social_behavior'],
            carnivore: ['pack_hunting', 'speed', 'strength', 'camouflage', 'intelligence'],
            omnivore: ['intelligence', 'social_behavior', 'speed', 'endurance', 'opportunism'],
            decomposer: ['chemosynthesis', 'toxin_production', 'rapid_reproduction', 'spore_dispersal']
        };
        
        const adaptations = [];
        const typeAdaptations = typeSpecific[type] || [];
        
        // Add type-specific adaptations
        for (const adaptation of typeAdaptations) {
            if (Math.random() < 0.5) {
                adaptations.push(adaptation);
            }
        }
        
        // Add random adaptations
        const remainingAdaptations = allAdaptations.filter(a => !adaptations.includes(a));
        const randomCount = Math.floor(Math.random() * 3);
        for (let i = 0; i < randomCount; i++) {
            const randomAdaptation = remainingAdaptations[Math.floor(Math.random() * remainingAdaptations.length)];
            adaptations.push(randomAdaptation);
        }
        
        return adaptations;
    }

    /**
     * Generate diet for species
     */
    generateDiet(type) {
        const diets = {
            plant: { energySource: 'sunlight', consumes: ['co2', 'water', 'minerals'] },
            herbivore: { energySource: 'plants', consumes: ['plant_matter'] },
            carnivore: { energySource: 'meat', consumes: ['herbivore', 'omnivore'] },
            omnivore: { energySource: 'mixed', consumes: ['plants', 'herbivore', 'carrion'] },
            decomposer: { energySource: 'decay', consumes: ['dead_organic_matter'] }
        };
        
        return diets[type] || diets.plant;
    }

    /**
     * Generate behavior for species
     */
    generateBehavior(type) {
        const behaviors = {
            plant: {
                activityPattern: 'diurnal',
                social: 'solitary',
                territoriality: 0.2,
                aggression: 0.1,
                curiosity: 0.1
            },
            herbivore: {
                activityPattern: Math.random() < 0.5 ? 'diurnal' : 'crepuscular',
                social: Math.random() < 0.5 ? 'herd' : 'solitary',
                territoriality: Math.random() * 0.5,
                aggression: Math.random() * 0.3,
                curiosity: Math.random() * 0.7
            },
            carnivore: {
                activityPattern: Math.random() < 0.3 ? 'diurnal' : 'nocturnal',
                social: Math.random() < 0.3 ? 'pack' : 'solitary',
                territoriality: 0.5 + Math.random() * 0.5,
                aggression: 0.5 + Math.random() * 0.5,
                curiosity: Math.random() * 0.5
            },
            omnivore: {
                activityPattern: 'diurnal',
                social: Math.random() < 0.5 ? 'group' : 'solitary',
                territoriality: Math.random() * 0.5,
                aggression: Math.random() * 0.4,
                curiosity: 0.5 + Math.random() * 0.5
            },
            decomposer: {
                activityPattern: 'continuous',
                social: 'colony',
                territoriality: 0.1,
                aggression: 0.1,
                curiosity: 0.2
            }
        };
        
        return behaviors[type] || behaviors.plant;
    }

    /**
     * Generate initial ecosystems
     */
    generateInitialEcosystems(count) {
        const ecosystemTypes = ['forest', 'grassland', 'desert', 'aquatic', 'cave', 'tundra'];
        
        for (let i = 0; i < count; i++) {
            const type = ecosystemTypes[Math.floor(Math.random() * ecosystemTypes.length)];
            this.createEcosystem(`ecosystem_${i}`, {
                type,
                name: `${type.charAt(0).toUpperCase() + type.slice(1)} Ecosystem ${i + 1}`,
                location: {
                    x: (Math.random() - 0.5) * 400,
                    y: 0,
                    z: (Math.random() - 0.5) * 400
                },
                size: Math.random() * 100 + 50
            });
        }
    }

    /**
     * Create an ecosystem
     */
    createEcosystem(ecosystemId, config) {
        const ecosystem = {
            id: ecosystemId,
            name: config.name || 'Unknown Ecosystem',
            type: config.type || 'forest',
            location: config.location || { x: 0, y: 0, z: 0 },
            size: config.size || 100,
            
            species: [],
            biomass: 0,
            biodiversity: 0,
            
            environmentalConditions: {
                temperature: this.planetaryFactors.temperature + (Math.random() - 0.5) * 20,
                humidity: Math.random() * 100,
                lightLevel: Math.random(),
                nutrientLevel: Math.random()
            },
            
            stability: 0.5,
            productivity: 0.5,
            
            createdAt: Date.now()
        };
        
        // Add species to ecosystem
        const availableSpecies = Array.from(this.species.values());
        const speciesCount = Math.min(availableSpecies.length, Math.floor(Math.random() * 5) + 3);
        
        for (let i = 0; i < speciesCount; i++) {
            const speciesIndex = Math.floor(Math.random() * availableSpecies.length);
            const species = availableSpecies[speciesIndex];
            
            if (!ecosystem.species.includes(species.id)) {
                ecosystem.species.push({
                    id: species.id,
                    population: Math.floor(species.population / speciesCount),
                    role: this.assignSpeciesRole(species, ecosystem)
                });
            }
        }
        
        this.ecosystems.set(ecosystemId, ecosystem);
        this.calculateEcosystemMetrics(ecosystemId);
        
        return ecosystem;
    }

    /**
     * Assign species role in ecosystem
     */
    assignSpeciesRole(species, ecosystem) {
        const roles = {
            plant: ['producer', 'primary_producer'],
            herbivore: ['primary_consumer', 'prey'],
            carnivore: ['secondary_consumer', 'apex_predator', 'predator'],
            omnivore: ['secondary_consumer', 'opportunist'],
            decomposer: ['decomposer', 'recycler']
        };
        
        const possibleRoles = roles[species.type] || ['consumer'];
        return possibleRoles[Math.floor(Math.random() * possibleRoles.length)];
    }

    /**
     * Calculate ecosystem metrics
     */
    calculateEcosystemMetrics(ecosystemId) {
        const ecosystem = this.ecosystems.get(ecosystemId);
        if (!ecosystem) return;
        
        let totalBiomass = 0;
        let speciesCount = ecosystem.species.length;
        
        for (const speciesData of ecosystem.species) {
            const species = this.species.get(speciesData.id);
            if (species) {
                totalBiomass += speciesData.population * species.mass;
            }
        }
        
        ecosystem.biomass = totalBiomass;
        ecosystem.biodiversity = speciesCount / Math.max(1, this.species.size);
        
        // Calculate stability (Shannon diversity index approximation)
        let shannonIndex = 0;
        const totalPopulation = ecosystem.species.reduce((sum, s) => sum + s.population, 0);
        
        for (const speciesData of ecosystem.species) {
            if (totalPopulation > 0) {
                const proportion = speciesData.population / totalPopulation;
                shannonIndex -= proportion * Math.log(proportion);
            }
        }
        
        ecosystem.stability = Math.min(1, shannonIndex / Math.log(speciesCount || 1));
        
        // Calculate productivity based on environmental conditions
        const tempFactor = 1 - Math.abs(ecosystem.environmentalConditions.temperature - 25) / 50;
        const humidityFactor = ecosystem.environmentalConditions.humidity / 100;
        const lightFactor = ecosystem.environmentalConditions.lightLevel;
        
        ecosystem.productivity = (tempFactor + humidityFactor + lightFactor) / 3;
    }

    /**
     * Update evolution
     */
    update(deltaTime) {
        const now = Date.now();
        
        // Check if it's time for evolution update
        if (now - this.lastEvolutionUpdate < this.generationTime * 1000) {
            return;
        }
        
        this.lastEvolutionUpdate = now;
        
        // Evolve species
        for (const [speciesId, species] of this.species) {
            this.evolveSpecies(speciesId);
        }
        
        // Update ecosystems
        for (const [ecosystemId, ecosystem] of this.ecosystems) {
            this.updateEcosystem(ecosystemId);
        }
        
        // Record evolution history
        this.recordEvolutionHistory();
    }

    /**
     * Evolve a species
     */
    evolveSpecies(speciesId) {
        const species = this.species.get(speciesId);
        if (!species) return;
        
        // Calculate fitness based on environmental match
        species.fitness = this.calculateFitness(species);
        
        // Apply evolutionary pressure
        species.evolutionaryPressure = 1 - species.fitness;
        
        // Check for speciation event
        if (species.evolutionaryPressure > 0.5 && Math.random() < 0.1) {
            this.speciate(speciesId);
            return;
        }
        
        // Mutate traits
        if (Math.random() < this.mutationRate) {
            this.mutateSpecies(speciesId);
        }
        
        // Update population dynamics
        this.updatePopulationDynamics(speciesId);
        
        species.generation++;
        species.lastUpdated = Date.now();
    }

    /**
     * Calculate species fitness
     */
    calculateFitness(species) {
        let fitness = 0;
        
        // Temperature tolerance match
        const tempMatch = this.calculateToleranceMatch(
            this.planetaryFactors.temperature,
            species.tolerances.temperature
        );
        fitness += tempMatch * 0.3;
        
        // Gravity tolerance match
        const gravityMatch = this.calculateToleranceMatch(
            this.planetaryFactors.gravity,
            species.tolerances.gravity
        );
        fitness += gravityMatch * 0.2;
        
        // Radiation tolerance match
        const radiationMatch = this.calculateToleranceMatch(
            this.planetaryFactors.radiation,
            species.tolerances.radiation
        );
        fitness += radiationMatch * 0.2;
        
        // Pressure tolerance match
        const pressureMatch = this.calculateToleranceMatch(
            this.planetaryFactors.atmosphere.pressure,
            species.tolerances.pressure
        );
        fitness += pressureMatch * 0.1;
        
        // Adaptation bonus
        const adaptationBonus = this.calculateAdaptationBonus(species);
        fitness += adaptationBonus * 0.2;
        
        return Math.min(1, fitness);
    }

    /**
     * Calculate tolerance match
     */
    calculateToleranceMatch(value, tolerance) {
        if (value >= tolerance.min && value <= tolerance.max) {
            const distance = Math.abs(value - tolerance.optimal);
            const range = tolerance.max - tolerance.min;
            return 1 - (distance / (range / 2));
        }
        return 0;
    }

    /**
     * Calculate adaptation bonus
     */
    calculateAdaptationBonus(species) {
        let bonus = 0;
        
        for (const adaptation of species.adaptations) {
            switch (adaptation) {
                case 'radiation_resistance':
                    bonus += Math.min(0.5, this.planetaryFactors.radiation / 10);
                    break;
                case 'high_gravity_adaptation':
                    if (this.planetaryFactors.gravity > 1.0) bonus += 0.3;
                    break;
                case 'low_gravity_adaptation':
                    if (this.planetaryFactors.gravity < 1.0) bonus += 0.3;
                    break;
                case 'thermal_regulation':
                    const tempStress = Math.abs(this.planetaryFactors.temperature - 20) / 30;
                    bonus += Math.min(0.5, tempStress);
                    break;
                case 'water_retention':
                    if (this.planetaryFactors.waterCoverage < 0.5) bonus += 0.3;
                    break;
                case 'bioluminescence':
                    if (this.planetaryFactors.waterCoverage > 0.5) bonus += 0.2;
                    break;
            }
        }
        
        return Math.min(1, bonus);
    }

    /**
     * Mutate a species
     */
    mutateSpecies(speciesId) {
        const species = this.species.get(speciesId);
        if (!species) return;
        
        const mutationType = Math.random();
        
        if (mutationType < 0.3) {
            // Mutate size
            species.size *= 0.9 + Math.random() * 0.2;
            species.mass *= 0.9 + Math.random() * 0.2;
        } else if (mutationType < 0.5) {
            // Mutate color
            species.color.offsetHSL((Math.random() - 0.5) * 0.1, 0, 0);
        } else if (mutationType < 0.7) {
            // Mutate tolerances
            for (const key of Object.keys(species.tolerances)) {
                const tolerance = species.tolerances[key];
                tolerance.min *= 0.95 + Math.random() * 0.1;
                tolerance.max *= 0.95 + Math.random() * 0.1;
                tolerance.optimal += (Math.random() - 0.5) * 2;
            }
        } else if (mutationType < 0.85) {
            // Gain adaptation
            const allAdaptations = [
                'photosynthesis', 'chemosynthesis', 'bioluminescence',
                'thermal_regulation', 'water_retention', 'radiation_resistance',
                'high_gravity_adaptation', 'low_gravity_adaptation',
                'camouflage', 'mimicry', 'toxin_production', 'armor',
                'speed', 'endurance', 'strength', 'intelligence'
            ];
            const newAdaptation = allAdaptations[Math.floor(Math.random() * allAdaptations.length)];
            if (!species.adaptations.includes(newAdaptation)) {
                species.adaptations.push(newAdaptation);
            }
        } else {
            // Lose adaptation
            if (species.adaptations.length > 1) {
                const index = Math.floor(Math.random() * species.adaptations.length);
                species.adaptations.splice(index, 1);
            }
        }
        
        species.geneticDiversity *= 1.01;
    }

    /**
     * Speciate - create new species from existing one
     */
    speciate(parentSpeciesId) {
        const parent = this.species.get(parentSpeciesId);
        if (!parent) return;
        
        const newSpeciesId = `species_${Date.now()}_${Math.random()}`;
        
        // Create mutated copy
        const newSpecies = this.createSpecies(newSpeciesId, {
            name: `${parent.name} var.`,
            type: parent.type,
            generation: parent.generation + 1,
            parentSpecies: parentSpeciesId,
            size: parent.size * (0.8 + Math.random() * 0.4),
            mass: parent.mass * (0.8 + Math.random() * 0.4),
            color: parent.color.clone().offsetHSL((Math.random() - 0.5) * 0.2, 0, 0),
            shape: parent.shape,
            adaptations: [...parent.adaptations],
            tolerances: JSON.parse(JSON.stringify(parent.tolerances)),
            population: Math.floor(parent.population * 0.3),
            diet: JSON.parse(JSON.stringify(parent.diet)),
            behavior: JSON.parse(JSON.stringify(parent.behavior)),
            geneticDiversity: parent.geneticDiversity * 0.8
        });
        
        // Apply mutations
        this.mutateSpecies(newSpeciesId);
        
        console.log(`🌱 Speciation event: ${parent.name} -> ${newSpecies.name}`);
        
        return newSpeciesId;
    }

    /**
     * Update population dynamics
     */
    updatePopulationDynamics(speciesId) {
        const species = this.species.get(speciesId);
        if (!species) return;
        
        // Calculate carrying capacity based on fitness
        const effectiveCapacity = species.carryingCapacity * species.fitness;
        
        // Logistic growth model
        const growthRate = species.birthRate - species.deathRate;
        const populationPressure = (effectiveCapacity - species.population) / effectiveCapacity;
        
        const populationChange = species.population * growthRate * populationPressure;
        species.population = Math.max(1, Math.floor(species.population + populationChange));
        
        // Update biomass
        this.biomass.set(speciesId, species.population * species.mass);
        
        // Check for extinction
        if (species.population < 10) {
            this.extinctSpecies(speciesId);
        }
    }

    /**
     * Extinct a species
     */
    extinctSpecies(speciesId) {
        console.log(`🦕 Extinction event: ${this.species.get(speciesId)?.name}`);
        
        this.species.delete(speciesId);
        this.biomass.delete(speciesId);
        
        // Remove from ecosystems
        for (const ecosystem of this.ecosystems.values()) {
            ecosystem.species = ecosystem.species.filter(s => s.id !== speciesId);
        }
    }

    /**
     * Update ecosystem
     */
    updateEcosystem(ecosystemId) {
        const ecosystem = this.ecosystems.get(ecosystemId);
        if (!ecosystem) return;
        
        // Update species populations in ecosystem
        for (const speciesData of ecosystem.species) {
            const species = this.species.get(speciesData.id);
            if (species) {
                // Distribute population among ecosystems
                const ecosystemShare = Math.floor(species.population / ecosystem.species.length);
                speciesData.population = ecosystemShare;
            }
        }
        
        // Recalculate metrics
        this.calculateEcosystemMetrics(ecosystemId);
        
        // Check for ecosystem collapse
        if (ecosystem.species.length < 2) {
            this.collapseEcosystem(ecosystemId);
        }
    }

    /**
     * Collapse ecosystem
     */
    collapseEcosystem(ecosystemId) {
        console.log(`🌍 Ecosystem collapse: ${this.ecosystems.get(ecosystemId)?.name}`);
        this.ecosystems.delete(ecosystemId);
    }

    /**
     * Record evolution history
     */
    recordEvolutionHistory() {
        const timestamp = Date.now();
        
        const snapshot = {
            timestamp,
            speciesCount: this.species.size,
            ecosystemCount: this.ecosystems.size,
            totalBiomass: Array.from(this.biomass.values()).reduce((a, b) => a + b, 0),
            avgFitness: this.calculateAverageFitness(),
            biodiversity: this.calculateBiodiversity()
        };
        
        this.evolutionHistory.set(timestamp, snapshot);
        
        // Keep only last 100 snapshots
        if (this.evolutionHistory.size > 100) {
            const oldestKey = Array.from(this.evolutionHistory.keys())[0];
            this.evolutionHistory.delete(oldestKey);
        }
    }

    /**
     * Calculate average fitness
     */
    calculateAverageFitness() {
        let totalFitness = 0;
        let count = 0;
        
        for (const species of this.species.values()) {
            totalFitness += species.fitness;
            count++;
        }
        
        return count > 0 ? totalFitness / count : 0;
    }

    /**
     * Calculate biodiversity
     */
    calculateBiodiversity() {
        const types = new Set();
        
        for (const species of this.species.values()) {
            types.add(species.type);
        }
        
        return types.size / 5; // 5 possible types
    }

    /**
     * Get species data for visualization
     */
    getSpeciesVisualizationData(speciesId) {
        const species = this.species.get(speciesId);
        if (!species) return null;
        
        return {
            id: species.id,
            name: species.name,
            type: species.type,
            size: species.size,
            color: species.color.getHex(),
            shape: species.shape,
            population: species.population,
            fitness: species.fitness,
            adaptations: species.adaptations
        };
    }

    /**
     * Get ecosystem visualization data
     */
    getEcosystemVisualizationData(ecosystemId) {
        const ecosystem = this.ecosystems.get(ecosystemId);
        if (!ecosystem) return null;
        
        return {
            id: ecosystem.id,
            name: ecosystem.name,
            type: ecosystem.type,
            location: ecosystem.location,
            size: ecosystem.size,
            species: ecosystem.species.map(s => ({
                id: s.id,
                population: s.population,
                role: s.role
            })),
            biomass: ecosystem.biomass,
            biodiversity: ecosystem.biodiversity,
            stability: ecosystem.stability
        };
    }

    /**
     * Serialize data
     */
    serialize() {
        return {
            species: Array.from(this.species.entries()),
            ecosystems: Array.from(this.ecosystems.entries()),
            biomass: Array.from(this.biomass.entries()),
            evolutionHistory: Array.from(this.evolutionHistory.entries()),
            planetaryFactors: this.planetaryFactors
        };
    }

    /**
     * Deserialize data
     */
    deserialize(data) {
        this.species = new Map(data.species);
        this.ecosystems = new Map(data.ecosystems);
        this.biomass = new Map(data.biomass);
        this.evolutionHistory = new Map(data.evolutionHistory);
        Object.assign(this.planetaryFactors, data.planetaryFactors);
    }

    /**
     * Cleanup
     */
    dispose() {
        this.species.clear();
        this.ecosystems.clear();
        this.biomass.clear();
        this.evolutionHistory.clear();
    }
}

export default AlienBiosphereSystem;
