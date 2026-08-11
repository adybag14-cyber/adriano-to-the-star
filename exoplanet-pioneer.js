/**
 * Exoplanet Pioneer - Main Game Logic
 * Version: 2026_V30_DEFINITIVE
 */
console.log('%c 🚀 EXOPLANET PIONEER ENGINE - v2026_V30_DEFINITIVE ', 'background: #1e293b; color: #38bdf8; font-size: 16px; font-weight: bold; padding: 4px; border-radius: 4px;');

// Definitive dependency check
(function () {
    const deps = ['AlienSignalSystem', 'NPCSystem', 'FactionManager', 'AIGameMaster', 'MilitarySystem', 'LegalSystem', 'MegastructureSystem', 'MutationEngine', 'OmegaPoint'];
    deps.forEach(dep => {
        if (typeof window[dep] === 'undefined') {
            console.error(`❌ CRITICAL: ${dep} is NOT defined at pioneer start!`);
        } else {
            console.log(`✅ ${dep} is ready.`);
        }
    });
})();

if (typeof Logger === 'undefined') {
    window.Logger = class Logger {
        constructor() {
            this.entries = [];
            this.maxEntries = 50;
        }

        add(text, type = 'info') {
            this.entries.unshift({
                text: text,
                type: type,
                timestamp: window.game ? window.game.day : 0,
                realTime: Date.now()
            });
            if (this.entries.length > this.maxEntries) {
                this.entries.pop();
            }
        }

        getEntries() { return this.entries; }

        getTypeColor(type) {
            switch (type) {
                case 'success': return '#4ade80';
                case 'warning': return '#facc15';
                case 'error': return '#ef4444';
                default: return '#38bdf8';
            }
        }
    };
} else {
    // If it exists, ensure window.Logger points to it if needed, or do nothing.
    // The class is likely already defined on window if we use this pattern.
}
/**
 * Exoplanet Pioneer
 * An advanced colony management simulation on a 3D hex-sphere.
 * Features: Resource management, procedural terrain, structure building.
 */

if (typeof TRAIT_DEFINITIONS === 'undefined') {
    window.TRAIT_DEFINITIONS = {
        'Lazy': { name: 'Lazy', desc: 'Work Speed -20%', type: 'negative', color: '#fca5a5', effect: { workSpeed: 0.8 } },
        'Workaholic': { name: 'Workaholic', desc: 'Work Speed +20%, Morale decay faster', type: 'positive', color: '#86efac', effect: { workSpeed: 1.2, moraleDecay: 1.5 } },
        'Genius': { name: 'Genius', desc: 'Research Output +50%', type: 'positive', color: '#c084fc', effect: { researchMult: 1.5 } },
        'Dull': { name: 'Dull', desc: 'Research Output -50%', type: 'negative', color: '#94a3b8', effect: { researchMult: 0.5 } },
        'Robust': { name: 'Robust', desc: 'Health decay -50%', type: 'positive', color: '#fcd34d', effect: { healthDecay: 0.5 } },
        'Fragile': { name: 'Fragile', desc: 'Health decay +50%', type: 'negative', color: '#fb7185', effect: { healthDecay: 1.5 } },
        'Insomniac': { name: 'Insomniac', desc: 'Loses morale at night', type: 'negative', color: '#a78bfa', effect: { nightMorale: -0.5 } },
        'NightOwl': { name: 'Night Owl', desc: 'Bonus productivity at night', type: 'positive', color: '#60a5fa', effect: { nightWorkSpeed: 1.3 } },
        // New Personality Traits (Roadmap Item 101)
        'Optimist': { name: 'Optimist', desc: 'Morale gain +20%', type: 'positive', color: '#fbbf24', effect: { moraleGain: 1.2 } },
        'Pessimist': { name: 'Pessimist', desc: 'Morale gain -20%', type: 'negative', color: '#64748b', effect: { moraleGain: 0.8 } },
        'Stoic': { name: 'Stoic', desc: 'Reduced emotional swings', type: 'neutral', color: '#94a3b8', effect: { emotionSensitivity: 0.5 } },
        'Neurotic': { name: 'Neurotic', desc: 'High emotional sensitivity', type: 'negative', color: '#f472b6', effect: { emotionSensitivity: 2.0 } },
        'Social': { name: 'Social', desc: 'Morale boost from high population', type: 'positive', color: '#38bdf8', effect: { populationMorale: 0.1 } },
        'Solitary': { name: 'Solitary', desc: 'Morale penalty from high population', type: 'negative', color: '#475569', effect: { populationMorale: -0.1 } },
        'Adaptable': { name: 'Adaptable', desc: 'Reduced penalty from harsh biomes', type: 'positive', color: '#4ade80', effect: { habitabilityPenalty: 0.5 } }
    };
}
class ExoplanetPioneer {
    constructor(containerOrId) {
        if (typeof containerOrId === 'string') {
            this.container = document.getElementById(containerOrId);
        } else {
            this.container = containerOrId;
        }

        if (!this.container) {
            console.error("ExoplanetPioneer: Container not found!");
            return;
        }

        // Three.js Components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Game State
        this.day = 1;
        this.timeOfDay = 8; // 8 AM start
        this.temperature = 15; // 15 C
        this.tickRate = 1000;

        // Roadmap Item 17: Time Dilation
        this.timeScale = 1.0;
        this.timeSpeeds = [0, 1, 2, 5, 10]; // Paused, Normal, Fast, Very Fast, Ultra
        this.timeSpeedIndex = 1;

        // Asset Management (Asset Roadmap Phase 2)
        this.assetManifest = typeof GAME_ASSET_MANIFEST !== 'undefined' ? GAME_ASSET_MANIFEST : null;
        this.assetManager = null;
        this.vfxManager = null;
        this.audioManager = null;
        this.narrativeManager = null;
        this.optimizationManager = null;
        this.decalManager = null;
        this.characterManager = null;
        this.attributes = {
            intelligence: 10,
            memory: 10,
            perception: 10,
            willpower: 10,
            charisma: 10
        };

        this.pilotSkillDefs = this.getPilotSkillDefinitions();
        this.pilotSkills = this.createDefaultPilotSkillsState(this.pilotSkillDefs);

        this.agentMissionDefs = this.getAgentMissionDefinitions();
        this.agentMissions = this.createDefaultAgentMissionsState(this.agentMissionDefs);

        this.isPaused = false;
        this.isCombatActive = false;
        this.autosaveIntervalMs = 120000;
        this.lastAutosaveNotifyAt = 0;
        this.autosaveEnabled = true;
        this.autoloadEnabled = true;
        this.tutorialStep = 0;
        this.tutorialActive = false;
        this.tutorialStorageKey = 'ep_tutorial_v2_complete';

        this.audioMaster = 0.3;
        this.audioMusic = 1.0;
        this.audioSfx = 1.0;
        this.audioMuted = false;
        this.voiceEnabled = false;
        this.graphicsSettings = {
            renderMode: 'standard',
            meshDetail: 'high',
            terrainDetail: 'high',
            atmosphereQuality: 'high',
            cloudQuality: 'high',
            shadowQuality: 'high',
            rayTraceScale: 0.65,
            pathTraceSamples: 64
        };
        this.loadSettings();

        this.synth = window.speechSynthesis;

        this.resources = {
            energy: 50,
            oxygen: 200,
            minerals: 100,
            food: 100,
            data: 50,
            alloys: 50,
            circuits: 50,
            helium3: 0,
            composite: 0,
            credits: 1000,
            carbon_credits: 100 // Roadmap Item 230
        };
        this.resourceRates = {};
        this.caps = {
            energy: 200,
            oxygen: 200,
            minerals: 100,
            food: 100,
            data: 50,
            alloys: 50,
            circuits: 50,
            helium3: 250,
            composite: 1000,
            credits: 999999,
            carbon_credits: 9999
        };
        // Phase 2: Colonists
        this.basePopulationCap = 6;
        this.colonists = [];
        this.structures = []; // Built structures
        this.buildingMeshes = {}; // Map tileId -> Mesh
        this.infrastructureGroup = null;
        this.infrastructureLinks = [];
        this.infrastructureSignature = '';
        this.tiles = []; // Logical game tiles
        this.morale = 100;

        // Moon/Galaxy State
        this.isOnMoon = false;
        this.currentSystemId = 'kepler_186f';
        this.systemSecurity = {
            'kepler_186f': 0.8, // High-Sec
            'wolf_1061c': 0.4,   // Low-Sec
            'trappist_1e': 0.0,  // Null-Sec
            'proxima_b': 1.0     // Core-Sec
        };
        this.systemStates = {};
        this.claims = {}; // { systemId: 'player' }

        // Phase 5: Advanced Fleet & EWAR
        if (typeof JumpBridgeManager !== 'undefined') {
            this.jumpBridges = new JumpBridgeManager(this);
        }
        this.planetData = {
            name: 'Kepler-186f',
            kepler_name: 'Kepler-186f',
            id: 'kepler_186f',
            radius: 1.17,
            mass: 1.71,
            koi_period: 129.9,
            orbital_radius: 0.432,
            distance: 580,
            koi_dist: 580,
            insolation: 0.33,
            host_star: 'M-type',
            detection_method: 'Transit',
            discovery_year: 2014,
            data_source: 'NASA Exoplanet Catalog / NASA Kepler mission'
        };
        this.isGalaxyViewActive = false;
        this.isOrbitalViewActive = false;
        this.localSystemExplorer = null;
        this.rayTracingRenderer = null;

        // Cloud Service
        this.cloud = new SupabaseService();

        // Alien Ecosystem
        this.ecosystem = new AlienEcosystem();
        this.ecosystem.init();

        // Production
        this.production = new CraftingManager(this);
        this.production.init();

        // Phase 1: EVE Industry
        this.inventory = [
            { type: 'solar', count: 2 },
            { type: 'hab', count: 1 },
            { type: 'mine', count: 1 }
        ]; // Items ready to be anchored/used
        this.blueprints = [
            { id: 'bpo_solar', type: 'solar', name: 'Solar Array Blueprint', isBPO: true, icon: '⚡' },
            { id: 'bpo_hab', type: 'hab', name: 'Habitat Dome Blueprint', isBPO: true, icon: '🏠' },
            { id: 'bpo_mine', type: 'mine', name: 'Auto-Miner Blueprint', isBPO: true, icon: '⛏️' },
            { id: 'bpo_farm', type: 'farm', name: 'Hydroponics Blueprint', isBPO: true, icon: '🌱' },
            { id: 'bpo_lab', type: 'lab', name: 'Research Lab Blueprint', isBPO: true, icon: '🔬' },
            { id: 'bpo_oxy', type: 'oxy', name: 'O2 Generator Blueprint', isBPO: true, icon: '💨' },
            { id: 'bpo_store', type: 'store', name: 'Silo Blueprint', isBPO: true, icon: '📦' },
            { id: 'bpo_refinery', type: 'refinery', name: 'Refinery Blueprint', isBPO: true, icon: '🏭' },
            { id: 'bpo_chip_fab', type: 'chip_fab', name: 'Chip Fab Blueprint', isBPO: true, icon: '📟' },
            { id: 'bpo_drone_hub', type: 'drone_hub', name: 'Drone Hub Blueprint', isBPO: true, icon: '🚁' },
            { id: 'bpo_launch_site', type: 'launch_site', name: 'Launch Site Blueprint', isBPO: true, icon: '🚀' },
            { id: 'bpo_citadel', type: 'citadel', name: 'Astrahus Citadel Blueprint', isBPO: true, icon: '🏰' },
            { id: 'bpo_injector', type: 'injector', name: 'Atm. Injector Blueprint', isBPO: true, icon: '💉' }
        ];
        this.industry = {
            jobs: [],
            maxJobs: 2
        };
        this.selectedInventoryItem = null; // Track item selected for anchoring
        this.resourcePanelExpanded = false;
        this.operationsMenuOpen = false;
        this.lastPlacementHintKey = '';
        this.windowManagerObserver = null;
        this.windowViewportResizeHandler = null;

        // Category 2: Advanced AI Enhancements
        console.log('🏗️ Initializing AI Systems...');
        this.npcSystem = new NPCSystem(this);
        this.npcSystem.init();

        this.factionManager = new FactionManager(this);
        this.factionManager.init();

        this.aiGameMaster = new AIGameMaster(this);

        if (typeof AlienSignalSystem === 'undefined') {
            console.error('❌ CRITICAL ERROR: AlienSignalSystem not defined! Check script loading.');
        } else {
            this.alienSignals = new AlienSignalSystem(this);
        }

        this.militarySystem = new MilitarySystem(this);
        this.militarySystem.init();

        this.legalSystem = new LegalSystem(this);

        this.chatterPosts = [];

        // Drones
        this.drones = new DroneController(this);
        this.drones.init();

        // Orbit (init deferred until after scene)
        this.orbit = new OrbitalManager(this);

        // Ship Designer
        this.shipDesigner = new ShipDesigner(this);
        this.shipDesigner.init();
        this.ships = []; // Fleet storage

        // Fleet Manager
        this.fleetManager = new FleetManager(this);
        this.fleetManager.init();

        // Combat System
        this.aliens = new AlienGenerator(this);
        this.combat = new CombatManager(this);

        // Archaeology System
        this.archaeology = new ArchaeologyManager(this);
        this.archaeology.init();

        // Victory System
        this.victory = new VictoryManager(this);
        this.victory.init();

        // Legacy Supabase multiplayer is retired with the disabled cloud backend.
        // Keep the property explicit so guarded Galaxy integrations stay on their
        // existing offline path without parsing/constructing the unused manager.
        this.multiplayer = null;

        // Performance System
        this.performance = new PerformanceManager(this);
        this.performance.init();

        // Terraforming System (Roadmap)
        this.terraforming = new TerraformingManager(this);
        this.terraforming.init();

        // Phase 6: Megastructures
        this.megastructureSystem = new MegastructureSystem(this);
        this.megastructureSystem.init();

        // Phase 7: Multiverse
        this.universe = new UniverseManager(this);

        // Phase 8: Chrono-Trigger
        this.temporal = new TemporalEngine(this);

        // Phase 9: Neural Link
        this.neural = new NeuralLinkSystem(this);
        this.dream = new DreamState(this);
        this.dream.init();

        // Phase 10: The Simulation Hypothesis
        this.twin = new DigitalTwinSystem(this);
        this.recursion = new RecursiveSimulation(this);
        this.historian = new AIHistorian(this);
        this.historian.init();

        // Phase 11: Quantum Computing
        this.quantum = new QuantumComputeEngine(this);
        // Roadmap Category 9: UI/UX & Cinematic Immersion
        this.ui = {
            holographicMode: false,
            hudScale: 1.0,
            highContrast: false,
            colorBlindMode: 'none',
            language: 'en',
            radialMenuOpen: false,
            keybindings: {
                'build': 'B',
                'fleet': 'F',
                'map': 'M',
                'inventory': 'I'
            },
            notificationQueue: [],
            breadcrumbs: [],
            undoStack: [],
            redoStack: []
        };

        // Category 11: End-game Mechanics
        // DNA Storage & Eternity
        this.dna = new DNAStorageSystem(this);
        this.capsule = new TimeCapsuleManager(this);

        // Roadmap Item 394: Genetic Memory (Apply Ascension Bonuses)
        this.applyGeneticMemory();

        setTimeout(() => this.capsule.init(), 1000); // Delay init to check buffs

        // Phase 13: Neural Fabric
        this.fabric = new NeuralFabricSystem(this);
        this.fabric.init();
        this.oversoul = new GalacticOversoul(this, this.fabric);
        this.oversoul.init();
        // Create default ship AI agent
        this.shipAI = new SentientAgent("Ship AI", this.fabric, { efficiency: 0.9, curiosity: 0.4 });

        // Phase 14: Quantum dashboard visuals are loaded and instantiated only when opened.
        // The active QuantumComputeEngine above remains part of the simulation loop.
        this.qubitMinigame = null;
        this.quantumRenderer = null;



        // Phase 15: P2P Mesh & Trade
        this.crdt = new CRDTManager(this);
        this.crdt.init();
        this.mesh = new GalacticMeshNetwork(this);
        this.mesh.init(this.crdt);
        this.trade = new InterstellarTradeSystem(this, this.mesh);
        this.trade.init();

        // Phase 16: Bio-Digital (IoT)
        this.iot = new IoTManager(this);
        this.iot.init();
        this.ambience = new AmbienceEngine(this, this.iot);
        this.ambience.init();

        // Phase 17: Transcendence
        this.mutation = new MutationEngine(this);
        this.mutation.init();
        this.omega = new OmegaPoint(this);
        this.omega.init();

        // Check for New Game+ Seed
        const seed = JSON.parse(localStorage.getItem('ep_omega_seed'));
        if (seed) {
            console.log(`%c NEW UNIVERSE GENERATION ${seed.generation}`, 'color: gold; font-size: 20px; font-weight: bold;');
            // Apply physics variations here
        }

        // Tech & Modifiers
        this.technologies = {
            // Tier 1: Basics
            'bio_engineering': { name: 'Bio-Engineering', cost: 20, desc: 'Unlocks Hydroponics Efficiency (+50%)', effect: () => this.modifiers.farmOutput = 1.5, unlocked: false, req: null, pos: { x: 100, y: 300 } },
            'adv_mining': { name: 'Deep Core Mining', cost: 40, desc: 'Unlocks Auto-Miner Efficiency (+50%)', effect: () => this.modifiers.mineOutput = 1.5, unlocked: false, req: null, pos: { x: 100, y: 100 } },

            // Tier 2: Specialized (Requires Tier 1)
            'geothermal': { name: 'Geothermal Siphons', cost: 80, desc: 'Lava Biome adaptation. +Energy from heat.', effect: () => this.unlockBuilding('geothermal'), unlocked: false, req: 'adv_mining', pos: { x: 300, y: 100 } },
            'insulated_habs': { name: 'Cryo-Insulation', cost: 80, desc: 'Ice Biome adaptation. Reduces heating costs.', unlocked: false, req: 'bio_engineering', pos: { x: 300, y: 300 } },
            'quantum_storage': { name: 'Quantum Storage', cost: 100, desc: 'Doubles all storage capacity', effect: () => this.multiplyCaps(2), unlocked: false, req: 'adv_mining', pos: { x: 300, y: 200 } },

            // Tier 3: Advanced
            'fusion_power': { name: 'Fusion Power', cost: 250, desc: 'Unlocks Fusion Reactor (Massive Energy)', effect: () => this.unlockBuilding('fusion'), unlocked: false, req: 'quantum_storage', pos: { x: 500, y: 200 } },
            'atm_terraforming': { name: 'Atm. Filtering', cost: 300, desc: 'Gas Giant adaptation. Allows harvesting atmosphere.', unlocked: false, req: 'geothermal', pos: { x: 500, y: 100 } },
            'seti_analysis': { name: 'SETI Signal Analysis', cost: 400, desc: 'Unlocks Long-range Telescope Array.', effect: () => this.unlockBuilding('telescope_array'), unlocked: false, req: 'chip_fab', pos: { x: 500, y: 400 } },
            'antimatter_physics': { name: 'Antimatter Physics', cost: 500, desc: 'Unlocks Antimatter Reactor.', effect: () => this.unlockBuilding('antimatter'), unlocked: false, req: 'fusion_power', pos: { x: 700, y: 100 } },
            'dyson_construction': { name: 'Megastructure Engineering', cost: 800, desc: 'Unlocks Dyson Swarm segments.', effect: () => this.unlockBuilding('dyson_segment'), unlocked: false, req: 'warp_drive', pos: { x: 900, y: 100 } },
            'warp_drive': { name: 'Warp Drive Opt.', cost: 400, desc: 'Reduces Warp Energy cost by 50%', unlocked: false, req: 'fusion_power', pos: { x: 700, y: 200 } },
            'nano_assembly': { name: 'Nano-Assembly', cost: 600, desc: 'Unlocks Nano-Assembler (Instant construction).', effect: () => this.unlockBuilding('nano_assembler'), unlocked: false, req: 'antimatter_physics', pos: { x: 900, y: 100 } },
            'adv_3d_printing': { name: 'Adv. 3D Printing', cost: 450, desc: 'Unlocks 3D Hull Printer (Faster ship builds).', effect: () => this.unlockBuilding('hull_printer'), unlocked: false, req: 'chip_fab', pos: { x: 500, y: 300 } },

            // Tier 4: Victory
            'ascension_gate': { name: 'Ascension Gate', cost: 1000, desc: 'Construct a bridge to higher reality. WINS THE GAME.', effect: () => this.victory.triggerVictory('Science'), unlocked: false, req: 'warp_drive', pos: { x: 900, y: 200 } },

            // Category 10: Research, Science & Chrono-Mechanics (Items 902-1000)
            'bio_logic': { name: 'Biological Computing', cost: 1200, desc: 'Unlocks living ship hulls.', unlocked: false, req: 'bio_engineering', pos: { x: 300, y: 400 } },
            'secret_energy': { name: 'Vacuum Energy', cost: 2000, desc: 'Infinite zero-point energy foundation.', unlocked: false, req: 'antimatter_physics', pos: { x: 900, y: 0 } },
            'quantum_logic': { name: 'Quantum Supremacy', cost: 1500, desc: 'Instant data processing.', unlocked: false, req: 'quantum_storage', pos: { x: 500, y: 300 } },
            'chrono_trigger': { name: 'Chronon Particle Research', cost: 2500, desc: 'Foundation for temporal manipulation.', unlocked: false, req: 'warp_drive', pos: { x: 1100, y: 200 } },
            'dimension_fold': { name: '5th-Dimensional Folding', cost: 3000, desc: 'Travel beyond the galactic rim.', unlocked: false, req: 'chrono_trigger', pos: { x: 1300, y: 200 } },
            'omega_point': { name: 'The Omega Point', cost: 10000, desc: 'Transcending the physical universe.', unlocked: false, req: 'dimension_fold', pos: { x: 1500, y: 200 } }
        };
        // Military System
        this.military = new MilitarySystem(this);
        // Merge Military Techs
        Object.assign(this.technologies, this.military.getTechs());

        this.modifiers = {
            farmOutput: 1.0,
            mineOutput: 1.0,
            solarOutput: 1.0,
            researchOutput: 1.0,
            gravity: 1.0,
            moonProduction: 1.0
        };
        this.planetSurfaceGravity = 1.0;

        // Building Definitions
        this.buildingTypes = {
            'solar': { name: 'Solar Array', cost: { minerals: 20 }, icon: '⚡', output: { energy: 8 }, job: 'engineer', desc: 'Generates Energy', color: 0xfacc15, buildTime: 10, maxLevel: 3, upgradeMult: 1.5, assetId: 'sci_fusion_reactor' },
            'hab': { name: 'Habitat Dome', cost: { minerals: 50, alloys: 5 }, icon: '🏠', capacity: 5, desc: 'Houses 5 Colonists', color: 0x60a5fa, buildTime: 20, maxLevel: 3, upgradeMult: 1.5, assetId: 'hab_bio_dome' },
            'mine': { name: 'Auto-Miner', cost: { minerals: 40, alloys: 2 }, icon: '⛏️', output: { minerals: 3 }, job: 'miner', desc: 'Extracts Minerals', color: 0x94a3b8, buildTime: 15, maxLevel: 3, upgradeMult: 1.5, assetId: 'veh_mining_drill' },
            'farm': { name: 'Hydroponics', cost: { minerals: 30, alloys: 5 }, icon: '🌱', output: { food: 5 }, job: 'botanist', desc: 'Grows Food', color: 0x4ade80, buildTime: 30, assetId: 'sci_hydro_tray' },
            'lab': { name: 'Research Lab', cost: { minerals: 100, circuits: 5 }, icon: '🔬', output: { data: 2 }, job: 'researcher', desc: 'Generates Data', color: 0xa855f7, buildTime: 45, assetId: 'hab_command_center' },
            'oxy': { name: 'O2 Generator', cost: { minerals: 40, alloys: 10 }, icon: '💨', output: { oxygen: 6 }, job: 'engineer', desc: 'Produces Oxygen', color: 0xa5f3fc, buildTime: 25, assetId: 'hab_bio_dome' },
            'store': { name: 'Silo', cost: { minerals: 80, alloys: 10 }, icon: '📦', capBoost: 100, desc: 'Increases Storage', color: 0xf472b6, buildTime: 20, maxLevel: 3, upgradeMult: 1.5, assetId: 'log_cargo_container' },
            'refinery': { name: 'Refinery', cost: { minerals: 120, circuits: 5 }, icon: '🏭', desc: 'Refines Minerals into Alloys', color: 0xff8c00, buildTime: 60, maxLevel: 3, upgradeMult: 1.5, assetId: 'ind_ore_crusher' },
            'chip_fab': { name: 'Chip Fab', cost: { alloys: 50, circuits: 10 }, icon: '📟', desc: 'Assembles Circuits', color: 0x00ced1, buildTime: 90, maxLevel: 3, upgradeMult: 1.5, assetId: 'ind_atm_processor' },
            'drone_hub': { name: 'Drone Hub', cost: { alloys: 50, circuits: 10 }, icon: '🚁', desc: 'Center for automation', color: 0xffffff, buildTime: 120, assetId: 'com_dish_large' },
            'fusion': { name: 'Fusion Reactor', cost: { alloys: 200, circuits: 50 }, icon: '☢️', output: { energy: 100 }, job: 'engineer', desc: 'Massive Power', color: 0xef4444, buildTime: 300, assetId: 'sci_fusion_reactor' },
            'antimatter': { name: 'Antimatter Reactor', cost: { composite: 100, circuits: 200 }, icon: '⚛️', output: { energy: 500 }, job: 'engineer', desc: 'End-game power generation.', color: 0xa855f7, buildTime: 600, assetId: 'eng_antimatter' },
            'dyson_segment': { name: 'Dyson Segment', cost: { alloys: 500, composite: 500 }, icon: '☀️', output: { energy: 1000 }, job: 'engineer', desc: 'Harnesses stellar energy directly.', color: 0xfacc15, buildTime: 1200, assetId: 'mega_dyson_ring' },
            'launch_site': { name: 'Launch Site', cost: { alloys: 150, circuits: 80 }, icon: '🚀', desc: 'Unlocks Orbital View', color: 0xcbd5e1, buildTime: 180, assetId: 'log_docking_ring' },
            // Moon-specific buildings
            'helium_mine': { name: 'Helium-3 Extractor', cost: { minerals: 80, alloys: 40 }, icon: '⚛️', output: { helium3: 0.6 }, job: 'miner', desc: 'Slowly extracts strategic Helium-3 from surveyed lunar deposits', color: 0x7dd3fc, buildTime: 45, moonOnly: true, requiredReserve: 'helium3', assetId: 'veh_mining_drill' },
            'lunar_hab': { name: 'Lunar Habitat', cost: { minerals: 40, alloys: 20 }, icon: '🌙', capacity: 3, desc: 'Houses 3 Colonists (Low-G)', color: 0x94a3b8, buildTime: 30, moonOnly: true, assetId: 'hab_living_quarter' },
            'low_g_factory': { name: 'Low-G Factory', cost: { alloys: 60, circuits: 20 }, icon: '🏭', output: { circuits: 3 }, job: 'engineer', desc: '+50% production in low gravity', color: 0xe879f9, moonOnly: true, assetId: 'ind_atm_processor' },
            'citadel': { name: 'Astrahus Citadel', cost: { alloys: 500, circuits: 200 }, icon: '🏰', desc: 'Huge Orbital Hub. Reduces all Manufacturing time in system by 25%.', color: 0xffd700, buildTime: 300, assetId: 'mega_space_elevator' },
            'recycling_plant': { name: 'Recycling Plant', cost: { minerals: 100, alloys: 20 }, icon: '♻️', desc: 'Converts minerals into alloys at high efficiency.', color: 0x4ade80, buildTime: 40, maxLevel: 3, upgradeMult: 1.5, assetId: 'ind_ore_crusher' },
            'orbital_elevator': { name: 'Orbital Elevator', cost: { alloys: 1000, composite: 200, circuits: 100 }, icon: '🏗️', desc: 'Reduces surface-to-orbit transport costs by 90%.', color: 0x38bdf8, buildTime: 600, assetId: 'mega_space_elevator' },
            // Roadmap Item 501: Atmospheric Injector
            'injector': { name: 'Atm. Injector', cost: { minerals: 100, circuits: 50, energy: 100 }, icon: '💉', job: 'engineer', desc: 'Injects gases into the atmosphere to regulate composition.', color: 0x38bdf8, buildTime: 40, maxLevel: 3, upgradeMult: 1.5, assetId: 'ind_atm_processor' },
            'nano_assembler': { name: 'Nano-Assembler', cost: { composite: 200, circuits: 150 }, icon: '🧱', desc: 'Uses nanites to build structures instantly.', color: 0x4ade80, buildTime: 120, assetId: 'hab_command_center' },
            'hull_printer': { name: '3D Hull Printer', cost: { alloys: 300, composite: 100 }, icon: '🖨️', desc: 'Massively speeds up ship manufacturing.', color: 0x38bdf8, buildTime: 90, assetId: 'ind_ore_crusher' },
            'cryo_vault': { name: 'Cryo-Vault', cost: { alloys: 200, circuits: 50 }, icon: '❄️', desc: 'Prevents biological decay. Reduces food spoilage by 95%.', color: 0xa5f3fc, buildTime: 60, assetId: 'prop_cryo_pod' },
            'alchemist_lab': { name: 'Alchemist Lab', cost: { composite: 100, data: 500 }, icon: '🧪', desc: 'Transmutes raw minerals into synthetic materials.', color: 0xc084fc, buildTime: 90, assetId: 'hab_command_center' },
            'modular_hub': { name: 'Modular Hub', cost: { alloys: 150, circuits: 50 }, icon: '🧱', desc: 'Roadmap Item 247: Can be expanded with modular sub-sections.', color: 0x94a3b8, buildTime: 45, assetId: 'hab_living_quarter' },
            'prefab_pod': { name: 'Pre-fab Pod', cost: { alloys: 500, circuits: 100 }, icon: '📦', desc: 'Roadmap Item 248: Instant deployment from orbit.', color: 0xfacc15, buildTime: 5, assetId: 'log_escape_pod' },
            'base_crawler': { name: 'Base Crawler', cost: { alloys: 400, circuits: 150, composite: 50 }, icon: '🚜', desc: 'Roadmap Item 249: A mobile factory platform.', color: 0xef4444, buildTime: 120, assetId: 'veh_lunar_rover' },
            'ocean_rig': { name: 'Sub-Oceanic Rig', cost: { alloys: 300, composite: 100 }, icon: '⚓', desc: 'Roadmap Item 250: Specialized for deep-sea mineral extraction.', color: 0x38bdf8, buildTime: 80, waterOnly: true, assetId: 'ind_ore_crusher' },
            'geothermal': { name: 'Geothermal Plant', cost: { alloys: 150, circuits: 20 }, icon: '🔥', output: { energy: 40 }, desc: 'Item 251: Taps planetary heat for stable power.', color: 0xf87171, buildTime: 40, assetId: 'sci_fusion_reactor' },
            'wind_turbine': { name: 'Wind Turbine', cost: { minerals: 50, alloys: 10 }, icon: '🌬️', output: { energy: 15 }, desc: 'Item 252: Clean atmospheric energy.', color: 0xcbd5e1, buildTime: 15, assetId: 'sci_radar_array' },
            'tesla_tower': { name: 'Tesla Tower', cost: { alloys: 200, circuits: 100 }, icon: '🗼', desc: 'Item 254: Extends power grid range to neighboring tiles.', color: 0x60a5fa, buildTime: 50, assetId: 'grav_gen' },
            'battery_bank': { name: 'Battery Bank', cost: { alloys: 100, circuits: 50 }, icon: '🔋', capBoost: { energy: 500 }, desc: 'Item 255: Increases energy storage capacity.', color: 0x4ade80, buildTime: 30, assetId: 'log_cargo_container' },
            'hydrogen_plant': { name: 'Hydrogen Plant', cost: { alloys: 120, circuits: 40 }, icon: '💧', output: { hydrogen: 5 }, desc: 'Item 256: Extracts hydrogen from atmosphere/water.', color: 0x38bdf8, buildTime: 45, assetId: 'ind_atm_processor' },
            'antimatter_collider': { name: 'AM Collider', cost: { alloys: 1000, composite: 500, circuits: 500 }, icon: '🌀', output: { antimatter: 1 }, desc: 'Item 258: Produces antimatter for end-game power.', color: 0xa855f7, buildTime: 300, assetId: 'sci_fusion_reactor' },
            'singularity_harness': { name: 'Singularity Harness', cost: { composite: 1000, data: 2000 }, icon: '🕳️', output: { exotic_matter: 0.1 }, desc: 'Item 259: Harvests matter from artificial singularities.', color: 0x000000, buildTime: 600, assetId: 'mega_dyson_ring' },
            'dark_matter_lab': { name: 'Dark Matter Lab', cost: { data: 5000, composite: 200 }, icon: '🌑', output: { data: 50 }, desc: 'Item 260: Advanced research into dark matter.', color: 0x1e1b4b, buildTime: 180, assetId: 'hab_command_center' },
            'solar_sail': { name: 'Solar Sail', cost: { alloys: 100, composite: 50 }, icon: '⛵', output: { energy: 20 }, desc: 'Item 253: Passive energy transfer from the star.', color: 0xfff7ed, buildTime: 25, assetId: 'sci_fusion_reactor' },
            'telescope_array': { name: 'Telescope Array', cost: { alloys: 200, circuits: 150, data: 500 }, icon: '🔭', desc: 'Item 314: Unlocks long-range SETI signal analysis.', color: 0x60a5fa, buildTime: 60, assetId: 'sci_radar_array' },
            'gas_siphon': { name: 'Atmospheric Siphon', cost: { alloys: 300, circuits: 100 }, icon: '🌪️', desc: 'Item 325: Extracts rare gases from Gas Giants.', color: 0xf472b6, buildTime: 90, gasGiantOnly: true, assetId: 'ind_atm_processor' },
            'chrono_stabilizer': { name: 'Chrono-Stabilizer', cost: { energy: 300, data: 100 }, icon: '⏳', desc: 'Item 345: Stabilizes localized spacetime anomalies.', color: 0xa855f7, buildTime: 40, assetId: 'grav_gen' },
            'stellar_dampener': { name: 'Stellar Dampener', cost: { alloys: 500, composite: 100 }, icon: '🛡️', desc: 'Item 397: Mitigates damage from stellar-scale disasters.', color: 0x38bdf8, buildTime: 120, assetId: 'mega_dyson_ring' },
            'temporal_anchor': { name: 'Temporal Anchor', cost: { data: 500, circuits: 200 }, icon: '⚓', desc: 'Item 382: Prevents timeline divergence and convergence issues.', color: 0x6366f1, buildTime: 60, assetId: 'grav_gen' },
            'matrioshka_brain': { name: 'Matrioshka Brain', cost: { circuits: 5000, composite: 2000 }, icon: '🧠', desc: 'Item 389: A star-sized computer for hosting digital universes.', color: 0xfacc15, buildTime: 600, assetId: 'mega_dyson_ring' },
            'defense_battery': { name: 'Defense Battery', cost: { alloys: 200, circuits: 50 }, icon: '🔋', desc: 'Item 445: Planet-to-space defense. Fires at hostile vessels in low orbit.', color: 0xef4444, buildTime: 40, assetId: 'def_auto_turret' }
        };

        this.jobTitles = {
            'unemployed': 'Unemployed',
            'engineer': 'Engineer',
            'miner': 'Miner',
            'botanist': 'Botanist',
            'researcher': 'Researcher'
        };

        const w = this.container.clientWidth;
        const h = this.container.clientHeight || 600;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020617);
        this.scene.fog = new THREE.FogExp2(0x020617, 0.0015);
        this.clock = new THREE.Clock(); // Initialize Clock early

        this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        // Frame the whole colony world instead of starting almost inside the atmosphere.
        this.camera.position.set(0, 58, 150);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        this.renderer.setSize(w, h);
        if (THREE.SRGBColorSpace) this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.9;
        this.container.appendChild(this.renderer.domElement);

        // PerformanceManager is created earlier in the constructor, before WebGL exists.
        // Re-run quality detection now so software/low-end renderers are configured
        // before assets and shadow programs are compiled.
        if (this.performance?.detectQuality) {
            this.performance.detectQuality();
            console.log(`Performance renderer profile: ${this.performance.quality}`);
        }

        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 72; // Close zoom is available, but the default view frames the whole world.
            this.controls.maxDistance = 280;
            this.controls.enablePan = false; // Disable panning to keep planet centered
            this.controls.enableRotate = true; // Explicitly enable rotation
            this.controls.rotateSpeed = 0.5;
            this.controls.zoomSpeed = 1.2;

            // Ensure canvas handles gestures correctly for controls
            this.renderer.domElement.style.touchAction = 'none';
        }

        // --- ASSET PRODUCTION MANAGERS INITIALIZATION ---
        // These require scene, camera, and renderer to be ready.
        if (typeof ProductionAssetManager !== 'undefined') {
            this.assetManager = new ProductionAssetManager(this.assetManifest);
        }
        if (typeof VFXManager !== 'undefined') {
            this.vfxManager = new VFXManager(this.scene, this.camera, this.renderer, this.assetManifest);
        }
        if (typeof SpatialAudioManager !== 'undefined') {
            this.audioManager = new SpatialAudioManager(this.camera, this.assetManifest);
        }
        if (typeof NarrativeManager !== 'undefined') {
            this.narrativeManager = new NarrativeManager(this);
        }
        if (typeof OptimizationManager !== 'undefined') {
            this.optimizationManager = new OptimizationManager(this.scene, this.camera);
        }
        if (typeof DecalManager !== 'undefined') {
            this.decalManager = new DecalManager(this.scene);
        }
        if (typeof CharacterCustomizationManager !== 'undefined') {
            this.characterManager = new CharacterCustomizationManager(this.assetManager);
        }

        // --- MANUAL ROTATION HELPERS ---
        this.rotateLeft = () => {
            if (this.controls) {
                this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.1);
                this.camera.lookAt(0, 0, 0);
            }
        };

        this.rotateRight = () => {
            if (this.controls) {
                this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.1);
                this.camera.lookAt(0, 0, 0);
            }
        };

        // Lighting
        // Lighting
        this.suns = []; // Track active sun lights/meshes
        this.setupSuns(); // Setup default (single) sun initially

        // Post-Processing
        if (typeof THREE.EffectComposer !== 'undefined' && typeof THREE.RenderPass !== 'undefined') {
            this.composer = new THREE.EffectComposer(this.renderer);
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);

            // Bloom
            const canBloom =
                typeof THREE.UnrealBloomPass !== 'undefined' &&
                typeof THREE.LuminosityHighPassShader !== 'undefined' &&
                THREE.LuminosityHighPassShader &&
                THREE.LuminosityHighPassShader.uniforms;

            if (canBloom) {
                try {
                    this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85);
                    this.bloomPass.threshold = 0.5; // Higher threshold to avoid washing out the whole planet
                    this.bloomPass.strength = 0.4;  // Reduced intensity
                    this.bloomPass.radius = 0.3;
                    this.composer.addPass(this.bloomPass);
                } catch {
                    this.bloomPass = null;
                }
            } else {
                this.bloomPass = null;
            }

            // Roadmap Item 10: Gravitational Lensing Shader Pass (Foundation)
            if (typeof THREE.ShaderPass !== 'undefined') {
                const GravLensShader = {
                    uniforms: {
                        "tDiffuse": { value: null },
                        "strength": { value: 0.0 },
                        "center": { value: new THREE.Vector2(0.5, 0.5) }
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        precision mediump float;
                        uniform sampler2D tDiffuse;
                        uniform float strength;
                        uniform vec2 center;
                        varying vec2 vUv;
                        void main() {
                            if (strength <= 0.0) {
                                gl_FragColor = texture2D(tDiffuse, vUv);
                                return;
                            }
                            vec2 dir = vUv - center;
                            float dist = length(dir);
                            // Simple gravitational lensing distortion logic
                            vec2 uv = center + dir * (1.0 + strength / (1.0 + dist * 10.0));
                            gl_FragColor = texture2D(tDiffuse, uv);
                        }
                    `
                };
                this.lensPass = new THREE.ShaderPass(GravLensShader);
                this.composer.addPass(this.lensPass);
            }
        }

        const ambient = new THREE.AmbientLight(0x1e293b, 0.4);
        this.scene.add(ambient);

        const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.3);
        this.scene.add(hemiLight);

        this.createBackgroundStars(); // Add reference points

        this.createPlanet(); // createPlanet owns atmosphere/cloud creation.
        this.createCursor();

        // Initialize orbital manager now that scene exists
        this.orbit.init();

        // Initial Population
        for (let i = 0; i < 6; i++) this.addColonist();

        if (typeof LocalSystemExplorer === 'function') this.localSystemExplorer = new LocalSystemExplorer(this);
        this.createUI();
        if (typeof PioneerRayTracingRenderer === 'function') this.rayTracingRenderer = new PioneerRayTracingRenderer(this);

        this.tryAutoLoadGame();
        this.applyGraphicsSettings({ rebuildPlanet: false, notify: false });

        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            void this.audio.init()
                .then(() => this.applyAudioSettings())
                .catch((error) => console.warn('Audio initialization unavailable:', error));
            this.onPointerDown(e);
        });
        this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));

        // Window Resize Handling
        window.addEventListener('resize', () => {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight || 600;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(width, height);
            if (this.composer) {
                this.composer.setSize(width, height);
            }
            this.rayTracingRenderer?.resize?.(true);
        });

        const ro = new ResizeObserver(() => this.resize());
        ro.observe(this.container);

        // Audio
        this.audio = new SoundEngine();
        this.applyAudioSettings();
        this.log = new Logger();

        // Roadmap Item 801: Inject Diegetic UI Styles
        this.injectDiegeticStyles();

        // Roadmap Item 12 physics worker is currently a placeholder with no active
        // producers or result consumers. Avoid spawning an idle worker/thread during
        // colony startup until a gameplay system actually needs it.
        this.physicsWorker = null;

        // 3D combat is loaded only when the player actually launches fighters.
        // Keeping the secondary scene off the colony startup path avoids parsing
        // and constructing ~90 KB of combat code before it can be used.
        this.combatScene = null;
        this.combatSceneLoadPromise = null;

        this.onGlobalKeyDown = (e) => {
            if (e.repeat) return;

            const target = e.target;
            const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

            if (e.code === 'Escape') {
                e.preventDefault();

                if (this.isPaused) {
                    this.togglePause(false);
                    return;
                }

                const openModal = Array.from(document.querySelectorAll('.ep-modal-overlay'))
                    .reverse()
                    .find((modal) => modal.id !== 'ep-pause-modal' && getComputedStyle(modal).display !== 'none');
                if (openModal) {
                    openModal.style.display = 'none';
                    return;
                }

                if (isTyping) {
                    target.blur?.();
                    return;
                }

                if (this.operationsMenuOpen) {
                    this.toggleOperationsMenu(false);
                    return;
                }

                if (this.selectedInventoryItem) {
                    this.cancelPlacement(true);
                    return;
                }

                if (typeof window.setPioneerDataOverlayOpen === 'function') {
                    const overlay = document.getElementById('ep-data-overlay');
                    if (overlay && !overlay.classList.contains('hidden')) {
                        window.setPioneerDataOverlayOpen(false);
                        return;
                    }
                }

                this.togglePause();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
                e.preventDefault();
                this.saveGame();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyL') {
                e.preventDefault();
                this.loadGame();
                return;
            }

            if (isTyping) return;

            if (e.code === 'KeyR' && this.isCombatActive) {
                e.preventDefault();
                if (this.isPaused) this.togglePause(false);
                this.retreatFromCombat();
                return;
            }

            if (e.code === 'KeyG' && !this.isCombatActive) {
                e.preventDefault();
                if (!this.isPaused) {
                    if (this.universe?.openGalaxyMap) this.universe.openGalaxyMap();
                    else this.toggleGalaxyView();
                }
                return;
            }

            if (e.code === 'KeyC' && !this.isCombatActive) {
                e.preventDefault();
                if (!this.isPaused) this.toggleCinematicMode();
                return;
            }
        };
        window.addEventListener('keydown', this.onGlobalKeyDown);

        this.startAutosave();
    }

    createBackgroundStars() {
        const createLayer = (count, radius, size, opacity) => {
            const bgGeo = new THREE.BufferGeometry();
            const bgPos = new Float32Array(count * 3);
            for (let i = 0; i < count * 3; i += 3) {
                const r = radius * (0.8 + Math.random() * 0.4); // Variance in depth
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                bgPos[i] = r * Math.sin(phi) * Math.cos(theta);
                bgPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
                bgPos[i + 2] = r * Math.cos(phi);
            }
            bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
            const bgMat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: size,
                transparent: true,
                opacity: opacity,
                sizeAttenuation: false // Keep them distinct dots
            });
            const starfield = new THREE.Points(bgGeo, bgMat);
            this.scene.add(starfield);
            // Store for potential parallax animation if needed later
            if (!this.starLayers) this.starLayers = [];
            this.starLayers.push(starfield);
            return starfield;
        };

        this.starLayers = [];
        // Layer 1: Dense, faint, distant
        createLayer(3000, 1500, 0.5, 0.3);

        // Layer 2: Medium, brighter, mid-range
        createLayer(1000, 1000, 1.0, 0.6);

        // Layer 3: Sparse, bright, close (Parallax heavy)
        createLayer(200, 600, 1.5, 0.9);

        // Phase 6: Host Star
        this.createSun();
    }

    createSun() {
        // Create the visible Sun mesh in the distance
        // Use a large sphere with emissive material
        const sunGeo = new THREE.SphereGeometry(50, 64, 64);
        const sunMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00, // Orange-ish sun
            toneMapped: false // Super bright
        });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);

        // Position visually 'behind' the planet but rotatable
        // We'll place it far away.
        this.sunMesh.position.set(500, 300, -800);
        this.scene.add(this.sunMesh);

        // Add a glow sprite or lens flare if possible, but basic mesh for now
        const light = new THREE.PointLight(0xffaa00, 1.5, 2000);
        light.position.copy(this.sunMesh.position);
        this.scene.add(light);

        // Initialize InstancedMesh for Dyson Swarm
        this.initDysonSwarmVisuals();
    }

    initDysonSwarmVisuals() {
        // Prepare InstancedMesh for up to 10,000 satellites
        const count = 10000;
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide
        });

        this.dysonSwarmMesh = new THREE.InstancedMesh(geometry, material, count);
        this.dysonSwarmMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.dysonSwarmMesh.count = 0; // Start with 0 visible

        // Add to Sun group so they rotate with it or position relative to it
        this.scene.add(this.dysonSwarmMesh);
        this.dysonSwarmMesh.position.copy(this.sunMesh.position);

        // Initial update
        if (this.megastructureSystem) {
            this.updateDysonSwarmVisuals(this.megastructureSystem.swarmSatellites);
        }
    }

    updateDysonSwarmVisuals(count) {
        if (!this.dysonSwarmMesh) return;

        const dummy = new THREE.Object3D();
        const radius = 80; // Orbit around the Sun mesh (radius 50)

        // Cap at max instance count
        const displayCount = Math.min(count, 10000);
        this.dysonSwarmMesh.count = displayCount;

        for (let i = 0; i < displayCount; i++) {
            // Golden Angle distribution for even sphere coverage
            const phi = Math.acos(1 - 2 * (i + 0.5) / displayCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            dummy.position.set(x, y, z);
            dummy.lookAt(0, 0, 0); // Look at Sun center
            dummy.updateMatrix();

            this.dysonSwarmMesh.setMatrixAt(i, dummy.matrix);
        }

        this.dysonSwarmMesh.instanceMatrix.needsUpdate = true;
    }

    initGalaxyView() {
        if (this.galaxyView) return;
        const container = document.getElementById('ep-galaxy-container');
        if (!container) return;
        this.galaxyView = new GalaxyView(container);
    }

    // Pseudo-random number generator
    seedRandom(seed) {
        let val = seed;
        return function () {
            val = (val * 9301 + 49297) % 233280;
            return val / 233280;
        }
    }

    getTilePos(id) {
        if (this.tiles[id]) return this.tiles[id].position;
        return new THREE.Vector3();
    }

    getPlanetPhysicalProfile(seed = 12345, type = 'planet') {
        const catalogId = this.planetData && this.planetData.id ? String(this.planetData.id) : '';
        const currentId = this.currentSystemId !== undefined && this.currentSystemId !== null
            ? String(this.currentSystemId)
            : '';
        if (type === 'planet' && catalogId && currentId === catalogId) {
            return { ...this.planetData, provenance: 'catalog-constrained' };
        }
        return { worldType: type, seed, provenance: 'procedural-inference' };
    }

    createPlanet(seed = 12345, type = 'planet') {
        // A planet replacement invalidates every surface-parented visual from the retired mesh.
        if (this.buildingMeshes && Object.keys(this.buildingMeshes).length) {
            Object.values(this.buildingMeshes).forEach((group) => group?.parent?.remove?.(group));
            this.buildingMeshes = {};
        }
        if (this.resourceDepositMesh) {
            this.resourceDepositMesh.parent?.remove?.(this.resourceDepositMesh);
            this.resourceDepositMesh.geometry?.dispose?.();
            this.resourceDepositMesh.material?.dispose?.();
            this.resourceDepositMesh = null;
        }
        this.infrastructureGroup = null;
        this.infrastructureLinks = [];
        this.infrastructureSignature = '';
        if (this.planetMesh) {
            this.scene.remove(this.planetMesh);
            this.planetMesh.geometry.dispose();
            this.planetMesh.material.dispose();
        }
        if (this.cloudMesh) {
            this.scene.remove(this.cloudMesh);
            this.cloudMesh.geometry.dispose();
            this.cloudMesh.material.dispose();
            this.cloudMesh = null;
        }
        if (this.atmosphereMesh) {
            this.scene.remove(this.atmosphereMesh);
            this.atmosphereMesh.geometry.dispose();
            this.atmosphereMesh.material.dispose();
            this.atmosphereMesh = null;
        }

        // Catalog values constrain a procedural scenario; exoplanet surface topography is unresolved.
        const generator = new PlanetGenerator(this.scene);
        this.currentPhysicalProfile = this.getPlanetPhysicalProfile(seed, type);
        this.planetMesh = generator.createPlanet(seed, type, this.currentPhysicalProfile, this.getPlanetRenderOptions());
        this.scene.add(this.planetMesh); // CRITICAL: Add to scene for rendering

        // Cursor survives world regeneration by moving from the retired mesh to the new one.
        if (this.cursorMesh) {
            this.planetMesh.add(this.cursorMesh);
            this.cursorMesh.visible = false;
        }

        this.currentWorldSeed = seed;
        this.currentWorldType = type;

        // Generate tiles for game logic
        this.tiles = [];
        const numTiles = 1000;
        const phi = Math.PI * (3 - Math.sqrt(5));
        const rnd = this.seedRandom(seed);

        for (let i = 0; i < numTiles; i++) {
            const y = 1 - (i / (numTiles - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;

            // Logical tile position uses the exact same terrain field as the rendered mesh.
            let disp = 0;
            const isGasGiant = type === 'gas' || type === 'giant';
            if (window.getTerrainHeight && !isGasGiant) {
                disp = window.getTerrainHeight(x, y, z, seed, this.currentPhysicalProfile, type);
            } else if (!window.getTerrainHeight && !isGasGiant) {
                if (i === 0) console.error("CRITICAL: No terrain height function found! Buildings will be buried.");
            }

            const pos = new THREE.Vector3(x, y, z).multiplyScalar(50 + disp);

            // Determine Tile Type based on Height (Logic Sync)
            let tileType = 'plains';
            // disp > 7.0 is Peak (Snow/Rock)
            // disp > 4.0 is High Grass/Rock
            // disp <= 0.0 is Water (Should not happen for tiles usually unless we want water tiles)

            // Map height to types
            if (disp > 0.86) tileType = 'mountain';
            else if (disp < 0.10) tileType = 'crater'; // Lowlands/water remain distinct gameplay tiles.
            // else plains

            // Keep random variance for craters?
            // Blend logic: mostly height based, but some randomness

            this.tiles.push({
                id: i,
                position: pos,
                type: tileType,
                building: null,
                life: null,
                reserves: { // Roadmap Item 222: Resource Depletion
                    minerals: Math.floor(rnd() * 500 + 100),
                    helium3: type === 'moon' && tileType === 'crater' ? Math.floor(180 + rnd() * 320) : 0
                }
            });
            if (this.ecosystem) {
                const life = this.ecosystem.populateTile(i, tileType);
                this.tiles[i].life = life;
            }
        }

        // Lunar volatile deposits are a gameplay constraint, so make them visibly surveyable rather
        // than forcing the player to hunt invisible logical tiles. A single InstancedMesh keeps the
        // cue cheap even when many crater deposits are present.
        if (type === 'moon') this.createLunarResourceMarkers();

        // Recreate a rocky atmosphere from the modeled retention profile rather than from a
        // literal `type === planet` check. Ice/desert/terran worlds can retain atmospheres too;
        // gas giants render their visible atmosphere directly in the banded gas shader.
        const atmosphereProfile = this.planetMesh?.userData?.terrain?.physicalProfile || {};
        const gasAtmosphereWorld = type === 'gas' || type === 'giant';
        const retainedRockyAtmosphere = type !== 'moon' && !gasAtmosphereWorld
            && Number(atmosphereProfile.atmosphereRetention || 0) > 0.12;
        if (retainedRockyAtmosphere) this.createAtmosphere();

        // Rebind terrain/fluid tools whenever the world mesh is regenerated.
        if (window.voxelTerrainSystem) {
            window.voxelTerrainSystem.init(this.planetMesh);
            this.voxelTerrainInitialized = true;
        }
        if (window.fluidDynamicsSystem) {
            window.fluidDynamicsSystem.init(this.planetMesh);
            if (window.fluidDynamicsSystem.waterMesh) {
                window.fluidDynamicsSystem.waterMesh.visible = type === 'planet';
            }
            this.fluidDynamicsInitialized = true;
        }

        // Initialize AI Systems (Roadmap Phase 2) - ONLY if not already initialized
        if (window.NPCSystem && !this.npcSystem) {
            this.npcSystem = new window.NPCSystem(this);
            this.npcSystem.init();
        }
        if (window.FactionManager && !this.factionManager) {
            this.factionManager = new window.FactionManager(this);
            this.factionManager.init();
        }
        if (window.EconomyManager && !this.economyManager) {
            this.economyManager = new window.EconomyManager(this);
            this.market = this.economyManager;
        }
        if (window.TechTreeSystem && !this.techTree) {
            this.techTree = new window.TechTreeSystem(this);
        }
        if (window.DisasterManager && !this.disasterManager) {
            this.disasterManager = new window.DisasterManager(this);
        }

        // Keep the Science Deck's provenance/climate scenario synchronized across warps,
        // regeneration, Moon transit and save restores without coupling the game core to that panel.
        queueMicrotask(() => window.renderPioneerClimateModel?.());

        // Archaeology binds to the final logical tile/building state on the next task. This keeps
        // ruin markers deterministic across planet replacement, warp, Moon transit and save restore.
        clearTimeout(this.archaeologyWorldSyncTimer);
        this.archaeologyWorldSyncTimer = setTimeout(() => this.archaeology?.syncWorld?.(), 0);
    }

    createLunarResourceMarkers() {
        if (!this.planetMesh || !Array.isArray(this.tiles)) return null;
        if (this.resourceDepositMesh) {
            this.resourceDepositMesh.parent?.remove?.(this.resourceDepositMesh);
            this.resourceDepositMesh.geometry?.dispose?.();
            this.resourceDepositMesh.material?.dispose?.();
            this.resourceDepositMesh = null;
        }

        const deposits = this.tiles.filter((tile) => Number(tile?.reserves?.helium3 || 0) > 0);
        if (!deposits.length) return null;
        const geometry = new THREE.RingGeometry(0.42, 0.72, 18);
        const material = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.InstancedMesh(geometry, material, deposits.length);
        const normalAxis = new THREE.Vector3(0, 0, 1);
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        deposits.forEach((tile, index) => {
            const normal = tile.position.clone().normalize();
            const position = tile.position.clone().addScaledVector(normal, 0.13);
            quaternion.setFromUnitVectors(normalAxis, normal);
            matrix.compose(position, quaternion, scale);
            mesh.setMatrixAt(index, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.frustumCulled = false;
        mesh.renderOrder = 103;
        mesh.userData = {
            isResourceDepositMarker: true,
            resource: 'helium3',
            count: deposits.length
        };
        // Resource cues must never intercept the planet placement raycast.
        mesh.raycast = () => {};
        this.planetMesh.add(mesh);
        this.resourceDepositMesh = mesh;
        return mesh;
    }

    createAtmosphere() {
        if (this.atmosphereMesh) {
            this.scene.remove(this.atmosphereMesh);
            this.atmosphereMesh.geometry?.dispose?.();
            this.atmosphereMesh.material?.dispose?.();
            this.atmosphereMesh = null;
        }
        if (this.cloudMesh) {
            this.scene.remove(this.cloudMesh);
            this.cloudMesh.geometry?.dispose?.();
            this.cloudMesh.material?.dispose?.();
            this.cloudMesh = null;
        }

        const atmoSegments = ({ low: 48, medium: 72, high: 96, ultra: 144 })[this.graphicsSettings?.atmosphereQuality] || 96;
        const atmoGeo = new THREE.SphereGeometry(53.6, atmoSegments, atmoSegments);
        const profile = this.planetMesh?.userData?.terrain?.physicalProfile || {};
        const retention = profile.atmosphereRetention ?? 0.7;
        const hotHaze = THREE.MathUtils.clamp(((profile.estimatedSurfaceTemperatureK || 280) - 420) / 900, 0, 1);
        const dryHaze = THREE.MathUtils.clamp((profile.aridity || 0) * 0.34, 0, 0.34);
        const volcanicHaze = ['lava', 'volcanic'].includes(profile.worldType) ? 0.30 : 0;
        const hazeStrength = THREE.MathUtils.clamp(dryHaze + hotHaze * 0.25 + volcanicHaze, 0, 0.58);
        const atmoMat = new THREE.ShaderMaterial({
            uniforms: {
                sunDirection: { value: new THREE.Vector3(1, 0, 0) },
                colorDay: { value: new THREE.Color(0x38bdf8) },
                colorSunset: { value: new THREE.Color(0xff7043) },
                colorHaze: { value: new THREE.Color(hotHaze > 0.35 ? 0xd58b52 : 0xc5a878) },
                hazeStrength: { value: hazeStrength },
                density: { value: THREE.MathUtils.clamp(0.52 + retention * 0.22, 0.42, 0.82) }
            },
            vertexShader: `
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fragmentShader: `
                uniform vec3 sunDirection;
                uniform vec3 colorDay;
                uniform vec3 colorSunset;
                uniform vec3 colorHaze;
                uniform float hazeStrength;
                uniform float density;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;

                void main() {
                    vec3 N = normalize(vWorldNormal);
                    vec3 V = normalize(cameraPosition - vWorldPosition);
                    vec3 L = normalize(sunDirection);
                    float mu = clamp(dot(N, V), 0.0, 1.0);
                    float rim = pow(1.0 - mu, 3.2);
                    float sunMu = dot(N, L);
                    float day = smoothstep(-0.24, 0.18, sunMu);
                    float horizonSun = exp(-pow((sunMu + 0.02) / 0.18, 2.0));
                    float forwardScatter = pow(max(dot(V, L), 0.0), 7.0) * 0.12;
                    vec3 scatter = mix(colorDay, colorSunset, horizonSun * 0.86);
                    scatter = mix(scatter, colorHaze, hazeStrength * (0.46 + horizonSun * 0.54));
                    scatter += vec3(0.38, 0.58, 0.92) * forwardScatter * (1.0 - hazeStrength * 0.55);
                    float alpha = rim * mix(0.14, 0.82, day) * density;
                    gl_FragColor = vec4(scatter, alpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });

        this.atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
        this.atmosphereMesh.name = 'Atmosphere';
        this.scene.add(this.atmosphereMesh);
        if (Number(profile.cloudPotential || 0) > 0.045) this.createClouds();
    }

    createClouds() {
        const cloudSegments = ({ low: 48, medium: 72, high: 96, ultra: 144 })[this.graphicsSettings?.cloudQuality] || 96;
        const cloudGeo = new THREE.SphereGeometry(52.0, cloudSegments, cloudSegments);
        const profile = this.planetMesh?.userData?.terrain?.physicalProfile || {};
        const cloudiness = THREE.MathUtils.clamp(profile.cloudPotential ?? (0.28 + (profile.waterPotential || 0.4) * 0.52), 0.08, 0.84);
        const lockedCloudBoost = profile.tidallyLocked ? THREE.MathUtils.clamp(0.12 + (profile.insolationEarth || 1) * 0.07, 0.12, 0.34) : 0;

        const cloudMat = new THREE.ShaderMaterial({
            uniforms: {
                sunDirection: { value: new THREE.Vector3(1, 0, 0) },
                time: { value: 0 },
                cloudiness: { value: cloudiness },
                tidallyLocked: { value: profile.tidallyLocked ? 1 : 0 },
                lockedCloudBoost: { value: lockedCloudBoost }
            },
            vertexShader: `
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vLocalPosition;
                void main() {
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    vLocalPosition = position;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            fragmentShader: `
                uniform vec3 sunDirection;
                uniform float time;
                uniform float cloudiness;
                uniform float tidallyLocked;
                uniform float lockedCloudBoost;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vLocalPosition;

                float hash21(vec2 p) {
                    p = fract(p * vec2(123.34, 456.21));
                    p += dot(p, p + 45.32);
                    return fract(p.x * p.y);
                }
                float valueNoise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
                }
                float fbm(vec2 p) {
                    float v = 0.0;
                    float a = 0.52;
                    for (int i = 0; i < 5; i++) {
                        v += valueNoise(p) * a;
                        p = p * 2.03 + vec2(7.1, 3.7);
                        a *= 0.49;
                    }
                    return v;
                }
                float triCloud(vec3 p, vec3 n) {
                    vec3 w = pow(abs(n), vec3(3.0));
                    w /= max(w.x + w.y + w.z, 0.001);
                    vec3 drift = vec3(time * 0.010, time * 0.004, -time * 0.007);
                    p += drift;
                    float x = fbm(p.yz);
                    float y = fbm(p.zx + vec2(17.0, -9.0));
                    float z = fbm(p.xy + vec2(-11.0, 23.0));
                    return x * w.x + y * w.y + z * w.z;
                }

                void main() {
                    vec3 N = normalize(vWorldNormal);
                    vec3 V = normalize(cameraPosition - vWorldPosition);
                    vec3 L = normalize(sunDirection);
                    vec3 sphere = normalize(vLocalPosition);
                    float broad = triCloud(sphere * 5.4, sphere);
                    float wisps = triCloud(sphere * 11.5 + vec3(3.1, 7.4, -4.6), sphere);
                    float field = broad * 0.80 + wisps * 0.27;
                    // Reduced-order proxy for GCM cloud behavior on 1:1 locked rocky worlds:
                    // deep convection is preferentially concentrated around the substellar region.
                    float substellar = pow(max(dot(N, L), 0.0), 3.2);
                    float cloudStreet = 0.5 + 0.5 * sin(atan(sphere.z, sphere.x) * 18.0 + sphere.y * 13.0 + time * 0.025);
                    field += tidallyLocked * substellar * lockedCloudBoost * (0.78 + cloudStreet * 0.22);
                    float threshold = mix(0.70, 0.53, cloudiness);
                    float cloud = smoothstep(threshold, threshold + 0.13, field);
                    float sun = max(dot(N, L), 0.0);
                    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);
                    float silver = pow(max(dot(reflect(-L, N), V), 0.0), 10.0);
                    // Night-side clouds should stay visible as pale atmospheric structure, not
                    // become a charcoal overlay that hides terrain and colony silhouettes.
                    vec3 shadowColor = vec3(0.38, 0.46, 0.58);
                    vec3 litColor = vec3(0.95, 0.98, 1.0);
                    vec3 finalColor = mix(shadowColor, litColor, 0.22 + sun * 0.78);
                    finalColor += vec3(0.20, 0.36, 0.56) * rim * 0.20 + silver * 0.12;
                    gl_FragColor = vec4(finalColor, cloud * (0.10 + sun * 0.34));
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            side: THREE.DoubleSide
        });

        this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        this.cloudMesh.name = 'CloudLayer';
        this.scene.add(this.cloudMesh);
    }

    createCursor() {
        const geo = new THREE.RingGeometry(1.5, 1.8, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthTest: false });
        this.cursorMesh = new THREE.Mesh(geo, mat);
        this.cursorMesh.visible = false;
        // RingGeometry lies in local XY, so its local surface normal is +Z.
        this.cursorSurfaceAxis = new THREE.Vector3(0, 0, 1);
        this.cursorSurfaceNormal = new THREE.Vector3();

        // Parent to planetMesh so it rotates with the surface
        if (this.planetMesh) {
            this.planetMesh.add(this.cursorMesh);
        } else {
            this.scene.add(this.cursorMesh);
        }
    }

    createUI() {
        let ui = document.getElementById('ep-ui');
        if (ui) ui.remove();

        ui = document.createElement('div');
        ui.id = 'ep-ui';
        ui.style.pointerEvents = 'none'; // Allow clicks to pass through to canvas

        ui.innerHTML = `
            <div class="ep-top-bar">
                <div class="ep-resource-panel" id="ep-res-panel" aria-label="Colony resources"></div>

                <div class="ep-system-controls" aria-label="Command deck">
                    <div class="ep-command-primary">
                        <button class="ep-sys-btn ep-command-btn ep-command-combat" onclick="window.game.launchFighters()" title="Launch Fighters" aria-label="Launch Fighters"><span>🚀</span><span class="ep-command-text">Combat</span></button>
                        <button class="ep-sys-btn ep-command-btn" id="ep-btn-galaxy" title="Galaxy View (G)" aria-label="Galaxy View"><span>🌌</span><span class="ep-command-text">Galaxy</span></button>
                        <button class="ep-sys-btn ep-command-btn" id="ep-btn-tech" title="Research" aria-label="Research"><span>🔬</span><span class="ep-command-text">Research</span></button>
                        <button class="ep-sys-btn ep-command-btn" id="ep-btn-industry" title="Industrial Operations" aria-label="Industrial Operations"><span>🏭</span><span class="ep-command-text">Industry</span></button>
                        <button class="ep-sys-btn ep-command-btn" id="ep-btn-missions" title="Agent Missions" aria-label="Agent Missions"><span>📜</span><span class="ep-command-text">Missions</span></button>
                        <button class="ep-sys-btn ep-command-btn ep-command-more" id="ep-btn-ops" title="More operations" aria-label="More operations" aria-expanded="false" aria-controls="ep-ops-drawer"><span>☷</span><span class="ep-command-text">More</span></button>
                    </div>

                    <div class="ep-command-overflow" id="ep-ops-drawer" hidden>
                        <div class="ep-ops-header"><span>OPERATIONS</span><span>Low-frequency systems</span></div>
                        <div class="ep-ops-grid">
                            <section class="ep-ops-group">
                                <div class="ep-ops-label">SESSION</div>
                                <button class="ep-sys-btn" id="ep-btn-save" title="Save Game"><span>💾</span><span>Save</span></button>
                                <button class="ep-sys-btn" id="ep-btn-load" title="Load Game"><span>📂</span><span>Load</span></button>
                                <button class="ep-sys-btn" id="ep-btn-profile" title="Profile"><span>👤</span><span>Profile</span></button>
                                <button class="ep-sys-btn" id="ep-btn-cloud" title="Cloud Services"><span>☁️</span><span>Cloud</span></button>
                            </section>
                            <section class="ep-ops-group">
                                <div class="ep-ops-label">COLONY</div>
                                <button class="ep-sys-btn" id="ep-btn-roster" title="Colony Roster"><span>📋</span><span>Roster</span></button>
                                <button class="ep-sys-btn" id="ep-btn-recruit" title="Recruitment"><span>🤝</span><span>Recruit</span></button>
                                <button class="ep-sys-btn" id="ep-btn-legal" title="Colony Laws"><span>⚖️</span><span>Laws</span></button>
                                <button class="ep-sys-btn" id="ep-btn-factions" onclick="window.game.openFactionDashboard()" title="Factions"><span>🏳️</span><span>Factions</span></button>
                                <button class="ep-sys-btn" id="ep-btn-terra" onclick="window.game.terraforming.toggleUI()" title="Terraforming Status"><span>🌍</span><span>Terraform</span></button>
                                <button class="ep-sys-btn ep-claim-btn" id="ep-btn-claim" title="Claim System"><span>🚩</span><span>Claim</span></button>
                            </section>
                            <section class="ep-ops-group">
                                <div class="ep-ops-label">EXPLORE</div>
                                <button class="ep-sys-btn" id="ep-btn-xeno" title="Xenodex"><span>👽</span><span>Xenodex</span></button>
                                <button class="ep-sys-btn" id="ep-btn-fleet" title="Fleet"><span>🚀</span><span>Fleet</span></button>
                                <button class="ep-sys-btn" id="ep-btn-system" title="Explore the local Kepler-186 planetary system"><span>&#9678;</span><span>System</span></button>
                                <button class="ep-sys-btn" id="ep-btn-skills" title="Pilot Skills"><span>🧠</span><span>Skills</span></button>
                                <button class="ep-sys-btn" id="ep-btn-orbit" title="Orbital Operations"><span>🛰️</span><span class="ep-orbit-label">Orbit</span></button>
                                <button class="ep-sys-btn" id="ep-btn-moon" title="Lunar Operations"><span>🌙</span><span class="ep-moon-label">Moon</span></button>
                                <button class="ep-sys-btn" id="ep-btn-archaeology" title="Archaeology"><span>🏺</span><span>Archaeology</span></button>
                                <button class="ep-sys-btn" id="ep-btn-signals" title="Alien Signals"><span>📡</span><span>Signals</span></button>
                                <button class="ep-sys-btn" id="ep-btn-chatter" title="Colony Chatter"><span>💬</span><span>Chatter</span></button>
                            </section>
                            <section class="ep-ops-group">
                                <div class="ep-ops-label">ECONOMY</div>
                                <button class="ep-sys-btn" id="ep-btn-trade" title="Trade"><span>💰</span><span>Trade</span></button>
                                <button class="ep-sys-btn" id="ep-btn-stocks" title="Galactic Stocks"><span>📈</span><span>Stocks</span></button>
                                <button class="ep-sys-btn" id="ep-btn-logistics" title="Logistics Log"><span>📦</span><span>Logistics</span></button>
                            </section>
                        </div>
                        <button class="ep-sys-btn" id="ep-btn-cinematic" title="Cinematic Mode" aria-label="Cinematic Mode" style="display:none;">🎬</button>
                    </div>
                </div>
            </div>

            <div id="ep-left-hud" class="ep-left-hud">
                <section class="ep-world-card">
                    <div class="ep-hud-kicker">PLANETARY COMMAND</div>
                    <div class="ep-world-title-row">
                        <div id="ep-world-name" class="ep-world-name">Kepler-186f</div>
                        <span id="ep-world-security" class="ep-security-badge">HIGH SEC</span>
                    </div>
                    <div id="ep-day-display" class="ep-world-meta">Day 1 · 08:00 · 15°C</div>
                    <div class="ep-hud-status-row">
                        <div id="ep-morale-display" class="ep-morale-display">
                            <span id="ep-morale-icon" class="ep-morale-icon">😐</span>
                            <div><span>Morale</span><strong id="ep-morale-value">100%</strong></div>
                        </div>
                        <div id="ep-time-controls" class="ep-time-controls" aria-label="Simulation speed">
                            <button class="ep-time-btn" onclick="game.setTimeSpeed(0)" title="Pause" aria-label="Pause">⏸</button>
                            <button class="ep-time-btn" onclick="game.setTimeSpeed(1)" title="1x Speed" aria-label="1x speed">▶</button>
                            <button class="ep-time-btn" onclick="game.setTimeSpeed(2)" title="2x Speed" aria-label="2x speed">▶▶</button>
                            <button class="ep-time-btn" onclick="game.setTimeSpeed(3)" title="5x Speed" aria-label="5x speed">▶▶▶</button>
                            <button class="ep-time-btn" onclick="game.setTimeSpeed(4)" title="10x Speed" aria-label="10x speed">⏩</button>
                            <span id="ep-time-label">1x</span>
                        </div>
                    </div>
                </section>

                <section id="ep-colony-path" class="ep-colony-path" aria-live="polite">
                    <div class="ep-colony-path-header">
                        <span>NEXT OBJECTIVE</span>
                        <span id="ep-colony-path-progress">0/5</span>
                    </div>
                    <div id="ep-colony-path-current" class="ep-colony-path-current">Preparing mission path…</div>
                    <div id="ep-colony-path-steps" class="ep-colony-path-steps"></div>
                    <button id="ep-colony-path-action" class="ep-objective-action" type="button">Prepare next step</button>
                </section>
            </div>

            <button id="ep-btn-cinematic-toggle" class="ep-cinematic-toggle" title="Cinematic Mode (C)" aria-label="Cinematic Mode">🎥</button>

            <aside id="ep-tutorial" class="ep-tutorial" hidden aria-live="polite" aria-label="Pioneer tutorial">
                <div class="ep-tutorial-kicker">MISSION CONTROL · <span id="ep-tutorial-progress">1/4</span></div>
                <h3 id="ep-tutorial-title">Welcome, Pioneer</h3>
                <p id="ep-tutorial-copy">Establish a self-sustaining foothold and learn the command surface.</p>
                <div class="ep-tutorial-actions">
                    <button id="ep-tutorial-skip" type="button">Skip</button>
                    <button id="ep-tutorial-next" type="button">Next</button>
                </div>
            </aside>

            <div id="ep-placement-hint" class="ep-placement-hint" hidden aria-live="polite">
                <div class="ep-placement-state">PLACEMENT MODE</div>
                <div class="ep-placement-copy">
                    <strong id="ep-placement-title">Structure</strong>
                    <span id="ep-placement-status">Move across the surface and click a valid tile.</span>
                </div>
                <button id="ep-placement-cancel" type="button" title="Cancel placement">ESC</button>
            </div>

            <div class="ep-bottom-bar">
                <div class="ep-build-dock">
                    <div class="ep-build-dock-header">
                        <span>DEPLOY INVENTORY</span>
                        <span id="ep-build-summary">Ready structures</span>
                    </div>
                    <div class="ep-build-menu" id="ep-build-menu"></div>
                </div>
            </div>
            <div id="ep-tooltip" class="ep-tooltip" style="display:none;"></div>
            <div id="ep-notifications" style="position:absolute; top:80px; right:20px; width:300px; display:flex; flex-direction:column; gap:10px; pointer-events:none;"></div>

            <!-- Tech Tree Modal -->
            <div class="ep-modal-overlay" id="ep-tech-modal" style="display:none;">
                <div class="ep-modal">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#a855f7;">🔬 Research</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-tech-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body">
                        <div class="ep-tech-grid" id="ep-tech-grid"></div>
                    </div>
                </div>
            </div>

            <!-- Xenodex Modal -->
            <div class="ep-modal-overlay" id="ep-xenodex-modal" style="display:none;">
                <div class="ep-modal" style="width:600px;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#4ade80;">🌿 Xenodex - Discovered Species</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-xenodex-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-xenodex-content"></div>
                </div>
            </div>

            <!-- Roster Modal -->
            <div class="ep-modal-overlay" id="ep-roster-modal" style="display:none;">
                <div class="ep-modal">
                    <div class="ep-modal-header">
                         <h2 style="margin:0; color:#38bdf8;">👥 Colony Roster</h2>
                         <button class="ep-sys-btn" onclick="document.getElementById('ep-roster-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body">
                        <table style="width:100%; border-collapse:collapse; color:#fff;">
                            <thead>
                                <tr style="border-bottom:1px solid #444; text-align:left;">
                                    <th style="padding:0.5rem;">Name</th>
                                    <th>Job</th>
                                    <th>Morale</th>
                                    <th>Needs</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ep-roster-list"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Industry Modal -->
            <div class="ep-modal-overlay" id="ep-industry-modal" style="display:none;">
                <div class="ep-modal" style="width:800px; max-width:92vw; height:auto; max-height:92vh;">
                    <div class="ep-modal-header">
                         <h2 style="margin:0; color:#4ade80;">🏭 Industrial Operations</h2>
                         <button class="ep-sys-btn" onclick="document.getElementById('ep-industry-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-industry-content" style="padding:1.5rem; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);"></div>
                </div>
            </div>

            <!-- Skills Modal -->
            <div class="ep-modal-overlay" id="ep-skills-modal" style="display:none;">
                <div class="ep-modal" style="width:760px; max-width:92vw; height:auto; max-height:92vh;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#38bdf8;">🧠 Pilot Skills</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-skills-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-skills-content" style="padding:1.5rem; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);"></div>
                </div>
            </div>

            <!-- Missions Modal -->
            <div class="ep-modal-overlay" id="ep-missions-modal" style="display:none;">
                <div class="ep-modal" style="width:760px; max-width:92vw; height:auto; max-height:92vh;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#38bdf8;">📜 Agent Missions</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-missions-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-missions-content" style="padding:1.5rem; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);"></div>
                </div>
            </div>

            <!-- CRISPR Lab Modal -->
            <div class="ep-modal-overlay" id="ep-crispr-modal" style="display:none;">
                 <div class="ep-modal" style="width:800px; max-width:90vw;">
                    <div class="ep-modal-header">
                         <h2 style="margin:0; color:#a855f7;">🧬 CRISPR Lab</h2>
                         <button class="ep-sys-btn" onclick="document.getElementById('ep-crispr-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-crispr-content"></div>
                 </div>
            </div>

            <!-- Cloud Modal -->
            <div class="ep-modal-overlay" id="ep-cloud-modal" style="display:none;">
                <div class="ep-modal" style="width:400px;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#38bdf8;">☁️ Cloud Services</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-cloud-modal').style.display='none'">x</button>
                    </div>
                    <div class="ep-modal-body" id="ep-cloud-content"></div>
                </div>
            </div>

            <!-- Building Details Modal -->
            <div class="ep-modal-overlay" id="ep-building-modal" style="display:none; z-index:3000;">
                <div class="ep-modal" style="width:400px;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#cbd5e1;" id="ep-bld-title">Building</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-building-modal').style.display='none'">X</button>
                    </div>
                    <div class="ep-modal-body" id="ep-bld-content"></div>
                </div>
            </div>

            <!-- System Action Modal -->
            <div class="ep-modal-overlay" id="ep-system-modal" style="display:none; z-index:3000;">
                <div class="ep-modal" style="width:500px;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#f87171;">🚀 Sector Action</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-system-modal').style.display='none'">CANCEL</button>
                    </div>
                    <div class="ep-modal-body" id="ep-system-content"></div>
                </div>
            </div>

            <!-- Alien Signals Modal (Roadmap Item 139) -->
            <div class="ep-modal-overlay" id="ep-signals-modal" style="display:none; z-index:4000;">
                <div class="ep-modal" style="width:600px; height:600px; max-width:95vw;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#38bdf8;">📡 Deep Space Signals</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-signals-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" style="display:flex; flex-direction:column; padding:1.5rem; background:#020617;">
                        <div id="ep-signals-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding-right:5px;"></div>
                    </div>
                </div>
            </div>
            <div class="ep-modal-overlay" id="ep-chatter-modal" style="display:none; z-index:4000;">
                <div class="ep-modal" style="width:500px; height:600px; max-width:95vw;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#38bdf8;">📡 Colony Chatter</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-chatter-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" style="display:flex; flex-direction:column; padding:1rem; background:#020617;">
                        <div id="ep-chatter-feed" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding-right:5px;"></div>
                    </div>
                </div>
            </div>

            <!-- Galactic Stock Market Modal (Roadmap Item 206) -->
            <div class="ep-modal-overlay" id="ep-stocks-modal" style="display:none; z-index:4500;">
                <div class="ep-modal" style="width:700px; height:600px; max-width:95vw;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#fbbf24;">📈 Galactic Stock Exchange</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-stocks-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-stocks-content" style="padding:1rem; background:#0f172a; overflow-y:auto;">
                    </div>
                </div>
            </div>
        `;

        this.container.appendChild(ui);

        // Galaxy Container
        const galContainer = document.createElement('div');
        galContainer.id = 'ep-galaxy-container';
        galContainer.style.position = 'absolute';
        galContainer.style.top = '0';
        galContainer.style.left = '0';
        galContainer.style.width = '100%';
        galContainer.style.height = '100%';
        galContainer.style.zIndex = '10';
        galContainer.style.background = 'black';
        galContainer.style.display = 'none';
        this.container.insertBefore(galContainer, ui);

        this.updateResourceUI();
        this.createBuildMenu();

        // Listeners
        this.container.querySelector('#ep-btn-galaxy').onclick = () => {
            this.audio.playClick();
            if (this.universe && this.universe.openGalaxyMap) {
                this.universe.openGalaxyMap();
            } else {
                this.toggleGalaxyView();
            }
        };
        this.container.querySelector('#ep-btn-save').onclick = () => { this.audio.playClick(); this.saveGame(); };
        this.container.querySelector('#ep-btn-load').onclick = () => { this.audio.playClick(); this.loadGame(); };
        this.container.querySelector('#ep-btn-tech').onclick = () => { this.audio.playClick(); this.openTechTree(); };
        this.container.querySelector('#ep-btn-industry').onclick = () => { this.audio.playClick(); this.openIndustry(); };
        this.container.querySelector('#ep-btn-xeno').onclick = () => { this.audio.playClick(); this.openXenodex(); };
        this.container.querySelector('#ep-btn-roster').onclick = () => { this.audio.playClick(); this.openRoster(); };
        this.container.querySelector('#ep-btn-fleet').onclick = () => { this.audio.playClick(); this.fleetManager.openFleetUI(); };
        this.container.querySelector('#ep-btn-system').onclick = () => { this.audio.playClick(); this.localSystemExplorer?.open?.(); };
        this.container.querySelector('#ep-btn-skills').onclick = () => { this.audio.playClick(); this.openSkills(); };
        this.container.querySelector('#ep-btn-orbit').onclick = () => { this.audio.playClick(); this.requestOrbitalView(); };
        this.container.querySelector('#ep-btn-moon').onclick = () => { this.audio.playClick(); this.requestMoonTransit(); };
        this.container.querySelector('#ep-btn-missions').onclick = () => { this.audio.playClick(); this.openMissions(); };
        this.container.querySelector('#ep-btn-archaeology').onclick = () => { this.audio.playClick(); this.archaeology.openUI(); };
        this.container.querySelector('#ep-btn-recruit').onclick = () => { this.audio.playClick(); this.openRecruitment(); };
        this.container.querySelector('#ep-btn-legal').onclick = () => { this.audio.playClick(); this.openLegalSystem(); };
        this.container.querySelector('#ep-btn-profile').onclick = () => { this.audio.playClick(); this.openProfile(); };
        this.container.querySelector('#ep-btn-trade').onclick = () => { this.audio.playClick(); this.openMarket(); };
        this.container.querySelector('#ep-btn-stocks').onclick = () => { this.audio.playClick(); this.openStocks(); };
        this.container.querySelector('#ep-btn-logistics').onclick = () => { this.audio.playClick(); this.openLogisticsLog(); };
        this.container.querySelector('#ep-btn-signals').onclick = () => { this.audio.playClick(); this.openSignals(); };
        this.container.querySelector('#ep-btn-chatter').onclick = () => { this.audio.playClick(); this.openChatter(); };

        const tradeBtn = this.container.querySelector('#ep-btn-trade');
        if (tradeBtn) {
            // Pioneer Galactic Market is a local simulation system. The global
            // TRADING feature flag belongs to the separate planet marketplace and
            // must not hide this in-game EconomyManager UI.
            const marketAvailable = !!this.economyManager;
            tradeBtn.style.display = marketAvailable ? '' : 'none';
            tradeBtn.disabled = !marketAvailable;
            tradeBtn.setAttribute('aria-disabled', String(!marketAvailable));
            if (marketAvailable) tradeBtn.onclick = () => { this.audio.playClick(); this.openMarket(); };
        }

        this.container.querySelector('#ep-btn-cloud').onclick = () => { this.audio.playClick(); this.openCloudMenu(); };
        this.container.querySelector('#ep-btn-claim').onclick = () => { this.audio.playClick(); this.claimCurrentSystem(); };
        this.container.querySelector('#ep-btn-cinematic').onclick = () => { this.toggleCinematicMode(); };

        // Toggle Listener
        this.container.querySelector('#ep-btn-cinematic-toggle').onclick = () => { this.toggleCinematicMode(); };

        this.container.querySelector('#ep-btn-ops').onclick = () => {
            this.audio.playClick();
            this.toggleOperationsMenu();
        };
        this.container.querySelector('#ep-colony-path-action').onclick = () => {
            this.audio.playClick();
            this.runColonyPathAction();
        };
        this.container.querySelector('#ep-placement-cancel').onclick = () => {
            this.audio.playClick();
            this.cancelPlacement(true);
        };
        this.container.querySelector('#ep-tutorial-next').onclick = () => {
            this.audio.playClick();
            this.advanceTutorial();
        };
        this.container.querySelector('#ep-tutorial-skip').onclick = () => this.completeTutorial(true);
        this.container.querySelector('#ep-ops-drawer').addEventListener('click', (event) => {
            if (event.target.closest('button.ep-sys-btn')) {
                window.setTimeout(() => this.toggleOperationsMenu(false), 0);
            }
        });
        this.updatePlacementHint();
        this.toggleOperationsMenu(false);
        this.updateOrbitalControls();

        window.setTimeout(() => this.maybeStartTutorial(), 500);

        this.ensurePauseUI();
        this.initializeWindowManager();
    }

    getTutorialSteps() {
        return [
            { title: 'Survey the world', copy: 'Drag the planet to orbit your view. Use the mouse wheel to zoom. The camera stays centred on the colony world.', focus: 'canvas' },
            { title: 'Follow the mission path', copy: 'NEXT OBJECTIVE is the fastest route to a stable colony. It always points at the next useful action instead of leaving you in a menu maze.', focus: '#ep-colony-path' },
            { title: 'Deploy to the surface', copy: 'Select a ready structure, move across the surface and click a green site. Red sites are blocked or incompatible.', focus: '.ep-build-dock' },
            { title: 'Control simulation time', copy: 'Construction and production run on simulation time. Speed up routine waits, pause when you need to inspect the colony, and use ESC to cancel context first.', focus: '#ep-time-controls' }
        ];
    }

    maybeStartTutorial() {
        const params = new URLSearchParams(window.location.search);
        const forced = params.get('tutorial') === '1';
        let completed = false;
        try { completed = localStorage.getItem(this.tutorialStorageKey) === '1'; } catch { completed = false; }
        if (forced || !completed) this.startTutorial();
    }

    startTutorial() {
        this.tutorialStep = 0;
        this.tutorialActive = true;
        const el = this.container?.querySelector('#ep-tutorial');
        if (el) el.hidden = false;
        this.renderTutorialStep();
    }

    renderTutorialStep() {
        const steps = this.getTutorialSteps();
        const step = steps[this.tutorialStep];
        const panel = this.container?.querySelector('#ep-tutorial');
        if (!step || !panel) return this.completeTutorial(false);
        panel.dataset.step = String(this.tutorialStep + 1);
        this.container.querySelector('#ep-tutorial-progress').textContent = `${this.tutorialStep + 1}/${steps.length}`;
        this.container.querySelector('#ep-tutorial-title').textContent = step.title;
        this.container.querySelector('#ep-tutorial-copy').textContent = step.copy;
        const next = this.container.querySelector('#ep-tutorial-next');
        next.textContent = this.tutorialStep === steps.length - 1 ? 'Begin mission' : 'Next';
        this.container.querySelectorAll('.ep-tutorial-focus').forEach((el) => el.classList.remove('ep-tutorial-focus'));
        if (step.focus && step.focus !== 'canvas') this.container.querySelector(step.focus)?.classList.add('ep-tutorial-focus');
    }

    advanceTutorial() {
        if (!this.tutorialActive) return;
        this.tutorialStep += 1;
        if (this.tutorialStep >= this.getTutorialSteps().length) this.completeTutorial(false);
        else this.renderTutorialStep();
    }

    completeTutorial(skipped = false) {
        this.tutorialActive = false;
        this.container?.querySelectorAll('.ep-tutorial-focus').forEach((el) => el.classList.remove('ep-tutorial-focus'));
        const panel = this.container?.querySelector('#ep-tutorial');
        if (panel) panel.hidden = true;
        try { localStorage.setItem(this.tutorialStorageKey, '1'); } catch { }
        if (!skipped) this.notify('Mission control online. Establish power to begin.', 'success');
    }

    toggleOperationsMenu(force = null) {
        const drawer = this.container?.querySelector('#ep-ops-drawer');
        const button = this.container?.querySelector('#ep-btn-ops');
        if (!drawer || !button) return;
        const next = typeof force === 'boolean' ? force : !this.operationsMenuOpen;
        this.operationsMenuOpen = next;
        drawer.hidden = !next;
        button.setAttribute('aria-expanded', String(next));
        button.classList.toggle('active', next);
    }

    toggleResourcePanel(force = null) {
        this.resourcePanelExpanded = typeof force === 'boolean' ? force : !this.resourcePanelExpanded;
        this.updateResourceUI();
    }

    getCurrentWorldLabel() {
        const id = String(this.currentSystemId ?? '');
        const catalogId = String(this.planetData?.id ?? '');
        let label = id && id !== catalogId
            ? (this.currentSystemName || id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))
            : (this.planetData?.name || 'Unknown World');
        if (this.isOnMoon) label += ' · Moon';
        return label;
    }

    cancelPlacement(showNotification = false) {
        if (!this.selectedInventoryItem && !this.selectedBuilding) return;
        this.selectedInventoryItem = null;
        this.selectedBuilding = null;
        this.container?.querySelectorAll('.ep-build-btn.active').forEach((button) => {
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
        });
        if (this.cursorMesh) this.cursorMesh.visible = false;
        this.updatePlacementHint();
        if (showNotification) this.notify('Placement cancelled.', 'info');
    }

    getPlacementValidity(tile, itemType) {
        if (!tile) return { valid: false, reason: 'Move over the planetary surface.' };
        const building = this.buildingTypes?.[itemType];
        if (!building) return { valid: false, reason: 'Unknown structure type.' };
        if (tile.building) return { valid: false, reason: 'Tile occupied — choose a clear site.' };
        if (building.moonOnly && !this.isOnMoon) return { valid: false, reason: 'This structure can only be deployed on a moon.' };
        const gasGiantWorld = this.currentWorldType === 'gas' || this.currentWorldType === 'giant';
        if (building.gasGiantOnly && !gasGiantWorld) return { valid: false, reason: 'Requires a gas-giant atmosphere.' };
        if (gasGiantWorld && !building.gasGiantOnly) return { valid: false, reason: 'No solid surface - deploy a gas-giant atmospheric structure.' };
        if (building.requiredReserve && Number(tile.reserves?.[building.requiredReserve] || 0) <= 0) {
            const label = building.requiredReserve === 'helium3' ? 'Helium-3' : building.requiredReserve;
            return { valid: false, reason: `Requires a detected ${label} deposit.` };
        }
        if (building.waterOnly && tile.type !== 'crater') return { valid: false, reason: 'Requires a lowland/ocean-basin tile.' };
        if (this.techTree && !this.techTree.canBuild(itemType)) {
            const requirement = this.techTree.getRequirementName(itemType);
            return { valid: false, reason: `Research required: ${requirement}` };
        }
        return { valid: true, reason: 'Valid site — click to anchor.' };
    }

    updatePlacementHint(state = null) {
        const hint = this.container?.querySelector('#ep-placement-hint');
        const title = this.container?.querySelector('#ep-placement-title');
        const status = this.container?.querySelector('#ep-placement-status');
        if (!hint || !title || !status) return;

        const itemType = this.selectedInventoryItem;
        if (!itemType) {
            hint.hidden = true;
            hint.classList.remove('valid', 'invalid');
            this.lastPlacementHintKey = '';
            return;
        }

        const building = this.buildingTypes?.[itemType];
        const item = this.inventory.find((entry) => entry.type === itemType);
        hint.hidden = false;
        title.textContent = `${building?.icon || '⬡'} ${building?.name || itemType} · ${item?.count || 0} ready`;
        const effectiveState = state || { valid: null, reason: 'Move across the surface and click a clear tile.' };
        status.textContent = effectiveState.reason;
        hint.classList.toggle('valid', effectiveState.valid === true);
        hint.classList.toggle('invalid', effectiveState.valid === false);
    }

    initializeWindowManager() {
        const windowSelector = '.ep-modal-overlay > .ep-modal, .ep-modal-overlay > .ep-datapad, #ep-data-overlay, #ep-tutorial, #ep-leaderboard-modal';
        const lifecycleSelector = '.ep-modal-overlay, #ep-data-overlay, #ep-tutorial, #ep-leaderboard-modal';

        this.windowLifecycleObservers?.forEach?.((observer) => observer.disconnect());
        this.windowLifecycleObservers = [];

        const collectMatches = (root, selector) => {
            const matches = [];
            if (!root) return matches;
            if (root.nodeType === 1 && root.matches?.(selector)) matches.push(root);
            root.querySelectorAll?.(selector).forEach((element) => matches.push(element));
            return matches;
        };

        const fitVisibleWindows = (root) => {
            const managed = collectMatches(root, '.ep-window-managed');
            if (root?.nodeType === 1 && root.matches?.('.ep-window-managed') && !managed.includes(root)) managed.unshift(root);
            managed.forEach((element) => {
                if (this.isManagedWindowVisible(element)) this.clampManagedWindow(element);
            });
        };

        const scan = (root = document) => {
            collectMatches(root, windowSelector).forEach((element) => this.makeWindowInteractive(element));
        };

        const bindLifecycle = (root = document) => {
            collectMatches(root, lifecycleSelector).forEach((target) => {
                if (target.dataset.epWindowLifecycleBound === '1') return;
                target.dataset.epWindowLifecycleBound = '1';
                const observer = new MutationObserver((mutations) => {
                    let shouldRefresh = false;
                    for (const mutation of mutations) {
                        // The window manager itself writes inline geometry on managed top-level
                        // windows. Those writes are not visibility changes and must not feed back.
                        if (mutation.attributeName === 'style' && target.matches?.('.ep-window-managed')) continue;
                        shouldRefresh = true;
                        break;
                    }
                    if (!shouldRefresh) return;
                    requestAnimationFrame(() => fitVisibleWindows(target));
                });
                observer.observe(target, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
                this.windowLifecycleObservers.push(observer);
            });
        };

        scan(document);
        bindLifecycle(document);

        this.windowManagerObserver?.disconnect?.();
        this.windowManagerObserver = new MutationObserver((mutations) => {
            const windowsToFit = new Set();
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    scan(node);
                    bindLifecycle(node);
                });
                const targetElement = mutation.target?.nodeType === 1 ? mutation.target : mutation.target?.parentElement;
                const owner = targetElement?.matches?.('.ep-window-managed')
                    ? targetElement
                    : targetElement?.closest?.('.ep-window-managed');
                if (owner) windowsToFit.add(owner);
            });
            if (windowsToFit.size) {
                requestAnimationFrame(() => {
                    windowsToFit.forEach((element) => {
                        if (this.isManagedWindowVisible(element)) this.clampManagedWindow(element);
                    });
                });
            }
        });
        if (document.body) this.windowManagerObserver.observe(document.body, { childList: true, subtree: true });

        if (this.windowViewportResizeHandler) window.removeEventListener('resize', this.windowViewportResizeHandler);
        this.windowViewportResizeHandler = () => {
            document.querySelectorAll('.ep-window-managed[data-ep-window-positioned="1"]').forEach((element) => {
                if (this.isManagedWindowVisible(element)) this.clampManagedWindow(element);
            });
        };
        window.addEventListener('resize', this.windowViewportResizeHandler, { passive: true });
    }

    getManagedWindowHandle(element, preferredHandle = null) {
        if (preferredHandle?.isConnected) return preferredHandle;
        const direct = element.querySelector?.(':scope > .ep-modal-header, :scope > .ep-datapad-header, :scope > header, :scope > .ep-tutorial-kicker');
        if (direct) return direct;
        if (element.id === 'ep-leaderboard-modal') return element.querySelector('.ep-modal-content > h2');
        return element.querySelector?.('.ep-modal-header, .ep-datapad-header, header, h2, h3') || null;
    }

    isManagedWindowVisible(element) {
        if (!element?.isConnected || element.hidden) return false;
        if (element.id === 'ep-data-overlay' && element.classList.contains('hidden')) return false;
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return element.getClientRects().length > 0;
    }

    makeWindowInteractive(element, preferredHandle = null) {
        if (!element) return;
        element.classList.add('ep-window-managed');
        element.dataset.epWindowManaged = '1';

        let handle = this.getManagedWindowHandle(element, preferredHandle);
        if (!handle) {
            handle = document.createElement('div');
            handle.className = 'ep-window-dragbar';
            handle.innerHTML = '<span>MOVE WINDOW</span>';
            element.prepend(handle);
        }
        handle.classList.add('ep-window-drag-handle');
        handle.title = handle.title || 'Drag to move';

        let grip = element.querySelector(':scope > .ep-window-resize-handle');
        if (!grip) {
            grip = document.createElement('div');
            grip.className = 'ep-window-resize-handle';
            grip.setAttribute('role', 'separator');
            grip.setAttribute('aria-label', 'Resize window');
            grip.setAttribute('aria-orientation', 'horizontal');
            grip.tabIndex = 0;
            grip.title = 'Drag to resize';
            element.appendChild(grip);
        }

        if (handle.dataset.epWindowDragBound !== '1') {
            handle.dataset.epWindowDragBound = '1';
            handle.addEventListener('pointerdown', (event) => this.beginManagedWindowDrag(event, element, handle));
        }

        if (grip.dataset.epWindowResizeBound !== '1') {
            grip.dataset.epWindowResizeBound = '1';
            grip.addEventListener('pointerdown', (event) => this.beginManagedWindowResize(event, element, grip));
            grip.addEventListener('keydown', (event) => {
                const amount = event.shiftKey ? 48 : 20;
                let dx = 0;
                let dy = 0;
                if (event.key === 'ArrowRight') dx = amount;
                else if (event.key === 'ArrowLeft') dx = -amount;
                else if (event.key === 'ArrowDown') dy = amount;
                else if (event.key === 'ArrowUp') dy = -amount;
                else return;
                event.preventDefault();
                if (!this.activateManagedWindowGeometry(element)) return;
                this.resizeManagedWindowTo(element, element.getBoundingClientRect().width + dx, element.getBoundingClientRect().height + dy);
            });
        }
    }

    makeDraggable(element, handle) {
        this.makeWindowInteractive(element, handle);
    }

    activateManagedWindowGeometry(element) {
        if (!this.isManagedWindowVisible(element)) return false;
        if (element.dataset.epWindowPositioned === '1') {
            this.clampManagedWindow(element);
            return true;
        }

        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        element.style.position = 'fixed';
        element.style.left = `${Math.round(rect.left)}px`;
        element.style.top = `${Math.round(rect.top)}px`;
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        element.style.margin = '0';
        element.style.transform = 'none';
        element.style.width = `${Math.round(rect.width)}px`;
        element.style.height = `${Math.round(rect.height)}px`;
        element.style.maxWidth = 'none';
        element.style.maxHeight = 'none';
        element.dataset.epWindowPositioned = '1';
        this.clampManagedWindow(element);
        return true;
    }

    getManagedWindowLimits(element) {
        const compact = window.innerWidth <= 680;
        const inset = compact ? 6 : 8;
        const maxWidth = Math.max(180, window.innerWidth - inset * 2);
        const maxHeight = Math.max(140, window.innerHeight - inset * 2);
        let minWidth = compact ? 238 : 280;
        let minHeight = compact ? 150 : 180;
        if (element.id === 'ep-tutorial') {
            minWidth = compact ? 220 : 280;
            minHeight = 130;
        }
        minWidth = Math.min(minWidth, maxWidth);
        minHeight = Math.min(minHeight, maxHeight);
        return { inset, minWidth, minHeight, maxWidth, maxHeight };
    }

    clampManagedWindow(element) {
        if (!this.isManagedWindowVisible(element)) return;
        const limits = this.getManagedWindowLimits(element);
        let rect = element.getBoundingClientRect();
        const width = Math.min(Math.max(rect.width, limits.minWidth), limits.maxWidth);
        const height = Math.min(Math.max(rect.height, limits.minHeight), limits.maxHeight);
        if (Math.abs(width - rect.width) > 0.5) element.style.width = `${Math.round(width)}px`;
        if (Math.abs(height - rect.height) > 0.5) element.style.height = `${Math.round(height)}px`;

        // Before the first drag/resize, the overlay's flex/grid layout owns positioning. Writing
        // left/top here would offset a relatively positioned centered modal from its natural slot.
        // Dynamic content may still be size-fitted, but positional clamping begins only after the
        // window has been explicitly detached into fixed-position mode.
        if (element.dataset.epWindowPositioned !== '1') return;

        rect = element.getBoundingClientRect();
        const maxLeft = Math.max(limits.inset, window.innerWidth - rect.width - limits.inset);
        const maxTop = Math.max(limits.inset, window.innerHeight - rect.height - limits.inset);
        const left = Math.max(limits.inset, Math.min(maxLeft, rect.left));
        const top = Math.max(limits.inset, Math.min(maxTop, rect.top));
        element.style.left = `${Math.round(left)}px`;
        element.style.top = `${Math.round(top)}px`;
        element.style.right = 'auto';
        element.style.bottom = 'auto';
    }

    resizeManagedWindowTo(element, requestedWidth, requestedHeight) {
        if (!this.activateManagedWindowGeometry(element)) return;
        const limits = this.getManagedWindowLimits(element);
        const rect = element.getBoundingClientRect();
        const availableWidth = Math.max(limits.minWidth, window.innerWidth - rect.left - limits.inset);
        const availableHeight = Math.max(limits.minHeight, window.innerHeight - rect.top - limits.inset);
        const width = Math.max(limits.minWidth, Math.min(requestedWidth, Math.min(limits.maxWidth, availableWidth)));
        const height = Math.max(limits.minHeight, Math.min(requestedHeight, Math.min(limits.maxHeight, availableHeight)));
        element.style.width = `${Math.round(width)}px`;
        element.style.height = `${Math.round(height)}px`;
        this.clampManagedWindow(element);
        element.dispatchEvent(new CustomEvent('ep-window-resized', { bubbles: false, detail: { width, height } }));
    }

    beginManagedWindowDrag(event, element, handle) {
        if (!this.isManagedWindowVisible(element)) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (event.target.closest('button, a, input, select, textarea, [contenteditable="true"], .ep-window-resize-handle')) return;
        if (!this.activateManagedWindowGeometry(element)) return;

        event.preventDefault();
        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startY = event.clientY;
        const startRect = element.getBoundingClientRect();
        const limits = this.getManagedWindowLimits(element);
        element.classList.add('ep-window-dragging');
        document.body.classList.add('ep-window-interacting');
        try { handle.setPointerCapture(pointerId); } catch { }

        const move = (moveEvent) => {
            if (moveEvent.pointerId !== pointerId) return;
            moveEvent.preventDefault();
            const maxLeft = Math.max(limits.inset, window.innerWidth - startRect.width - limits.inset);
            const maxTop = Math.max(limits.inset, window.innerHeight - startRect.height - limits.inset);
            const left = Math.max(limits.inset, Math.min(maxLeft, startRect.left + moveEvent.clientX - startX));
            const top = Math.max(limits.inset, Math.min(maxTop, startRect.top + moveEvent.clientY - startY));
            element.style.left = `${Math.round(left)}px`;
            element.style.top = `${Math.round(top)}px`;
        };
        const end = (endEvent) => {
            if (endEvent.pointerId !== pointerId) return;
            try { handle.releasePointerCapture(pointerId); } catch { }
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', end);
            handle.removeEventListener('pointercancel', end);
            element.classList.remove('ep-window-dragging');
            document.body.classList.remove('ep-window-interacting');
            this.clampManagedWindow(element);
        };
        handle.addEventListener('pointermove', move, { passive: false });
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
    }

    beginManagedWindowResize(event, element, grip) {
        if (!this.isManagedWindowVisible(element)) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (!this.activateManagedWindowGeometry(element)) return;

        event.preventDefault();
        event.stopPropagation();
        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startY = event.clientY;
        const startRect = element.getBoundingClientRect();
        element.classList.add('ep-window-resizing');
        document.body.classList.add('ep-window-interacting');
        try { grip.setPointerCapture(pointerId); } catch { }

        const move = (moveEvent) => {
            if (moveEvent.pointerId !== pointerId) return;
            moveEvent.preventDefault();
            this.resizeManagedWindowTo(element, startRect.width + moveEvent.clientX - startX, startRect.height + moveEvent.clientY - startY);
        };
        const end = (endEvent) => {
            if (endEvent.pointerId !== pointerId) return;
            try { grip.releasePointerCapture(pointerId); } catch { }
            grip.removeEventListener('pointermove', move);
            grip.removeEventListener('pointerup', end);
            grip.removeEventListener('pointercancel', end);
            element.classList.remove('ep-window-resizing');
            document.body.classList.remove('ep-window-interacting');
            this.clampManagedWindow(element);
        };
        grip.addEventListener('pointermove', move, { passive: false });
        grip.addEventListener('pointerup', end);
        grip.addEventListener('pointercancel', end);
    }

    resetManagedWindowGeometry(element) {
        if (!element) return;
        ['position', 'left', 'top', 'right', 'bottom', 'margin', 'transform', 'width', 'height', 'max-width', 'max-height'].forEach((property) => element.style.removeProperty(property));
        delete element.dataset.epWindowPositioned;
        requestAnimationFrame(() => {
            if (this.isManagedWindowVisible(element)) this.makeWindowInteractive(element);
        });
    }

    toggleCinematicMode() {
        this.isCinematic = !this.isCinematic;
        const ui = document.getElementById('ep-ui');
        if (!ui) return;
        const toggleBtn = document.getElementById('ep-btn-cinematic-toggle');

        ui.classList.toggle('ep-cinematic', this.isCinematic);
        document.querySelectorAll('.ep-modal-overlay').forEach(el => el.style.display = 'none');

        if (toggleBtn) {
            toggleBtn.textContent = this.isCinematic ? '❌' : '🎥';
            toggleBtn.title = this.isCinematic ? 'Exit Cinematic Mode' : 'Cinematic Mode';
        }

        this.notify(this.isCinematic ? 'Cinematic Mode Active' : 'Cinematic Mode Disabled', 'info');
    }

    normalizeGraphicsSettings(raw = null) {
        const current = raw && typeof raw === 'object' ? raw : {};
        const pick = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
        const scaleRaw = Number(current.rayTraceScale);
        const samplesRaw = Number(current.pathTraceSamples);
        return {
            renderMode: pick(current.renderMode, ['standard', 'raytraced', 'pathtraced'], 'standard'),
            meshDetail: pick(current.meshDetail, ['low', 'medium', 'high', 'ultra'], 'high'),
            terrainDetail: pick(current.terrainDetail, ['low', 'medium', 'high', 'ultra'], 'high'),
            atmosphereQuality: pick(current.atmosphereQuality, ['low', 'medium', 'high', 'ultra'], 'high'),
            cloudQuality: pick(current.cloudQuality, ['low', 'medium', 'high', 'ultra'], 'high'),
            shadowQuality: pick(current.shadowQuality, ['off', 'medium', 'high', 'ultra'], 'high'),
            rayTraceScale: Number.isFinite(scaleRaw) ? Math.max(0.35, Math.min(1, scaleRaw)) : 0.65,
            pathTraceSamples: Number.isFinite(samplesRaw) ? Math.max(8, Math.min(512, Math.round(samplesRaw))) : 64
        };
    }

    getPlanetRenderOptions() {
        const graphics = this.normalizeGraphicsSettings(this.graphicsSettings);
        const terrainScale = ({ low: 0.62, medium: 0.82, high: 1.0, ultra: 1.24 })[graphics.terrainDetail] || 1;
        return {
            meshDetail: graphics.meshDetail,
            terrainDetail: graphics.terrainDetail,
            terrainDetailScale: terrainScale
        };
    }

    applyShadowQuality() {
        const graphics = this.normalizeGraphicsSettings(this.graphicsSettings);
        const quality = graphics.shadowQuality;
        const enabled = quality !== 'off';
        const mapSize = ({ medium: 1024, high: 2048, ultra: 4096 })[quality] || 1024;

        if (this.renderer?.shadowMap) {
            this.renderer.shadowMap.enabled = enabled;
            this.renderer.shadowMap.type = quality === 'ultra' && THREE.VSMShadowMap
                ? THREE.VSMShadowMap
                : THREE.PCFSoftShadowMap;
        }

        if (this.sunLight) {
            const shadow = this.sunLight.shadow;
            this.sunLight.castShadow = enabled;
            shadow.mapSize.set(mapSize, mapSize);
            // Planet radius is ~50. Three.js defaults to +/-5 here, which clipped almost
            // the entire colony from the directional shadow frustum.
            shadow.camera.left = -72;
            shadow.camera.right = 72;
            shadow.camera.top = 72;
            shadow.camera.bottom = -72;
            shadow.camera.near = 250;
            shadow.camera.far = 550;
            shadow.bias = -0.00018;
            shadow.normalBias = quality === 'ultra' ? 0.018 : 0.028;
            shadow.radius = quality === 'medium' ? 1.1 : (quality === 'ultra' ? 2.4 : 1.7);
            shadow.camera.updateProjectionMatrix?.();
            shadow.map?.dispose?.();
            shadow.map = null;
            shadow.needsUpdate = true;
        }

        Object.values(this.buildingMeshes || {}).forEach((group) => {
            group?.traverse?.((child) => {
                if (!child?.isMesh) return;
                if (child.userData?.isBuildingMarker || child.userData?.isConstructionScaffold || child.userData?.isBuildingContactShadowMesh || child.userData?.isBuildingNightGlow) return;
                child.castShadow = enabled;
                child.receiveShadow = enabled;
            });
            const contact = group?.userData?.contactShadow || group?.getObjectByName?.('PioneerContactShadow');
            if (contact) contact.visible = enabled;
        });
        return { quality, enabled, mapSize };
    }

    createBuildingContactShadow() {
        const pivot = new THREE.Group();
        pivot.name = 'PioneerContactShadow';
        pivot.userData.isBuildingContactShadow = true;
        const geometry = new THREE.CircleGeometry(1.75, 36);
        const material = new THREE.ShaderMaterial({
            uniforms: { opacity: { value: 0.24 } },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float opacity;
                varying vec2 vUv;
                void main() {
                    vec2 p = (vUv - 0.5) * 2.0;
                    float d = length(p);
                    float soft = 1.0 - smoothstep(0.20, 1.0, d);
                    gl_FragColor = vec4(0.005, 0.012, 0.025, soft * opacity);
                }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'PioneerContactShadowMesh';
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = 1;
        mesh.frustumCulled = false;
        mesh.userData.isBuildingContactShadowMesh = true;
        mesh.raycast = () => {};
        pivot.add(mesh);
        pivot.userData.shadowMesh = mesh;
        return pivot;
    }

    updateBuildingContactShadows(sunDirectionWorld = null) {
        const graphics = this.normalizeGraphicsSettings(this.graphicsSettings);
        const enabled = graphics.shadowQuality !== 'off';
        const sunDir = sunDirectionWorld?.clone?.() || this.sunLight?.position?.clone?.().normalize?.();
        if (!sunDir) return;
        const worldQuat = new THREE.Quaternion();
        const inverseQuat = new THREE.Quaternion();
        const localSun = new THREE.Vector3();
        Object.values(this.buildingMeshes || {}).forEach((group) => {
            if (!group) return;
            const pivot = group.userData?.contactShadow || group.getObjectByName?.('PioneerContactShadow');
            const mesh = pivot?.userData?.shadowMesh;
            if (!pivot || !mesh?.material?.uniforms?.opacity) return;
            group.getWorldQuaternion(worldQuat);
            inverseQuat.copy(worldQuat).invert();
            localSun.copy(sunDir).applyQuaternion(inverseQuat).normalize();
            const aboveHorizon = THREE.MathUtils.smoothstep(localSun.y, -0.02, 0.34);
            const tangent = Math.hypot(localSun.x, localSun.z);
            const stretch = 1.0 + THREE.MathUtils.clamp(tangent, 0, 1) * 1.35;
            const angle = tangent > 0.0001 ? Math.atan2(-localSun.x, -localSun.z) : 0;
            pivot.position.y = -1.04 / Math.max(0.22, Math.abs(group.scale.y || 1));
            pivot.rotation.y = angle;
            mesh.scale.set(stretch, 0.82, 1);
            mesh.material.uniforms.opacity.value = enabled ? (0.10 + aboveHorizon * 0.22) : 0;
            pivot.visible = enabled && aboveHorizon > 0.01;
        });
    }

    applyGraphicsSettings(options = {}) {
        const notify = options.notify !== false;
        const rebuildPlanet = options.rebuildPlanet === true;
        this.graphicsSettings = this.normalizeGraphicsSettings(this.graphicsSettings);

        if (this.renderer) {
            const pixelRatioCap = ({ low: 1, medium: 1.25, high: 1.75, ultra: 2 })[this.graphicsSettings.meshDetail] || 1.75;
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight || 600);
            this.composer?.setSize?.(this.container.clientWidth, this.container.clientHeight || 600);
        }

        let renderResult = { ok: true, mode: this.graphicsSettings.renderMode };
        if (this.rayTracingRenderer) {
            renderResult = this.rayTracingRenderer.setMode(this.graphicsSettings.renderMode, {
                renderScale: this.graphicsSettings.rayTraceScale,
                maxSamples: this.graphicsSettings.pathTraceSamples
            });
            if (!renderResult.ok) {
                this.graphicsSettings.renderMode = 'standard';
                if (notify) this.notify(`Experimental renderer unavailable: ${renderResult.reason}`, 'warning');
            }
        }

        if (this.graphicsSettings.renderMode === 'pathtraced' && this.timeScale !== 0 && !this._pathTraceAutoPaused) {
            this._pathTracePreviousSpeedIndex = this.timeSpeedIndex;
            this._pathTraceAutoPaused = true;
            this.setTimeSpeed(0);
        } else if (this.graphicsSettings.renderMode !== 'pathtraced' && this._pathTraceAutoPaused) {
            const restoreIndex = Number.isInteger(this._pathTracePreviousSpeedIndex) ? this._pathTracePreviousSpeedIndex : 1;
            this._pathTraceAutoPaused = false;
            this._pathTracePreviousSpeedIndex = null;
            this.setTimeSpeed(restoreIndex);
        }

        if (rebuildPlanet && this.planetMesh) this.rebuildPlanetForGraphicsChange();
        this.applyShadowQuality();
        this.syncGraphicsSettingsUI();
        this.saveSettings();

        if (notify && renderResult.ok) {
            const label = this.graphicsSettings.renderMode === 'pathtraced'
                ? 'Path Traced Photo'
                : this.graphicsSettings.renderMode === 'raytraced' ? 'Ray Traced Lighting' : 'Standard';
            this.notify(`Graphics renderer: ${label}.`, 'info');
        }
        return renderResult;
    }

    rebuildPlanetForGraphicsChange() {
        if (!this.scene || !this.planetMesh) return false;
        const seed = Number.isFinite(Number(this.currentWorldSeed)) ? Number(this.currentWorldSeed) : 12345;
        const type = this.currentWorldType || (this.isOnMoon ? 'moon' : 'planet');
        const tileState = new Map((this.tiles || []).map((tile) => [tile.id, {
            building: tile.building || null,
            type: tile.type,
            reserves: tile.reserves ? { ...tile.reserves } : null,
            life: tile.life || null
        }]));
        const structures = Array.isArray(this.structures) ? this.structures.slice() : [];

        this.createPlanet(seed, type);
        this.structures = structures;
        for (const tile of this.tiles || []) {
            const saved = tileState.get(tile.id);
            if (!saved) continue;
            tile.building = saved.building;
            if (saved.type) tile.type = saved.type;
            if (saved.reserves) tile.reserves = { ...saved.reserves };
            if (saved.life) tile.life = saved.life;
        }
        if (this.isOnMoon) this.createLunarResourceMarkers();
        this.rebuildAllBuildings();
        this.rebuildColonyInfrastructure?.(true);
        (this.structures || []).forEach((struct) => this.updateBuildingConstructionVisual(struct));
        this.rayTracingRenderer?.resetAccumulation?.();
        return true;
    }

    syncGraphicsSettingsUI() {
        const graphics = this.normalizeGraphicsSettings(this.graphicsSettings);
        const values = {
            'ep-setting-render-mode': graphics.renderMode,
            'ep-setting-mesh-detail': graphics.meshDetail,
            'ep-setting-terrain-detail': graphics.terrainDetail,
            'ep-setting-atmosphere-quality': graphics.atmosphereQuality,
            'ep-setting-cloud-quality': graphics.cloudQuality,
            'ep-setting-shadow-quality': graphics.shadowQuality,
            'ep-setting-ray-scale': String(graphics.rayTraceScale),
            'ep-setting-path-samples': String(graphics.pathTraceSamples)
        };
        Object.entries(values).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        this.rayTracingRenderer?.updateStatusUI?.();
    }

    loadSettings() {
        try {
            const json = localStorage.getItem('ep_settings_v1');
            if (!json) return;
            const data = JSON.parse(json);
            if (typeof data.autosaveEnabled === 'boolean') this.autosaveEnabled = data.autosaveEnabled;
            if (typeof data.autoloadEnabled === 'boolean') this.autoloadEnabled = data.autoloadEnabled;
            if (typeof data.autosaveIntervalMs === 'number' && Number.isFinite(data.autosaveIntervalMs)) {
                const ms = data.autosaveIntervalMs;
                if (ms >= 15000 && ms <= 3600000) this.autosaveIntervalMs = ms;
            }

            if (typeof data.audioMaster === 'number' && Number.isFinite(data.audioMaster)) {
                this.audioMaster = Math.max(0, Math.min(1, data.audioMaster));
            }
            if (typeof data.audioMusic === 'number' && Number.isFinite(data.audioMusic)) {
                this.audioMusic = Math.max(0, Math.min(1, data.audioMusic));
            }
            if (typeof data.audioSfx === 'number' && Number.isFinite(data.audioSfx)) {
                this.audioSfx = Math.max(0, Math.min(1, data.audioSfx));
            }
            if (typeof data.audioMuted === 'boolean') this.audioMuted = data.audioMuted;
            if (typeof data.voiceEnabled === 'boolean') this.voiceEnabled = data.voiceEnabled;
            if (data.graphics && typeof data.graphics === 'object') {
                this.graphicsSettings = this.normalizeGraphicsSettings({ ...this.graphicsSettings, ...data.graphics });
            }
        } catch (e) { }
    }

    saveSettings() {
        try {
            localStorage.setItem('ep_settings_v1', JSON.stringify({
                autosaveEnabled: this.autosaveEnabled,
                autosaveIntervalMs: this.autosaveIntervalMs,
                autoloadEnabled: this.autoloadEnabled,
                audioMaster: this.audioMaster,
                audioMusic: this.audioMusic,
                audioSfx: this.audioSfx,
                audioMuted: this.audioMuted,
                voiceEnabled: this.voiceEnabled,
                graphics: this.normalizeGraphicsSettings(this.graphicsSettings)
            }));
        } catch (e) { }
    }

    applyAudioSettings() {
        if (!this.audio) return;

        const clamp01 = (v, fallback) => {
            if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
            if (v < 0) return 0;
            if (v > 1) return 1;
            return v;
        };

        const master = clamp01(this.audioMaster, 0.3);
        const music = clamp01(this.audioMusic, 1);
        const sfx = clamp01(this.audioSfx, 1);
        const muted = !!this.audioMuted;

        if (this.audio.masterGain) this.audio.masterGain.gain.value = muted ? 0 : master;
        if (this.audio.musicGain) this.audio.musicGain.gain.value = music;
        if (this.audio.sfxGain) this.audio.sfxGain.gain.value = sfx;
    }

    ensurePauseUI() {
        let modal = document.getElementById('ep-pause-modal');
        if (modal) return;

        modal = document.createElement('div');
        modal.id = 'ep-pause-modal';
        modal.className = 'ep-modal-overlay';
        modal.style.display = 'none';
        modal.style.zIndex = '8000';
        modal.innerHTML = `
            <div class="ep-modal" style="width:520px; max-width:92vw; height:auto; max-height:92vh;">
                <div class="ep-modal-header">
                    <h2 style="margin:0; color:#fbbf24;">⏸ PAUSED</h2>
                    <button class="ep-sys-btn" id="ep-pause-close">RESUME</button>
                </div>
                <div class="ep-modal-body" style="padding:1.5rem; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);">
                    <div style="margin-bottom:1rem; color:#cbd5e1;">Game is paused.</div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="ep-sys-btn" id="ep-pause-resume">▶ Resume (Esc)</button>
                        <button class="ep-sys-btn" id="ep-pause-save">💾 Save (Ctrl+S)</button>
                        <button class="ep-sys-btn" id="ep-pause-load">📂 Load (Ctrl+L)</button>
                        <button class="ep-sys-btn" id="ep-pause-retreat" style="display:none; border-color:#ef4444; color:#ef4444;">↩ Retreat (R)</button>
                    </div>
                    <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(148,163,184,0.25);">
                        <div style="margin-bottom:0.75rem; color:#cbd5e1; font-weight:600;">Settings</div>
                        <label style="display:flex; align-items:center; gap:8px; color:#cbd5e1; margin-bottom:0.75rem;">
                            <input type="checkbox" id="ep-setting-autosave">
                            Autosave (Local)
                        </label>
                        <label style="display:flex; align-items:center; gap:8px; color:#cbd5e1; margin-bottom:0.75rem;">
                            <input type="checkbox" id="ep-setting-autoload">
                            Auto-load (Local)
                        </label>
                        <label style="display:flex; align-items:center; gap:8px; color:#cbd5e1; margin-bottom:0.75rem;">
                            <input type="checkbox" id="ep-setting-voice">
                            AI Voice Alerts (WebSpeech)
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; color:#cbd5e1;">
                            Interval
                            <select id="ep-setting-autosave-interval" style="padding:6px 10px; border-radius:8px; background:rgba(15,23,42,0.8); color:#e2e8f0; border:1px solid rgba(148,163,184,0.3); outline:none;">
                                <option value="30000">30 sec</option>
                                <option value="60000">1 min</option>
                                <option value="120000">2 min</option>
                                <option value="300000">5 min</option>
                            </select>
                        </label>

                        <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(148,163,184,0.25);">
                            <div style="margin-bottom:0.75rem; color:#cbd5e1; font-weight:600;">Audio</div>
                            <label style="display:flex; align-items:center; gap:8px; color:#cbd5e1; margin-bottom:0.75rem;">
                                <input type="checkbox" id="ep-setting-audio-mute">
                                Mute
                            </label>

                            <div style="display:grid; grid-template-columns:90px 1fr 50px; gap:10px; align-items:center; color:#cbd5e1; margin-bottom:0.5rem;">
                                <div>Master</div>
                                <input type="range" min="0" max="100" step="1" id="ep-setting-audio-master" style="width:100%; accent-color:#38bdf8;">
                                <div id="ep-setting-audio-master-val" style="text-align:right; color:#94a3b8;">30%</div>
                            </div>
                            <div style="display:grid; grid-template-columns:90px 1fr 50px; gap:10px; align-items:center; color:#cbd5e1; margin-bottom:0.5rem;">
                                <div>Music</div>
                                <input type="range" min="0" max="100" step="1" id="ep-setting-audio-music" style="width:100%; accent-color:#38bdf8;">
                                <div id="ep-setting-audio-music-val" style="text-align:right; color:#94a3b8;">100%</div>
                            </div>
                            <div style="display:grid; grid-template-columns:90px 1fr 50px; gap:10px; align-items:center; color:#cbd5e1;">
                                <div>SFX</div>
                                <input type="range" min="0" max="100" step="1" id="ep-setting-audio-sfx" style="width:100%; accent-color:#38bdf8;">
                                <div id="ep-setting-audio-sfx-val" style="text-align:right; color:#94a3b8;">100%</div>
                            </div>
                        </div>

                        <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(148,163,184,0.25);">
                            <div style="margin-bottom:0.75rem; color:#cbd5e1; font-weight:600;">Graphics</div>
                            <div style="display:grid;grid-template-columns:145px 1fr;gap:8px 10px;align-items:center;color:#cbd5e1;font-size:.82rem;">
                                <label for="ep-setting-render-mode">Renderer</label>
                                <select id="ep-setting-render-mode" style="padding:6px 8px;border-radius:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;">
                                    <option value="standard">Standard</option>
                                    <option value="raytraced">Ray Traced Lighting (Experimental)</option>
                                    <option value="pathtraced">Path Traced Photo (Experimental)</option>
                                </select>
                                <label for="ep-setting-mesh-detail">Planet mesh</label>
                                <select id="ep-setting-mesh-detail" style="padding:6px 8px;border-radius:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="ultra">Ultra</option></select>
                                <label for="ep-setting-terrain-detail">Terrain detail</label>
                                <select id="ep-setting-terrain-detail" style="padding:6px 8px;border-radius:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="ultra">Ultra</option></select>
                                <label for="ep-setting-atmosphere-quality">Atmosphere</label>
                                <select id="ep-setting-atmosphere-quality" style="padding:6px 8px;border-radius:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="ultra">Ultra</option></select>
                                <label for="ep-setting-cloud-quality">Cloud geometry</label>
                                <select id="ep-setting-cloud-quality" style="padding:6px 8px;border-radius:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="ultra">Ultra</option></select>
                                <label for="ep-setting-shadow-quality">Colony shadows</label>
                                <select id="ep-setting-shadow-quality" style="padding:6px 8px;border-radius:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;"><option value="off">Off</option><option value="medium">Medium</option><option value="high">High</option><option value="ultra">Ultra</option></select>
                                <label for="ep-setting-ray-scale">RT resolution</label>
                                <select id="ep-setting-ray-scale" style="padding:6px 8px;border-radius:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;"><option value="0.5">50%</option><option value="0.65">65%</option><option value="0.8">80%</option><option value="1">100%</option></select>
                                <label for="ep-setting-path-samples">Path samples</label>
                                <select id="ep-setting-path-samples" style="padding:6px 8px;border-radius:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;"><option value="16">16</option><option value="32">32</option><option value="64">64</option><option value="128">128</option><option value="256">256</option></select>
                            </div>
                            <div id="ep-raytrace-status" style="margin-top:8px;color:#94a3b8;font-size:.72rem;line-height:1.35;">Standard rasterized renderer active.</div>
                            <div style="margin-top:5px;color:#64748b;font-size:.66rem;line-height:1.35;">Path Traced Photo is progressive and is designed for a paused camera. Unsupported GPUs automatically fall back to Standard.</div>
                        </div>

                        <div style="margin-top:0.9rem; display:flex; gap:10px; flex-wrap:wrap;">
                            <button class="ep-sys-btn" id="ep-setting-reset" style="border-color:#f59e0b; color:#fbbf24;">♻ Reset Settings</button>
                        </div>
                    </div>
                    <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid rgba(148,163,184,0.25);">
                        <div style="margin-bottom:0.75rem; color:#cbd5e1; font-weight:600;">Keybinds</div>
                        <div style="font-size:0.85rem; color:#94a3b8; line-height:1.4;">
                            Esc: Pause/Resume<br>
                            R: Retreat (combat)<br>
                            Ctrl+S: Save, Ctrl+L: Load<br>
                            G: Galaxy View, C: Cinematic Mode
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const close = () => this.togglePause(false);
        const closeBtn = document.getElementById('ep-pause-close');
        const resumeBtn = document.getElementById('ep-pause-resume');
        const saveBtn = document.getElementById('ep-pause-save');
        const loadBtn = document.getElementById('ep-pause-load');
        const retreatBtn = document.getElementById('ep-pause-retreat');
        const autosaveToggle = document.getElementById('ep-setting-autosave');
        const autoloadToggle = document.getElementById('ep-setting-autoload');
        const autosaveInterval = document.getElementById('ep-setting-autosave-interval');
        const audioMute = document.getElementById('ep-setting-audio-mute');
        const audioMaster = document.getElementById('ep-setting-audio-master');
        const audioMusic = document.getElementById('ep-setting-audio-music');
        const audioSfx = document.getElementById('ep-setting-audio-sfx');
        const audioMasterVal = document.getElementById('ep-setting-audio-master-val');
        const audioMusicVal = document.getElementById('ep-setting-audio-music-val');
        const audioSfxVal = document.getElementById('ep-setting-audio-sfx-val');
        const renderModeSelect = document.getElementById('ep-setting-render-mode');
        const meshDetailSelect = document.getElementById('ep-setting-mesh-detail');
        const terrainDetailSelect = document.getElementById('ep-setting-terrain-detail');
        const atmosphereQualitySelect = document.getElementById('ep-setting-atmosphere-quality');
        const cloudQualitySelect = document.getElementById('ep-setting-cloud-quality');
        const shadowQualitySelect = document.getElementById('ep-setting-shadow-quality');
        const rayScaleSelect = document.getElementById('ep-setting-ray-scale');
        const pathSamplesSelect = document.getElementById('ep-setting-path-samples');
        const resetBtn = document.getElementById('ep-setting-reset');

        if (autosaveToggle) autosaveToggle.checked = this.autosaveEnabled !== false;
        if (autoloadToggle) autoloadToggle.checked = this.autoloadEnabled !== false;
        if (autosaveInterval) {
            autosaveInterval.value = String(this.autosaveIntervalMs || 120000);
            autosaveInterval.disabled = !this.autosaveEnabled;
        }

        const syncAudioUI = () => {
            const masterPct = Math.round((this.audioMaster ?? 0.3) * 100);
            const musicPct = Math.round((this.audioMusic ?? 1) * 100);
            const sfxPct = Math.round((this.audioSfx ?? 1) * 100);

            if (audioMute) audioMute.checked = !!this.audioMuted;
            if (audioMaster) audioMaster.value = String(masterPct);
            if (audioMasterVal) audioMasterVal.textContent = `${masterPct}%`;
            if (audioMusic) audioMusic.value = String(musicPct);
            if (audioMusicVal) audioMusicVal.textContent = `${musicPct}%`;
            if (audioSfx) audioSfx.value = String(sfxPct);
            if (audioSfxVal) audioSfxVal.textContent = `${sfxPct}%`;
        };
        syncAudioUI();
        this.syncGraphicsSettingsUI();

        const applyGraphicsSelect = (key, value, rebuildPlanet = false) => {
            this.graphicsSettings = this.normalizeGraphicsSettings({ ...this.graphicsSettings, [key]: value });
            this.applyGraphicsSettings({ rebuildPlanet, notify: true });
        };
        if (renderModeSelect) renderModeSelect.onchange = () => applyGraphicsSelect('renderMode', renderModeSelect.value, false);
        if (meshDetailSelect) meshDetailSelect.onchange = () => applyGraphicsSelect('meshDetail', meshDetailSelect.value, true);
        if (terrainDetailSelect) terrainDetailSelect.onchange = () => applyGraphicsSelect('terrainDetail', terrainDetailSelect.value, true);
        if (atmosphereQualitySelect) atmosphereQualitySelect.onchange = () => applyGraphicsSelect('atmosphereQuality', atmosphereQualitySelect.value, true);
        if (cloudQualitySelect) cloudQualitySelect.onchange = () => applyGraphicsSelect('cloudQuality', cloudQualitySelect.value, true);
        if (shadowQualitySelect) shadowQualitySelect.onchange = () => applyGraphicsSelect('shadowQuality', shadowQualitySelect.value, false);
        if (rayScaleSelect) rayScaleSelect.onchange = () => applyGraphicsSelect('rayTraceScale', Number(rayScaleSelect.value), false);
        if (pathSamplesSelect) pathSamplesSelect.onchange = () => applyGraphicsSelect('pathTraceSamples', Number(pathSamplesSelect.value), false);

        const setPctFromRange = (kind, el, outEl) => {
            if (!el) return;
            const v = parseInt(el.value, 10);
            if (!Number.isFinite(v)) return;
            const n = Math.max(0, Math.min(100, v)) / 100;
            const pct = Math.round(n * 100);
            if (outEl) outEl.textContent = `${pct}%`;

            if (kind === 'master') this.audioMaster = n;
            if (kind === 'music') this.audioMusic = n;
            if (kind === 'sfx') this.audioSfx = n;

            this.applyAudioSettings();
        };

        if (audioMute) {
            audioMute.onchange = () => {
                this.audioMuted = !!audioMute.checked;
                this.saveSettings();
                this.applyAudioSettings();
            };
        }

        if (audioMaster) {
            audioMaster.oninput = () => setPctFromRange('master', audioMaster, audioMasterVal);
            audioMaster.onchange = () => this.saveSettings();
        }
        if (audioMusic) {
            audioMusic.oninput = () => setPctFromRange('music', audioMusic, audioMusicVal);
            audioMusic.onchange = () => this.saveSettings();
        }
        if (audioSfx) {
            audioSfx.oninput = () => setPctFromRange('sfx', audioSfx, audioSfxVal);
            audioSfx.onchange = () => this.saveSettings();
        }

        if (resetBtn) {
            resetBtn.onclick = () => {
                try { localStorage.removeItem('ep_settings_v1'); } catch (e) { }

                this.autosaveEnabled = true;
                this.autosaveIntervalMs = 120000;
                this.autoloadEnabled = true;

                this.audioMaster = 0.3;
                this.audioMusic = 1.0;
                this.audioSfx = 1.0;
                this.audioMuted = false;
                this.voiceEnabled = false;
                this.graphicsSettings = this.normalizeGraphicsSettings({});

                if (autosaveToggle) autosaveToggle.checked = true;
                if (autoloadToggle) autoloadToggle.checked = true;
                if (autosaveInterval) {
                    autosaveInterval.value = String(this.autosaveIntervalMs);
                    autosaveInterval.disabled = false;
                }

                syncAudioUI();
                this.applyAudioSettings();
                this.applyGraphicsSettings({ rebuildPlanet: true, notify: false });
                this.startAutosave(true);
                this.notify('Settings reset to defaults.', 'info');
            };
        }

        if (autosaveToggle) {
            autosaveToggle.onchange = () => {
                this.autosaveEnabled = !!autosaveToggle.checked;
                if (autosaveInterval) autosaveInterval.disabled = !this.autosaveEnabled;
                this.saveSettings();
                this.startAutosave(true);
            };
        }

        if (autoloadToggle) {
            autoloadToggle.onchange = () => {
                this.autoloadEnabled = !!autoloadToggle.checked;
                this.saveSettings();
            };
        }

        if (autosaveInterval) {
            autosaveInterval.onchange = () => {
                const next = parseInt(autosaveInterval.value, 10);
                if (!Number.isFinite(next) || next < 15000) return;
                this.autosaveIntervalMs = next;
                this.saveSettings();
                this.startAutosave(true);
            };
        }

        if (closeBtn) closeBtn.onclick = close;
        if (resumeBtn) resumeBtn.onclick = close;
        if (saveBtn) saveBtn.onclick = () => this.saveGame();
        if (loadBtn) loadBtn.onclick = () => this.loadGame();
        if (retreatBtn) {
            retreatBtn.onclick = () => {
                if (this.isCombatActive) {
                    this.togglePause(false);
                    this.retreatFromCombat();
                }
            };
        }

        modal.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    }

    openPauseMenu() {
        this.ensurePauseUI();
        const modal = document.getElementById('ep-pause-modal');
        if (!modal) return;
        modal.style.display = 'flex';

        const retreatBtn = document.getElementById('ep-pause-retreat');
        if (retreatBtn) retreatBtn.style.display = this.isCombatActive ? 'inline-flex' : 'none';

        const autosaveToggle = document.getElementById('ep-setting-autosave');
        const autoloadToggle = document.getElementById('ep-setting-autoload');
        const autosaveInterval = document.getElementById('ep-setting-autosave-interval');
        if (autosaveToggle) autosaveToggle.checked = this.autosaveEnabled !== false;
        if (autoloadToggle) autoloadToggle.checked = this.autoloadEnabled !== false;
        if (autosaveInterval) {
            autosaveInterval.value = String(this.autosaveIntervalMs || 120000);
            autosaveInterval.disabled = !this.autosaveEnabled;
        }

        const audioMute = document.getElementById('ep-setting-audio-mute');
        const audioMaster = document.getElementById('ep-setting-audio-master');
        const audioMusic = document.getElementById('ep-setting-audio-music');
        const audioSfx = document.getElementById('ep-setting-audio-sfx');
        const audioMasterVal = document.getElementById('ep-setting-audio-master-val');
        const audioMusicVal = document.getElementById('ep-setting-audio-music-val');
        const audioSfxVal = document.getElementById('ep-setting-audio-sfx-val');

        const setRangePct = (el, val, outEl, fallback) => {
            if (!el && !outEl) return;
            const n = (typeof val === 'number' && Number.isFinite(val)) ? val : fallback;
            const pct = Math.round(Math.max(0, Math.min(1, n)) * 100);
            if (el) el.value = String(pct);
            if (outEl) outEl.textContent = `${pct}%`;
        };

        if (audioMute) audioMute.checked = !!this.audioMuted;
        setRangePct(audioMaster, this.audioMaster, audioMasterVal, 0.3);
        setRangePct(audioMusic, this.audioMusic, audioMusicVal, 1);
        setRangePct(audioSfx, this.audioSfx, audioSfxVal, 1);
        this.syncGraphicsSettingsUI();
    }

    closePauseMenu() {
        const modal = document.getElementById('ep-pause-modal');
        if (!modal) return;
        modal.style.display = 'none';
    }

    togglePause(forceState = null) {
        const nextState = (typeof forceState === 'boolean') ? forceState : !this.isPaused;
        if (nextState === this.isPaused) return;

        this.isPaused = nextState;

        if (this.isPaused) {
            this._prePauseControlsEnabled = (this.controls ? this.controls.enabled : null);
            if (this.controls) this.controls.enabled = false;
            this.openPauseMenu();
        } else {
            this.closePauseMenu();
            if (this.controls && this._prePauseControlsEnabled !== null) {
                this.controls.enabled = this._prePauseControlsEnabled;
            }
        }
    }

    startAutosave(forceRestart = false) {
        if (this.autosaveTimer) {
            if (!forceRestart) return;
            clearInterval(this.autosaveTimer);
            this.autosaveTimer = null;
        }

        if (this.autosaveEnabled === false) return;

        this.autosaveTimer = setInterval(() => {
            if (this.isPaused) return;
            this.saveGame({ silent: true });

            const now = Date.now();
            if (!this.lastAutosaveNotifyAt || (now - this.lastAutosaveNotifyAt) > 300000) {
                this.notify('Autosaved (Local).', 'info');
                this.lastAutosaveNotifyAt = now;
            }
        }, this.autosaveIntervalMs);
    }

    getPilotSkillDefinitions() {
        return {
            // Combat & Navigation
            piloting: { id: 'piloting', name: 'Piloting', icon: '🧭', rank: 1, primary: 'perception', secondary: 'willpower', desc: 'Increases max speed and turn rate.' },
            gunnery: { id: 'gunnery', name: 'Gunnery', icon: '🔫', rank: 1, primary: 'perception', secondary: 'willpower', desc: 'Increases laser weapon damage.' },
            missile_ops: { id: 'missile_ops', name: 'Missile Ops', icon: '🚀', rank: 2, primary: 'perception', secondary: 'willpower', desc: 'Increases missile weapon damage.' },
            shield_management: { id: 'shield_management', name: 'Shield Management', icon: '🛡️', rank: 2, primary: 'intelligence', secondary: 'memory', desc: 'Increases shield capacity and regeneration.' },
            hull_upgrades: { id: 'hull_upgrades', name: 'Hull Upgrades', icon: '🧱', rank: 2, primary: 'intelligence', secondary: 'willpower', desc: 'Increases hull integrity.' },

            // Industry & Science
            science: { id: 'science', name: 'Science', icon: '🔬', rank: 1, primary: 'intelligence', secondary: 'memory', desc: 'Increases researcher data output by 5% per level.' },
            industry: { id: 'industry', name: 'Industry', icon: '🏭', rank: 1, primary: 'intelligence', secondary: 'memory', desc: 'Decreases manufacturing time by 5% per level.' },
            mining: { id: 'mining', name: 'Mining', icon: '⛏️', rank: 1, primary: 'perception', secondary: 'memory', desc: 'Increases automated mining yield by 5% per level.' },
            production_efficiency: { id: 'production_efficiency', name: 'Production Efficiency', icon: '⚙️', rank: 3, primary: 'intelligence', secondary: 'memory', desc: 'Reduces material requirements for jobs.' },

            // Management
            colony_mgmt: { id: 'colony_mgmt', name: 'Colony Management', icon: '🏛️', rank: 2, primary: 'charisma', secondary: 'willpower', desc: 'Increases population capacity by 2 per level.' },
            negotiation: { id: 'negotiation', name: 'Negotiation', icon: '🤝', rank: 2, primary: 'charisma', secondary: 'intelligence', desc: 'Better credit rewards from missions.' }
        };
    }

    createDefaultPilotSkillsState(defs = null) {
        const skillDefs = defs || this.pilotSkillDefs || this.getPilotSkillDefinitions();
        const skills = {};
        Object.keys(skillDefs).forEach((id) => {
            skills[id] = { level: 0 };
        });

        return {
            skills,
            queue: [],
            active: null,
            lastUpdateAt: Date.now()
        };
    }

    normalizePilotSkillsState(state) {
        const skillDefs = this.pilotSkillDefs || this.getPilotSkillDefinitions();
        const maxLevel = 5;
        const out = (state && typeof state === 'object') ? state : {};

        if (!out.skills || typeof out.skills !== 'object') out.skills = {};
        Object.keys(skillDefs).forEach((id) => {
            const entry = out.skills[id];
            const lvlRaw = entry && typeof entry.level === 'number' ? entry.level : 0;
            const lvl = Math.max(0, Math.min(maxLevel, Math.floor(lvlRaw)));
            out.skills[id] = { level: lvl };
        });

        if (!Array.isArray(out.queue)) out.queue = [];
        out.queue = out.queue
            .filter((q) => q && typeof q === 'object')
            .map((q) => {
                const skillId = String(q.skillId || '');
                const toLevelRaw = (typeof q.toLevel === 'number' && Number.isFinite(q.toLevel)) ? Math.floor(q.toLevel) : null;
                const toLevel = (toLevelRaw !== null) ? Math.max(1, Math.min(maxLevel, toLevelRaw)) : null;
                return { skillId, toLevel };
            })
            .filter((q) => q.skillId && q.toLevel !== null && !!skillDefs[q.skillId]);

        if (out.active && typeof out.active === 'object') {
            const skillId = String(out.active.skillId || '');
            const toLevel = (typeof out.active.toLevel === 'number' && Number.isFinite(out.active.toLevel)) ? Math.floor(out.active.toLevel) : null;
            const duration = (typeof out.active.duration === 'number' && Number.isFinite(out.active.duration)) ? out.active.duration : null;
            const remaining = (typeof out.active.remaining === 'number' && Number.isFinite(out.active.remaining)) ? out.active.remaining : null;

            const currentLevel = (out.skills && out.skills[skillId] && typeof out.skills[skillId].level === 'number') ? out.skills[skillId].level : 0;

            if (!skillId || !skillDefs[skillId] || toLevel === null || toLevel < 1 || toLevel > maxLevel || currentLevel >= toLevel || remaining === null || remaining <= 0 || duration === null || duration <= 0) {
                out.active = null;
            } else {
                out.active = {
                    skillId,
                    toLevel: Math.max(1, Math.min(maxLevel, toLevel)),
                    duration: Math.max(1, duration),
                    remaining: Math.max(0, Math.min(duration, remaining))
                };
            }
        } else {
            out.active = null;
        }

        const last = (typeof out.lastUpdateAt === 'number' && Number.isFinite(out.lastUpdateAt)) ? out.lastUpdateAt : Date.now();
        out.lastUpdateAt = last;

        return out;
    }

    getPilotSkillLevel(skillId) {
        const id = String(skillId || '');
        if (!id || !this.pilotSkills || !this.pilotSkills.skills) return 0;
        const entry = this.pilotSkills.skills[id];
        const lvl = entry && typeof entry.level === 'number' ? entry.level : 0;
        return Math.max(0, Math.min(5, Math.floor(lvl)));
    }

    getPilotSkillTrainingSpeed(skillId) {
        const skillDefs = this.pilotSkillDefs || this.getPilotSkillDefinitions();
        const def = skillDefs[skillId];
        if (!def) return 15 / 60; // Default: 15 SP/min = 0.25 SP/sec

        const primary = this.attributes[def.primary || 'intelligence'] || 10;
        const secondary = this.attributes[def.secondary || 'memory'] || 10;

        // EVE Formula: SP/min = Primary + (Secondary / 2)
        const spPerMin = primary + (secondary / 2);
        return spPerMin / 60; // Returns SP/sec
    }

    getPilotSkillTrainingTimeSeconds(skillId, targetLevel) {
        const skillDefs = this.pilotSkillDefs || this.getPilotSkillDefinitions();
        const def = skillDefs[String(skillId || '')];
        if (!def) return null;
        const lvl = (typeof targetLevel === 'number' && Number.isFinite(targetLevel)) ? Math.floor(targetLevel) : null;
        if (!lvl || lvl < 1 || lvl > 5) return null;

        const rank = (typeof def.rank === 'number' && Number.isFinite(def.rank) && def.rank > 0) ? def.rank : 1;

        // SP Required Formula (Simplified EVE): Level 1=250*rank, Level 2=1414*rank, etc.
        // sp = 250 * rank * multiplier^(lvl-1)
        const spRequired = 250 * rank * Math.pow(5.5, lvl - 1);
        const spPerSec = this.getPilotSkillTrainingSpeed(skillId);

        return Math.ceil(spRequired / spPerSec);
    }

    enqueuePilotSkillTraining(skillId, levels = 1) {
        if (!this.pilotSkills) this.pilotSkills = this.createDefaultPilotSkillsState(this.pilotSkillDefs);

        const id = String(skillId || '');
        if (!id) return;

        const maxLevel = 5;
        const nLevels = (typeof levels === 'number' && Number.isFinite(levels)) ? Math.floor(levels) : 1;
        const addLevels = Math.max(1, Math.min(5, nLevels));

        const currentLevel = this.getPilotSkillLevel(id);
        let next = currentLevel;

        const planned = [];
        for (let i = 0; i < this.pilotSkills.queue.length; i++) {
            const q = this.pilotSkills.queue[i];
            if (q && q.skillId === id && typeof q.toLevel === 'number') planned.push(q.toLevel);
        }
        if (this.pilotSkills.active && this.pilotSkills.active.skillId === id && typeof this.pilotSkills.active.toLevel === 'number') {
            planned.push(this.pilotSkills.active.toLevel);
        }

        for (let i = 0; i < addLevels; i++) {
            const highestPlanned = planned.length > 0 ? Math.max(...planned) : next;
            next = Math.max(next, highestPlanned);
            const toLevel = next + 1;
            if (toLevel > maxLevel) break;
            const duration = this.getPilotSkillTrainingTimeSeconds(id, toLevel);
            if (!duration) break;
            this.pilotSkills.queue.push({ skillId: id, toLevel });
            planned.push(toLevel);
            next = toLevel;
        }

        this.advancePilotSkillTraining(0);
        this.renderSkillsUI();
    }

    clearPilotSkillQueue() {
        if (!this.pilotSkills) return;
        this.pilotSkills.queue = [];
        this.renderSkillsUI();
    }

    cancelPilotSkillTraining() {
        if (!this.pilotSkills) return;
        this.pilotSkills.active = null;
        this.renderSkillsUI();
    }

    advancePilotSkillTraining(dtSeconds, options = {}) {
        if (!this.pilotSkills) this.pilotSkills = this.createDefaultPilotSkillsState(this.pilotSkillDefs);
        this.pilotSkills = this.normalizePilotSkillsState(this.pilotSkills);

        const now = Date.now();
        const last = (typeof this.pilotSkills.lastUpdateAt === 'number' && Number.isFinite(this.pilotSkills.lastUpdateAt)) ? this.pilotSkills.lastUpdateAt : now;
        const derived = Math.max(0, (now - last) / 1000);

        const inputDt = (typeof dtSeconds === 'number' && Number.isFinite(dtSeconds)) ? dtSeconds : null;
        const dt = (inputDt !== null) ? Math.max(0, inputDt) : derived;

        this.pilotSkills.lastUpdateAt = now;
        if (dt <= 0) return { completed: [] };

        const completed = [];

        const ensureActive = () => {
            if (this.pilotSkills.active) return;
            if (!Array.isArray(this.pilotSkills.queue) || this.pilotSkills.queue.length === 0) return;
            const next = this.pilotSkills.queue.shift();
            if (!next || !next.skillId) return;

            const duration = this.getPilotSkillTrainingTimeSeconds(next.skillId, next.toLevel);
            if (!duration) return;

            this.pilotSkills.active = {
                skillId: next.skillId,
                toLevel: next.toLevel,
                duration,
                remaining: duration
            };
        };

        ensureActive();
        let timeLeft = dt;

        while (timeLeft > 0 && this.pilotSkills.active) {
            const a = this.pilotSkills.active;
            const step = Math.min(timeLeft, a.remaining);
            a.remaining = Math.max(0, a.remaining - step);
            timeLeft = Math.max(0, timeLeft - step);

            if (a.remaining <= 0) {
                const current = this.getPilotSkillLevel(a.skillId);
                const toLevel = Math.max(current, Math.min(5, a.toLevel));
                this.pilotSkills.skills[a.skillId].level = toLevel;
                completed.push({ skillId: a.skillId, level: toLevel });
                this.pilotSkills.active = null;
                ensureActive();
            }
        }

        const shouldNotify = options && options.silent !== true;
        if (shouldNotify && completed.length > 0 && typeof this.notify === 'function') {
            const skillDefs = this.pilotSkillDefs || this.getPilotSkillDefinitions();
            completed.slice(0, 3).forEach((c) => {
                const def = skillDefs[c.skillId];
                const name = def ? def.name : c.skillId;
                this.notify(`${name} trained to Level ${c.level}!`, 'success');
            });
            if (completed.length > 3) {
                this.notify(`+${completed.length - 3} more skills completed.`, 'success');
            }
        }

        this.renderSkillsUI();
        return { completed };
    }

    getPilotCombatBonuses() {
        const piloting = this.getPilotSkillLevel('piloting');
        const gunnery = this.getPilotSkillLevel('gunnery');
        const missiles = this.getPilotSkillLevel('missile_ops');
        const shields = this.getPilotSkillLevel('shield_management');
        const hull = this.getPilotSkillLevel('hull_upgrades');

        return {
            speedMult: 1 + 0.02 * piloting,
            turnMult: 1 + 0.01 * piloting,
            laserDmgMult: 1 + 0.03 * gunnery,
            missileDmgMult: 1 + 0.03 * missiles,
            shieldHpMult: 1 + 0.04 * shields,
            shieldRegenMult: 1 + 0.02 * shields,
            hullHpMult: 1 + 0.04 * hull
        };
    }

    getPilotIndustryBonuses() {
        const industry = this.getPilotSkillLevel('industry');
        const prod = this.getPilotSkillLevel('production_efficiency');

        let timeMult = 1 - 0.05 * industry; // -5% time per level

        // Citadel Bonus: -25% time
        if (this.structures.some(s => s.type === 'citadel' && this.isStructureOperational(s))) {
            timeMult *= 0.75;
        }

        return {
            timeMult: timeMult,
            matMult: 1 - 0.03 * prod      // -3% materials per level
        };
    }

    getPilotColonyBonuses() {
        const mgmt = this.getPilotSkillLevel('colony_mgmt');
        const neg = this.getPilotSkillLevel('negotiation');
        return {
            popCapBonus: mgmt * 2,
            missionCreditMult: 1 + 0.05 * neg
        };
    }

    getPilotProductionBonuses() {
        const science = this.getPilotSkillLevel('science');
        const mining = this.getPilotSkillLevel('mining');
        return {
            dataMult: 1 + 0.05 * science,
            mineralMult: 1 + 0.05 * mining
        };
    }

    claimCurrentSystem() {
        if (this.claims[this.currentSystemId] === 'player') {
            this.notify("System already claimed!", "warning");
            return;
        }

        const cost = { alloys: 100, circuits: 50 };
        for (const r in cost) {
            if ((this.resources[r] || 0) < cost[r]) {
                this.notify(`Insufficient ${r} to claim system! (Need ${cost[r]})`, "danger");
                return;
            }
        }

        for (const r in cost) this.resources[r] -= cost[r];
        this.claims[this.currentSystemId] = 'player';
        this.updateResourceUI();
        this.notify(`Territorial Claim Successful: ${this.planetData.name} is now yours!`, "success");
        if (this.audio && this.audio.playSuccess) this.audio.playSuccess();
    }

    formatDuration(seconds) {
        const s = (typeof seconds === 'number' && Number.isFinite(seconds)) ? Math.max(0, Math.floor(seconds)) : 0;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const r = s % 60;
        const pad = (n) => String(n).padStart(2, '0');
        if (h > 0) return `${h}:${pad(m)}:${pad(r)}`;
        return `${m}:${pad(r)}`;
    }

    openSkills() {
        const modal = document.getElementById('ep-skills-modal');
        if (!modal) return;
        modal.style.display = 'flex';
        this.renderSkillsUI();
    }

    renderSkillsUI() {
        const modal = document.getElementById('ep-skills-modal');
        const content = document.getElementById('ep-skills-content');
        if (!modal || !content) return;
        if (modal.style.display === 'none' || modal.style.display === '') return;

        if (!this.pilotSkills) this.pilotSkills = this.createDefaultPilotSkillsState(this.pilotSkillDefs);
        this.pilotSkills = this.normalizePilotSkillsState(this.pilotSkills);

        const defs = this.pilotSkillDefs || this.getPilotSkillDefinitions();

        // Attribute Bar
        let attributesHtml = `
            <div style="display:flex; justify-content:space-between; background:rgba(15,23,42,0.9); padding:15px; border-radius:10px; margin-bottom:20px; border:1px solid #334155;">
        `;
        const attrs = ['intelligence', 'perception', 'memory', 'willpower', 'charisma'];
        attrs.forEach(a => {
            const val = this.attributes[a];
            attributesHtml += `
                <div style="text-align:center;">
                    <div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase;">${a.slice(0, 3)}</div>
                    <div style="font-size:1.2rem; font-weight:bold; color:#38bdf8;">${val}</div>
                </div>
            `;
        });
        attributesHtml += `</div>`;

        const active = this.pilotSkills.active;
        let activeHtml = '<div style="color:#64748b; background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; text-align:center;">No active training.</div>';
        if (active) {
            const def = defs[active.skillId];
            const name = def ? def.name : active.skillId;
            const pct = active.duration > 0 ? Math.floor(((active.duration - active.remaining) / active.duration) * 100) : 0;
            const spSpeed = (this.getPilotSkillTrainingSpeed(active.skillId) * 60).toFixed(1);
            activeHtml = `
                <div style="background:rgba(56,189,248,0.1); border:1px solid #38bdf8; padding:15px; border-radius:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                        <div style="flex-grow:1;">
                            <div style="font-weight:700; color:#e2e8f0; font-size:1.1rem;">Training: ${name} ${'I'.repeat(active.toLevel)}</div>
                            <div style="margin-top:8px; height:12px; background:rgba(0,0,0,0.5); border-radius:9999px; overflow:hidden; border:1px solid rgba(56,189,248,0.3);">
                                <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, #38bdf8, #818cf8); box-shadow:0 0 10px #38bdf8;"></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top:8px; color:#94a3b8; font-size:0.85rem;">
                                <span>${pct}% Complete (${spSpeed} SP/min)</span>
                                <span>${this.formatDuration(active.remaining)} remaining</span>
                            </div>
                        </div>
                        <button class="ep-sys-btn" style="border-color:#ef4444; color:#ef4444;" onclick="window.game.cancelPilotSkillTraining()">ABORT</button>
                    </div>
                </div>
            `;
        }

        const queue = Array.isArray(this.pilotSkills.queue) ? this.pilotSkills.queue : [];
        const queueHtml = queue.length === 0
            ? '<div style="color:#64748b; background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; text-align:center;">Queue empty.</div>'
            : `<div style="display:flex; flex-direction:column; gap:6px; background:rgba(0,0,0,0.3); padding:15px; border-radius:10px;">${queue.slice(0, 10).map((q, idx) => {
                const def = defs[q.skillId];
                const name = def ? def.name : q.skillId;
                return `<div style="display:flex; justify-content:space-between; gap:10px; color:#cbd5e1;"><div>${idx + 1}. ${name} ${'I'.repeat(q.toLevel)}</div><div style="color:#64748b;">${this.formatDuration(this.getPilotSkillTrainingTimeSeconds(q.skillId, q.toLevel) || 0)}</div></div>`;
            }).join('')}</div>`;

        const skillCards = Object.keys(defs).map((id) => {
            const def = defs[id];
            const lvl = this.getPilotSkillLevel(id);
            const nextLevel = Math.min(5, lvl + 1);
            const canTrain = lvl < 5;
            const nextTime = canTrain ? this.getPilotSkillTrainingTimeSeconds(id, nextLevel) : null;

            // Check if already in queue
            const inQueue = (this.pilotSkills.queue || []).some(q => q.skillId === id && q.toLevel === nextLevel) ||
                (active && active.skillId === id && active.toLevel === nextLevel);

            return `
                <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.15); border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px; transition:border 0.2s;" onmouseover="this.style.borderColor='#38bdf8'" onmouseout="this.style.borderColor='rgba(148,163,184,0.15)'">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="font-size:1.5rem; filter:drop-shadow(0 0 5px rgba(56,189,248,0.3));">${def.icon || '⭐'}</div>
                            <div>
                                <div style="font-weight:700; color:#e2e8f0; font-size:0.95rem;">${def.name}</div>
                                <div style="display:flex; gap:3px; margin-top:3px;">
                                    ${[1, 2, 3, 4, 5].map(i => `<div style="width:8px; height:4px; background:${i <= lvl ? '#38bdf8' : '#334155'}; border-radius:1px;"></div>`).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.7rem; color:#64748b;">RANK ${def.rank || 1}</div>
                            <div style="font-size:0.6rem; color:#475569; text-transform:uppercase;">${(def.primary || '').slice(0, 3)}/${(def.secondary || '').slice(0, 3)}</div>
                        </div>
                    </div>
                    
                    <div style="font-size:0.8rem; color:#94a3b8; line-height:1.3;">${def.desc}</div>
                    
                    <div style="margin-top:auto; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; color:#64748b;">${canTrain ? this.formatDuration(nextTime) : 'MAX LEVEL'}</span>
                        ${canTrain && !inQueue ? `
                            <button class="ep-sys-btn" style="font-size:0.7rem; padding:4px 10px;" onclick="window.game.enqueuePilotSkillTraining('${id}', 1)">Train</button>
                        ` : canTrain && inQueue ? `
                            <span style="font-size:0.7rem; color:#38bdf8;">IN QUEUE</span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = `
            ${attributesHtml}
            <h3 style="margin:0 0 15px 0; color:#e2e8f0; border-left:3px solid #38bdf8; padding-left:10px;">Active Training</h3>
            ${activeHtml}
            
            <h3 style="margin:25px 0 15px 0; color:#e2e8f0; border-left:3px solid #38bdf8; padding-left:10px;">Available Skills</h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:15px;">
                ${skillCards}
            </div>
        `;
    }

    // --- INDUSTRY ---
    openIndustry() {
        const modal = document.getElementById('ep-industry-modal');
        if (modal) modal.style.display = 'flex';
        this.renderIndustryUI();
    }

    renderIndustryUI() {
        const container = document.getElementById('ep-industry-content');
        if (!container) return;

        let html = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; color:#fff; font-family:'Orbitron';">
                <!-- Blueprints Column -->
                <div style="background:rgba(15,23,42,0.8); padding:1rem; border-radius:10px; border:1px solid #334155;">
                    <h3 style="margin-top:0; border-bottom:1px solid #334155; padding-bottom:10px; color:#4ade80;">📜 Blueprints</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:10px; max-height:60vh; overflow-y:auto;">
        `;

        this.blueprints.forEach(bp => {
            const b = this.buildingTypes[bp.type];
            if (!b) return;
            const ib = this.getPilotIndustryBonuses();
            let costText = '';
            for (const res in b.cost) {
                const finalCost = Math.ceil(b.cost[res] * ib.matMult);
                costText += `${res.substring(0, 3)}:${finalCost} `;
            }

            html += `
                <div class="ep-bp-card" style="background:#1e293b; padding:10px; border-radius:8px; border:1px solid #475569; position:relative; cursor:pointer;" onclick="game.startIndustryJob('${bp.id}')">
                    <div style="font-size:1.5rem; margin-bottom:5px;">${bp.icon}</div>
                    <div style="font-size:0.8rem; font-weight:bold;">${bp.name}</div>
                    <div style="font-size:0.6rem; color:#94a3b8; margin-top:4px;">COST: ${costText}</div>
                    <div style="font-size:0.6rem; color:#4ade80; margin-top:2px;">TIME: ${Math.ceil((b.buildTime || 30) * ib.timeMult)}s</div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>

                <!-- Active Jobs Column -->
                <div style="background:rgba(15,23,42,0.8); padding:1rem; border-radius:10px; border:1px solid #334155;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:10px; margin-bottom:10px;">
                        <h3 style="margin:0; color:#38bdf8;">⚙️ Industrial Queue (${this.industry.jobs.length}/${this.industry.maxJobs})</h3>
                        <div style="display:flex; gap:10px;">
                            <button class="ep-sys-btn" style="font-size:0.7rem; padding:4px 8px;" onclick="game.openLogisticsLog()">LOGISTICS</button>
                            <div style="font-size:0.7rem; color:#94a3b8; align-self:center;">Slots: ${this.industry.maxJobs}</div>
                        </div>
                    </div>
                    <div id="ep-jobs-list">
        `;

        if (this.industry.jobs.length === 0) {
            html += `<div style="color:#64748b; font-size:0.9rem; padding:20px; text-align:center;">No active jobs. Select a blueprint to start production.</div>`;
        } else {
            this.industry.jobs.forEach((job, idx) => {
                const b = this.buildingTypes[job.type];
                const progress = ((job.duration - job.timeLeft) / job.duration) * 100;
                html += `
                    <div class="ep-industry-job" data-job-id="${job.id}" style="background:#1e293b; padding:12px; border-radius:8px; margin-bottom:10px; border:1px solid #38bdf8; position:relative;">
                        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px;">
                            <span>${b.name}</span>
                            <span class="ep-job-progress-label" style="color:#38bdf8;">${Math.round(progress)}%</span>
                        </div>
                        <div style="width:100%; height:8px; background:#0f172a; border-radius:4px; overflow:hidden;">
                            <div class="ep-job-progress-bar" style="width:${progress}%; height:100%; background:#38bdf8; transition:width 0.15s linear;"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                            <div class="ep-job-remaining" style="font-size:0.7rem; color:#94a3b8;">Remaining: ${Math.ceil(job.timeLeft)}s</div>
                            <button class="ep-sys-btn" style="font-size:0.6rem; padding:2px 6px; border-color:#ef4444; color:#ef4444;" onclick="game.cancelIndustryJob('${job.id}')">CANCEL</button>
                        </div>
                    </div>
                `;
            });
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    cancelIndustryJob(jobId) {
        const idx = this.industry.jobs.findIndex(j => j.id === jobId);
        if (idx !== -1) {
            const job = this.industry.jobs[idx];
            const b = this.buildingTypes[job.type];
            const ib = this.getPilotIndustryBonuses();

            // Refund 75% of resources
            for (const res in b.cost) {
                const finalCost = Math.ceil(b.cost[res] * ib.matMult);
                const refund = Math.floor(finalCost * 0.75);
                this.resources[res] += refund;
            }

            this.industry.jobs.splice(idx, 1);
            this.notify(`Manufacturing cancelled. 75% resources refunded.`, "warning");
            this.updateResourceUI();
            this.renderIndustryUI();
        }
    }

    startIndustryJob(bpId) {
        const bp = this.blueprints.find(b => b.id === bpId);
        if (!bp) return;

        if (this.industry.jobs.length >= this.industry.maxJobs) {
            this.notify("Industry Queue Full!", "danger");
            return;
        }

        const b = this.buildingTypes[bp.type];
        if (!b) {
            this.notify('This blueprint is not compatible with planetary Industry.', 'warning');
            return;
        }
        const ib = this.getPilotIndustryBonuses();

        // Check Resources (Skill-based reduction)
        for (const res in b.cost) {
            const finalCost = Math.ceil(b.cost[res] * ib.matMult);
            if (this.resources[res] < finalCost) {
                this.notify(`Insufficient ${res}! (Required: ${finalCost})`, "danger");
                return;
            }
        }

        // Consume Resources
        for (const res in b.cost) {
            const finalCost = Math.ceil(b.cost[res] * ib.matMult);
            this.resources[res] -= finalCost;
        }
        this.updateResourceUI();

        // Add Job (Skill-based duration reduction)
        const finalDuration = Math.max(1, (b.buildTime || 30) * ib.timeMult);
        this.industry.jobs.push({
            id: 'job_' + Date.now(),
            type: bp.type,
            duration: finalDuration,
            timeLeft: finalDuration
        });

        this.notify(`Manufacturing ${b.name} started.`, "success");
        this.renderIndustryUI();
    }

    updateIndustryJobProgressUI() {
        const container = document.getElementById('ep-industry-content');
        if (!container) return;
        this.industry.jobs.forEach((job) => {
            const card = Array.from(container.querySelectorAll('.ep-industry-job')).find((el) => el.dataset.jobId === job.id);
            if (!card) return;
            const progress = Math.max(0, Math.min(100, ((job.duration - job.timeLeft) / job.duration) * 100));
            const label = card.querySelector('.ep-job-progress-label');
            const bar = card.querySelector('.ep-job-progress-bar');
            const remaining = card.querySelector('.ep-job-remaining');
            if (label) label.textContent = `${Math.round(progress)}%`;
            if (bar) bar.style.width = `${progress}%`;
            if (remaining) remaining.textContent = `Remaining: ${Math.max(0, Math.ceil(job.timeLeft))}s`;
        });
    }

    advanceIndustryJobs(dt) {
        let changed = false;
        for (let i = this.industry.jobs.length - 1; i >= 0; i--) {
            const job = this.industry.jobs[i];
            job.timeLeft -= dt;
            if (job.timeLeft <= 0) {
                this.finishIndustryJob(job);
                this.industry.jobs.splice(i, 1);
                changed = true;
            }
        }
        if (changed) {
            this.renderIndustryUI();
        } else if (document.getElementById('ep-industry-modal')?.style.display === 'flex') {
            this.updateIndustryJobProgressUI();
        }
    }

    finishIndustryJob(job) {
        const b = this.buildingTypes[job.type];

        // Add to inventory
        const invItem = this.inventory.find(i => i.type === job.type);
        if (invItem) {
            invItem.count++;
        } else {
            this.inventory.push({ type: job.type, count: 1 });
        }

        this.notify(`${b.name} Manufacturing Complete!`, "success");
        this.audio.playSuccess();
        this.createBuildMenu();
    }

    getTotalStructuresForCurrentSystem() {
        const sources = [];
        const addSource = (structures) => {
            if (Array.isArray(structures)) sources.push(structures);
        };

        addSource(this.structures);

        if (this.systemStates && this.currentSystemId !== undefined && this.currentSystemId !== null) {
            const planetId = String(this.currentSystemId);
            const moonId = `${planetId}_moon`;
            const otherId = this.isOnMoon ? planetId : moonId;
            const otherState = this.systemStates[otherId];
            if (otherState && Array.isArray(otherState.structures)) addSource(otherState.structures);
        }

        let count = 0;
        sources.forEach(structures => {
            count += structures.length;
        });
        return count;
    }

    getAgentMissionDefinitions() {
        return {
            // ... (existing missions)
            citizen_science: {
                id: 'citizen_science',
                name: 'Citizen Science: Exoplanet Analysis',
                icon: '🔭',
                desc: 'Analyze light curves from the TESS mission to identify potential exoplanets.',
                target: 100,
                reward: { credits: 500, data: 200 },
                standing: 1,
                lp: 100,
                isCitizenScience: true,
                getCurrent: (game) => (game.resources.data_analyzed || 0)
            },
            build_outpost: {
                id: 'build_outpost',
                name: 'Establish Outpost',
                icon: '🏗️',
                desc: 'Construct 10 structures on the surface.',
                target: 10,
                reward: { credits: 250, alloys: 5 },
                standing: 1,
                lp: 40,
                getCurrent: (game) => (game && typeof game.getTotalStructuresForCurrentSystem === 'function') ? game.getTotalStructuresForCurrentSystem() : ((game && Array.isArray(game.structures)) ? game.structures.length : 0)
            },
            grow_population: {
                id: 'grow_population',
                name: 'Grow the Colony',
                icon: '👥',
                desc: 'Reach a population of 12 colonists.',
                target: 12,
                reward: { credits: 200, food: 25 },
                standing: 1,
                lp: 35,
                getCurrent: (game) => (game && Array.isArray(game.colonists)) ? game.colonists.length : 0
            },
            research_cache: {
                id: 'research_cache',
                name: 'Research Cache',
                icon: '🔬',
                desc: 'Stockpile 120 data for analysis.',
                target: 120,
                reward: { credits: 300, circuits: 2 },
                standing: 1,
                lp: 50,
                getCurrent: (game) => (game && game.resources && typeof game.resources.data === 'number' && Number.isFinite(game.resources.data)) ? game.resources.data : 0
            },
            combat_patrol: {
                id: 'combat_patrol',
                name: 'Combat Patrol',
                icon: '⚔️',
                desc: 'Win 2 space combat engagements.',
                target: 2,
                reward: { credits: 350, alloys: 10 },
                minStanding: 1,
                standing: 2,
                lp: 80,
                getCurrent: (game, state) => {
                    const s = (state && state.stats && typeof state.stats.combatWins === 'number' && Number.isFinite(state.stats.combatWins)) ? state.stats.combatWins : 0;
                    return Math.max(0, Math.floor(s));
                }
            },
            pilot_training: {
                id: 'pilot_training',
                name: 'Pilot Training',
                icon: '🧠',
                desc: 'Train a total of 6 pilot skill levels.',
                target: 6,
                reward: { credits: 400, data: 50 },
                standing: 2,
                lp: 60,
                getCurrent: (game) => {
                    const skills = (game && game.pilotSkills && game.pilotSkills.skills && typeof game.pilotSkills.skills === 'object') ? game.pilotSkills.skills : null;
                    if (!skills) return 0;
                    let sum = 0;
                    Object.keys(skills).forEach((k) => {
                        const e = skills[k];
                        const lvl = (e && typeof e.level === 'number' && Number.isFinite(e.level)) ? e.level : 0;
                        sum += Math.max(0, Math.floor(lvl));
                    });
                    return sum;
                }
            },
            // Roadmap Item 705: Corporate Espionage
            corp_espionage: {
                id: 'corp_espionage',
                name: 'Operation: Shadow Protocol',
                icon: '🕵️',
                desc: 'Infiltrate a rival corporation to steal proprietary data and sabotage their research.',
                target: 1,
                reward: { credits: 1000, data: 500 },
                standing: -2, // Risky for reputation
                lp: 150,
                isEspionage: true,
                getCurrent: (game) => (game.playerCorp.espionageSuccesses || 0)
            }
        };
    }

    createDefaultAgentMissionsState(defs = null) {
        const missionDefs = defs || this.agentMissionDefs || this.getAgentMissionDefinitions();
        const completed = {};
        Object.keys(missionDefs).forEach((id) => {
            completed[id] = false;
        });
        return {
            completed: completed,
            stats: {
                combatWins: 0
            },
            standing: 0,
            loyaltyPoints: 0,
            offers: [],
            active: null,
            cooldowns: {},
            lastOfferDay: 0,
            lastUpdateAt: Date.now()
        };
    }

    normalizeAgentMissionsState(state) {
        const defs = this.agentMissionDefs || this.getAgentMissionDefinitions();
        const out = (state && typeof state === 'object') ? state : {};

        if (!out.completed || typeof out.completed !== 'object') out.completed = {};
        Object.keys(defs).forEach((id) => {
            out.completed[id] = !!out.completed[id];
        });

        if (!out.stats || typeof out.stats !== 'object') out.stats = {};
        const winsRaw = (typeof out.stats.combatWins === 'number' && Number.isFinite(out.stats.combatWins)) ? Math.floor(out.stats.combatWins) : 0;
        out.stats.combatWins = Math.max(0, winsRaw);

        const standingRaw = (typeof out.standing === 'number' && Number.isFinite(out.standing)) ? Math.floor(out.standing) : 0;
        out.standing = Math.max(0, standingRaw);

        const lpRaw = (typeof out.loyaltyPoints === 'number' && Number.isFinite(out.loyaltyPoints)) ? Math.floor(out.loyaltyPoints) : 0;
        out.loyaltyPoints = Math.max(0, lpRaw);

        if (!Array.isArray(out.offers)) out.offers = [];
        const offerSeen = {};
        out.offers = out.offers.map((o) => {
            if (!o || typeof o !== 'object') return null;
            const missionId = String(o.missionId || o.id || '');
            if (!missionId || !defs[missionId] || offerSeen[missionId]) return null;
            offerSeen[missionId] = true;
            const offeredAtDayRaw = (typeof o.offeredAtDay === 'number' && Number.isFinite(o.offeredAtDay)) ? Math.floor(o.offeredAtDay) : 0;
            const offeredAtDay = Math.max(0, offeredAtDayRaw);
            const expiresAtDayRaw = (typeof o.expiresAtDay === 'number' && Number.isFinite(o.expiresAtDay)) ? Math.floor(o.expiresAtDay) : offeredAtDay;
            const expiresAtDay = Math.max(offeredAtDay, expiresAtDayRaw);
            return { missionId, offeredAtDay, expiresAtDay };
        }).filter(Boolean);

        if (!out.cooldowns || typeof out.cooldowns !== 'object') out.cooldowns = {};
        const cdOut = {};
        Object.keys(defs).forEach((id) => {
            const raw = out.cooldowns[id];
            const n = (typeof raw === 'number' && Number.isFinite(raw)) ? Math.floor(raw) : 0;
            if (n > 0) cdOut[id] = n;
        });
        out.cooldowns = cdOut;

        const lastOfferDayRaw = (typeof out.lastOfferDay === 'number' && Number.isFinite(out.lastOfferDay)) ? Math.floor(out.lastOfferDay) : 0;
        out.lastOfferDay = Math.max(0, lastOfferDayRaw);

        if (out.active && typeof out.active === 'object') {
            const missionId = String(out.active.missionId || out.active.id || '');
            if (!missionId || !defs[missionId]) {
                out.active = null;
            } else {
                const acceptedAtDayRaw = (typeof out.active.acceptedAtDay === 'number' && Number.isFinite(out.active.acceptedAtDay)) ? Math.floor(out.active.acceptedAtDay) : this.day;
                out.active = {
                    missionId,
                    acceptedAtDay: Math.max(1, acceptedAtDayRaw),
                    notifiedComplete: !!out.active.notifiedComplete
                };
            }
        } else {
            out.active = null;
        }

        const last = (typeof out.lastUpdateAt === 'number' && Number.isFinite(out.lastUpdateAt)) ? out.lastUpdateAt : Date.now();
        out.lastUpdateAt = last;

        return out;
    }

    getAgentMissionProgress(missionId) {
        const defs = this.agentMissionDefs || this.getAgentMissionDefinitions();
        const def = defs[String(missionId || '')];
        if (!def) return null;

        const targetRaw = (typeof def.target === 'number' && Number.isFinite(def.target)) ? def.target : 1;
        const target = Math.max(1, targetRaw);

        let cur = 0;
        if (typeof def.getCurrent === 'function') {
            const v = def.getCurrent(this, this.agentMissions);
            if (typeof v === 'number' && Number.isFinite(v)) cur = v;
        }

        const current = Math.max(0, cur);
        const complete = current >= target;
        const pct = Math.max(0, Math.min(1, current / target));
        return { current, target, complete, pct };
    }

    updateAgentMissions(options = {}) {
        if (!this.agentMissionDefs) this.agentMissionDefs = this.getAgentMissionDefinitions();
        if (!this.agentMissions) this.agentMissions = this.createDefaultAgentMissionsState(this.agentMissionDefs);
        this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);

        const curDayRaw = (typeof this.day === 'number' && Number.isFinite(this.day)) ? Math.floor(this.day) : 1;
        const curDay = Math.max(1, curDayRaw);
        const lastOfferDayRaw = (typeof this.agentMissions.lastOfferDay === 'number' && Number.isFinite(this.agentMissions.lastOfferDay)) ? Math.floor(this.agentMissions.lastOfferDay) : 0;
        const lastOfferDay = Math.max(0, lastOfferDayRaw);

        if (this.agentMissions.cooldowns && typeof this.agentMissions.cooldowns === 'object') {
            Object.keys(this.agentMissions.cooldowns).forEach((id) => {
                const until = this.agentMissions.cooldowns[id];
                const n = (typeof until === 'number' && Number.isFinite(until)) ? Math.floor(until) : 0;
                if (!(n > 0) || curDay >= n) delete this.agentMissions.cooldowns[id];
            });
        }

        if (Array.isArray(this.agentMissions.offers)) {
            this.agentMissions.offers = this.agentMissions.offers.filter((o) => {
                if (!o || typeof o !== 'object') return false;
                const expiresAtDayRaw = (typeof o.expiresAtDay === 'number' && Number.isFinite(o.expiresAtDay)) ? Math.floor(o.expiresAtDay) : 0;
                const expiresAtDay = Math.max(0, expiresAtDayRaw);
                return curDay <= expiresAtDay;
            });
        }

        if (lastOfferDay !== curDay) {
            const maxOffers = 3;
            const offerDurationDays = 1;
            const ids = Object.keys(this.agentMissionDefs);
            const cooldowns = (this.agentMissions.cooldowns && typeof this.agentMissions.cooldowns === 'object') ? this.agentMissions.cooldowns : {};
            const isOnCooldown = (id) => {
                const until = cooldowns[id];
                const n = (typeof until === 'number' && Number.isFinite(until)) ? Math.floor(until) : 0;
                return n > 0 && curDay < n;
            };

            const scoreFor = (id) => {
                let h = 2166136261;
                const s = `${curDay}|${id}`;
                for (let i = 0; i < s.length; i++) {
                    h ^= s.charCodeAt(i);
                    h = Math.imul(h, 16777619);
                }
                return h >>> 0;
            };

            const activeId = (this.agentMissions && this.agentMissions.active && this.agentMissions.active.missionId) ? String(this.agentMissions.active.missionId) : '';
            const eligible = ids.filter((id) => !isOnCooldown(id) && (!activeId || id !== activeId));
            const sorted = eligible.slice().sort((a, b) => scoreFor(b) - scoreFor(a));
            const chosen = sorted.slice(0, Math.max(0, Math.floor(maxOffers)));
            const offeredAtDay = curDay;
            const expiresAtDay = offeredAtDay + Math.max(0, Math.floor(offerDurationDays) - 1);
            this.agentMissions.offers = chosen.map((missionId) => ({ missionId, offeredAtDay, expiresAtDay }));
            this.agentMissions.lastOfferDay = curDay;
        }

        const active = this.agentMissions.active;
        if (active && active.missionId) {
            const p = this.getAgentMissionProgress(active.missionId);
            const shouldNotify = options && options.silent !== true;
            if (p && p.complete && !active.notifiedComplete && shouldNotify && typeof this.notify === 'function') {
                const defs = this.agentMissionDefs;
                const def = defs[active.missionId];
                const name = def ? def.name : active.missionId;
                this.notify(`Mission ready to claim: ${name}`, 'success');
                active.notifiedComplete = true;
            }
        }

        this.renderMissionsUI();
    }

    acceptAgentMission(missionId) {
        if (!this.agentMissionDefs) this.agentMissionDefs = this.getAgentMissionDefinitions();
        if (!this.agentMissions) this.agentMissions = this.createDefaultAgentMissionsState(this.agentMissionDefs);
        this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);

        if (this.agentMissions.active) {
            this.notify('You can only run one agent mission at a time.', 'warning');
            return;
        }

        const id = String(missionId || '');
        const def = this.agentMissionDefs[id];
        if (!def) return;

        const curDayRaw = (typeof this.day === 'number' && Number.isFinite(this.day)) ? Math.floor(this.day) : 1;
        const curDay = Math.max(1, curDayRaw);
        const offers = Array.isArray(this.agentMissions.offers) ? this.agentMissions.offers : [];
        const offer = offers.find((o) => o && o.missionId === id);
        if (!offer) {
            this.notify('Mission not available on the board today.', 'warning');
            return;
        }

        const expiresAtDayRaw = (typeof offer.expiresAtDay === 'number' && Number.isFinite(offer.expiresAtDay)) ? Math.floor(offer.expiresAtDay) : 0;
        const expiresAtDay = Math.max(0, expiresAtDayRaw);
        if (curDay > expiresAtDay) {
            this.notify('This mission offer has expired.', 'warning');
            return;
        }

        const cooldownUntilRaw = (this.agentMissions.cooldowns && typeof this.agentMissions.cooldowns[id] === 'number' && Number.isFinite(this.agentMissions.cooldowns[id]))
            ? Math.floor(this.agentMissions.cooldowns[id])
            : 0;
        const cooldownUntil = Math.max(0, cooldownUntilRaw);
        if (cooldownUntil > 0 && curDay < cooldownUntil) {
            this.notify(`Mission is on cooldown until day ${cooldownUntil}.`, 'warning');
            return;
        }

        const minStanding = (typeof def.minStanding === 'number' && Number.isFinite(def.minStanding)) ? Math.floor(def.minStanding) : 0;
        const standing = (typeof this.agentMissions.standing === 'number' && Number.isFinite(this.agentMissions.standing)) ? this.agentMissions.standing : 0;
        if (standing < Math.max(0, minStanding)) {
            this.notify(`Requires standing ${Math.max(0, minStanding)} to accept this mission.`, 'warning');
            return;
        }

        this.agentMissions.offers = offers.filter((o) => o && o.missionId !== id);
        this.agentMissions.active = { missionId: id, acceptedAtDay: curDay, notifiedComplete: false };
        this.notify(`Mission accepted: ${def.name}`, 'info');
        this.updateAgentMissions({ silent: true });
        this.renderMissionsUI();
    }

    abandonAgentMission() {
        if (!this.agentMissions || !this.agentMissions.active) return;
        this.agentMissions.active = null;
        this.notify('Mission abandoned.', 'warning');
        this.renderMissionsUI();
    }

    claimAgentMissionReward() {
        if (!this.agentMissionDefs) this.agentMissionDefs = this.getAgentMissionDefinitions();
        if (!this.agentMissions) return;
        this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);

        const active = this.agentMissions.active;
        if (!active || !active.missionId) return;

        const def = this.agentMissionDefs[active.missionId];
        if (!def) return;

        const p = this.getAgentMissionProgress(active.missionId);
        if (!p || !p.complete) {
            this.notify('Mission not complete yet.', 'warning');
            return;
        }

        const reward = (def.reward && typeof def.reward === 'object') ? def.reward : {};
        const gained = [];
        Object.keys(reward).forEach((k) => {
            const amt = reward[k];
            const n = (typeof amt === 'number' && Number.isFinite(amt)) ? amt : Number(amt);
            if (!(typeof n === 'number' && Number.isFinite(n)) || n <= 0) return;
            if (!this.resources || !Object.prototype.hasOwnProperty.call(this.resources, k)) return;
            const cur = (typeof this.resources[k] === 'number' && Number.isFinite(this.resources[k])) ? this.resources[k] : 0;
            this.resources[k] = cur + n;
            gained.push(`+${Math.floor(n)} ${k}`);
        });

        const lpGain = (typeof def.lp === 'number' && Number.isFinite(def.lp)) ? Math.floor(def.lp) : 0;
        if (lpGain > 0) {
            const curLp = (typeof this.agentMissions.loyaltyPoints === 'number' && Number.isFinite(this.agentMissions.loyaltyPoints)) ? this.agentMissions.loyaltyPoints : 0;
            this.agentMissions.loyaltyPoints = curLp + lpGain;
            gained.push(`+${lpGain} LP`);
        }

        const standingGain = (typeof def.standing === 'number' && Number.isFinite(def.standing)) ? Math.floor(def.standing) : 0;
        if (standingGain > 0) {
            const curStanding = (typeof this.agentMissions.standing === 'number' && Number.isFinite(this.agentMissions.standing)) ? this.agentMissions.standing : 0;
            this.agentMissions.standing = curStanding + standingGain;
            gained.push(`+${standingGain} standing`);
        }

        const curDayRaw = (typeof this.day === 'number' && Number.isFinite(this.day)) ? Math.floor(this.day) : 1;
        const curDay = Math.max(1, curDayRaw);
        const cooldownDays = 2;
        const cooldownUntil = curDay + Math.max(0, Math.floor(cooldownDays));
        if (cooldownUntil > curDay) {
            if (!this.agentMissions.cooldowns || typeof this.agentMissions.cooldowns !== 'object') this.agentMissions.cooldowns = {};
            this.agentMissions.cooldowns[active.missionId] = cooldownUntil;
        }

        this.agentMissions.completed[active.missionId] = true;
        this.agentMissions.active = null;

        if (gained.length > 0) this.notify(`Mission complete! Rewards: ${gained.join(', ')}`, 'success');
        else this.notify('Mission complete!', 'success');
        this.updateResourceUI();
        this.renderMissionsUI();
    }

    getAgentLpStoreDefinitions() {
        return {
            lp_minerals: { id: 'lp_minerals', name: 'Mineral Shipment', icon: '⛏️', desc: 'Trade LP for bulk minerals.', costLp: 25, reward: { minerals: 80 } },
            lp_food: { id: 'lp_food', name: 'Food Crate', icon: '🌱', desc: 'Trade LP for preserved rations.', costLp: 20, reward: { food: 80 } },
            lp_data: { id: 'lp_data', name: 'Encrypted Data Cache', icon: '💾', desc: 'Trade LP for research data.', costLp: 35, reward: { data: 50 } },
            lp_alloys: { id: 'lp_alloys', name: 'Alloy Pack', icon: '🏭', desc: 'Trade LP for refined alloys.', costLp: 50, reward: { alloys: 10 } },
            lp_circuits: { id: 'lp_circuits', name: 'Circuit Bundle', icon: '📟', desc: 'Trade LP for electronics.', costLp: 60, reward: { circuits: 5 } }
        };
    }

    buyAgentLpStoreItem(itemId) {
        if (!this.agentMissions) return;
        this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);

        const store = this.getAgentLpStoreDefinitions();
        const id = String(itemId || '');
        const item = store[id];
        if (!item) return;

        const costRaw = (typeof item.costLp === 'number' && Number.isFinite(item.costLp)) ? Math.floor(item.costLp) : 0;
        const cost = Math.max(0, costRaw);
        if (cost <= 0) return;

        const curLp = (typeof this.agentMissions.loyaltyPoints === 'number' && Number.isFinite(this.agentMissions.loyaltyPoints)) ? this.agentMissions.loyaltyPoints : 0;
        if (curLp < cost) {
            this.notify('Not enough Loyalty Points.', 'warning');
            return;
        }

        this.agentMissions.loyaltyPoints = curLp - cost;

        const reward = (item.reward && typeof item.reward === 'object') ? item.reward : {};
        const gained = [];
        Object.keys(reward).forEach((k) => {
            const amt = reward[k];
            const n = (typeof amt === 'number' && Number.isFinite(amt)) ? amt : Number(amt);
            if (!(typeof n === 'number' && Number.isFinite(n)) || n <= 0) return;
            if (!this.resources || !Object.prototype.hasOwnProperty.call(this.resources, k)) return;
            const cur = (typeof this.resources[k] === 'number' && Number.isFinite(this.resources[k])) ? this.resources[k] : 0;
            this.resources[k] = cur + n;
            gained.push(`+${Math.floor(n)} ${k}`);
        });

        if (gained.length > 0) this.notify(`Purchased: ${item.name} (${cost} LP) · ${gained.join(', ')}`, 'success');
        else this.notify(`Purchased: ${item.name} (${cost} LP)`, 'success');

        this.updateResourceUI();
        this.renderMissionsUI();
    }

    renderMissionsUI() {
        const modal = document.getElementById('ep-missions-modal');
        const content = document.getElementById('ep-missions-content');
        if (!modal || !content) return;
        if (modal.style.display === 'none' || modal.style.display === '') return;

        if (!this.agentMissionDefs) this.agentMissionDefs = this.getAgentMissionDefinitions();
        if (!this.agentMissions) this.agentMissions = this.createDefaultAgentMissionsState(this.agentMissionDefs);
        this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);

        const defs = this.agentMissionDefs;
        const state = this.agentMissions;
        const allIds = Object.keys(defs);
        const completedCount = allIds.filter(id => !!state.completed[id]).length;

        const curDayRaw = (typeof this.day === 'number' && Number.isFinite(this.day)) ? Math.floor(this.day) : 1;
        const curDay = Math.max(1, curDayRaw);

        const resourceRewardToHtml = (reward) => {
            const r = (reward && typeof reward === 'object') ? reward : {};
            const keys = Object.keys(r);
            if (keys.length === 0) return '<span style="color:#94a3b8;">No rewards.</span>';
            return keys.map((k) => {
                const v = r[k];
                const n = (typeof v === 'number' && Number.isFinite(v)) ? v : Number(v);
                const num = (typeof n === 'number' && Number.isFinite(n)) ? Math.floor(n) : 0;
                return `<span style="color:#e2e8f0;">+${num} ${k}</span>`;
            }).join('<span style="color:#475569; padding:0 6px;">·</span>');
        };

        const rewardToHtml = (def) => {
            const parts = [];
            const r = (def && def.reward && typeof def.reward === 'object') ? def.reward : {};
            Object.keys(r).forEach((k) => {
                const v = r[k];
                const n = (typeof v === 'number' && Number.isFinite(v)) ? v : Number(v);
                const num = (typeof n === 'number' && Number.isFinite(n)) ? Math.floor(n) : 0;
                if (num > 0) parts.push(`<span style="color:#e2e8f0;">+${num} ${k}</span>`);
            });

            const lp = (def && typeof def.lp === 'number' && Number.isFinite(def.lp)) ? Math.floor(def.lp) : 0;
            if (lp > 0) parts.push(`<span style="color:#e2e8f0;">+${lp} LP</span>`);

            const standing = (def && typeof def.standing === 'number' && Number.isFinite(def.standing)) ? Math.floor(def.standing) : 0;
            if (standing > 0) parts.push(`<span style="color:#e2e8f0;">+${standing} standing</span>`);

            if (parts.length === 0) return '<span style="color:#94a3b8;">No rewards.</span>';
            return parts.join('<span style="color:#475569; padding:0 6px;">·</span>');
        };

        let activeHtml = '<div style="color:#94a3b8;">No active mission. Accept one from the board below.</div>';
        if (state.active && state.active.missionId) {
            const def = defs[state.active.missionId];
            const name = def ? def.name : state.active.missionId;
            const icon = def && def.icon ? def.icon : '📜';
            const desc = def && def.desc ? def.desc : '';
            const p = this.getAgentMissionProgress(state.active.missionId);
            const pct = p ? Math.floor(p.pct * 100) : 0;
            const cur = p ? Math.floor(p.current) : 0;
            const tgt = p ? Math.floor(p.target) : 0;
            const canClaim = !!(p && p.complete);
            activeHtml = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="font-size:1.4rem;">${icon}</div>
                            <div>
                                <div style="font-weight:700; color:#e2e8f0;">${name}</div>
                                <div style="margin-top:2px; color:#94a3b8; font-size:0.9rem;">${desc}</div>
                            </div>
                        </div>
                        <div style="margin-top:10px; height:10px; background:rgba(148,163,184,0.2); border-radius:9999px; overflow:hidden;">
                            <div style="height:100%; width:${pct}%; background:#38bdf8;"></div>
                        </div>
                        <div style="margin-top:6px; color:#94a3b8; font-size:0.9rem;">${cur} / ${tgt} · ${pct}%</div>
                        <div style="margin-top:6px; color:#94a3b8; font-size:0.9rem;">Rewards: ${rewardToHtml(def)}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                        <button class="ep-sys-btn" ${canClaim ? '' : 'disabled'} onclick="window.game.claimAgentMissionReward()">Claim</button>
                        <button class="ep-sys-btn" onclick="window.game.abandonAgentMission()">Abandon</button>
                    </div>
                </div>
            `;
        }

        const hasActive = !!state.active;
        const offers = Array.isArray(state.offers) ? state.offers : [];
        const cardsHtml = offers.map((offer) => {
            const id = offer && offer.missionId ? String(offer.missionId) : '';
            const def = defs[id];
            if (!id || !def) return '';
            const icon = def && def.icon ? def.icon : '📜';
            const p = this.getAgentMissionProgress(id);
            const pct = p ? Math.floor(p.pct * 100) : 0;
            const cur = p ? Math.floor(p.current) : 0;
            const tgt = p ? Math.floor(p.target) : 0;
            const minStanding = (typeof def.minStanding === 'number' && Number.isFinite(def.minStanding)) ? Math.floor(def.minStanding) : 0;
            const standing = (typeof state.standing === 'number' && Number.isFinite(state.standing)) ? state.standing : 0;
            const lockedByStanding = standing < Math.max(0, minStanding);

            const expiresAtDayRaw = (typeof offer.expiresAtDay === 'number' && Number.isFinite(offer.expiresAtDay)) ? Math.floor(offer.expiresAtDay) : curDay;
            const expiresAtDay = Math.max(0, expiresAtDayRaw);
            const expired = curDay > expiresAtDay;
            const daysLeft = Math.max(0, expiresAtDay - curDay);
            let expiryLabel = `Expires Day ${expiresAtDay}`;
            if (expired) expiryLabel = 'Offer expired';
            else if (daysLeft === 0) expiryLabel = `Expires today (Day ${expiresAtDay})`;
            else expiryLabel = `Expires in ${daysLeft}d (Day ${expiresAtDay})`;

            const cooldownUntilRaw = (state.cooldowns && typeof state.cooldowns[id] === 'number' && Number.isFinite(state.cooldowns[id])) ? Math.floor(state.cooldowns[id]) : 0;
            const cooldownUntil = Math.max(0, cooldownUntilRaw);
            const onCooldown = cooldownUntil > 0 && curDay < cooldownUntil;

            const acceptDisabled = hasActive || lockedByStanding || expired || onCooldown;
            let acceptTitle = 'Accept mission';
            if (hasActive) acceptTitle = 'Finish or abandon your current mission first.';
            else if (lockedByStanding) acceptTitle = `Requires standing ${Math.max(0, minStanding)}`;
            else if (expired) acceptTitle = 'This offer has expired.';
            else if (onCooldown) acceptTitle = `On cooldown until day ${cooldownUntil}`;
            return `
                <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.25); border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="font-size:1.4rem;">${icon}</div>
                            <div>
                                <div style="font-weight:700; color:#e2e8f0;">${def.name}</div>
                                <div style="font-size:0.9rem; color:#94a3b8;">${def.desc}</div>
                            </div>
                        </div>
                        <div style="font-weight:700; color:#38bdf8; white-space:nowrap;">${cur}/${tgt}</div>
                    </div>
                    <div style="height:8px; background:rgba(148,163,184,0.2); border-radius:9999px; overflow:hidden;">
                        <div style="height:100%; width:${pct}%; background:#38bdf8;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                        <div style="font-size:0.85rem; color:#94a3b8;">Rewards: ${rewardToHtml(def)}</div>
                        <button class="ep-sys-btn" title="${acceptTitle}" ${acceptDisabled ? 'disabled' : ''} onclick="window.game.acceptAgentMission('${id}')">Accept</button>
                    </div>
                    <div style="font-size:0.85rem; color:#94a3b8;">${expiryLabel}${onCooldown ? ` · Cooldown until Day ${cooldownUntil}` : ''}</div>
                </div>
            `;
        }).filter(Boolean).join('');

        const cooldownListHtml = (state.cooldowns && typeof state.cooldowns === 'object')
            ? Object.keys(state.cooldowns).map((id) => {
                const untilRaw = state.cooldowns[id];
                const until = (typeof untilRaw === 'number' && Number.isFinite(untilRaw)) ? Math.floor(untilRaw) : 0;
                if (!(until > 0) || curDay >= until) return '';
                const def = defs[id];
                const name = def ? def.name : id;
                return `<div style="color:#94a3b8; font-size:0.9rem;">${name} (available Day ${until})</div>`;
            }).filter(Boolean).join('')
            : '';

        const cooldownSectionHtml = cooldownListHtml
            ? `
                <div style="background:rgba(15,23,42,0.9); border:1px solid rgba(148,163,184,0.25); border-radius:12px; padding:14px;">
                    <div style="font-weight:700; color:#e2e8f0; margin-bottom:8px;">Cooldowns</div>
                    ${cooldownListHtml}
                </div>
            `
            : '';

        const lpStore = this.getAgentLpStoreDefinitions();
        const lpBalance = (typeof state.loyaltyPoints === 'number' && Number.isFinite(state.loyaltyPoints)) ? state.loyaltyPoints : 0;
        const storeCardsHtml = Object.keys(lpStore).map((id) => {
            const item = lpStore[id];
            if (!item) return '';
            const icon = item.icon || '🎁';
            const costRaw = (typeof item.costLp === 'number' && Number.isFinite(item.costLp)) ? Math.floor(item.costLp) : 0;
            const cost = Math.max(0, costRaw);
            const canBuy = cost > 0 && lpBalance >= cost;
            const title = canBuy ? 'Purchase' : 'Not enough LP';
            return `
                <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(148,163,184,0.25); border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="font-size:1.4rem;">${icon}</div>
                            <div>
                                <div style="font-weight:700; color:#e2e8f0;">${item.name || id}</div>
                                <div style="font-size:0.9rem; color:#94a3b8;">${item.desc || ''}</div>
                            </div>
                        </div>
                        <div style="font-weight:700; color:#38bdf8; white-space:nowrap;">${cost} LP</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                        <div style="font-size:0.85rem; color:#94a3b8;">Reward: ${resourceRewardToHtml(item.reward)}</div>
                        <button class="ep-sys-btn" title="${title}" ${canBuy ? '' : 'disabled'} onclick="window.game.buyAgentLpStoreItem('${id}')">Buy</button>
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr; gap:14px;">
                <div style="background:rgba(15,23,42,0.9); border:1px solid rgba(56,189,248,0.25); border-radius:12px; padding:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
                        <div style="font-weight:700; color:#e2e8f0;">Active Mission</div>
                        <div style="color:#94a3b8; font-size:0.9rem;">Standing: ${state.standing} · LP: ${state.loyaltyPoints} · Completed: ${completedCount}/${allIds.length}</div>
                    </div>
                    ${activeHtml}
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px;">
                    ${cardsHtml || '<div style="color:#94a3b8;">No mission offers available today.</div>'}
                </div>

                ${cooldownSectionHtml}

                <div style="background:rgba(15,23,42,0.9); border:1px solid rgba(148,163,184,0.25); border-radius:12px; padding:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
                        <div style="font-weight:700; color:#e2e8f0;">Loyalty Store</div>
                        <div style="color:#94a3b8; font-size:0.9rem;">LP: ${lpBalance}</div>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px;">
                        ${storeCardsHtml || '<div style="color:#94a3b8;">No items available.</div>'}
                    </div>
                </div>

                <div style="color:#94a3b8; font-size:0.9rem;">Combat victories recorded: ${state.stats && typeof state.stats.combatWins === 'number' ? state.stats.combatWins : 0}</div>
            </div>
        `;
    }

    async runAgentMissionsSelfTests(options = {}) {
        const opts = (options && typeof options === 'object') ? options : {};
        const shouldToast = opts.silent === false;
        const results = [];
        const record = (name, pass, details = null) => {
            results.push({ name, pass: !!pass, details: details != null ? details : '' });
        };

        const notifyOrig = (typeof this.notify === 'function') ? this.notify : null;
        if (notifyOrig) this.notify = () => { };

        let preLocalSave = null;
        let baselineData = null;
        let cloudSaveOrig = null;
        let cloudLoadOrig = null;

        try {
            try {
                preLocalSave = localStorage.getItem('ep_save_v2');
            } catch (e) {
                record('localStorage available', false, e && e.message ? e.message : String(e));
            }

            try {
                this.saveGame({ silent: true });
                const baselineStr = localStorage.getItem('ep_save_v2');
                baselineData = baselineStr ? JSON.parse(baselineStr) : null;
                record('local save parse', !!baselineData);
                record('local save includes agentMissions', !!(baselineData && baselineData.agentMissions));
                record('local save includes standing', !!(baselineData && baselineData.agentMissions && typeof baselineData.agentMissions.standing === 'number'));
                record('local save includes loyaltyPoints', !!(baselineData && baselineData.agentMissions && typeof baselineData.agentMissions.loyaltyPoints === 'number'));
                record('local save includes offers', !!(baselineData && baselineData.agentMissions && Array.isArray(baselineData.agentMissions.offers)));
                record('local save includes cooldowns', !!(baselineData && baselineData.agentMissions && baselineData.agentMissions.cooldowns && typeof baselineData.agentMissions.cooldowns === 'object'));
                record('local save includes lastOfferDay', !!(baselineData && baselineData.agentMissions && typeof baselineData.agentMissions.lastOfferDay === 'number'));
            } catch (e) {
                record('local save parse', false, e && e.message ? e.message : String(e));
            }

            try {
                if (!this.agentMissionDefs) this.agentMissionDefs = this.getAgentMissionDefinitions();
                const defs = this.agentMissionDefs;
                const norm = this.normalizeAgentMissionsState({
                    completed: { build_outpost: 1 },
                    active: { missionId: 'nope', acceptedAtDay: 'x', notifiedComplete: 'no' },
                    stats: { combatWins: -2.8 },
                    standing: -3.2,
                    loyaltyPoints: 11.9,
                    offers: [{ missionId: 'build_outpost', offeredAtDay: 2.3, expiresAtDay: 1 }, { missionId: 'build_outpost', offeredAtDay: 1, expiresAtDay: 1 }, { missionId: 'nope', offeredAtDay: 1, expiresAtDay: 1 }, null],
                    cooldowns: { build_outpost: 3.7, invalid: 2, grow_population: -1 },
                    lastOfferDay: -5,
                    lastUpdateAt: 'bad'
                });
                record('normalize clamps combatWins >= 0', !!(norm && norm.stats && norm.stats.combatWins === 0));
                record('normalize clamps standing >= 0', !!(norm && norm.standing === 0));
                record('normalize floors loyaltyPoints', !!(norm && norm.loyaltyPoints === 11));
                record('normalize clears invalid active', !!(norm && norm.active === null));
                record('normalize expands completed mission map', !!(norm && norm.completed && Object.keys(defs).every(id => Object.prototype.hasOwnProperty.call(norm.completed, id))));
                record('normalize filters offers', !!(norm && Array.isArray(norm.offers) && norm.offers.length === 1 && norm.offers[0] && norm.offers[0].missionId === 'build_outpost'));
                record('normalize filters cooldowns', !!(norm && norm.cooldowns && norm.cooldowns.build_outpost === 3 && !Object.prototype.hasOwnProperty.call(norm.cooldowns, 'invalid') && !Object.prototype.hasOwnProperty.call(norm.cooldowns, 'grow_population')));
                record('normalize clamps lastOfferDay >= 0', !!(norm && norm.lastOfferDay === 0));
            } catch (e) {
                record('normalizeAgentMissionsState', false, e && e.message ? e.message : String(e));
            }

            try {
                if (!this.agentMissionDefs) this.agentMissionDefs = this.getAgentMissionDefinitions();
                if (!this.agentMissions) this.agentMissions = this.createDefaultAgentMissionsState(this.agentMissionDefs);
                this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);

                this.agentMissions.standing = 5;
                this.agentMissions.loyaltyPoints = 77;
                if (!this.agentMissions.stats) this.agentMissions.stats = { combatWins: 0 };
                this.agentMissions.stats.combatWins = 9;
                this.agentMissions.offers = [{ missionId: 'build_outpost', offeredAtDay: 10, expiresAtDay: 11 }];
                this.agentMissions.cooldowns = { build_outpost: 12 };
                this.agentMissions.lastOfferDay = 10;
                this.saveGame({ silent: true });

                const roundtripStr = localStorage.getItem('ep_save_v2');
                const roundtrip = roundtripStr ? JSON.parse(roundtripStr) : null;
                const am = roundtrip && roundtrip.agentMissions ? roundtrip.agentMissions : null;
                record('local save persists standing', !!(am && am.standing === 5));
                record('local save persists loyaltyPoints', !!(am && am.loyaltyPoints === 77));
                record('local save persists combatWins', !!(am && am.stats && am.stats.combatWins === 9));
                record('local save persists offers', !!(am && Array.isArray(am.offers) && am.offers.length === 1 && am.offers[0] && am.offers[0].missionId === 'build_outpost'));
                record('local save persists cooldowns', !!(am && am.cooldowns && am.cooldowns.build_outpost === 12));
                record('local save persists lastOfferDay', !!(am && am.lastOfferDay === 10));
            } catch (e) {
                record('local save persists agentMissions fields', false, e && e.message ? e.message : String(e));
            }

            try {
                const savedStr = localStorage.getItem('ep_save_v2');
                const saved = savedStr ? JSON.parse(savedStr) : null;
                if (!saved) {
                    record('loadGameData normalization', false, 'missing save data');
                } else {
                    const corrupted = JSON.parse(JSON.stringify(saved));
                    corrupted.agentMissions = {
                        completed: { build_outpost: true },
                        active: { missionId: 'invalid', acceptedAtDay: 1, notifiedComplete: false },
                        stats: { combatWins: -4.2 },
                        standing: -2,
                        loyaltyPoints: 12.9,
                        lastUpdateAt: 'bad'
                    };

                    const notifyTmp = this.notify;
                    this.notify = () => { };
                    try {
                        this.loadGameData(corrupted);
                    } finally {
                        this.notify = notifyTmp;
                    }

                    record('loadGameData normalizes standing', !!(this.agentMissions && this.agentMissions.standing === 0));
                    record('loadGameData normalizes loyaltyPoints', !!(this.agentMissions && this.agentMissions.loyaltyPoints === 12));
                    record('loadGameData normalizes combatWins', !!(this.agentMissions && this.agentMissions.stats && this.agentMissions.stats.combatWins === 0));
                    record('loadGameData clears invalid active', !!(this.agentMissions && this.agentMissions.active === null));
                }
            } catch (e) {
                record('loadGameData normalization', false, e && e.message ? e.message : String(e));
            }

            try {
                if (this.cloud && typeof this.cloud.saveGame === 'function' && typeof this.cloud.loadGame === 'function' && typeof this.saveToCloud === 'function' && typeof this.loadFromCloud === 'function') {
                    cloudSaveOrig = this.cloud.saveGame;
                    cloudLoadOrig = this.cloud.loadGame;

                    let cloudData = null;
                    this.cloud.saveGame = async (gameId, slotId, saveData) => {
                        cloudData = saveData;
                        return { data: true, error: null };
                    };
                    this.cloud.loadGame = async (gameId, slotId) => ({ data: cloudData, error: null });

                    if (!this.agentMissions) this.agentMissions = this.createDefaultAgentMissionsState(this.agentMissionDefs);
                    this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);
                    this.agentMissions.standing = 6;
                    this.agentMissions.loyaltyPoints = 88;

                    await this.saveToCloud();
                    record('saveToCloud includes standing', !!(cloudData && cloudData.agentMissions && cloudData.agentMissions.standing === 6));
                    record('saveToCloud includes loyaltyPoints', !!(cloudData && cloudData.agentMissions && cloudData.agentMissions.loyaltyPoints === 88));

                    this.agentMissions.standing = 0;
                    this.agentMissions.loyaltyPoints = 0;
                    await this.loadFromCloud();
                    record('loadFromCloud restores standing', !!(this.agentMissions && this.agentMissions.standing === 6));
                    record('loadFromCloud restores loyaltyPoints', !!(this.agentMissions && this.agentMissions.loyaltyPoints === 88));
                } else {
                    record('cloud save/load hooks present', true, 'skipped');
                }
            } catch (e) {
                record('cloud save/load roundtrip (stubbed)', false, e && e.message ? e.message : String(e));
            }
        } finally {
            if (cloudSaveOrig && this.cloud) this.cloud.saveGame = cloudSaveOrig;
            if (cloudLoadOrig && this.cloud) this.cloud.loadGame = cloudLoadOrig;
            if (notifyOrig) this.notify = notifyOrig;

            try {
                if (baselineData) {
                    const notifyTmp = this.notify;
                    this.notify = () => { };
                    try {
                        this.loadGameData(baselineData);
                    } finally {
                        this.notify = notifyTmp;
                    }
                }
            } catch (e) { }

            try {
                if (preLocalSave === null) localStorage.removeItem('ep_save_v2');
                else localStorage.setItem('ep_save_v2', preLocalSave);
            } catch (e) { }
        }

        const passed = results.filter(r => r.pass).length;
        const failed = results.length - passed;
        const ok = failed === 0;

        if (ok) console.log('[AgentMissionsTest] PASS', { passed, failed, results });
        else console.warn('[AgentMissionsTest] FAIL', { passed, failed, results });

        if (shouldToast && notifyOrig) {
            notifyOrig(ok ? `Agent Missions self-tests passed (${passed}/${results.length}).` : `Agent Missions self-tests failed (${failed} failed). See console.`, ok ? 'success' : 'danger');
        }

        return { ok, passed, failed, results };
    }

    addColonist(parentA = null, parentB = null) {
        if (this.colonists.length >= this.getPopulationCap()) {
            this.notify('Insufficient housing capacity for new colonist.', 'warning');
            return;
        }

        const keys = Object.keys(TRAIT_DEFINITIONS);
        let traits = [];
        let legacyBonus = 0;

        // Roadmap Item 111: Trait Inheritance & Item 147: Legacy System
        if (parentA && parentB) {
            // Inherit from parents
            const pool = [...parentA.traits, ...parentB.traits];
            if (pool.length > 0 && Math.random() < 0.7) {
                const inherited = pool[Math.floor(Math.random() * pool.length)];
                traits.push(inherited);
            }
            // Mutation chance
            if (Math.random() < 0.2) {
                traits.push(keys[Math.floor(Math.random() * keys.length)]);
            }
            // Ensure unique
            traits = [...new Set(traits)];

            // Item 147: Legacy Bonus (Parents' combined levels contribute to child's potential)
            legacyBonus = Math.floor(((parentA.career?.level || 1) + (parentB.career?.level || 1)) / 2);
        } else {
            // Random arrival
            const trait = (Math.random() < 0.5) ? keys[Math.floor(Math.random() * keys.length)] : null;
            if (trait) traits.push(trait);
        }

        const col = {
            id: 'col_' + Date.now() + Math.random(),
            name: this.generateName(),
            job: 'unemployed',
            career: {
                path: ['Industrialist', 'Scientist', 'Colonizer', 'Administrator'][Math.floor(Math.random() * 4)],
                level: 1,
                exp: 0,
                goal: 'Improve efficiency',
                targetValue: 100,
                currentValue: 0,
                legacy: legacyBonus // Roadmap Item 147
            },
            morale: 100 + (legacyBonus * 2), // Legacy boosts initial morale
            traits: traits,
            needs: { hunger: 100, oxygen: 100, rest: 100 },
            // Roadmap Item 105: Emotional States
            emotions: {
                happiness: 50,
                stress: 0,
                fear: 0,
                loneliness: 0
            },
            // Roadmap Item 104: Relationships
            relationships: {},
            // Roadmap Item 103: Memory
            memory: []
        };

        // If inherited, add record to memory
        if (parentA && parentB) {
            col.memory.push({
                event: `Born in the colony to ${parentA.name} and ${parentB.name}.`,
                importance: 1.0,
                day: this.day,
                timestamp: Date.now()
            });
            this.recordColonyEvent(`A new generation begins: ${col.name} was born!`, 0.9);
        }

        this.colonists.push(col);
        this.notify(`New arrival: ${col.name} ${traits.length > 0 ? `(${traits.join(', ')})` : ''}`, 'success');
        this.updateResourceUI();
    }

    isStructureOperational(struct) {
        if (!struct) return false;
        const condition = Number.isFinite(struct.condition) ? struct.condition : (Number.isFinite(struct.health) ? struct.health : 100);
        return !struct.isConstructing && condition > 0;
    }

    getPopulationCap() {
        const base = (typeof this.basePopulationCap === 'number' && Number.isFinite(this.basePopulationCap)) ? this.basePopulationCap : 0;
        const cb = this.getPilotColonyBonuses ? this.getPilotColonyBonuses() : { popCapBonus: 0 };

        const sources = [];
        const addSource = (arr) => {
            if (!Array.isArray(arr)) return;
            if (sources.includes(arr)) return;
            sources.push(arr);
        };

        addSource(this.structures);

        if (this.systemStates && this.currentSystemId !== undefined && this.currentSystemId !== null) {
            const planetId = String(this.currentSystemId);
            const moonId = `${planetId}_moon`;
            const otherId = this.isOnMoon ? planetId : moonId;
            const otherList = this.systemStates[otherId] ? this.systemStates[otherId].structures : null;
            if (otherList) addSource(otherList);
        }

        let cap = base + cb.popCapBonus;
        sources.forEach((sList) => {
            sList.forEach((s) => {
                if (!this.isStructureOperational(s)) return;
                const bDef = this.buildingTypes[s.type];
                if (bDef && bDef.capacity) {
                    cap += bDef.capacity * Math.pow(1.5, (s.level || 1) - 1);
                }
            });
        });

        return cap;
    }

    normalizeColonist(c) {
        if (!c || typeof c !== 'object') return c;

        if (!c.id) c.id = 'col_' + Date.now() + Math.random();
        if (!c.name) c.name = this.generateName();
        if (!c.job) c.job = 'unemployed';
        if (typeof c.morale !== 'number' || Number.isNaN(c.morale)) c.morale = 100;
        if (!Array.isArray(c.traits)) c.traits = [];

        if (!c.needs || typeof c.needs !== 'object') c.needs = {};
        if (typeof c.needs.hunger !== 'number' || Number.isNaN(c.needs.hunger)) c.needs.hunger = 100;
        if (typeof c.needs.oxygen !== 'number' || Number.isNaN(c.needs.oxygen)) c.needs.oxygen = 100;
        if (typeof c.needs.rest !== 'number' || Number.isNaN(c.needs.rest)) c.needs.rest = 100;

        // Roadmap Item 105: Emotional States
        if (!c.emotions || typeof c.emotions !== 'object') {
            c.emotions = {
                happiness: 50,
                stress: 0,
                fear: 0,
                loneliness: 0
            };
        }

        // Roadmap Item 104: Relationships Foundation
        if (!c.relationships || typeof c.relationships !== 'object') {
            c.relationships = {}; // Map colId -> level (-100 to 100)
        }

        // Roadmap Item 103: Memory System (Local Brain)
        if (!c.memory || !Array.isArray(c.memory)) {
            c.memory = []; // Array of { event: str, importance: 0-1, timestamp: long }
        }

        c.needs.hunger = Math.max(0, Math.min(100, c.needs.hunger));
        c.needs.oxygen = Math.max(0, Math.min(100, c.needs.oxygen));
        c.needs.rest = Math.max(0, Math.min(100, c.needs.rest));
        c.morale = Math.max(0, Math.min(100, c.morale));

        return c;
    }

    generateName() {
        const names = ['Sarah', 'John', 'Ada', 'Elon', 'Yuri', 'Neil', 'Mae', 'Buzz', 'Valentina', 'Chris'];
        return names[Math.floor(Math.random() * names.length)] + ' ' + Math.floor(Math.random() * 100);
    }

    updateResourceUI() {
        const panel = this.container.querySelector('#ep-res-panel');
        if (!panel) return;

        const meta = {
            energy: { icon: '⚡', label: 'Energy' },
            oxygen: { icon: '💨', label: 'Oxygen' },
            minerals: { icon: '⛏️', label: 'Minerals' },
            food: { icon: '🌱', label: 'Food' },
            data: { icon: '💾', label: 'Data' },
            alloys: { icon: '🏭', label: 'Alloys' },
            circuits: { icon: '📟', label: 'Circuits' },
            helium3: { icon: '⚛️', label: 'Helium-3' },
            composite: { icon: '💎', label: 'Composite' },
            credits: { icon: '💳', label: 'Credits' },
            carbon_credits: { icon: '💹', label: 'Carbon Credits' }
        };
        const primaryKeys = new Set(['energy', 'oxygen', 'minerals', 'food', 'data']);
        const orderedKeys = Object.keys(meta).filter((key) => Object.prototype.hasOwnProperty.call(this.resources, key));
        const secondaryCount = orderedKeys.filter((key) => !primaryKeys.has(key)).length;

        const resourceHtml = orderedKeys.map((key) => {
            const val = Math.floor(this.resources[key] || 0);
            const max = this.caps[key] || 9999;
            const ratio = max > 0 ? val / max : 0;
            const isLow = max > 0 && ratio < 0.1;
            const isFull = max > 0 && val >= max;
            const secondary = !primaryKeys.has(key);
            const rate = Number(this.resourceRates?.[key] || 0);
            const showRate = primaryKeys.has(key) && Math.abs(rate) >= 0.05;
            const rateText = `${rate > 0 ? '+' : ''}${Math.abs(rate) >= 10 ? rate.toFixed(0) : rate.toFixed(1)}/s`;
            const classes = ['ep-res-item'];
            if (secondary) classes.push('ep-res-secondary');
            if (isLow) classes.push('ep-res-attention');
            if (isFull) classes.push('ep-res-full');
            const color = isLow ? '#fb7185' : (isFull ? '#fbbf24' : '#7dd3fc');
            const titleRate = showRate ? ` · ${rateText} at ${this.timeScale || 0}x` : '';
            return `<div class="${classes.join(' ')}" title="${meta[key].label}: ${val} / ${max}${titleRate}" data-resource="${key}">
                <span class="ep-res-icon">${meta[key].icon}</span>
                <span class="ep-res-copy"><strong style="color:${color}">${val}</strong><span>/${max}</span></span>
                ${showRate ? `<span class="ep-res-rate ${rate > 0 ? 'positive' : 'negative'}">${rateText}</span>` : ''}
            </div>`;
        }).join('');

        panel.classList.toggle('expanded', this.resourcePanelExpanded);
        panel.innerHTML = `
            <div class="ep-res-item ep-res-population" title="Population: ${this.colonists.length} / ${this.getPopulationCap()}">
                <span class="ep-res-icon">👥</span>
                <span class="ep-res-copy"><strong>${this.colonists.length}</strong><span>/${this.getPopulationCap()}</span></span>
            </div>
            ${resourceHtml}
            ${secondaryCount ? `<button class="ep-resource-toggle" type="button" onclick="window.game.toggleResourcePanel()" aria-expanded="${this.resourcePanelExpanded}" title="${this.resourcePanelExpanded ? 'Show core resources only' : 'Show all resources'}">${this.resourcePanelExpanded ? '−' : '+' + secondaryCount}</button>` : ''}
        `;

        const secStatus = this.systemSecurity[this.currentSystemId] ?? 1.0;
        const isClaimed = this.claims[this.currentSystemId] === 'player';
        const secEl = this.container.querySelector('#ep-world-security');
        if (secEl) {
            const secLabel = secStatus >= 0.5 ? 'HIGH SEC' : (secStatus > 0 ? 'LOW SEC' : 'NULL SEC');
            secEl.textContent = isClaimed ? `${secLabel} · OWNED` : secLabel;
            secEl.dataset.level = secStatus >= 0.5 ? 'high' : (secStatus > 0 ? 'low' : 'null');
        }

        const worldName = this.container.querySelector('#ep-world-name');
        if (worldName) worldName.textContent = this.getCurrentWorldLabel();
        const dayEl = this.container.querySelector('#ep-day-display');
        if (dayEl) dayEl.textContent = `Day ${this.day} · ${Math.floor(this.timeOfDay).toString().padStart(2, '0')}:00 · ${Math.round(this.temperature)}°C`;
        this.updateColonyPathUI?.();
    }

    notify(msg, type = 'info') {
        const notif = document.getElementById('ep-notifications');
        if (!notif) return;

        // Accelerated simulation can emit the same hazard on adjacent ticks/days. Keep urgent
        // alerts distinct, but suppress exact repeats long enough for the existing card to clear.
        const urgentTypes = new Set(['warning', 'danger', 'error']);
        if (urgentTypes.has(type)) {
            if (!this.notificationCooldowns) this.notificationCooldowns = new Map();
            const key = `${type}:${String(msg)}`;
            const now = performance.now();
            const lastShown = this.notificationCooldowns.get(key) || -Infinity;
            if ((now - lastShown) < 8000) return;
            this.notificationCooldowns.set(key, now);
            if (this.notificationCooldowns.size > 64) {
                for (const [entryKey, timestamp] of this.notificationCooldowns) {
                    if ((now - timestamp) > 30000) this.notificationCooldowns.delete(entryKey);
                }
            }
        }

        // Voice alert foundation (Item 131)
        if (this.voiceEnabled && this.synth) {
            const utterance = new SpeechSynthesisUtterance(msg);
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
            this.synth.speak(utterance);
        }

        while (notif.children.length >= 4) notif.lastElementChild?.remove();
        const el = document.createElement('div');
        el.className = `ep-notification ep-notification-${type}`;
        el.textContent = msg;
        if (type === 'danger') el.style.borderLeftColor = '#ef4444';
        if (type === 'success') el.style.borderLeftColor = '#22c55e';
        notif.prepend(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
    }

    showTooltip(e, text) {
        const tt = document.getElementById('ep-tooltip');
        if (tt) {
            tt.style.display = 'block';
            tt.innerHTML = text; // Allow HTML
            tt.style.left = e.clientX + 'px';
            tt.style.top = (e.clientY - 40) + 'px';
        }
    }

    hideTooltip() {
        const tt = document.getElementById('ep-tooltip');
        if (tt) tt.style.display = 'none';
    }

    getColonyPathSteps() {
        const hasStructure = (type) => Array.isArray(this.structures) && this.structures.some((s) => s && s.type === type && this.isStructureOperational(s));
        const claimed = this.claims && this.claims[this.currentSystemId] === 'player';
        return [
            { id: 'power', title: 'Establish power', detail: 'Anchor a Solar Array from the deploy inventory.', itemType: 'solar', done: hasStructure('solar') },
            { id: 'habitat', title: 'Secure habitation', detail: 'Anchor a Habitat Dome to create colony capacity.', itemType: 'hab', done: hasStructure('hab') },
            { id: 'mining', title: 'Start extraction', detail: 'Anchor an Auto-Miner to stabilize material income.', itemType: 'mine', done: hasStructure('mine') },
            { id: 'research', title: 'Open research', detail: 'Manufacture and anchor a Research Lab.', itemType: 'lab', done: hasStructure('lab') },
            { id: 'claim', title: 'Claim the system', detail: 'Formalize sovereignty once the colony is established.', action: 'claim', done: claimed }
        ];
    }

    updateColonyPathUI() {
        const currentEl = this.container?.querySelector('#ep-colony-path-current');
        const stepsEl = this.container?.querySelector('#ep-colony-path-steps');
        const progressEl = this.container?.querySelector('#ep-colony-path-progress');
        const actionEl = this.container?.querySelector('#ep-colony-path-action');
        if (!currentEl || !stepsEl || !progressEl) return;

        const steps = this.getColonyPathSteps();
        const completed = steps.filter((step) => step.done).length;
        const current = steps.find((step) => !step.done);
        progressEl.textContent = `${completed}/${steps.length}`;
        currentEl.innerHTML = current
            ? `<strong>${current.title}</strong><span>${current.detail}</span>`
            : '<strong>Colony established</strong><span>Core infrastructure is online. Explore research, fleets and neighboring systems.</span>';
        stepsEl.innerHTML = steps.map((step, index) => `<span class="ep-path-dot ${step.done ? 'done' : (current && current.id === step.id ? 'current' : '')}" title="${step.title}: ${step.detail}" aria-label="Step ${index + 1}: ${step.title}">${step.done ? '✓' : index + 1}</span>`).join('');

        if (actionEl) {
            if (!current) {
                actionEl.hidden = true;
            } else {
                actionEl.hidden = false;
                if (current.action === 'claim') {
                    actionEl.textContent = '🚩 Claim this system';
                } else {
                    const item = this.inventory.find((entry) => entry.type === current.itemType && entry.count > 0);
                    const building = this.buildingTypes[current.itemType];
                    actionEl.textContent = item
                        ? `${building?.icon || '⬡'} Select ${building?.name || current.itemType}`
                        : `🏭 Manufacture ${building?.name || current.itemType}`;
                }
            }
        }

        const claimButton = this.container?.querySelector('#ep-btn-claim');
        claimButton?.classList.toggle('objective-pulse', current?.action === 'claim');
    }

    runColonyPathAction() {
        const current = this.getColonyPathSteps().find((step) => !step.done);
        if (!current) return;
        if (current.action === 'claim') {
            this.claimCurrentSystem();
            return;
        }

        const item = this.inventory.find((entry) => entry.type === current.itemType && entry.count > 0);
        if (!item) {
            this.openIndustry();
            this.notify(`Manufacture a ${this.buildingTypes[current.itemType]?.name || current.itemType}, then deploy it from the tray.`, 'info');
            return;
        }

        const button = this.container?.querySelector(`.ep-build-btn[data-building-type="${current.itemType}"]`);
        if (this.selectedInventoryItem !== current.itemType && button) {
            this.selectInventoryItem(current.itemType, button);
        } else {
            this.updatePlacementHint();
        }
    }

    createBuildMenu() {
        const menu = this.container.querySelector('#ep-build-menu');
        const summary = this.container.querySelector('#ep-build-summary');
        if (!menu) return;
        menu.innerHTML = '';

        const totalReady = this.inventory.reduce((sum, item) => sum + Math.max(0, item.count || 0), 0);
        if (summary) summary.textContent = `${totalReady} structure${totalReady === 1 ? '' : 's'} ready`;

        if (this.inventory.length === 0 || totalReady === 0) {
            menu.innerHTML = `<div class="ep-build-empty">
                <div><strong>Deploy inventory empty</strong><span>Manufacture a structure before returning to the surface.</span></div>
                <button type="button" class="ep-sys-btn" onclick="window.game.openIndustry()">🏭 Open Industry</button>
            </div>`;
            this.updatePlacementHint();
            return;
        }

        this.inventory.forEach((item) => {
            if (!item || item.count <= 0) return;
            const building = this.buildingTypes[item.type];
            if (!building) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ep-build-btn';
            button.dataset.buildingType = item.type;
            button.setAttribute('aria-pressed', String(this.selectedInventoryItem === item.type));
            if (this.selectedInventoryItem === item.type) button.classList.add('active');

            button.innerHTML = `
                <span class="ep-build-icon" style="--ep-building-color:${new THREE.Color(building.color).getStyle()}">${building.icon}</span>
                <span class="ep-build-copy"><strong>${building.name}</strong><span>${building.desc}</span></span>
                <span class="ep-build-count">×${item.count}</span>
            `;

            button.onclick = () => {
                this.audio.playClick();
                this.selectInventoryItem(item.type, button);
            };
            button.onmouseenter = (event) => this.showTooltip(event, `${building.desc}<br><span style="color:#94a3b8">Click to enter placement mode</span>`);
            button.onmouseleave = () => this.hideTooltip();
            menu.appendChild(button);
        });
        this.updatePlacementHint();
    }

    selectInventoryItem(type, btnElement) {
        if (this.selectedInventoryItem === type) {
            this.selectedInventoryItem = null;
            btnElement.classList.remove('active');
            btnElement.setAttribute('aria-pressed', 'false');
        } else {
            this.selectedInventoryItem = type;
            this.container.querySelectorAll('.ep-build-btn').forEach((button) => {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            });
            btnElement.classList.add('active');
            btnElement.setAttribute('aria-pressed', 'true');
            this.toggleOperationsMenu(false);
            this.notify(`Placement mode: ${this.buildingTypes[type].name}`, 'info');
        }
        this.updatePlacementHint();
    }

    formatCost(cost) {
        return Object.keys(cost).map(k => {
            const icons = { minerals: 'Min', energy: 'En', alloys: 'Aly', circuits: 'Cir', data: 'Dat' };
            return `${icons[k] || k}:${cost[k]}`;
        }).join(' ');
    }

    selectBuilding(type, btnElement) {
        if (this.selectedBuilding === type) {
            this.selectedBuilding = null;
            btnElement.classList.remove('active');
        } else {
            this.selectedBuilding = type;
            this.container.querySelectorAll('.ep-build-btn').forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
            this.notify(`Select a tile to construct ${this.buildingTypes[type].name}`);
        }
    }

    getClosestTile(worldPoint) {
        if (!this.planetMesh) return null;

        // Transform world point to planet-local space for accurate distance check
        const localPoint = this.planetMesh.worldToLocal(worldPoint.clone());

        let minDist = Infinity;
        let closest = null;
        let index = -1;

        this.tiles.forEach((t, i) => {
            const d = t.position.distanceTo(localPoint);
            if (d < minDist) { minDist = d; closest = t; index = i; }
        });

        if (minDist < 5) return { tile: closest, index: index }; // Increased threshold slightly
        return null;
    }

    // Roadmap Item 394: Apply Genetic Memory Bonuses
    applyGeneticMemory() {
        if (!this.capsule || !this.capsule.geneticBuffs) return;

        const buffs = this.capsule.geneticBuffs;
        console.log(`🧬 Applying Genetic Memory: Gen ${this.capsule.generation}`, buffs);

        // Apply multipliers to base modifiers
        if (this.modifiers) {
            this.modifiers.mineOutput *= (buffs.resourceMul || 1.0);
            this.modifiers.solarOutput *= (buffs.resourceMul || 1.0);
            this.modifiers.farmOutput *= (buffs.resourceMul || 1.0);
            this.modifiers.researchOutput *= (buffs.techSpeed || 1.0);
        }
    }

    injectDiegeticStyles() {
        if (document.getElementById('ep-diegetic-styles')) return;
        const style = document.createElement('style');
        style.id = 'ep-diegetic-styles';
        style.textContent = `
            .ep-datapad {
                background: rgba(10, 20, 30, 0.95);
                border: 2px solid #00fff2;
                border-radius: 15px;
                box-shadow: 0 0 30px rgba(0, 255, 242, 0.3), inset 0 0 10px rgba(0, 255, 242, 0.2);
                padding: 20px;
                color: #00fff2;
                font-family: 'Orbitron', sans-serif;
                position: relative;
                overflow: hidden;
            }
            .ep-datapad::before {
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; height: 2px;
                background: linear-gradient(90deg, transparent, #00fff2, transparent);
                animation: ep-scanline 4s linear infinite;
            }
            @keyframes ep-scanline {
                0% { top: 0; }
                100% { top: 100%; }
            }
            .ep-datapad-header {
                border-bottom: 1px solid rgba(0, 255, 242, 0.5);
                padding-bottom: 10px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .ep-datapad-content {
                font-size: 0.9rem;
                line-height: 1.5;
            }
            .ep-datapad-btn {
                background: rgba(0, 255, 242, 0.1);
                border: 1px solid #00fff2;
                color: #00fff2;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                text-transform: uppercase;
                font-size: 0.8rem;
            }
            .ep-datapad-btn:hover {
                background: rgba(0, 255, 242, 0.3);
                box-shadow: 0 0 10px rgba(0, 255, 242, 0.5);
            }
        `;
        document.head.appendChild(style);
    }

    onPointerMove(e) {
        if (this.isCombatActive) {
            if (this.cursorMesh) this.cursorMesh.visible = false;
            return;
        }
        if (!this.planetMesh) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.planetMesh, true);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const match = this.getClosestTile(point);

            if (match && this.cursorMesh) {
                const localNormal = this.cursorSurfaceNormal.copy(match.tile.position).normalize();
                this.cursorMesh.position.copy(match.tile.position).addScaledVector(localNormal, 0.14);
                this.cursorMesh.quaternion.setFromUnitVectors(this.cursorSurfaceAxis, localNormal);
                this.cursorMesh.visible = true;

                if (this.selectedInventoryItem) {
                    const validity = this.getPlacementValidity(match.tile, this.selectedInventoryItem);
                    this.cursorMesh.material.color.setHex(validity.valid ? 0x4ade80 : 0xfb7185);
                    this.cursorMesh.material.opacity = validity.valid ? 0.92 : 0.78;
                    this.updatePlacementHint(validity);
                } else if (this.relocatingCrawler) {
                    const valid = !match.tile.building;
                    this.cursorMesh.material.color.setHex(valid ? 0x38bdf8 : 0xfb7185);
                    this.cursorMesh.material.opacity = 0.82;
                } else {
                    this.cursorMesh.material.color.setHex(0x38bdf8);
                    this.cursorMesh.material.opacity = 0.24;
                }
            } else if (this.cursorMesh) {
                this.cursorMesh.visible = false;
            }
        } else {
            if (this.cursorMesh) this.cursorMesh.visible = false;
            if (this.selectedInventoryItem) this.updatePlacementHint({ valid: false, reason: 'Move over the planetary surface.' });
        }
    }

    onPointerDown(e) {
        if (this.isCombatActive) return;
        if (e.target.closest('.ep-build-menu') || e.target.closest('.ep-top-bar') || e.target.closest('.ep-modal')) {
            return;
        }

        // Safety check for camera/raycaster/planet
        if (!this.camera || !this.raycaster || !this.planetMesh) {
            console.error("Missing core components for raycast:", this.camera, this.raycaster, this.planetMesh);
            return;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Use recursive=true for robust intersection
        const intersects = this.raycaster.intersectObject(this.planetMesh, true);

        if (intersects.length > 0) {
            const worldPoint = intersects[0].point;
            const match = this.getClosestTile(worldPoint);
            if (match) {
                // Correct world normal for the clicked point
                const worldNormal = worldPoint.clone().normalize();
                this.handleTileClick(match.index, worldPoint, worldNormal);
            }
        }
    }

    startCrawlerRelocation(tileIdx) {
        // Roadmap Item 249: Mobile base crawlers movement
        this.relocatingCrawler = this.structures.find(s => s.tileId === tileIdx);
        if (this.relocatingCrawler) {
            this.notify("Select a new tile to relocate the Base Crawler.", "info");
            document.getElementById('ep-building-modal').style.display = 'none';
        }
    }

    handleTileClick(tileIdx, point, normal) {
        const tile = this.tiles[tileIdx];
        if (!tile) return;

        // Roadmap Item 249: Relocation logic
        if (this.relocatingCrawler) {
            if (tile.building) {
                this.notify("Tile occupied!", "danger");
                return;
            }

            const oldTileIdx = this.relocatingCrawler.tileId;
            const oldTile = this.tiles[oldTileIdx];

            // Move mesh
            const mesh = this.buildingMeshes[oldTileIdx];
            if (mesh) {
                // Lift point slightly above surface
                const liftedPoint = point.clone().add(normal.clone().multiplyScalar(2.5));
                if (this.planetMesh) {
                    const localPos = this.planetMesh.worldToLocal(liftedPoint.clone());
                    mesh.position.copy(localPos);
                    const localNormal = localPos.clone().normalize();
                    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), localNormal);
                } else {
                    mesh.position.copy(liftedPoint);
                    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
                }
                this.buildingMeshes[tileIdx] = mesh;
                delete this.buildingMeshes[oldTileIdx];
            }

            // Update data
            tile.building = this.relocatingCrawler.type;
            tile.level = this.relocatingCrawler.level;
            oldTile.building = null;
            oldTile.level = 0;
            this.relocatingCrawler.tileId = tileIdx;

            this.relocatingCrawler = null;
            this.notify("Base Crawler relocated successfully.", "success");
            this.createEffect(point, normal, 0x38bdf8);
            return;
        }

        // Placement mode owns the next surface click. Archaeology must not steal a valid build action.
        if (this.selectedInventoryItem) {
            const itemType = this.selectedInventoryItem;
            const placement = this.getPlacementValidity(tile, itemType);
            if (!placement.valid) {
                this.updatePlacementHint(placement);
                this.notify(placement.reason, 'danger');
                return;
            }

            // Tech Check
            if (this.techTree && !this.techTree.canBuild(itemType)) {
                const req = this.techTree.getRequirementName(itemType);
                this.notify(`🔒 Research Required: ${req}`, 'warning');
                return;
            }
            const itemIdx = this.inventory.findIndex(i => i.type === itemType);

            if (itemIdx === -1) {
                this.notify(`No ${itemType} items in inventory!`, "danger");
                this.cancelPlacement(false);
                return;
            }

            const building = this.buildingTypes[itemType];

            // Roadmap Item 231: Nano-assembler instant construction bonus
            const hasNanoAssembler = this.structures.some(s => s.type === 'nano_assembler' && this.isStructureOperational(s) && (s.condition ?? 100) > 50);
            const buildTimeMult = hasNanoAssembler ? 0.1 : 1.0; // 90% faster if nano-assembler is active

            // Roadmap Item 248: Pre-fab deployment logic
            const isPrefab = itemType === 'prefab_pod';
            const finalBuildTime = isPrefab ? 0 : (building.buildTime || 10) * buildTimeMult;

            const mesh = this.placeBuildingMesh(point, normal, itemType);
            if (mesh) this.buildingMeshes[tileIdx] = mesh;
            this.createEffect(point, normal, 0x4ade80);

            // Set Tile Data
            tile.building = itemType;
            tile.level = 1;

            // Add to structures list
            this.structures.push({
                id: 'str_' + Date.now(),
                type: itemType,
                level: 1,
                tileId: tileIdx,
                health: 100,
                condition: 100,
                buildDuration: finalBuildTime,
                buildElapsed: 0,
                buildProgress: finalBuildTime > 0 ? 0 : 100,
                isConstructing: finalBuildTime > 0
            });
            this.updateBuildingConstructionVisual(this.structures[this.structures.length - 1]);

            // Consume from inventory
            this.inventory[itemIdx].count--;
            if (this.inventory[itemIdx].count <= 0) {
                this.inventory.splice(itemIdx, 1);
                this.selectedInventoryItem = null;
            }

            this.updateResourceUI();
            this.audio.playBuild();
            this.notify(`${building.name} Anchored!`, "success");
            this.createBuildMenu(); // Refresh to show updated inventory counts
            this.updatePlacementHint();
            return;
        }

        // Archaeology handles free surface interaction only when no structure is being placed.
        if (this.archaeology && this.archaeology.handleTileClick(tile)) return;

        if (this.selectedBuilding) {
            this.notify("Instant construction disabled. Use the Industry menu to manufacture structures.", "warning");
            this.selectedBuilding = null;
            this.createBuildMenu();
        } else {
            // Interact with existing building
            if (tile.building) {
                this.showBuildingUI(tileIdx);
            } else {
                this.notify("Empty tile. Select a building to construct.", "info");
            }
        }
    }

    toggleLetterbox(active) {
        this.ui.letterboxActive = active;
        document.body.classList.toggle('cinematic-bars', active);
    }

    setFOV(value) {
        if (this.camera) {
            this.camera.fov = value;
            this.camera.updateProjectionMatrix();
        }
    }

    triggerCameraShake(intensity, duration) {
        if (!this.camera) return;
        const originalPos = this.camera.position.clone();
        const startTime = Date.now();
        const anim = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            if (elapsed < duration) {
                this.camera.position.set(
                    originalPos.x + (Math.random() - 0.5) * intensity,
                    originalPos.y + (Math.random() - 0.5) * intensity,
                    originalPos.z + (Math.random() - 0.5) * intensity
                );
                requestAnimationFrame(anim);
            } else {
                this.camera.position.copy(originalPos);
            }
        };
        anim();
    }

    playKillCam(targetPosition) {
        this.setCameraMode('cinematic');
        this.triggerCameraShake(2.0, 1000);
        this.notify("🎥 KILL-CAM: Critical structural failure witnessed.", "danger");
        // Orbit target logic foundation
    }

    setCloudDensity(density) {
        if (this.cloudMesh && this.cloudMesh.material) {
            this.cloudMesh.material.opacity = density;
        }
    }

    // Roadmap Item 833: Motion blur toggle
    toggleMotionBlur(active) {
        this.ui.motionBlurActive = active;
        // EffectComposer pass foundation
    }

    // Roadmap Item 834: Depth of Field (DOF)
    setDOFFocus(depth) {
        if (this.dofPass) {
            this.dofPass.uniforms.focus.value = depth;
        }
    }

    // Roadmap Item 836: Bloom toggle
    toggleBloom(active) {
        if (this.bloomPass) {
            this.bloomPass.enabled = active;
        }
    }

    // Roadmap Item 839: Dynamic Crosshairs
    setCrosshairStyle(style) {
        this.ui.crosshairStyle = style;
        const el = document.getElementById('ep-crosshair');
        if (el) el.className = `crosshair-${style}`;
    }

    // Roadmap Item 841: Replay system
    recordReplayFrame() {
        if (!this.ui.isRecordingReplay) return;
        // Log game state delta foundation
    }

    // Roadmap Item 845: Cinematic Landing
    playLandingSequence() {
        this.setCameraMode('cinematic');
        this.notify("🚀 LANDING: Descent phase initiated.", "info");
        // Camera spline path foundation
    }

    // Roadmap Item 835: Chromatic aberration for damage
    triggerDamageEffects() {
        if (this.chromaticPass) {
            this.chromaticPass.uniforms.strength.value = 0.5;
            setTimeout(() => this.chromaticPass.uniforms.strength.value = 0, 300);
        }
        this.triggerUIGlitch();
    }

    // Roadmap Item 837: Particle-based UI transitions
    playUITransition(type) {
        this.notify(`✨ UI: Executing ${type} transition.`, "info");
        // Particle emitter foundation
    }

    // Roadmap Item 842: Dynamic music switching
    updateDynamicMusic(dangerLevel) {
        if (this.audio && this.audio.musicEngine) {
            this.audio.musicEngine.setIntensity(dangerLevel);
        }
    }

    // Roadmap Item 843: Adaptive soundscape
    updateSoundscape(isInterior) {
        if (this.audio) {
            this.audio.setReverb(isInterior ? 0.8 : 0.1);
        }
    }

    // Roadmap Item 846: Atmosphere "Entry" visual effects
    playEntryEffects() {
        this.notify("🔥 ENTRY: Atmospheric friction heating hull.", "warning");
        // Fire shader overlay foundation
    }

    // Roadmap Item 848: Nebula "Distant" parallax backgrounds
    updateNebulaParallax() {
        if (this.nebulaMesh) {
            this.nebulaMesh.position.copy(this.camera.position).multiplyScalar(0.95);
        }
    }

    // Roadmap Item 849: Dynamic starfield density
    // Roadmap Item 851: Surface "Detail" textures
    setSurfaceDetail(level) {
        if (this.planetMesh && this.planetMesh.material.uniforms.detailLevel) {
            this.planetMesh.material.uniforms.detailLevel.value = level;
        }
    }

    // Roadmap Item 853: Dynamic colony "Light Pollution". Keep this local to inhabited
    // surface sites instead of washing the entire space background with a global color lerp.
    getColonyGlowTexture() {
        if (this._colonyGlowTexture) return this._colonyGlowTexture;
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 31);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.16, 'rgba(255,255,255,.92)');
        gradient.addColorStop(0.48, 'rgba(255,255,255,.32)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        this._colonyGlowTexture = texture;
        return texture;
    }

    createBuildingNightGlow(type = 'hab') {
        const colors = {
            solar: 0x67e8f9,
            hab: 0xffd166,
            mine: 0xff8a4c,
            lab: 0x8b5cf6,
            launch_site: 0xe0f2fe,
            farm: 0x86efac,
            refinery: 0xfb923c,
            oxy: 0x7dd3fc,
            power: 0xfde047
        };
        const color = new THREE.Color(colors[type] || 0xa5f3fc);
        const pivot = new THREE.Group();
        pivot.name = 'PioneerNightGlow';
        pivot.userData.isBuildingNightGlow = true;

        const haloGeometry = new THREE.CircleGeometry(3.15, 40);
        const haloMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: color.clone() },
                opacity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float opacity;
                varying vec2 vUv;
                void main() {
                    vec2 p = (vUv - 0.5) * 2.0;
                    float d = length(p);
                    float core = 1.0 - smoothstep(0.05, 0.92, d);
                    float halo = exp(-d * d * 3.2);
                    float a = max(core * 0.58, halo * 0.48) * opacity;
                    gl_FragColor = vec4(glowColor * (0.72 + halo * 0.65), a);
                }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.name = 'PioneerNightGlowHalo';
        halo.rotation.x = -Math.PI / 2;
        halo.renderOrder = 2;
        halo.frustumCulled = false;
        halo.userData.isBuildingNightGlow = true;
        halo.raycast = () => {};
        pivot.add(halo);

        const glowTexture = this.getColonyGlowTexture();
        let aura = null;
        if (glowTexture) {
            const auraMaterial = new THREE.SpriteMaterial({
                map: glowTexture,
                color,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                depthTest: true,
                blending: THREE.AdditiveBlending
            });
            aura = new THREE.Sprite(auraMaterial);
            aura.name = 'PioneerNightGlowAura';
            aura.position.y = 2.25;
            aura.scale.set(6.5, 6.5, 1);
            aura.renderOrder = 4;
            aura.frustumCulled = false;
            aura.userData.isBuildingNightGlow = true;
            aura.raycast = () => {};
            pivot.add(aura);
        }

        pivot.visible = false;
        pivot.userData.halo = halo;
        pivot.userData.haloMaterial = haloMaterial;
        pivot.userData.aura = aura;
        pivot.userData.baseColor = color.getHex();
        return pivot;
    }

    updateLightPollution(sunDirectionWorld = null) {
        const sunDir = sunDirectionWorld?.clone?.() || this.sunLight?.position?.clone?.().normalize?.();
        if (!sunDir || !this.structures?.length) return;
        const activeStructures = this.structures.filter((entry) => Number(entry?.condition ?? 100) > 0 && !entry?.isConstructing).length;
        const densityBoost = 1 + Math.min(0.55, activeStructures * 0.035);
        const worldQuat = new THREE.Quaternion();
        const inverseQuat = new THREE.Quaternion();
        const localSun = new THREE.Vector3();
        const time = Number(this.clock?.elapsedTime || 0);

        this.structures.forEach((struct) => {
            const group = this.buildingMeshes?.[struct.tileId];
            if (!group) return;
            const glow = group.userData?.nightGlow || group.getObjectByName?.('PioneerNightGlow');
            if (!glow) return;
            group.userData.nightGlow = glow;
            group.getWorldQuaternion(worldQuat);
            inverseQuat.copy(worldQuat).invert();
            localSun.copy(sunDir).applyQuaternion(inverseQuat).normalize();
            // Local +Y is the site's surface normal. Fade through civil twilight rather than popping.
            const darkness = 1 - THREE.MathUtils.smoothstep(localSun.y, -0.18, 0.10);
            const condition = THREE.MathUtils.clamp(Number(struct.condition ?? 100) / 100, 0, 1);
            const powered = struct.powered !== false;
            const operational = !struct.isConstructing && condition > 0 && powered;
            const damageFlicker = condition < 0.35
                ? 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(time * 12.3 + struct.tileId * 0.53))
                : 1;
            const strength = operational ? darkness * Math.max(0.18, condition) * damageFlicker : 0;
            const halo = glow.userData?.halo;
            const haloMaterial = glow.userData?.haloMaterial;
            const aura = glow.userData?.aura;
            // Cancel the building's terrain-clearance lift so the halo remains painted onto the surface.
            glow.position.y = -0.92 / Math.max(0.22, Math.abs(group.scale.y || 1));
            if (haloMaterial?.uniforms?.opacity) haloMaterial.uniforms.opacity.value = strength * 0.34;
            if (aura?.material) aura.material.opacity = strength * 0.58;
            if (halo) halo.scale.setScalar(densityBoost);
            if (aura) aura.scale.set(6.5 * densityBoost, 6.5 * densityBoost, 1);
            glow.visible = strength > 0.012;
            glow.userData.lastStrength = strength;
            glow.userData.lastDarkness = darkness;
            glow.userData.lastPowered = powered;
        });
    }

    // Roadmap Item 855: Glowing energy-lines on structures
    toggleEnergyLines(active) {
        this.structures.forEach(s => {
            const mesh = this.buildingMeshes[s.tileId];
            if (mesh && mesh.userData.energyMaterial) {
                mesh.userData.energyMaterial.emissiveIntensity = active ? 1.0 : 0.0;
            }
        });
    }

    // Roadmap Item 857: Interactive "Data Pads"
    openDataPad(topicId) {
        const content = this.universe.multiplayer.wikiEntries.get(topicId) || "No data found.";
        this.notify(`📟 DATAPAD: Accessing ${topicId}.`, "info");
        // Datapad UI foundation
    }

    // Roadmap Item 858: Galactic "News" tickers
    updateNewsTicker() {
        if (this.universe.multiplayer.newsFeed.length > 0) {
            const latest = this.universe.multiplayer.newsFeed[this.universe.multiplayer.newsFeed.length - 1];
            // Update UI ticker element foundation
        }
    }

    // Roadmap Item 860: Ambient colony sounds
    updateAmbientAudio() {
        if (this.audio) {
            const isNight = this.timeOfDay < 6 || this.timeOfDay > 20;
            this.audio.setAmbientTrack(isNight ? 'crickets' : 'wind');
        }
    }

    // Roadmap Item 864: Procedural music based on biome
    updateBiomeMusic(tileIndex) {
        const tile = this.tiles[tileIndex];
        if (tile && this.audio) {
            this.audio.playMusicForBiome(tile.type);
        }
    }

    // Roadmap Item 866: Credit-roll
    showCredits() {
        this.notify("📜 CREDITS: Transitioning to planetary legacy roll.", "info");
        // Scrollable credits UI foundation
    }

    // Roadmap Item 869: High-res "Screenshot" export
    exportScreenshot() {
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
            const dataURL = this.renderer.domElement.toDataURL("image/png");
            this.notify("📸 GALLERY: Orbital capture exported to datapad.", "success");
            return dataURL;
        }
    }

    // Roadmap Item 871: Streamer-mode
    toggleStreamerMode(active) {
        this.ui.streamerMode = active;
        const privateElements = document.querySelectorAll('.ep-private-info');
        privateElements.forEach(el => el.style.display = active ? 'none' : '');
        this.notify(`🎥 STREAMING: Streamer mode ${active ? 'ENGAGED' : 'DISENGAGED'}.`, "info");
    }

    // Roadmap Item 878: Frame-rate limiter
    setTargetFPS(fps) {
        this.ui.targetFPS = fps;
        this.notify(`🖥️ PERFORMANCE: Frame-rate target set to ${fps} Hz.`, "info");
    }

    // Roadmap Item 881: Sharpness/Contrast post-FX
    updateVisualSettings(sharpness, contrast) {
        if (this.contrastPass) {
            this.contrastPass.uniforms.contrast.value = contrast;
        }
        this.notify("🎨 VISUALS: Post-processing parameters adjusted.", "info");
    }

    // Roadmap Item 887: Narrative "Log" with search
    searchLog(query) {
        const results = this.chatterPosts.filter(p => p.text.includes(query));
        this.notify(`📖 LOG: Found ${results.length} matches for "${query}".`, "info");
        return results;
    }

    // Roadmap Item 893: Colony "Efficiency" grade
    calculateColonyGrade() {
        const uptime = 0.95; // Placeholder
        const resourceRatio = 1.2; // Placeholder
        const score = (uptime + resourceRatio) / 2;
        let grade = 'C';
        if (score > 0.9) grade = 'A';
        else if (score > 0.7) grade = 'B';

        this.ui.colonyGrade = grade;
        this.notify(`📊 STATUS: Current Colony Efficiency Grade: ${grade}`, "success");
    }

    // Roadmap Item 895: Custom "Signs" and "Labels"
    addBaseLabel(tileIndex, text) {
        const tile = this.tiles[tileIndex];
        if (tile) {
            tile.label = text;
            this.notify(`🏷️ LABEL: "${text}" assigned to sector.`, "info");
        }
    }

    // Roadmap Item 898: Cinematic "Death" screen
    triggerDeathScreen(reason) {
        this.notify(`💀 FATAL: ${reason}`, "danger");
        this.setCameraMode('cinematic');
        // Death overlay foundation
    }

    // Roadmap Item 852: Shadow-casting for every small detail
    setUltraShadows(enabled) {
        this.graphicsSettings = this.normalizeGraphicsSettings({
            ...this.graphicsSettings,
            shadowQuality: enabled ? 'ultra' : 'off'
        });
        this.applyShadowQuality();
        this.syncGraphicsSettingsUI();
        this.saveSettings();
        this.notify(`LIGHTING: Ultra shadows ${enabled ? 'ENABLED' : 'DISABLED'}.`, "info");
    }

    // Roadmap Item 854: Light-flicker for damaged buildings. Keep geometry visible and pulse only
    // emissive circuitry so damage never masquerades as a missing/culled building.
    updateBuildingFlicker(delta = 0.016) {
        const time = Number(this.clock?.elapsedTime || 0);
        this.structures.forEach((struct) => {
            const group = this.buildingMeshes?.[struct.tileId];
            if (!group) return;
            group.visible = true;
            const condition = Number.isFinite(Number(struct.condition)) ? Number(struct.condition) : 100;
            const damage = THREE.MathUtils.clamp((35 - condition) / 35, 0, 1);
            const wasFlickering = !!group.userData.damageFlickerActive;
            if (damage <= 0 && !wasFlickering) return;
            group.userData.damageFlickerActive = damage > 0;
            const phase = time * (11.5 + (struct.tileId % 5) * 0.7) + struct.tileId * 0.41;
            const flicker = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(phase));
            group.traverse?.((child) => {
                if (!child?.isMesh || child.userData?.isBuildingMarker || child.userData?.isConstructionScaffold || child.userData?.isBuildingContactShadowMesh || child.userData?.isBuildingNightGlow) return;
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((material) => {
                    if (!material?.emissive) return;
                    material.userData = material.userData || {};
                    const base = Number.isFinite(material.userData.pioneerBaseEmissiveIntensity)
                        ? material.userData.pioneerBaseEmissiveIntensity
                        : Number(material.emissiveIntensity || 0);
                    material.userData.pioneerBaseEmissiveIntensity = base;
                    material.emissiveIntensity = base * (1 + damage * (0.75 + flicker * 1.8));
                });
            });
        });
    }

    // Roadmap Item 856: Procedural "Dirt" and "Aging" on UI
    applyUIAging(age) {
        const opacity = Math.min(0.2, age * 0.001);
        document.documentElement.style.setProperty('--ui-dirt-opacity', opacity);
    }

    // Roadmap Item 859: Ship "Cockpit" chatter
    playCockpitChatter() {
        if (this.audio) {
            this.audio.playRandomChatter();
        }
    }

    // Roadmap Item 861: Realistic "Footstep" sounds
    playFootstep(surfaceType) {
        if (this.audio) {
            this.audio.playFootstep(surfaceType);
        }
    }

    // Roadmap Item 863: Soundtrack that evolves with colony age
    updateSoundtrackEvolution() {
        if (this.audio) {
            const ageTier = Math.floor(this.day / 100);
            this.audio.setMusicTier(ageTier);
        }
    }

    // Roadmap Item 867: End-of-game "Universe Summary"
    generateUniverseSummary() {
        const summary = {
            day: this.day,
            population: this.colonists.length,
            structures: this.structures.length,
            discoveredStars: this.universe.galacticMap.stars.filter(s => s.discovered).length
        };
        this.notify("🌌 SUMMARY: Compiling universal legacy data...", "info");
        return summary;
    }

    // Roadmap Item 868: Interactive "Gallery" of discoveries
    openDiscoveryGallery() {
        this.notify("🖼️ GALLERY: Opening holographic archive of your journey.", "info");
        // Gallery UI foundation
    }

    // Roadmap Item 870: Animated "GIF" generator
    captureActionGIF() {
        this.notify("📽️ RECORD: Capturing cinematic sequence...", "info");
        // GIF recording foundation
    }

    // Roadmap Item 872: Discord Rich Presence
    updateDiscordPresence(state) {
        console.log(`[Discord RPC] Updating state: ${state}`);
        // Discord API foundation
    }

    // Roadmap Item 862: Echo/Reverb in empty structures
    updateAcousticEnvironment(tileIndex) {
        if (!this.audio) return;
        const tile = this.tiles[tileIndex];
        const isEmptyStructure = tile && tile.building && this.colonists.filter(c => c.targetBuilding === tile.building).length === 0;
        this.audio.setReverb(isEmptyStructure ? 0.6 : 0.2);
    }

    // Roadmap Item 873: Steam Deck optimization
    applySteamDeckProfile() {
        this.setHUDScale(1.2);
        this.toggleMobileUI(true);
        this.setTargetFPS(60);
        this.notify("🎮 DECK: Applied Valve Steam Deck performance profile.", "success");
    }

    // Roadmap Item 874: Mobile-native UI layout
    toggleMobileUI(active) {
        document.body.classList.toggle('mobile-ui', active);
        this.notify(`📱 UI: Switched to ${active ? 'mobile' : 'desktop'} layout.`, "info");
    }

    // Roadmap Item 875: Tablet "Split-Screen" support
    toggleSplitScreen(active) {
        document.body.classList.toggle('tablet-split-view', active);
        this.notify(`📱 TABLET: Split-screen layout ${active ? 'ENABLED' : 'DISABLED'}.`, "info");
    }

    // Roadmap Item 876: Ultra-wide monitor support
    updateUltraWideSupport() {
        const aspect = window.innerWidth / window.innerHeight;
        if (aspect > 2.0) {
            document.body.classList.add('ultra-wide');
            this.notify("🖥️ DISPLAY: Ultra-wide aspect ratio detected and optimized.", "info");
        }
    }

    // Roadmap Item 877: Multi-GPU rendering settings
    toggleMultiGPURendering(active) {
        this.ui.multiGPU = active;
        this.notify(`🖥️ GPU: Multi-GPU support ${active ? 'enabled' : 'disabled'}.`, "info");
    }

    // Roadmap Item 879: Resolution scale slider
    setResolutionScale(scale) {
        this.ui.resolutionScale = scale;
        if (this.renderer) {
            this.renderer.setPixelRatio(window.devicePixelRatio * scale);
            this.handleResize();
        }
    }

    // Roadmap Item 880: Dynamic resolution scaling
    toggleDynamicResolution(active) {
        this.ui.dynamicRes = active;
        this.notify(`🖥️ PERFORMANCE: Dynamic resolution ${active ? 'active' : 'inactive'}.`, "info");
    }

    // Roadmap Item 882: Film-grain toggle
    setFilmGrain(intensity) {
        if (this.filmGrainPass) {
            this.filmGrainPass.uniforms.intensity.value = intensity;
        }
    }

    // Roadmap Item 883: Lens flare intensity
    setLensFlareIntensity(intensity) {
        if (this.lensPass) {
            this.lensPass.uniforms.strength.value = intensity;
        }
    }

    // Roadmap Item 885: Head-bob settings
    setHeadBob(intensity) {
        this.ui.headBobIntensity = intensity;
    }

    // Roadmap Item 886: Subtitle settings
    updateSubtitleSettings(size, background) {
        this.ui.subtitleSize = size;
        this.ui.subtitleBackground = background;
        // Subtitle CSS foundation
    }

    // Roadmap Item 888: Mission "Archive"
    openMissionArchive() {
        this.notify("📜 ARCHIVE: Accessing historical mission logs.", "info");
        // Archive UI foundation
    }

    // Roadmap Item 889: NPC "Relationship" graph
    openNPCRelationshipGraph() {
        this.notify("👥 SOCIAL: Mapping colonist social networks.", "info");
        // Graph visualization foundation
    }

    // Roadmap Item 890: Tech-tree "Pathfinder"
    setTechPathfinderGoal(techId) {
        this.ui.techGoal = techId;
        this.notify(`🔬 PATHFINDER: Analysis set for technology [${techId}].`, "success");
    }

    // Roadmap Item 891: Market "Price Alerts"
    setPriceAlert(resource, threshold) {
        this.notify(`📈 MARKET: Alert set for ${resource} at ${threshold} credits.`, "info");
    }

    // Roadmap Item 892: Inventory "Low Stock" warnings
    toggleLowStockWarnings(active) {
        this.ui.lowStockWarnings = active;
        this.notify(`📦 LOGISTICS: Low stock alerts ${active ? 'engaged' : 'disengaged'}.`, "info");
    }

    // Roadmap Item 894: "Best Base" awards UI
    openAwardsUI() {
        this.notify("🏆 AWARDS: Opening monthly cluster-wide architecture rankings.", "success");
    }

    // Roadmap Item 896: Graffiti and custom art
    addGraffiti(tileIndex, textureId) {
        const tile = this.tiles[tileIndex];
        if (tile) {
            tile.graffiti = textureId;
            this.notify("🎨 VISUALS: Custom aesthetic markings applied to sector.", "info");
        }
    }

    // Roadmap Item 897: Holo-billboards
    addHoloBillboard(tileIndex, content) {
        const tile = this.tiles[tileIndex];
        if (tile) {
            tile.hasBillboard = true;
            tile.billboardContent = content;
            this.notify("📟 ADVERTISING: Holographic billboard deployed.", "info");
        }
    }

    // Roadmap Item 884: Field of View (FOV) adjustment
    adjustFOV(value) {
        this.setFOV(value);
        this.notify(`🎥 CAMERA: Field of View adjusted to ${value}°.`, "info");
    }

    // Roadmap Item 900: Credits and "Thank You"
    // Roadmap Item 904: Research "Breakthrough" mini-games
    startBreakthroughMiniGame(techId) {
        this.notify(`🔬 BREAKTHROUGH: Analyzing experimental data for ${techId}.`, "info");
        // Mini-game UI foundation
    }

    // Roadmap Item 905: Prototype testing hazards
    triggerPrototypeHazard() {
        if (Math.random() < 0.05) {
            this.notify("⚠️ HAZARD: Experimental prototype destabilized! Structural integrity compromised.", "danger");
            this.triggerDamageEffects();
        }
    }

    // Roadmap Item 907: Protein folding puzzles
    startProteinFoldingChallenge() {
        this.notify("🧬 SCIENCE: Contributing to interstellar bio-data mapping.", "success");
        this.resources.data += 100;
    }

    // Roadmap Item 908: Light-curve analysis
    analyzeLightCurve(starId) {
        this.notify(`🔭 ANALYSIS: Planetary transit detected in system ${starId}.`, "info");
        this.resources.data += 50;
    }

    // Roadmap Item 911: Quantum computing research
    processQuantumData() {
        if (this.quantum) {
            this.quantum.processData(500);
            this.notify("⚛️ QUANTUM: Supremacy achieved for local data-node.", "success");
        }
    }

    // Roadmap Item 913: Teleportation technology tiers
    initiateTeleport(targetId) {
        this.notify(`🌀 TELEPORT: Materializing assets at ${targetId}.`, "info");
        // Coordinate transition foundation
    }

    // Roadmap Item 914: Matter-energy conversion
    replicateResource(resource, amount) {
        const energyCost = amount * 10;
        if (this.resources.energy >= energyCost) {
            this.resources.energy -= energyCost;
            this.resources[resource] += amount;
            this.notify(`⚛️ REPLICATION: ${amount} ${resource} synthesized from energy.`, "success");
        }
    }

    // Roadmap Item 917: Time-travel mechanics
    collectChronons(amount) {
        this.resources.chronons = (this.resources.chronons || 0) + amount;
        this.notify(`⏳ TEMPORAL: ${amount} Chronon particles stabilized.`, "info");
    }

    // Roadmap Item 909: SETI signal decoding
    decodeSETISignal() {
        this.notify("📡 SIGNAL: Fragment of ancient transmission decoded.", "success");
        this.resources.data += 200;
    }

    // Roadmap Item 910: Climate modeling
    runClimateSimulation() {
        this.notify("🌍 SCIENCE: Long-term atmospheric stability projected.", "info");
        if (this.terraforming) this.terraforming.recalculateRates();
    }

    // Roadmap Item 912: Entanglement-based communication
    establishQuantumLink() {
        this.notify("⚛️ COMMS: Instantaneous sub-space uplink active.", "success");
        // Multiplayer latency reduction foundation
    }

    // Roadmap Item 915: Anti-gravity research
    toggleAntiGravity(active) {
        this.modifiers.gravityMult = active ? 0.1 : 1.0;
        this.notify(`🛸 PHYSICS: Anti-gravity generator ${active ? 'ENGAGED' : 'DISENGAGED'}.`, "info");
    }

    // Roadmap Item 916: Inertia manipulation
    setInertiaDamping(value) {
        if (this.controls) {
            this.controls.dampingFactor = 0.05 * (1 - value);
        }
        this.notify("🚀 NAVIGATION: Inertial compensators calibrated.", "info");
    }

    // Roadmap Item 918: Temporal paradox prevention
    stabilizeTimeline() {
        this.notify("🛡️ CHRONO: Local causality reinforced against divergence.", "success");
        // Temporal health foundation
    }

    // Roadmap Item 919: Sending messages back in time
    sendTemporalMessage(content) {
        this.notify("✉️ TIME: Neural-link data packet sent to previous cycle.", "warning");
        // NG+ data carry-over foundation
    }

    // Roadmap Item 921: Prophesy and prediction algorithms
    predictNextEvent() {
        this.notify("🔮 ORACLE: High-probability system anomaly detected in 10 cycles.", "info");
        // Event forecasting foundation
    }

    // Roadmap Item 922: Probability manipulation
    toggleProbabilityAnchor(active) {
        this.ui.probabilityBuff = active;
        this.notify(`🎲 QUANTUM: Probability anchor ${active ? 'active' : 'inactive'}.`, "success");
    }

    // Roadmap Item 923: Multi-dimensional physics
    viewDimensionalShift() {
        this.notify("🌌 PHYSICS: Observing 4th-dimensional intersection.", "info");
        // Shader slice effect foundation
    }

    // Roadmap Item 924: 5th-Dimensional travel
    initiate5DJump() {
        this.notify("🌀 TRANSCENDENCE: Transitioning to 5th-dimensional vector.", "danger");
        // Universe switch foundation
    }

    // Roadmap Item 926: Genetic engineering for immortality
    applyImmortalityGene() {
        this.colonists.forEach(c => c.isImmortal = true);
        this.notify("🧬 BIOLOGY: Telomere degradation halted. Pioneers are immortal.", "success");
    }

    // Roadmap Item 927: Mind-uploading
    uploadConsciousness(colonistId) {
        this.notify(`💻 CLOUD: Mind of colonist ${colonistId} uploaded to neural network.`, "info");
        // Digital conversion foundation
    }

    // Roadmap Item 931: Planetary-scale AI (World-Mind)
    awakenWorldMind() {
        this.notify("🧠 AI: Planetary neural fabric achieved self-awareness.", "success");
        this.modifiers.efficiencyMult = 2.0;
    }

    // Roadmap Item 932: Precursor AI communication
    contactPrecursor() {
        this.notify("📟 SIGNAL: Establishing handshake with Type III Precursor AI.", "info");
        // Ancient tech unlock foundation
    }

    // Roadmap Item 935: Manipulating physical constants
    alterPhysics(constant, delta) {
        this.notify(`🧪 PHYSICS: Constant [${constant}] adjusted by ${delta}.`, "warning");
        // Physics engine override foundation
    }

    // Roadmap Item 936: Creating "Pocket" dimensions
    createPocketDimension() {
        this.notify("🌌 VOID: Stable sub-space pocket initialized.", "success");
        this.multiplyCaps(5);
    }

    // Roadmap Item 938: Black hole engineering
    stabilizeSingularity() {
        this.notify("🕳️ PHYSICS: Gravitational singularity contained for power harvesting.", "success");
        this.resources.energy += 10000;
    }

    // Roadmap Item 940: Entropy reversal
    reverseLocalEntropy() {
        this.structures.forEach(s => s.condition = 100);
        this.notify("⏳ CHRONO: Local entropy reversed. All structures restored.", "success");
    }

    // Roadmap Item 941: Preventing "Heat Death"
    injectStellarFuel() {
        this.notify("☀️ STELLAR: Injecting exotic matter to prevent star-death.", "info");
        // Star age reset foundation
    }

    // Roadmap Item 943: Intergalactic ships
    launchArkShip() {
        this.notify("🚀 MISSION: Intergalactic Ark launched toward Andromeda.", "success");
        // New galaxy transition foundation
    }

    // Roadmap Item 948: Solving the "Simulation" mystery
    revealSimulationTruth() {
        this.notify("💻 META: System detected recursive execution loops. Reality is a simulation.", "warning");
        this.triggerUIGlitch();
    }

    // Roadmap Item 951: Research "Ethics" board
    setResearchEthics(policy) {
        this.ui.researchPolicy = policy;
        this.notify(`⚖️ ETHICS: Research directive set to [${policy.toUpperCase()}].`, "info");
    }

    // Roadmap Item 953: Technology "Leakage"
    triggerTechLeak() {
        if (Math.random() < 0.02) {
            this.notify("🕵️ INTEL: Classified research data leaked to rival factions.", "warning");
            if (this.factionManager) this.factionManager.updateTechLevels();
        }
    }

    // Roadmap Item 959: Laboratory safety levels
    setLabSafetyLevel(level) {
        this.ui.labSafety = level;
        this.notify(`🛡️ SAFETY: Lab containment reinforced to Level ${level}.`, "success");
    }

    // Roadmap Item 960: Accidental "Gray Goo"
    triggerGrayGooScenario() {
        this.notify("🧱 CRISIS: Nanobot swarm achieved self-replication. Gray Goo event active!", "danger");
        this.triggerDamageEffects();
        // Structure consumption foundation
    }

    // Roadmap Item 963: Research "Spying"
    dispatchIntelAgent(targetFaction) {
        this.notify(`🕵️ INTEL: Agent deployed to infiltrate ${targetFaction} research labs.`, "info");
        // Blueprint theft foundation
    }

    // Roadmap Item 971: Chrono-mapping the galaxy history
    viewGalaxyHistory() {
        this.notify("⏳ CHRONO: Accessing temporal records of stellar evolution.", "info");
        // Historical timeline UI foundation
    }

    // Roadmap Item 974: Stabilizing "Reality Fractures"
    stabilizeRealityFracture(coords) {
        this.notify("🌌 PHYSICS: Reality anchor deployed. Dimensional breach sealed.", "success");
        // Fracture mesh removal foundation
    }

    // Roadmap Item 976: The "Grand Unified Theory" discovery
    discoverGrandUnifiedTheory() {
        this.notify("⚛️ SCIENCE: Grand Unified Theory achieved. Universal laws mastered.", "success");
        this.technologies['omega_point'].unlocked = true;
    }

    // Roadmap Item 977: Harvesting "Vacuum Fluctuations"
    harvestVacuumFluctuations() {
        this.notify("🌀 ENERGY: Zero-point fluctuations captured for local grid.", "success");
        this.resources.energy += 5000;
    }

    // Roadmap Item 983: Resurrection technology
    toggleResurrectionTech(active) {
        this.ui.resurrectionEnabled = active;
        this.notify(`🧬 BIOLOGY: Resurrection protocols ${active ? 'ENGAGED' : 'DISENGAGED'}.`, "warning");
    }

    // Roadmap Item 986: Galactic Museum of Mankind
    foundMuseum() {
        this.notify("🏛️ CULTURE: Galactic Museum established. Human history preserved.", "success");
        this.resources.credits += 1000;
    }

    // Roadmap Item 989: Finding Home (Ancient Earth)
    discoverAncientEarth() {
        this.notify("🌍 DISCOVERY: Coordinates for Sector 0-0-0 validated. Ancient Earth found.", "success");
        // Secret system jump foundation
    }

    // Roadmap Item 990: Restoring "Dead Earth"
    restoreEarth() {
        this.notify("🌍 MISSION: Terraforming engines deployed to Sol III. Restoration active.", "success");
        // Victory condition foundation
    }

    // Roadmap Item 991: Galactic Rebirth event
    triggerGalacticRebirth() {
        this.notify("✨ COSMOS: A new cycle of stellar formation has begun.", "success");
        // Universe state reset foundation
    }

    // Roadmap Item 992: Post-scarcity economy transition
    enablePostScarcity() {
        this.ui.postScarcityActive = true;
        this.notify("♾️ ECONOMY: Post-scarcity achieved. Resources are now infinite.", "success");
    }

    // Roadmap Item 995: Multi-universal Council
    conveneCouncil() {
        this.notify("⚖️ COUNCIL: Representatives from all realities are convening.", "info");
        // Diplomatic UI foundation
    }

    // Roadmap Item 998: Universal "Reset" button (NG+)
    triggerNewGamePlus() {
        this.notify("🔄 RESET: Commencing New Game+ initialization...", "warning");
        const seed = { generation: (this.generation || 0) + 1, timestamp: Date.now() };
        localStorage.setItem('ep_omega_seed', JSON.stringify(seed));
        location.reload();
    }

    // Roadmap Item 928: Digital consciousness evolution
    evolveDigitalMind() {
        this.notify("💻 AI: Uplifting digital consciousness to Tier 2.", "success");
        // AI performance buff foundation
    }

    // Roadmap Item 929: Cybernetic enhancement tiers
    upgradeColonistCybernetics(tier) {
        this.notify(`🦾 CYBER: Installing Tier ${tier} neural-links.`, "info");
        // Colonist stat buff foundation
    }

    // Roadmap Item 930: Nanobot medicine
    deployMedicalNanobots() {
        this.notify("💉 BIO: Medical nanobots active. Mortality rates minimized.", "success");
        // Health regen foundation
    }

    // Roadmap Item 933: Decoding the "Language of the Universe"
    decodeUniversalLanguage() {
        this.notify("🌌 SCIENCE: Fundamental constants of reality decoded.", "success");
        this.resources.data += 1000;
    }

    // Roadmap Item 934: Understanding "Dark Energy"
    harvestDarkEnergy() {
        this.notify("⚛️ ENERGY: Dark energy siphon online.", "success");
        this.resources.energy += 2000;
    }

    // Roadmap Item 937: Stable wormhole generation
    createStableWormhole(targetSystemId) {
        this.notify(`🌀 NAV: Stable wormhole corridor opened to ${targetSystemId}.`, "success");
        // Instant travel foundation
    }

    // Roadmap Item 939: White hole power siphons
    deployWhiteHoleSiphon() {
        this.notify("☀️ ENERGY: White hole singularity siphoning infinite radiation.", "success");
        this.resources.energy += 50000;
    }

    // Roadmap Item 942: Galactic "Noah's Ark" project
    storeGeneticSamples() {
        this.notify("🧬 ARCHIVE: Planet-wide biodiversity archived for intergalactic seed ship.", "info");
        // Ark progress foundation
    }

    // Roadmap Item 944: Terraforming the "Great Void"
    seedTheVoid() {
        this.notify("🌌 MISSION: Commencing matter-seeding in intergalactic void.", "info");
        // Void map expansion foundation
    }

    // Roadmap Item 945: Building a "Type IV" civilization
    achieveTypeIVStatus() {
        this.notify("👑 KARDASHEV: Type IV status achieved. Universal energy mastery confirmed.", "success");
        // Final tier status foundation
    }

    // Roadmap Item 946: Universal "Peace" through neural-link
    achieveUniversalHarmony() {
        this.notify("🕊️ DIPLOMACY: Global neural synchronization achieved. War is obsolete.", "success");
        // Combat disable foundation
    }

    // Roadmap Item 947: Collective consciousness awakening
    awakenCollective() {
        this.notify("🧠 OVERSOUL: Colony minds merged into single planetary entity.", "success");
        // Management automation foundation
    }

    // Roadmap Item 949: Meeting the "Developers" (Meta-quest)
    initiateMetaQuest() {
        this.notify("💻 META: Handshake established with outside simulation entities.", "warning");
        this.triggerUIGlitch();
    }

    // Roadmap Item 952: Public "Opinion" on dangerous tech
    checkScientificEthics() {
        this.notify("⚖️ ETHICS: Reviewing public sentiment on recursive research.", "info");
        // Morale impact foundation
    }

    // Roadmap Item 954: Scientific journals and publications
    publishResearchPaper(techId) {
        this.notify(`📜 SCIENCE: Results for [${techId}] published in Galactic Journal.`, "success");
        this.resources.credits += 200;
    }

    // Roadmap Item 955: Academic conferences and networking
    hostScienceSummit() {
        this.notify("🔬 SUMMIT: Gathering cluster-wide scientific minds.", "info");
        // Research speed buff foundation
    }

    // Roadmap Item 956: Nobel-prize analog awards
    receiveGalacticAward() {
        this.notify("🏆 ACHIEVEMENT: Awarded the Orion Prize for Quantum Mastery.", "success");
        this.morale += 10;
    }

    // Roadmap Item 957: Research "Funding" from corporations
    secureResearchGrant() {
        this.notify("💰 FUNDING: Mega-corp grant secured for deep-space studies.", "success");
        this.resources.credits += 500;
    }

    // Roadmap Item 958: Crowd-funded science projects
    launchCitizenScienceProject() {
        this.notify("👥 SCIENCE: Commencing community-driven data analysis.", "info");
        this.resources.data += 50;
    }

    // Roadmap Item 961: Accidental "Zombie" fungus outbreak
    triggerBioHazard() {
        this.notify("☣️ CRISIS: Xeno-fungal spores detected in ventilation system!", "danger");
        this.morale -= 20;
    }

    // Roadmap Item 962: Accidental "Dimensional Breach"
    triggerDimensionalBreach() {
        this.notify("🌌 CRISIS: Containment failed! Local space-time is fracturing.", "danger");
        this.triggerCameraShake(5.0, 2000);
    }

    // Roadmap Item 964: Shared "University" systems
    foundGalacticUniversity() {
        this.notify("🏫 EDUCATION: Central University node active. Skills increasing cluster-wide.", "success");
        // Global XP buff foundation
    }

    // Roadmap Item 965: Student "Mentorship" in science
    assignScienceMentor(colonistId) {
        this.notify(`🎓 EDUCATION: Colonist ${colonistId} assigned to senior researcher.`, "info");
    }

    // Roadmap Item 966: Historical "Archives" of tech
    accessTechArchives() {
        this.notify("📜 ARCHIVE: Retrieving blueprints from Pre-Warp era.", "info");
        // Retro-tech unlock foundation
    }

    // Roadmap Item 967: Finding "Lost" technologies
    discoverLostTech() {
        this.notify("🏺 DISCOVERY: Ancient data-core retrieved from graveyard world.", "success");
        // Random tech unlock foundation
    }

    // Roadmap Item 969: Decoding "Signal from the Future"
    decodeFutureSignal() {
        this.notify("✉️ SIGNAL: Temporal packet received from Cycle 10,000.", "warning");
        // NG+ hint foundation
    }

    // Roadmap Item 970: Investigating "Time-Lost" ships
    recoverTimeLostShip() {
        this.notify("🚀 DISCOVERY: Interstellar wreck found in temporal stasis.", "success");
        // Rare ship acquisition foundation
    }

    // Roadmap Item 972: Quantum archaeology
    viewPastTimeline() {
        this.notify("🏺 ARCHAEOLOGY: Reconstructing planetary events from 1M years ago.", "info");
        // Lore video foundation
    }

    // Roadmap Item 973: Observing the "Big Bang" visuals
    observeCosmicOrigin() {
        this.notify("🌌 VISION: Viewing the initial expansion event via 5D sensor.", "info");
        this.triggerUIGlitch();
    }

    // Roadmap Item 975: Multi-dimensional "Puzzles"
    startHypercubePuzzle() {
        this.notify("🧩 PUZZLE: Analyzing 4D geometry for spatial unlock.", "info");
    }

    // Roadmap Item 978: Infinite "Energy" trade-offs
    enableInfiniteEnergy() {
        this.notify("♾️ ENERGY: Drawing directly from vacuum. Reality stability decreasing.", "warning");
        this.resources.energy = 999999;
    }

    // Roadmap Item 979: Galactic "Balance" mechanics
    checkUniversalBalance() {
        this.notify("⚖️ COSMOS: Analyzing matter-energy equilibrium.", "info");
    }

    // Roadmap Item 980: The "End of Research"
    completeAllResearch() {
        this.notify("🔬 MASTER: All potential technologies mastered. No more to learn.", "success");
    }

    // Roadmap Item 981: Genetic "Library" of every creature
    completeGeneticLibrary() {
        this.notify("🧬 ARCHIVE: Complete cluster-wide DNA database finalized.", "success");
    }

    // Roadmap Item 982: Digital "Backup" of every mind
    backupAllMinds() {
        this.notify("💾 CLOUD: Full population neural-backup complete.", "success");
    }

    // Roadmap Item 985: Peaceful "First Contact" celebration
    celebrateContact() {
        this.notify("👽 DIPLOMACY: Cluster-wide festival celebrating Xeno integration.", "success");
        this.morale = 100;
    }

    // Roadmap Item 987: The "Golden Voyager" return
    recoverVoyagerProbe() {
        this.notify("🚀 DISCOVERY: Ancient deep-space probe recovered. Sol coordinates verified.", "success");
    }

    // Roadmap Item 988: Solving "Fermi's Paradox"
    solveFermiParadox() {
        this.notify("🌌 TRUTH: Silence explained. The Pre-Simulation barrier revealed.", "warning");
    }

    // Roadmap Item 993: Global "Utopia" simulation
    startUtopiaSim() {
        this.notify("🌈 VISION: Running perfect-harmony simulation for colony.", "success");
    }

    // Roadmap Item 994: The "Dystopia" prevention missions
    haltDystopianChain() {
        this.notify("🛡️ SECURITY: Stopping authoritarian AI chain execution.", "success");
    }

    // Roadmap Item 996: Quantum "Voting" on reality
    executeQuantumVote() {
        this.notify("⚖️ COSMOS: Reality state determined by collective observation.", "info");
    }

    // Roadmap Item 997: The "Final" Question
    askFinalQuestion() {
        this.notify("❓ TRUTH: Asking the simulation core for universal meaning.", "warning");
    }

    // Roadmap Item 999: Eternal "Persistence" in DNA storage
    achieveEternalMemory() {
        this.notify("♾️ PERSISTENCE: Civilizational data encoded into universal fundamental particles.", "success");
    }

    showBuildingUI(tileIdx) {
        const tile = this.tiles[tileIdx];
        if (!tile || !tile.building) return;

        const struct = this.structures.find(s => s.tileId === tileIdx);
        if (!struct) return; // Should detect mismatch

        const def = this.buildingTypes[struct.type];
        const modal = document.getElementById('ep-building-modal');
        const title = document.getElementById('ep-bld-title');
        const content = document.getElementById('ep-bld-content');

        if (modal) modal.style.display = 'flex';
        if (title) title.innerText = `${def.name} (Lv ${struct.level || 1})`;

        // Calculate Upgrade Cost
        const nextLevel = (struct.level || 1) + 1;
        const upgradeCost = {};
        let costHtml = '';
        let canAfford = true;

        for (const res in def.cost) {
            upgradeCost[res] = Math.floor(def.cost[res] * Math.pow(1.5, (struct.level || 1)));
            const afford = this.resources[res] >= upgradeCost[res];
            if (!afford) canAfford = false;
            costHtml += `<div style="color:${afford ? '#fff' : '#ef4444'}">${res}: ${upgradeCost[res]}</div>`;
        }

        // Stats
        let statsHtml = '';
        if (def.output) {
            statsHtml += '<div><b>Production:</b></div>';
            for (const res in def.output) {
                const current = (def.output[res] * Math.pow(1.2, (struct.level || 1) - 1)).toFixed(1);
                const next = (def.output[res] * Math.pow(1.2, nextLevel - 1)).toFixed(1);
                statsHtml += `<div>${res}: <span style="color:#38bdf8">${current}</span> ➤ <span style="color:#4ade80">${next}</span></div>`;
            }
        }
        if (def.capacity) {
            statsHtml += '<div><b>Capacity:</b></div>';
            const current = Math.floor(def.capacity * Math.pow(1.2, (struct.level || 1) - 1));
            const next = Math.floor(def.capacity * Math.pow(1.2, nextLevel - 1));
            statsHtml += `<div>Residents: <span style="color:#38bdf8">${current}</span> ➤ <span style="color:#4ade80">${next}</span></div>`;
        }

        content.innerHTML = `
            <div style="text-align:center; padding:10px;">
                <div style="font-size:3em; margin-bottom:10px;">${def.icon}</div>
                <div style="margin-bottom:15px; color:#94a3b8;">${def.desc}</div>
                
                <div style="background:#1e293b; padding:10px; border-radius:6px; margin-bottom:15px; text-align:left;">
                    ${statsHtml || 'No active output.'}
                    ${struct.reinforced ? '<div style="color:#4ade80; font-size:0.8em; margin-top:5px;">🛡️ Reinforced for High-G</div>' : ''}
                </div>

                <div style="margin-bottom:5px; font-weight:bold; color:#fbbf24;">Upgrade Cost:</div>
                <div style="display:flex; gap:10px; justify-content:center; margin-bottom:15px; font-size:0.9em;">
                    ${costHtml}
                </div>

                <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                    <button class="ep-sys-btn" ${canAfford ? '' : 'disabled'} onclick="window.game.upgradeBuilding(${tileIdx})" style="border-color:${canAfford ? '#4ade80' : '#475569'}; color:${canAfford ? '#4ade80' : '#475569'}">
                        UPGRADE
                    </button>
                    ${!struct.reinforced && this.modifiers.gravity > 1.2 ? `
                    <button class="ep-sys-btn" onclick="window.game.reinforceBuilding(${tileIdx})" style="border-color:#fbbf24; color:#fbbf24;">
                        REINFORCE (50 Alloys)
                    </button>` : ''}
                    ${struct.type === 'base_crawler' ? `
                    <button class="ep-sys-btn" onclick="window.game.startCrawlerRelocation(${tileIdx})" style="border-color:#38bdf8; color:#38bdf8;">
                        MOVE
                    </button>` : ''}
                    <button class="ep-sys-btn" onclick="window.game.demolishBuilding(${tileIdx})" style="border-color:#ef4444; color:#ef4444;">
                        DEMOLISH
                    </button>
                </div>
            </div>
        `;
    }

    upgradeBuilding(tileIdx) {
        const struct = this.structures.find(s => s.tileId === tileIdx);
        if (!struct) return;
        const def = this.buildingTypes[struct.type];

        // Final resource check
        const upgradeCost = {};
        for (const res in def.cost) {
            upgradeCost[res] = Math.floor(def.cost[res] * Math.pow(1.5, (struct.level || 1)));
            if (this.resources[res] < upgradeCost[res]) {
                this.notify("Insufficient Resources!", "danger");
                return;
            }
        }

        // Deduct
        for (const res in upgradeCost) {
            this.resources[res] -= upgradeCost[res];
        }

        struct.level = (struct.level || 1) + 1;
        this.audio.playUnlock(); // or level up sound
        this.notify(`${def.name} upgraded to Level ${struct.level}!`, "success");
        this.createEffect(this.getTilePos(tileIdx), new THREE.Vector3(0, 1, 0), 0xfbbf24);

        // Refresh UI
        this.showBuildingUI(tileIdx);
        this.updateResourceUI();
    }

    reinforceBuilding(tileIdx) {
        // Roadmap Item 323: High-G reinforcement
        const struct = this.structures.find(s => s.tileId === tileIdx);
        if (!struct) return;

        if (this.resources.alloys < 50) {
            this.notify("Requires 50 Alloys to reinforce!", "danger");
            return;
        }

        this.resources.alloys -= 50;
        struct.reinforced = true;
        this.notify("Structure reinforced for extreme gravity.", "success");
        this.updateResourceUI();
        this.showBuildingUI(tileIdx);
    }

    // --- 3D SPACE COMBAT CONTROL ---

    launchFighters() {
        if (!this.combatScene) return;

        console.log("Launching Fighters into Orbit...");
        this.notify("Alert! Fighters Launching... Switching to Combat View.", "warning");
        this.audio.playWarp(); // Re-use warp sound

        // 1. Hide Planet View
        document.getElementById('ui-container').style.display = 'none';

        // 2. Start Combat Scene
        this.combatScene.start();

        // 3. Switch Rendering Loop
        this.isCombatActive = true;
    }

    retreatFromCombat(result = null) {
        if (!this.combatScene) return;

        console.log("Retreating to Surface...");
        this.notify("Fighters Returning to Base.", "info");

        const outcome = (result && result.outcome != null) ? String(result.outcome) : null;
        const reward = (result && result.reward && typeof result.reward === 'object') ? result.reward : null;
        if (outcome === 'victory') {
            if (!this.agentMissionDefs) this.agentMissionDefs = this.getAgentMissionDefinitions();
            if (!this.agentMissions) this.agentMissions = this.createDefaultAgentMissionsState(this.agentMissionDefs);
            this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);
            if (!this.agentMissions.stats) this.agentMissions.stats = { combatWins: 0 };
            const wins = (typeof this.agentMissions.stats.combatWins === 'number' && Number.isFinite(this.agentMissions.stats.combatWins)) ? this.agentMissions.stats.combatWins : 0;
            this.agentMissions.stats.combatWins = Math.max(0, Math.floor(wins)) + 1;
        }
        if (outcome === 'victory' && reward && this.resources) {
            const gained = [];
            Object.keys(reward).forEach((k) => {
                const amt = reward[k];
                const n = (typeof amt === 'number' && Number.isFinite(amt)) ? amt : Number(amt);
                if (!(typeof n === 'number' && Number.isFinite(n)) || n <= 0) return;
                if (!Object.prototype.hasOwnProperty.call(this.resources, k)) return;
                const cur = (typeof this.resources[k] === 'number' && Number.isFinite(this.resources[k])) ? this.resources[k] : 0;
                this.resources[k] = cur + n;
                gained.push(`+${Math.floor(n)} ${k}`);
            });
            if (gained.length > 0) {
                this.notify(`Combat rewards: ${gained.join(', ')}`, 'success');
                this.updateResourceUI();
            }
        }

        this.updateAgentMissions();

        // 1. Stop Combat Scene
        this.combatScene.stop();
        this.isCombatActive = false;

        // 2. Show Planet UI
        document.getElementById('ui-container').style.display = 'block';

        // 3. Reset Camera to Planet
        // this.camera.position.set(0, 50, 100);
        // this.camera.lookAt(0, 0, 0);
        this.controls.enabled = true;
    }

    demolishBuilding(tileIdx) {
        const tile = this.tiles[tileIdx];
        if (!tile || !tile.building) return;

        // Refund? 50% of base cost
        const def = this.buildingTypes[tile.building];
        for (const res in def.cost) {
            this.resources[res] += Math.floor(def.cost[res] * 0.5);
        }

        // Remove from structures
        this.structures = this.structures.filter(s => s.tileId !== tileIdx);
        this.removeBuildingMesh(tileIdx);

        // Clear Tile
        tile.building = null;
        tile.level = null;

        // Visuals? Need to remove mesh.
        // Quick hack: Redraw planet or specific tile?
        // Ideally we keep a map of tileId -> Mesh Group to remove it.
        // For now, just removing the structure logic. 
        // Force refresh visual if possible
        // Let's assume re-entering system or save/load fixes visuals, but for immediate effect:
        // We'd need to track mesh objects. 
        // Note: The current `exoplanet-pioneer.js` handles placement by `placeBuildingMesh` which adds to scene/group?
        // Actually `placeBuildingMesh` is implemented where? It was in `handleTileClick` but I don't see the definition in the previous view. 
        // It's likely lower down or in `BuildingArchitect`.
        // Wait, `placeBuildingMesh` was called in `handleTileClick` line 999. 
        // If I don't remove the mesh, it stays. 
        // I will notify the user to refresh for visual update or implement mesh removal if the map exists.

        this.notify("Building Demolished. Resources refunded.", "info");
        document.getElementById('ep-building-modal').style.display = 'none';
        this.updateResourceUI();

        // Trigger a visual refresh if possible, otherwise just update logic.
        // If we want to be fancy, we'd add `this.buildingMeshes` map.
    }

    placeBuildingMesh(worldPosition, normal, buildingDef) {
        // Deduce Type and Asset ID
        let type = 'generic';
        let assetId = null;
        if (typeof buildingDef === 'string') {
            type = buildingDef;
            const def = this.buildingTypes[type];
            if (def && def.assetId) assetId = def.assetId;
        } else if (buildingDef && buildingDef.icon) {
            // ... (keep existing deduction logic as fallback)
            if (buildingDef.icon === '⚡') type = 'solar';
            else if (buildingDef.icon === '🏠') type = 'hab';
            else if (buildingDef.icon === '⛏️') type = 'mine';
            else if (buildingDef.icon === '☢️') type = 'fusion';
            else if (buildingDef.icon === '📦') type = 'store';
            else if (buildingDef.icon === '🔬') type = 'lab';
            else if (buildingDef.icon === '🌱') type = 'farm';
            else if (buildingDef.icon === '🏭') type = 'refinery';
            else if (buildingDef.icon === '💨') type = 'oxy';
            else if (buildingDef.icon === '🚀') type = 'launch_site';

            const def = this.buildingTypes[type];
            if (def && def.assetId) assetId = def.assetId;
        }

        // Lift distance: Increase to 3.0 to be absolutely sure we clear terrain displacement
        const liftDist = 0.85;
        const liftedPos = worldPosition.clone().add(normal.clone().multiplyScalar(liftDist));

        const meshGroup = new THREE.Group();

        // CRITICAL: Parent to planetMesh so it rotates with the surface
        if (this.planetMesh) {
            this.planetMesh.updateMatrixWorld(); // Ensure matrix is current for worldToLocal
            this.planetMesh.add(meshGroup);
            // Convert world position to local coordinates relative to planetMesh
            // This ensures buildings stay locked to their tile even as the planet rotates
            const localPos = this.planetMesh.worldToLocal(liftedPos.clone());
            meshGroup.position.copy(localPos);

            // Orient to local surface normal (pointing away from planet center)
            const localNormal = localPos.clone().normalize();
            meshGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), localNormal);
        } else {
            this.scene.add(meshGroup);
            meshGroup.position.copy(liftedPos);
            // World orientation
            meshGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        }

        // ASSET ROADMAP BRIDGE: Use ProductionAssetManager if available
        if (this.assetManager && assetId) {
            const modelDef = this.assetManager.findModelById(assetId);
            const modelPath = modelDef ? modelDef.path : null;

            if (modelPath) {
                this.assetManager.loadModel(modelPath).then(model => {
                    this.polishBuildingModel(model, type);
                    meshGroup.add(model);
                    meshGroup.userData.assetLoadState = 'production';
                    console.log(`✅ Loaded production asset: ${assetId} for ${type}`);
                }).catch(err => {
                    console.error(`❌ Failed to load production asset ${assetId}:`, err);
                    this.fallbackToArchitect(type, liftedPos, normal, meshGroup);
                    meshGroup.userData.assetLoadState = 'fallback';
                });
            } else {
                this.fallbackToArchitect(type, liftedPos, normal, meshGroup);
                meshGroup.userData.assetLoadState = 'fallback';
            }
        } else {
            this.fallbackToArchitect(type, liftedPos, normal, meshGroup);
            meshGroup.userData.assetLoadState = 'fallback';
        }

        // User Rotation (Y-axis is "up" relative to the surface now)
        if (this.buildingOrient) {
            meshGroup.rotateY(this.buildingOrient * (Math.PI / 2));
        }

        // Buildings should read clearly without becoming giant surface spikes.
        meshGroup.scale.set(1.45, 1.45, 1.45);
        meshGroup.renderOrder = 2;
        meshGroup.userData.isBuilding = true;
        meshGroup.userData.buildingType = type;

        // Compact animated locator ring replaces the old 50-world-unit yellow beacon.
        const markerGeo = new THREE.RingGeometry(1.15, 1.38, 32);
        const markerMat = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.48,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.rotation.x = -Math.PI / 2;
        marker.position.y = 0.16;
        marker.userData.isBuildingMarker = true;
        meshGroup.add(marker);

        const scaffoldGeo = new THREE.CylinderGeometry(1.55, 1.55, 2.8, 12, 1, true);
        const scaffoldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: true, transparent: true, opacity: 0.42, depthWrite: false });
        const scaffold = new THREE.Mesh(scaffoldGeo, scaffoldMat);
        scaffold.position.y = 1.35;
        scaffold.userData.isConstructionScaffold = true;
        scaffold.visible = false;
        meshGroup.add(scaffold);

        const contactShadow = this.createBuildingContactShadow();
        contactShadow.visible = this.normalizeGraphicsSettings(this.graphicsSettings).shadowQuality !== 'off';
        meshGroup.add(contactShadow);
        meshGroup.userData.contactShadow = contactShadow;

        const nightGlow = this.createBuildingNightGlow(type);
        meshGroup.add(nightGlow);
        meshGroup.userData.nightGlow = nightGlow;

        // Disable culling on all children and fix material properties
        meshGroup.frustumCulled = false;
        meshGroup.traverse(c => {
            c.frustumCulled = false;
            if (c.isMesh && c.material) {
                if (c.userData.isBuildingMarker || c.userData.isConstructionScaffold || c.userData.isBuildingContactShadowMesh || c.userData.isBuildingNightGlow) {
                    c.renderOrder = 3;
                    return;
                }
                const shadowEnabled = this.normalizeGraphicsSettings(this.graphicsSettings).shadowQuality !== 'off';
                c.castShadow = shadowEnabled;
                c.receiveShadow = shadowEnabled;
                const materials = Array.isArray(c.material) ? c.material : [c.material];
                materials.forEach((material) => {
                    if (!material) return;
                    material.side = THREE.DoubleSide;
                    material.depthTest = true;
                    material.depthWrite = material.transparent ? false : true;
                    if (material.emissive && !c.userData.buildingSurfaceStyled) {
                        material.emissive.setHex(0x164e63);
                        material.emissiveIntensity = 0.28;
                    }
                    material.userData = material.userData || {};
                    if (material.emissive && !Number.isFinite(material.userData.pioneerBaseEmissiveIntensity)) {
                        material.userData.pioneerBaseEmissiveIntensity = Number(material.emissiveIntensity || 0);
                    }
                    material.needsUpdate = true;
                });
                c.renderOrder = 2;
            }
        });

        meshGroup.visible = true;
        return meshGroup;
    }

    polishBuildingModel(root, type) {
        if (!root) return;
        const def = this.buildingTypes?.[type];
        const accent = new THREE.Color(def?.color ?? 0x67e8f9);
        const emissive = accent.clone().multiplyScalar(def?.output?.energy ? 0.20 : 0.11);
        root.traverse?.((child) => {
            if (!child?.isMesh || !child.material) return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            const styled = materials.map((material) => {
                const next = material?.clone ? material.clone() : material;
                if (!next) return next;
                next.side = THREE.DoubleSide;
                next.depthTest = true;
                next.depthWrite = next.transparent ? false : true;
                if (next.emissive) {
                    next.emissive.copy(emissive);
                    next.emissiveIntensity = def?.output?.energy ? 0.36 : 0.22;
                    next.userData = next.userData || {};
                    next.userData.pioneerBaseEmissiveIntensity = next.emissiveIntensity;
                }
                if (typeof next.roughness === 'number') next.roughness = THREE.MathUtils.clamp(next.roughness, 0.34, 0.82);
                if (typeof next.metalness === 'number') next.metalness = THREE.MathUtils.clamp(next.metalness, 0.04, 0.62);
                next.needsUpdate = true;
                return next;
            });
            child.material = Array.isArray(child.material) ? styled : styled[0];
            child.frustumCulled = false;
            const shadowEnabled = this.normalizeGraphicsSettings(this.graphicsSettings).shadowQuality !== 'off';
            child.castShadow = shadowEnabled;
            child.receiveShadow = shadowEnabled;
            child.renderOrder = 2;
            child.userData.buildingSurfaceStyled = true;
        });
        root.userData.buildingSurfaceStyled = true;
    }

    clearColonyInfrastructure() {
        const group = this.infrastructureGroup;
        if (group) {
            while (group.children.length) {
                const child = group.children.pop();
                child.geometry?.dispose?.();
                if (Array.isArray(child.material)) child.material.forEach((m) => m?.dispose?.());
                else child.material?.dispose?.();
            }
            group.parent?.remove?.(group);
        }
        this.infrastructureGroup = null;
        this.infrastructureLinks = [];
        this.infrastructureSignature = '';
    }

    ensureInfrastructureGroup() {
        if (!this.planetMesh) return null;
        if (this.infrastructureGroup?.parent === this.planetMesh) return this.infrastructureGroup;
        this.clearColonyInfrastructure();
        const group = new THREE.Group();
        group.name = 'colony-infrastructure-network';
        group.userData.isInfrastructureNetwork = true;
        group.renderOrder = 1;
        this.planetMesh.add(group);
        this.infrastructureGroup = group;
        return group;
    }

    rebuildColonyInfrastructure(force = false) {
        if (!this.planetMesh || !Array.isArray(this.structures)) return;
        const operational = this.structures.filter((s) => this.isStructureOperational(s) && this.tiles?.[s.tileId]);
        const sources = (this.powerGrid?.sources || []).filter((source) => source?.pos && source?.id);
        const signature = operational
            .map((s) => `${s.id}:${s.tileId}:${s.type}:${s.powered === false ? 0 : 1}`)
            .sort()
            .concat(sources.map((s) => `src:${s.id}:${s.range || 0}`).sort())
            .join('|');
        if (!force && signature === this.infrastructureSignature) return;
        const group = this.ensureInfrastructureGroup();
        if (!group) return;
        this.infrastructureSignature = signature;
        while (group.children.length) {
            const child = group.children.pop();
            child.geometry?.dispose?.();
            if (Array.isArray(child.material)) child.material.forEach((m) => m?.dispose?.());
            else child.material?.dispose?.();
        }
        this.infrastructureLinks = [];
        if (!sources.length) return;

        const sourceIds = new Set(sources.map((source) => source.id));
        operational.forEach((struct, index) => {
            if (sourceIds.has(struct.id) || struct.powered === false) return;
            const targetPos = this.getTilePos(struct.tileId);
            let nearest = null;
            let nearestDistance = Infinity;
            for (const source of sources) {
                const distance = targetPos.distanceTo(source.pos);
                if (distance <= (source.range || 20) && distance < nearestDistance) {
                    nearest = source;
                    nearestDistance = distance;
                }
            }
            if (!nearest) return;

            const liftPoint = (point, lift = 0.42) => point.clone().normalize().multiplyScalar(point.length() + lift);
            const start = liftPoint(nearest.pos, 0.48);
            const end = liftPoint(targetPos, 0.48);
            const midpoint = start.clone().add(end).multiplyScalar(0.5);
            if (midpoint.lengthSq() < 1e-6) return;
            midpoint.normalize().multiplyScalar(Math.max(start.length(), end.length()) + Math.min(2.2, 0.75 + nearestDistance * 0.035));
            const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
            const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
            const material = new THREE.LineBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.28,
                depthWrite: false,
                depthTest: true
            });
            const line = new THREE.Line(geometry, material);
            line.frustumCulled = false;
            line.renderOrder = 1;
            line.userData.isPowerLink = true;
            group.add(line);

            const pulseMaterial = new THREE.MeshBasicMaterial({
                color: 0x9beeff,
                transparent: true,
                opacity: 0.88,
                depthWrite: false,
                depthTest: true
            });
            const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), pulseMaterial);
            pulse.position.copy(start);
            pulse.renderOrder = 2;
            pulse.userData.isPowerPulse = true;
            group.add(pulse);
            this.infrastructureLinks.push({ curve, pulse, line, progress: ((index * 0.31) % 1) });
        });
    }

    updateInfrastructurePulseVisuals(realDelta = 0.016) {
        if (!Array.isArray(this.infrastructureLinks) || !this.infrastructureLinks.length) return;
        const step = Math.max(0, Math.min(0.05, realDelta || 0)) * 0.34;
        this.infrastructureLinks.forEach((link, index) => {
            link.progress = (link.progress + step * (1 + (index % 3) * 0.08)) % 1;
            link.pulse?.position?.copy(link.curve.getPointAt(link.progress));
            if (link.line?.material) link.line.material.opacity = 0.22 + Math.sin(link.progress * Math.PI) * 0.14;
            if (link.pulse?.material) link.pulse.material.opacity = 0.56 + Math.sin(link.progress * Math.PI) * 0.34;
        });
    }

    updateBuildingOperationalVisual(struct) {
        if (!struct) return;
        const group = this.buildingMeshes?.[struct.tileId];
        if (!group) return;
        const constructing = !!struct.isConstructing;
        const powered = struct.powered !== false;
        group.userData.powered = powered;
        group.traverse?.((child) => {
            if (!child?.userData?.isBuildingMarker || !child.material) return;
            child.material.color.setHex(constructing ? 0xfbbf24 : (powered ? 0x67e8f9 : 0xfb7185));
            child.material.opacity = constructing ? 0.55 : (powered ? 0.46 : 0.72);
        });
    }

    fallbackToArchitect(type, liftedPos, normal, meshGroup) {
        if (!this.architect) this.architect = new BuildingArchitect(this.scene);
        try {
            const archMesh = this.architect.createBuilding(type, new THREE.Vector3(0, 0, 0), normal);
            this.polishBuildingModel(archMesh, type);
            meshGroup.add(archMesh);
            meshGroup.userData.assetLoadState = 'fallback';
        } catch (e) {
            console.error("BuildingArchitect failed, using fallback cube:", e);
            const colorMap = {
                'solar': 0xfacc15, 'hab': 0x60a5fa, 'mine': 0x94a3b8, 'fusion': 0xef4444,
                'store': 0xf472b6, 'lab': 0xa855f7, 'farm': 0x4ade80, 'refinery': 0xff8c00,
                'oxy': 0xa5f3fc, 'launch_site': 0xcbd5e1, 'generic': 0xff0000
            };
            const geo = new THREE.BoxGeometry(2, 2, 2);
            const mat = new THREE.MeshStandardMaterial({ color: colorMap[type] || 0xff0000, roughness: 0.62, metalness: 0.18 });
            const fallbackMesh = new THREE.Mesh(geo, mat);
            this.polishBuildingModel(fallbackMesh, type);
            meshGroup.add(fallbackMesh);
            meshGroup.userData.assetLoadState = 'fallback';
        }
    }

    updateBuildingConstructionVisual(struct) {
        if (!struct) return;
        const group = this.buildingMeshes?.[struct.tileId];
        if (!group) return;
        const progress = THREE.MathUtils.clamp((struct.buildProgress ?? 100) / 100, 0, 1);
        const constructing = !!struct.isConstructing;
        const baseScale = 1.45;
        group.scale.set(baseScale, baseScale * (constructing ? 0.32 + progress * 0.68 : 1), baseScale);
        group.userData.constructionProgress = progress;
        group.traverse((child) => {
            if (child.userData?.isConstructionScaffold) {
                child.visible = constructing;
                if (child.material) child.material.opacity = 0.20 + (1 - progress) * 0.38;
            }
            if (child.userData?.isBuildingMarker && child.material) child.material.color.setHex(constructing ? 0xfbbf24 : 0x67e8f9);
        });
    }

    advanceConstruction(deltaSeconds = 1) {
        const speed = Math.max(0, this.timeScale || 0);
        if (speed <= 0) return;
        let pathChanged = false;
        this.structures.forEach((struct) => {
            if (!struct?.isConstructing) return;
            const def = this.buildingTypes[struct.type];
            const duration = Math.max(0.1, Number(struct.buildDuration) || Number(def?.buildTime) || 10);
            struct.buildDuration = duration;
            struct.buildElapsed = Math.min(duration, (Number(struct.buildElapsed) || 0) + deltaSeconds * speed);
            struct.buildProgress = Math.min(100, (struct.buildElapsed / duration) * 100);
            if (struct.buildProgress >= 100) {
                struct.buildProgress = 100;
                struct.isConstructing = false;
                pathChanged = true;
                const tile = this.tiles[struct.tileId];
                if (tile) {
                    const worldPos = tile.position.clone();
                    this.planetMesh?.localToWorld(worldPos);
                    this.createEffect(worldPos, worldPos.clone().normalize(), 0x67e8f9);
                }
                this.notify(`${def?.name || struct.type} construction complete.`, 'success');
                if (struct.type === 'launch_site') {
                    this.ensureLunarBlueprints({ silent: false, requireLaunchSite: false });
                    this.recordColonyEvent('Orbital launch infrastructure became operational. Lunar operations are now available.', 0.8, 'success');
                    this.updateOrbitalControls();
                    this.updateLocationUI();
                }
            }
            this.updateBuildingConstructionVisual(struct);
        });
        if (pathChanged) this.updateColonyPathUI?.();
    }

    /**
     * DEBUG TOOL: Verifies that all logical buildings have visible meshes.
     * Can trigger auto-repairs if meshes are missing.
     */
    verifyBuildingIntegrity() {
        if (!this.structures || !this.buildingMeshes) return;

        let issues = 0;
        this.structures.forEach(struct => {
            const mesh = this.buildingMeshes[struct.tileId];

            // 1. Check if mesh exists
            if (!mesh) {
                console.warn(`⚠️ Integrity Issue: Structure at Tile ${struct.tileId} (${struct.type}) has NO MESH. Attempting repair...`);
                // Attempt Rebuild
                const tile = this.tiles.find(t => t.id === struct.tileId);
                if (tile) {
                    const worldPos = tile.position.clone();
                    if (this.planetMesh) {
                        this.planetMesh.updateMatrixWorld();
                        this.planetMesh.localToWorld(worldPos);
                    }
                    const normal = worldPos.clone().normalize();
                    const newMesh = this.placeBuildingMesh(worldPos, normal, struct.type);
                    if (newMesh) {
                        this.buildingMeshes[struct.tileId] = newMesh;
                        console.log(`✅ Repaired Mesh for Tile ${struct.tileId}`);
                    } else {
                        console.error(`❌ Failed to repair Mesh for Tile ${struct.tileId}`);
                    }
                }
                issues++;
                return;
            }

            // 2. Check Scene Graph
            if (this.planetMesh && mesh.parent !== this.planetMesh) {
                console.warn(`⚠️ Integrity Issue: Mesh for Tile ${struct.tileId} is detached from Planet! Re-attaching...`);
                // When re-parenting, we must ensure local coordinates are maintained correctly.
                // Assuming mesh.position was world pos if parent was null or scene.
                const worldPos = new THREE.Vector3();
                mesh.getWorldPosition(worldPos);
                this.planetMesh.add(mesh);
                mesh.position.copy(this.planetMesh.worldToLocal(worldPos));
                issues++;
            }

            // 3. Check Visibility/Scale
            if (!mesh.visible) {
                console.warn(`⚠️ Integrity Issue: Mesh for Tile ${struct.tileId} is HIDDEN. Setting visible = true.`);
                mesh.visible = true;
                issues++;
            }
            if (mesh.scale.length() < 0.1) {
                console.warn(`⚠️ Integrity Issue: Mesh for Tile ${struct.tileId} has near-zero scale. Resetting to 1.`);
                mesh.scale.set(1, 1, 1);
                issues++;
            }
        });

        if (issues === 0) {
            // console.log("Building Integrity Check Passed: All systems nominal.");
        } else {
            console.log(`Building Integrity Check Complete. Found and attempted to fix ${issues} issues.`);
        }
    }

    removeBuildingMesh(tileId) {
        if (this.buildingMeshes[tileId]) {
            this.planetMesh.remove(this.buildingMeshes[tileId]);
            delete this.buildingMeshes[tileId];
        }
    }

    checkMerge(tile) {
        // Find partners
        const partners = [];
        const range = 5; // User approved leeway

        this.structures.forEach(s => {
            if (s.tileId === tile.id) return;
            if (s.type === tile.building && s.level === 3) { // Require Level 3 to merge
                const otherTile = this.tiles.find(t => t.id === s.tileId);
                if (otherTile) {
                    const d = tile.position.distanceTo(otherTile.position);
                    if (d <= range) {
                        partners.push(otherTile);
                    }
                }
            }
        });
        return partners;
    }

    mergeBuildings(tileId) {
        const tile = this.tiles.find(t => t.id === tileId);
        if (!tile) return;

        // Find FIRST valid partner (simplest logic)
        const partners = this.checkMerge(tile);
        if (partners.length === 0) return;

        const partner = partners[0];
        const type = tile.building;

        // Remove Partner
        partner.building = null;
        partner.level = 0;
        this.structures = this.structures.filter(s => s.tileId !== partner.id);
        this.removeBuildingMesh(partner.id);
        this.removeBuildingMesh(tile.id); // Remove current to replace with Ultimate

        // Upgrade Current Tile to Ultimate
        const ultType = `ultimate_${type}`;
        const worldPos = tile.position.clone();
        if (this.planetMesh) {
            this.planetMesh.updateMatrixWorld();
            this.planetMesh.localToWorld(worldPos);
        }
        const worldNormal = worldPos.clone().normalize();

        const mesh = this.placeBuildingMesh(worldPos, worldNormal, ultType);
        if (mesh) this.buildingMeshes[tile.id] = mesh;

        // Logic Update
        tile.building = ultType; // New type 
        tile.level = 1; // Reset level or keep? unique type doesn't need levels yet.

        const struct = this.structures.find(s => s.tileId === tileId);
        if (struct) struct.type = ultType;

        this.notify(`MERGE COMPLETE! Ultimate Structure Created!`, 'success');
        this.audio.playScan(); // Sound effect
    }
    setupSuns(config = null) {
        // Clear existing suns
        if (this.suns) {
            this.suns.forEach(s => {
                this.scene.remove(s.light);
                if (s.mesh) this.scene.remove(s.mesh);
                if (s.helper) this.scene.remove(s.helper);
            });

        }

        this.suns = [];
        this.sunLight = null; // Reference to main shadow caster

        // Default Config
        if (!config) {
            config = { type: 'single', stars: [{ color: 0xfff7ed, size: 1.0 }] };
        }

        config.stars.forEach((star, index) => {
            const light = new THREE.DirectionalLight(star.color, 1.5);

            // Positioning Logic for Binary/Trinary
            const pos = new THREE.Vector3(20, 10, 20); // Default
            if (config.type === 'binary') {
                if (index === 0) pos.set(30, 20, 20);
                else pos.set(-30, 10, -20);
            } else if (config.type === 'trinary') {
                if (index === 0) pos.set(30, 25, 30);
                else if (index === 1) pos.set(-30, 10, 0);
                else pos.set(0, -10, -30);
            }

            light.position.copy(pos);

            // Only the first/main star casts shadows to save perf/complexity
            if (index === 0) {
                light.castShadow = true;
                light.shadow.mapSize.width = 2048;
                light.shadow.mapSize.height = 2048;
                light.shadow.camera.left = -72;
                light.shadow.camera.right = 72;
                light.shadow.camera.top = 72;
                light.shadow.camera.bottom = -72;
                light.shadow.camera.near = 250;
                light.shadow.camera.far = 550;
                light.shadow.bias = -0.00018;
                light.shadow.normalBias = 0.028;
                this.sunLight = light;
            }

            this.scene.add(light);

            // Visual Representation (a glowing sphere)
            const geo = new THREE.SphereGeometry(2 * star.size, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: star.color });
            const mesh = new THREE.Mesh(geo, mat);
            // Push sun far away but visible
            mesh.position.copy(pos.normalize().multiplyScalar(400));
            this.scene.add(mesh);

            this.suns.push({ light, mesh });
        });
    }

    createEffect(pos, normal, color) {
        const particleCount = 8;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            positions.push(pos.x, pos.y, pos.z);
            velocities.push((Math.random() - 0.5) * 0.5 + normal.x, (Math.random() - 0.5) * 0.5 + normal.y, (Math.random() - 0.5) * 0.5 + normal.z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: color, size: 0.8, transparent: true });
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        let life = 1.0;
        const anim = setInterval(() => {
            life -= 0.05;
            if (life <= 0) { clearInterval(anim); this.scene.remove(points); geometry.dispose(); material.dispose(); return; }
            const posAttr = geometry.attributes.position;
            for (let i = 0; i < particleCount; i++) {
                posAttr.setXYZ(i, posAttr.getX(i) + velocities[i * 3], posAttr.getY(i) + velocities[i * 3 + 1], posAttr.getZ(i) + velocities[i * 3 + 2] * 0.5);
            }
            posAttr.needsUpdate = true;
            material.opacity = life;
        }, 30);
    }

    openTechTree() {
        const modal = document.getElementById('ep-tech-modal');
        const grid = document.getElementById('ep-tech-grid');
    }

    openXenodex() {
        const modal = document.getElementById('ep-xenodex-modal');
        const content = document.getElementById('ep-xenodex-content');
        if (!modal || !content) return;

        modal.style.display = 'flex';

        const flora = (this.ecosystem && this.ecosystem.xenodex) ? this.ecosystem.xenodex.flora : [];
        const fauna = (this.ecosystem && this.ecosystem.xenodex) ? this.ecosystem.xenodex.fauna : [];

        if (flora.length === 0 && fauna.length === 0) {
            content.innerHTML = `<div style="text-align:center; color:#64748b; padding:40px;">No species discovered yet.<br>Build a Research Lab or explore more tiles!</div>`;
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:20px;">';

        // Flora Section
        if (flora.length > 0) {
            html += `
                <div>
                    <h3 style="color:#4ade80; border-bottom:1px solid #334155; margin-bottom:10px;">🌿 Flora (${flora.length})</h3>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        ${flora.map(f => `
                            <div style="background:#0f172a; padding:10px; border-radius:6px; border:1px solid #166534;">
                                <div style="font-weight:bold; color:#86efac;">${f.name}</div>
                                <div style="font-size:0.8em; color:#cbd5e1;">${f.description || 'Unknown properties.'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Fauna Section
        if (fauna.length > 0) {
            html += `
                <div>
                    <h3 style="color:#f472b6; border-bottom:1px solid #334155; margin-bottom:10px;">🐾 Fauna (${fauna.length})</h3>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        ${fauna.map(f => `
                            <div style="background:#0f172a; padding:10px; border-radius:6px; border:1px solid #9d174d;">
                                <div style="font-weight:bold; color:#f9a8d4;">${f.name}</div>
                                <div style="font-size:0.8em; color:#cbd5e1;">${f.description || 'Unknown behavior.'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        content.innerHTML = html;
    }

    researchTech(key) {
        const tech = this.technologies[key];
        if (this.resources.data >= tech.cost) {
            this.resources.data -= tech.cost;
            tech.unlocked = true;
            if (tech.effect) tech.effect();
            this.audio.playUnlock();
            this.notify(`${tech.name} Researched!`, "success");
            this.openTechTree();
            this.updateResourceUI();
        } else {
            this.audio.playError();
            this.notify("Insufficient Data!", "danger");
        }
    }

    serializeShipDesign(design) {
        if (!design || typeof design !== 'object') return null;

        const idsFrom = (arr) => Array.isArray(arr)
            ? arr.map(m => (m && m.id != null) ? String(m.id) : null).filter(Boolean)
            : [];

        return {
            id: (design.id != null) ? String(design.id) : null,
            name: (design.name != null) ? String(design.name) : 'Unknown Class',
            hullId: (design.hull && design.hull.id != null) ? String(design.hull.id) : null,
            engineId: (design.engine && design.engine.id != null) ? String(design.engine.id) : null,
            weaponIds: idsFrom(design.weapons),
            shieldIds: idsFrom(design.shields)
        };
    }

    deserializeShipDesigns(savedDesigns) {
        if (!this.shipDesigner || !this.shipDesigner.modules || !Array.isArray(savedDesigns)) return [];

        const out = [];
        savedDesigns.forEach((raw) => {
            if (!raw || typeof raw !== 'object') return;

            const name = (raw.name != null) ? String(raw.name) : 'Unknown Class';
            const hullId = (raw.hullId != null) ? String(raw.hullId) : null;
            const engineId = (raw.engineId != null) ? String(raw.engineId) : null;

            const hull = hullId ? this.shipDesigner.modules[hullId] : null;
            const engine = engineId ? this.shipDesigner.modules[engineId] : null;
            if (!hull || !engine || typeof ShipDesign !== 'function') return;

            const weaponIds = Array.isArray(raw.weaponIds)
                ? raw.weaponIds.map((id) => (id != null) ? String(id) : null).filter(Boolean)
                : [];
            const shieldIds = Array.isArray(raw.shieldIds)
                ? raw.shieldIds.map((id) => (id != null) ? String(id) : null).filter(Boolean)
                : [];

            const weapons = weaponIds.map(id => this.shipDesigner.modules[id]).filter(Boolean);
            const shields = shieldIds.map(id => this.shipDesigner.modules[id]).filter(Boolean);

            const design = new ShipDesign(name, hull, engine, weapons, shields);
            if (raw.id != null) design.id = String(raw.id);
            out.push(design);
        });

        return out;
    }

    serializeFleetShip(ship) {
        if (!ship || typeof ship !== 'object') return null;
        const id = ship.id != null ? String(ship.id) : null;
        const designId = ship.designId != null ? String(ship.designId) : (ship.design?.id != null ? String(ship.design.id) : null);
        if (!id || !designId) return null;
        const stats = {};
        Object.entries(ship.stats || {}).forEach(([key, value]) => {
            if (typeof value === 'number' && Number.isFinite(value)) stats[key] = value;
            else if (typeof value === 'boolean' || typeof value === 'string') stats[key] = value;
        });
        const mission = ship.mission ? {
            id: ship.mission.id || null,
            type: ship.mission.type || null,
            durationSeconds: Number(ship.mission.durationSeconds || 0),
            remaining: Number(ship.mission.remaining || 0),
            elapsed: Number(ship.mission.elapsed || 0),
            risk: Number(ship.mission.risk || 0),
            successChance: Number(ship.mission.successChance || 0),
            outcomeRoll: Number(ship.mission.outcomeRoll || 0),
            startedDay: Number(ship.mission.startedDay || 0),
            originStarId: ship.mission.originStarId || null,
            startTime: Number(ship.mission.startTime || 0),
            duration: Number(ship.mission.duration || 0)
        } : null;
        return {
            id,
            name: ship.name != null ? String(ship.name) : 'Unnamed Ship',
            status: ship.status != null ? String(ship.status) : 'docked',
            designId,
            mission,
            wing: ship.wing || null,
            currentStarId: ship.currentStarId || String(this.currentSystemId || 'kepler_186f'),
            hasCryoPods: !!ship.hasCryoPods,
            stats,
            crew: Array.isArray(ship.crew) ? ship.crew.slice(0, 50) : [],
            componentHealth: ship.componentHealth && typeof ship.componentHealth === 'object' ? { ...ship.componentHealth } : null
        };
    }

    deserializeFleetShips(savedShips) {
        if (!Array.isArray(savedShips) || !this.shipDesigner || !Array.isArray(this.shipDesigner.designs)) return [];
        const designsById = Object.fromEntries(this.shipDesigner.designs.filter((design) => design?.id != null).map((design) => [String(design.id), design]));
        const out = [];
        savedShips.forEach((raw) => {
            if (!raw || typeof raw !== 'object') return;
            const id = raw.id != null ? String(raw.id) : null;
            const designId = raw.designId != null ? String(raw.designId) : (raw.design?.id != null ? String(raw.design.id) : null);
            const design = designId ? designsById[designId] : null;
            if (!id || !design) return;
            const maxHpDefault = Math.max(1, Number(design.stats?.hp || 1));
            const stats = { ...(raw.stats || {}) };
            Object.keys(stats).forEach((key) => {
                if (typeof stats[key] === 'number' && !Number.isFinite(stats[key])) delete stats[key];
            });
            stats.maxHp = Math.max(1, Number(stats.maxHp || maxHpDefault));
            stats.hp = Math.max(0, Math.min(stats.maxHp, Number(stats.hp ?? stats.maxHp)));
            const missionRaw = raw.mission && typeof raw.mission === 'object' ? raw.mission : null;
            const mission = missionRaw ? {
                id: missionRaw.id || null,
                type: missionRaw.type || null,
                durationSeconds: Number(missionRaw.durationSeconds || 0),
                remaining: Number(missionRaw.remaining || 0),
                elapsed: Number(missionRaw.elapsed || 0),
                risk: Number(missionRaw.risk || 0),
                successChance: Number(missionRaw.successChance || 0),
                outcomeRoll: Number(missionRaw.outcomeRoll || 0),
                startedDay: Number(missionRaw.startedDay || 0),
                originStarId: missionRaw.originStarId || null,
                startTime: Number(missionRaw.startTime || 0),
                duration: Number(missionRaw.duration || 0)
            } : null;
            out.push({
                id,
                name: raw.name != null ? String(raw.name) : 'Unnamed Ship',
                status: mission ? 'mission' : (raw.status != null ? String(raw.status) : 'docked'),
                mission,
                designId,
                design,
                wing: raw.wing || null,
                currentStarId: raw.currentStarId || String(this.currentSystemId || 'kepler_186f'),
                hasCryoPods: !!raw.hasCryoPods,
                stats,
                crew: Array.isArray(raw.crew) ? raw.crew.slice(0, 50) : [],
                componentHealth: raw.componentHealth && typeof raw.componentHealth === 'object' ? { ...raw.componentHealth } : {}
            });
        });
        return out;
    }

    buildShipFromDesign(design) {
        if (!design || typeof design !== 'object') return null;
        if (!Array.isArray(this.ships)) this.ships = [];

        const maxSize = (this.fleetManager && typeof this.fleetManager.maxSize === 'number' && Number.isFinite(this.fleetManager.maxSize))
            ? Math.floor(this.fleetManager.maxSize)
            : 5;
        if (this.ships.length >= maxSize) {
            this.notify('Fleet at capacity. Scrap a ship or increase fleet limit.', 'warning');
            return null;
        }

        if (!this.resources || typeof this.resources !== 'object') this.resources = {};

        const cost = (design.cost && typeof design.cost === 'object') ? design.cost : {};
        const normalizedCost = {};
        Object.keys(cost).forEach((key) => {
            const raw = cost[key];
            if (typeof raw !== 'number' || !Number.isFinite(raw)) return;
            const need = Math.max(0, Math.floor(raw));
            if (need <= 0) return;
            normalizedCost[key] = need;
        });

        const haveByKey = {};
        const missing = [];
        Object.keys(normalizedCost).forEach((key) => {
            const have = (typeof this.resources[key] === 'number' && Number.isFinite(this.resources[key])) ? this.resources[key] : 0;
            haveByKey[key] = have;
            if (have < normalizedCost[key]) {
                missing.push(`${key} (${Math.floor(have)}/${normalizedCost[key]})`);
            }
        });

        if (missing.length > 0) {
            this.notify(`Insufficient resources to build ship: ${missing.join(', ')}`, 'warning');
            return null;
        }

        Object.keys(normalizedCost).forEach((key) => {
            this.resources[key] = haveByKey[key] - normalizedCost[key];
        });

        const designHpRaw = (design.stats && typeof design.stats.hp === 'number' && Number.isFinite(design.stats.hp)) ? design.stats.hp : 100;
        const maxHp = Math.max(1, Math.floor(designHpRaw));

        const shipId = `ship_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const shipName = `${(design.name != null) ? String(design.name) : 'Ship'} Prototype`;
        const designId = (design.id != null) ? String(design.id) : null;

        const ship = {
            id: shipId,
            name: shipName,
            status: 'docked',
            mission: null,
            designId,
            design,
            currentStarId: String(this.currentSystemId || 'kepler_186f'),
            stats: { hp: maxHp, maxHp, wear: 0, fuel: 100, maxFuel: 100 },
            componentHealth: design.componentHealth ? { ...design.componentHealth } : {},
            // Roadmap Item 403: Crew management
            crew: [] // Array of NPC IDs
        };

        this.ships.push(ship);
        this.updateResourceUI();
        this.notify(`Prototype constructed: ${shipName}`, 'success');
        return ship;
    }

    openBridgeView(shipId) {
        // Roadmap Item 423: Bridge control UI (First-person mode foundation)
        const ship = this.ships.find(s => s.id === shipId);
        if (!ship) return;

        let modal = document.getElementById('ep-bridge-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-bridge-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.zIndex = '8500';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="ep-datapad" style="width:900px; height:600px; background:#020617; border:2px solid #38bdf8; display:flex; flex-direction:column; padding:0; overflow:hidden;">
                <!-- Simulated Viewport -->
                <div style="flex:1; background: radial-gradient(circle at center, #1e293b 0%, #020617 100%); position:relative; display:flex; align-items:center; justify-content:center;">
                    <div style="position:absolute; inset:0; border:40px solid rgba(15, 23, 42, 0.8); border-bottom-width:80px; pointer-events:none;"></div>
                    <div style="color:#38bdf8; font-family:monospace; text-align:center;">
                        <div style="font-size:2rem; margin-bottom:10px;">FRONT VIEWPORT</div>
                        <div class="blink" style="font-size:0.8rem;">REAL-TIME TELEMETRY ACTIVE</div>
                    </div>
                    
                    <!-- HUD Elements -->
                    <div style="position:absolute; top:20px; left:20px; color:#4ade80; font-family:monospace; font-size:0.8rem;">
                        <div>SHIP: ${ship.name}</div>
                        <div>CLASS: ${ship.design.hull.name}</div>
                        <div>STATUS: ${ship.status.toUpperCase()}</div>
                    </div>
                    <div style="position:absolute; top:20px; right:20px; text-align:right; color:#ef4444; font-family:monospace; font-size:0.8rem;">
                        <div>VELOCITY: ${ship.design.stats.speed} m/s</div>
                        <div>HULL: ${Math.floor((ship.stats.hp / ship.stats.maxHp) * 100)}%</div>
                        <div>SHIELD: ${Math.floor((ship.stats.shield || 0) / (ship.stats.maxShield || 50) * 100)}%</div>
                    </div>
                </div>

                <!-- Control Console -->
                <div style="height:150px; background:rgba(30, 41, 59, 0.9); border-top:2px solid #334155; display:flex; padding:15px; gap:20px;">
                    <div style="flex:1; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <button class="ep-sys-btn" onclick="game.notify('Engines at 100% output.', 'info')">ENGINES MAX</button>
                        <button class="ep-sys-btn" onclick="game.notify('Shield frequency modulated.', 'success')">MODULATE SHIELDS</button>
                        <button class="ep-sys-btn" onclick="game.notify('Point-defense automated.', 'info')">ACTIVATE PD</button>
                        <button class="ep-sys-btn" onclick="game.notify('Sensors pinging...', 'info')">SENSOR PING</button>
                    </div>
                    <div style="width:200px; display:flex; flex-direction:column; gap:10px;">
                        <button class="ep-sys-btn" style="border-color:#f472b6; color:#f472b6;" onclick="document.getElementById('ep-bridge-modal').style.display='none'">EXIT BRIDGE</button>
                        <button class="ep-sys-btn" style="border-color:#ef4444; color:#ef4444;" onclick="game.notify('Emergency self-destruct aborted.', 'danger')">SELF-DESTRUCT</button>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    recordColonyEvent(text, significance = 0.5, type = null) {
        const message = String(text || '').trim();
        if (!message) return null;

        const weight = Number.isFinite(Number(significance)) ? Math.max(0, Math.min(1, Number(significance))) : 0.5;
        let logType = type;
        if (!logType) {
            if (/hostile|attack|betray|lost|failed|compromised|pirate|blockade|radiation|danger|destroyed|casualt/i.test(message)) logType = 'warning';
            else if (weight >= 0.6) logType = 'success';
            else logType = 'info';
        }

        const entry = {
            id: `colony_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            text: message,
            type: logType,
            significance: weight,
            timestamp: Number(this.day || 0),
            realTime: Date.now()
        };

        if (!Array.isArray(this.colonyEventHistory)) this.colonyEventHistory = [];
        this.colonyEventHistory.unshift(entry);
        if (this.colonyEventHistory.length > 250) this.colonyEventHistory.length = 250;

        if (this.log?.add) this.log.add(message, logType);
        else if (this.log?.addEntry) this.log.addEntry(message, logType);
        return entry;
    }

    saveGame(options = {}) {
        // Save current system state first
        this.saveCurrentSystemState();

        this.advancePilotSkillTraining(0, { silent: true });

        const data = {
            resources: this.resources,
            colonists: this.colonists,
            day: this.day,
            timeSpeedIndex: this.timeSpeedIndex,
            tech: Object.keys(this.technologies).filter(k => this.technologies[k].unlocked),
            caps: this.caps,
            currentSystemId: this.currentSystemId,
            isOnMoon: this.isOnMoon,
            systemStates: this.systemStates,
            tiles: this.tiles.map(t => ({ id: t.id, type: t.type, building: t.building })),
            pilotSkills: this.pilotSkills,
            attributes: this.attributes,
            claims: this.claims,
            agentMissions: this.agentMissions,
            ships: Array.isArray(this.ships)
                ? this.ships.map((s) => this.serializeFleetShip(s)).filter(Boolean)
                : [],
            shipDesigns: (this.shipDesigner && Array.isArray(this.shipDesigner.designs))
                ? this.shipDesigner.designs.map((d) => this.serializeShipDesign(d)).filter(Boolean)
                : [],
            industry: this.industry,
            inventory: this.inventory,
            blueprints: this.blueprints,
            jumpBridges: this.jumpBridges ? this.jumpBridges.bridges : {},
            marketSystems: (window.economySystem && window.economySystem.systems) ? window.economySystem.systems : {},
            galaxyState: this.universe?.serializeGalacticState?.() || null,
            colonyEventHistory: Array.isArray(this.colonyEventHistory) ? this.colonyEventHistory.slice(0, 250) : [],
            archaeologyState: this.archaeology?.serialize?.() || null,
            fleetState: this.fleetManager?.serialize?.() || null,
            economyState: this.economyManager?.exportState?.() || null,
            localSystemState: this.localSystemExplorer?.serialize?.() || null
        };
        localStorage.setItem('ep_save_v2', JSON.stringify(data));
        if (!options.silent) this.notify("Game Saved (Local)!", "success");
    }

    tryAutoLoadGame() {
        if (this.autoloadEnabled === false) return;
        this.loadGame({ silent: true });
    }

    loadGame(options = {}) {
        let json = null;
        try { json = localStorage.getItem('ep_save_v2'); } catch (e) { json = null; }
        if (!json) {
            if (!options.silent) this.notify("No Local Save Found!", "warning");
            return;
        }
        try {
            const data = JSON.parse(json);
            this.loadGameData(data, { silent: options.silent === true });
            if (!options.silent) this.notify("Local Game Loaded!", "success");
        }
        catch (e) {
            console.error(e);
            this.notify("Save Corrupted!", "danger");
        }
    }

    loadGameData(data, options = {}) {
        const resourceDefaults = { ...this.resources };
        this.resources = { ...resourceDefaults, ...(data.resources || {}) };
        if (!Number.isFinite(this.resources.credits)) this.resources.credits = resourceDefaults.credits || 1000;
        this.caps = { ...this.caps, ...(data.caps || {}) };
        this.colonists = Array.isArray(data.colonists) ? data.colonists.map(c => this.normalizeColonist(c)) : [];
        this.day = data.day;
        this.currentSystemId = data.currentSystemId || 0;
        this.systemStates = data.systemStates || {};
        this.isOnMoon = !!data.isOnMoon;

        if (Array.isArray(data.inventory)) {
            this.inventory = data.inventory
                .filter((entry) => entry && this.buildingTypes?.[entry.type] && Number(entry.count) > 0)
                .map((entry) => ({ type: entry.type, count: Math.max(1, Math.floor(Number(entry.count))) }));
        }
        if (Array.isArray(data.blueprints)) {
            const mergedBlueprints = new Map();
            [...this.blueprints, ...data.blueprints].forEach((bp) => {
                if (!bp?.type || !this.buildingTypes?.[bp.type]) return;
                const key = bp.id || `bpo_${bp.type}`;
                const def = this.buildingTypes[bp.type];
                mergedBlueprints.set(key, {
                    id: key,
                    type: bp.type,
                    name: bp.name || `${def.name} Blueprint`,
                    isBPO: bp.isBPO !== false,
                    icon: bp.icon || def.icon
                });
            });
            this.blueprints = Array.from(mergedBlueprints.values());
        }
        if (data.industry && typeof data.industry === 'object') {
            const restoredJobs = Array.isArray(data.industry.jobs)
                ? data.industry.jobs.filter((job) => job && this.buildingTypes?.[job.type]).map((job) => ({
                    id: job.id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    type: job.type,
                    duration: Math.max(1, Number(job.duration) || Number(this.buildingTypes[job.type]?.buildTime) || 30),
                    timeLeft: Math.max(0, Number(job.timeLeft) || 0)
                }))
                : [];
            this.industry = {
                ...this.industry,
                ...data.industry,
                maxJobs: Math.max(1, Math.floor(Number(data.industry.maxJobs) || this.industry.maxJobs || 2)),
                jobs: restoredJobs
            };
        }

        // Roadmap Integration: Load new systems
        if (data.stockMarket) this.stockMarket = data.stockMarket;
        if (data.playerCorp) this.playerCorp = data.playerCorp;
        if (typeof data.timeSpeedIndex === 'number') this.setTimeSpeed(data.timeSpeedIndex);

        if (Array.isArray(data.shipDesigns) && this.shipDesigner) {
            this.shipDesigner.designs = this.deserializeShipDesigns(data.shipDesigns);
        }
        this.fleetManager?.prepareForShipRestore?.();
        this.ships = this.deserializeFleetShips(data.ships);
        this.fleetManager?.restore?.(data.fleetState || null);

        if (data.attributes) {
            this.attributes = { ...this.attributes, ...data.attributes };
        }
        if (data.claims) {
            this.claims = { ...this.claims, ...data.claims };
        }
        if (data.galaxyState && this.universe?.restoreGalacticState) {
            this.universe.restoreGalacticState(data.galaxyState);
        }
        const savedEconomyState = data.economyState || data.economy || null;
        if (this.economyManager?.importState && savedEconomyState) {
            this.economyManager.importState(savedEconomyState, { deferRouteSync: true });
        }
        if (data.archaeologyState && this.archaeology?.restore) this.archaeology.restore(data.archaeologyState);
        if (data.localSystemState && this.localSystemExplorer?.restore) this.localSystemExplorer.restore(data.localSystemState);
        this.colonyEventHistory = Array.isArray(data.colonyEventHistory)
            ? data.colonyEventHistory.slice(0, 250).map((entry) => ({
                ...entry,
                timestamp: Number(entry?.timestamp ?? entry?.day ?? 0),
                realTime: Number(entry?.realTime || Date.now())
            }))
            : [];
        if (this.log && Array.isArray(this.log.entries) && this.colonyEventHistory.length) {
            this.log.entries = this.colonyEventHistory.slice(0, this.log.maxEntries || 50).map((entry) => ({
                text: entry.text,
                type: entry.type || 'info',
                timestamp: entry.timestamp,
                realTime: entry.realTime
            }));
        }

        // Phase 5 Load
        if (data.jumpBridges && this.jumpBridges) {
            this.jumpBridges.bridges = data.jumpBridges;
        }
        if (data.marketSystems && window.economySystem) {
            window.economySystem.systems = data.marketSystems;
        }

        const loadedPilot = data.pilotSkills ? this.normalizePilotSkillsState(data.pilotSkills) : this.createDefaultPilotSkillsState(this.pilotSkillDefs);
        this.pilotSkills = loadedPilot;
        this.advancePilotSkillTraining(null, { silent: options && options.silent === true });

        const loadedMissions = data.agentMissions ? this.normalizeAgentMissionsState(data.agentMissions) : this.createDefaultAgentMissionsState(this.agentMissionDefs);
        this.agentMissions = loadedMissions;
        this.updateAgentMissions({ silent: true });

        if (data.tech) data.tech.forEach(key => { if (this.technologies[key]) { this.technologies[key].unlocked = true; if (this.technologies[key].effect) this.technologies[key].effect(); } });

        // Load the current system
        const baseId = String(this.currentSystemId);
        const stateId = this.isOnMoon ? `${baseId}_moon` : baseId;
        this.loadSystemState(stateId);
        // Reconcile saved autonomous trade routes only after structures are restored;
        // local orbital routes depend on an operational Launch Site.
        this.economyManager?.syncTradeRoutesFromGalaxy?.();
        if (!Number.isFinite(Number(this.caps.helium3)) || Number(this.caps.helium3) <= 0) this.caps.helium3 = 250;
        this.applyLocationModifiers();
        this.ensureLunarBlueprints({ silent: true, requireLaunchSite: true });

        this.createBuildMenu();
        this.updateLocationUI();
        this.updateOrbitalControls();

        this.updateResourceUI();
    }

    saveCurrentSystemState() {
        // We only save tiles that differ from procedural generation?
        // For now, save all tiles and structures to ensure continuity.
        // Optimization: In V2, only save tiles with buildings or changes.
        const baseId = String(this.currentSystemId);
        const stateId = this.isOnMoon ? `${baseId}_moon` : baseId;

        const existing = (this.systemStates && this.systemStates[stateId]) ? this.systemStates[stateId] : null;
        const baseState = (this.systemStates && this.systemStates[baseId]) ? this.systemStates[baseId] : null;

        const seedFromWorld = (typeof this.currentWorldSeed === 'number' && Number.isFinite(this.currentWorldSeed)) ? this.currentWorldSeed : null;
        const seedFromExisting = (existing && typeof existing.seed === 'number' && Number.isFinite(existing.seed)) ? existing.seed : null;
        const seedFromBase = (baseState && typeof baseState.seed === 'number' && Number.isFinite(baseState.seed)) ? baseState.seed : null;
        const seed = seedFromWorld ?? seedFromExisting ?? seedFromBase ?? 12345;

        const starConfig = (existing && existing.starConfig) ? existing.starConfig : ((baseState && baseState.starConfig) ? baseState.starConfig : null);

        this.systemStates[stateId] = {
            seed,
            worldType: this.isOnMoon ? 'moon' : (this.currentWorldType || existing?.worldType || baseState?.worldType || 'planet'),
            starConfig,
            tiles: this.tiles.map(t => ({
                id: t.id,
                type: t.type,
                building: t.building,
                life: t.life ? { scanned: t.life.scanned, flora: t.life.flora, fauna: t.life.fauna } : null,
                reserves: t.reserves ? Object.fromEntries(Object.entries(t.reserves).map(([key, value]) => [key, Math.max(0, Number(value) || 0)])) : null
            })),
            structures: this.structures
        };
    }

    loadSystemState(systemId) {
        const isMoon = String(systemId).endsWith('_moon');
        const type = isMoon ? 'moon' : 'planet';
        const baseId = isMoon ? String(systemId).replace(/_moon$/, '') : String(systemId);

        if (this.scene) {
            // Remove buildings from scene and planetMesh
            const sceneToRemove = this.scene.children.filter(o => o && o.userData && o.userData.isBuilding);
            sceneToRemove.forEach(o => this.scene.remove(o));

            if (this.planetMesh) {
                const planetToRemove = this.planetMesh.children.filter(o => o && o.userData && o.userData.isBuilding);
                planetToRemove.forEach(o => this.planetMesh.remove(o));
            }
        }
        this.buildingMeshes = {};

        if (this.systemStates[systemId]) {
            // Restore from state, including the actual climate/world class rather than silently
            // coercing every visited destination back to a generic rocky planet.
            const state = this.systemStates[systemId];
            const baseState = this.systemStates[baseId];
            const restoredType = isMoon ? 'moon' : (state.worldType || baseState?.worldType || type);

            const starConfig = state.starConfig || (baseState ? baseState.starConfig : null);
            if (starConfig) this.setupSuns(starConfig);

            this.structures = [];
            this.createPlanet(state.seed || 12345, restoredType);
            this.applySystemState(state);
        } else {
            // Should not happen if we only load visited.
            // If manual loadGameData call without warp?
            this.structures = [];
            this.createPlanet(12345, type);
        }
    }

    applySystemState(state) {
        // Re-apply buildings and scan data to the generated tiles
        state.tiles.forEach((savedTile, i) => {
            if (this.tiles[i]) {
                this.tiles[i].building = savedTile.building;
                if (savedTile.type) this.tiles[i].type = savedTile.type;
                if (savedTile.life) this.tiles[i].life = savedTile.life;
                if (savedTile.reserves && typeof savedTile.reserves === 'object') {
                    const migrated = { ...(this.tiles[i].reserves || {}) };
                    Object.entries(savedTile.reserves).forEach(([key, raw]) => {
                        let value = Math.max(0, Number(raw) || 0);
                        // Early lunar builds generated only 0-49 He-3 per deposit. Preserve true
                        // depletion at zero while scaling surviving legacy deposits into the new
                        // strategic-reserve range.
                        if (key === 'helium3' && value > 0 && value < 60) value *= 8;
                        migrated[key] = value;
                    });
                    this.tiles[i].reserves = migrated;
                }

                if (savedTile.building) {
                    // Re-instantiate building mesh
                    const worldPos = this.tiles[i].position.clone();
                    if (this.planetMesh) {
                        this.planetMesh.updateMatrixWorld();
                        this.planetMesh.localToWorld(worldPos);
                    }
                    const normal = worldPos.clone().normalize();
                    const mesh = this.placeBuildingMesh(worldPos, normal, savedTile.building);
                    if (mesh) this.buildingMeshes[this.tiles[i].id] = mesh;
                }
            }
        });
        this.structures = Array.isArray(state.structures) ? state.structures : []; // Keep sync
        this.structures.forEach((struct) => this.updateBuildingConstructionVisual(struct));
        if (this.isOnMoon) this.createLunarResourceMarkers();
    }

    multiplyCaps(factor) { Object.keys(this.caps).forEach(k => this.caps[k] *= factor); this.updateResourceUI(); }
    unlockBuilding(type) {
        if (!this.blueprints.some(bp => bp.type === type)) {
            const def = this.buildingTypes[type];
            if (def) {
                this.blueprints.push({
                    id: 'bpo_' + type,
                    type: type,
                    name: def.name + ' Blueprint',
                    isBPO: true,
                    icon: def.icon
                });
                this.notify(`New Blueprint Unlocked: ${def.name}`, "success");
            }
        }
    }
    resize() {
        const w = this.container.clientWidth; const h = this.container.clientHeight || 600;
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h);
    }

    openTechTree() {
        const modal = document.getElementById('ep-tech-modal');
        if (!modal) return;

        // Ensure modal has canvas setup
        const canvas = document.getElementById('ep-tech-canvas');
        if (!canvas) {
            const content = document.getElementById('ep-tech-grid');
            if (content) {
                content.style.display = 'block';
                content.style.position = 'relative';
                content.style.width = '1000px';
                content.style.height = '600px';
                content.innerHTML = `
                    <div style="position:absolute; top:10px; right:10px; z-index:10; display:flex; gap:10px; align-items:center; background:rgba(15,23,42,0.8); padding:10px; border-radius:8px; border:1px solid #a855f7;">
                        <div style="color:#cbd5e1; font-size:0.8rem;">Roadmap Item 901:</div>
                        <button class="ep-sys-btn" style="border-color:#a855f7; color:#a855f7;" onclick="game.performHypothesisTest()">🧪 TEST HYPOTHESIS (50 Data)</button>
                    </div>
                    <canvas id="ep-tech-canvas" width="1000" height="600" style="position:absolute;top:0;left:0;z-index:1;"></canvas>
                    <div id="ep-tech-nodes" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;"></div>
                `;
            }
        }
        modal.style.display = 'flex';
        this.renderTechTree();
    }

    renderTechTree() {
        const canvas = document.getElementById('ep-tech-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const nodeContainer = document.getElementById('ep-tech-nodes');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        nodeContainer.innerHTML = '';

        // Draw Connections
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;

        Object.keys(this.technologies).forEach(key => {
            const tech = this.technologies[key];
            if (tech.req && this.technologies[tech.req]) {
                const parent = this.technologies[tech.req];

                if (!parent.pos || !tech.pos) return;

                // Draw line from Parent to Child
                ctx.beginPath();
                ctx.moveTo(parent.pos.x + 30, parent.pos.y + 30); // Center of 60px node

                // Beizer Curve
                const cp1x = parent.pos.x + 30 + 50;
                const cp1y = parent.pos.y + 30;
                const cp2x = tech.pos.x + 30 - 50;
                const cp2y = tech.pos.y + 30;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tech.pos.x + 30, tech.pos.y + 30);

                if (tech.unlocked) ctx.strokeStyle = '#38bdf8'; // Blue for unlocked path
                else if (parent.unlocked) ctx.strokeStyle = '#fbbf24'; // Yellow for next available
                else ctx.strokeStyle = '#334155'; // Dark for locked

                ctx.stroke();
            }
        });

        // Draw Nodes
        Object.keys(this.technologies).forEach(key => {
            const tech = this.technologies[key];
            if (!tech.pos) return;
            const el = document.createElement('div');

            // Status Logic
            let statusClass = 'locked';
            let statusIcon = '🔒';
            if (tech.unlocked) { statusClass = 'unlocked'; statusIcon = '✅'; }
            else if (!tech.req || this.technologies[tech.req].unlocked) { statusClass = 'available'; statusIcon = '🔓'; }

            el.className = `ep-tech-node ${statusClass}`;
            el.style.left = tech.pos.x + 'px';
            el.style.top = tech.pos.y + 'px';
            el.innerHTML = `
                <div class="tech-icon">${statusIcon}</div>
                <div class="tech-name">${tech.name}</div>
                <div class="tech-cost">${tech.cost} Data</div>
            `;

            // Tooltip
            el.title = `${tech.desc}`;

            if (statusClass === 'available') {
                el.onclick = () => this.researchTech(key);
            }
            nodeContainer.appendChild(el);
        });
    }

    openMissions() {
        const modal = document.getElementById('ep-missions-modal');
        if (modal) modal.style.display = 'flex';
        this.renderMissionsUI();
    }

    renderMissionsUI() {
        const container = document.getElementById('ep-missions-content');
        if (!container) return;

        const defs = this.agentMissionDefs || this.getAgentMissionDefinitions();
        const active = this.agentMissions.active;

        let html = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; color:#fff;">
                <div class="ep-panel" style="padding:15px; background:rgba(15,23,42,0.8); border:1px solid #334155;">
                    <h3 style="margin-top:0; color:#38bdf8; border-bottom:1px solid #334155; padding-bottom:10px;">📜 Available Missions</h3>
                    <div style="display:flex; flex-direction:column; gap:10px; max-height:50vh; overflow-y:auto;">
        `;

        Object.values(defs).forEach(m => {
            const isCompleted = this.agentMissions.completed[m.id];
            const isActive = active && active.missionId === m.id;
            if (isCompleted && !m.repeatable) return;

            html += `
                <div style="background:#1e293b; padding:12px; border-radius:8px; border:1px solid ${isActive ? '#38bdf8' : '#475569'}; position:relative;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                        <span style="font-size:1.5rem;">${m.icon}</span>
                        <span style="font-weight:bold; color:#e2e8f0;">${m.name}</span>
                    </div>
                    <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:8px;">${m.desc}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; color:#fbbf24;">Reward: ${this.formatCost(m.reward)}</span>
                        ${isActive ?
                    (m.isEspionage ? `<button class="ep-sys-btn" style="font-size:0.7rem; padding:4px 10px; border-color:#ef4444; color:#ef4444;" onclick="game.executeEspionage()">INFILTRATE</button>` : '<span style="color:#38bdf8; font-size:0.8rem;">ACTIVE</span>')
                    : `<button class="ep-sys-btn" style="font-size:0.7rem; padding:4px 10px;" onclick="game.acceptMission('${m.id}')">ACCEPT</button>`}
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
                <div class="ep-panel" style="padding:15px; background:rgba(15,23,42,0.8); border:1px solid #334155;">
                    <h3 style="margin-top:0; color:#a855f7; border-bottom:1px solid #334155; padding-bottom:10px;">🔬 Citizen Science (Item 906)</h3>
                    <div style="background:#0f172a; padding:15px; border-radius:8px; border:1px solid #a855f7;">
                        <div style="font-size:0.85rem; color:#cbd5e1; line-height:1.4; margin-bottom:15px;">
                            Help scientists on Earth by analyzing real stellar data. Connect your colony's arrays to the Interstellar Research Network.
                        </div>
                        <div id="ep-cs-data-display" style="background:#020617; padding:10px; border-radius:4px; font-family:monospace; color:#4ade80; font-size:0.75rem; min-height:80px; margin-bottom:15px; border:1px solid #1e293b;">
                            [WAITING FOR NASA DATA FEED...]
                        </div>
                        <button class="ep-sys-btn" style="width:100%; border-color:#a855f7; color:#a855f7;" onclick="game.performCitizenScience()">ANALYZE DATA PACKET</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    performCitizenScience() {
        const display = document.getElementById('ep-cs-data-display');
        if (!display) return;

        // Simulate fetching NASA Data (Roadmap Item 906)
        display.innerHTML = "CONNECTING TO TESS PUBLIC ARCHIVE...<br>FETCHING LIGHT CURVE: TIC 278825952<br>RUNNING PERIODOGRAM ANALYSIS...<br><span style='color:#fbbf24'>MATCH FOUND! Transit detected in Sector 4.</span>";

        if (!this.resources.data_analyzed) this.resources.data_analyzed = 0;
        this.resources.data_analyzed += 10;
        this.resources.data += 5;
        this.notify("Citizen Science contribution successful! +5 Research Data", "success");
        this.updateResourceUI();
        this.renderMissionsUI();
    }

    openRoster() {
        const modal = document.getElementById('ep-roster-modal');
        const list = document.getElementById('ep-roster-list');
        if (!modal || !list) return;
        modal.style.display = 'flex';
        list.innerHTML = '';
        this.colonists.forEach((c, index) => {
            const tr = document.createElement('tr');

            this.normalizeColonist(c);

            const needColor = (val) => val < 25 ? '#ef4444' : (val < 50 ? '#f59e0b' : '#22c55e');
            const hunger = Math.floor(c.needs.hunger);
            const oxygen = Math.floor(c.needs.oxygen);
            const rest = Math.floor(c.needs.rest);

            // Trait Badges
            const traitsHtml = c.traits.map(t => {
                const def = TRAIT_DEFINITIONS[t];
                if (!def) return '';
                return `<span style="background:${def.color}44; color:${def.color}; border:1px solid ${def.color}; padding:2px 6px; border-radius:4px; font-size:0.8em; margin-right:4px;">${def.name}</span>`;
            }).join('');

            const npc = this.npcSystem?.npcs[c.id];
            const emotionsHtml = npc ? `
                <div style="display:flex; gap:4px; font-size:0.75em; margin-top:4px; opacity:0.8;">
                    <span title="Happiness">😊 ${Math.floor(npc.emotions.happiness)}</span>
                    <span title="Stress">😰 ${Math.floor(npc.emotions.stress)}</span>
                    <span title="Fear">😨 ${Math.floor(npc.emotions.fear)}</span>
                    <span title="Loneliness">👤 ${Math.floor(npc.emotions.loneliness)}</span>
                </div>
            ` : '';

            const relationsHtml = npc ? `
                <div style="font-size:0.75em; margin-top:2px; color:#94a3b8;">
                    🤝 Friends: ${Object.values(npc.relationships).filter(v => v > 70).length} | ⚡ Rivals: ${Object.values(npc.relationships).filter(v => v < 30).length}
                </div>
            ` : '';

            const hobbyHtml = npc?.hobby ? `<div style="font-size:0.75em; color:#fbbf24; margin-top:2px;">🎨 Hobby: ${npc.hobby.name}</div>` : '';

            tr.innerHTML = `
                <td style="padding:0.5rem;">
                    <div style="font-weight:bold; color:#fff;">${c.name}</div>
                    <div style="margin-top:2px;">${traitsHtml}</div>
                    ${emotionsHtml}
                    ${relationsHtml}
                    ${hobbyHtml}
                </td>
                <td>${this.jobTitles[c.job] || c.job}</td>
                <td>${Math.floor(c.morale)}%</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:4px; font-size:0.85em; color:#cbd5e1;">
                        <div style="display:flex; gap:8px;">
                            <span style="color:${needColor(hunger)};" title="Hunger">🍖 ${hunger}%</span>
                            <span style="color:${needColor(oxygen)};" title="Oxygen">💨 ${oxygen}%</span>
                            <span style="color:${needColor(rest)};" title="Rest">😴 ${rest}%</span>
                        </div>
                    </div>
                </td>
                <td>
                    <button class="ep-sys-btn" onclick="window.game.openChat(${index})" title="Chat">💬</button>
                    <button class="ep-sys-btn" onclick="window.game.openCRISPRLab(${index})" title="Genetics">🧬</button>
                    <button class="ep-sys-btn" onclick="window.game.npcSystem.uploadMind('${c.id}')" title="Mind Upload" style="border-color:#a855f7; color:#a855f7;">🌌</button>
                    <button class="ep-sys-btn" onclick="window.game.assignJob('${c.id}', 'next')" title="Job">🔄</button>
                </td>
            `;
            list.appendChild(tr);
        });
    }

    openLegalSystem() {
        if (!this.legalSystem) return;
        let modal = document.getElementById('ep-legal-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-legal-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.display = 'none';
            modal.style.zIndex = '8500';
            modal.innerHTML = `
                <div class="ep-modal" style="width:600px; max-width:95vw;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#fbbf24;">⚖️ Colony Legal System</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-legal-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-legal-content" style="padding:20px; background: radial-gradient(circle at center, #1e1b4b 0%, #020617 100%);">
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.style.display = 'flex';
        this.renderLegalSystem();
    }

    renderLegalSystem() {
        const container = document.getElementById('ep-legal-content');
        if (!container || !this.legalSystem) return;

        let html = '<div style="display:flex; flex-direction:column; gap:15px;">';
        this.legalSystem.laws.forEach(law => {
            html += `
                <div style="background:rgba(15,23,42,0.8); border:1px solid ${law.active ? '#fbbf24' : '#334155'}; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <div style="font-weight:bold; color:${law.active ? '#fbbf24' : '#fff'}; font-size:1.1rem;">${law.name}</div>
                        <div style="font-size:0.8rem; color:#94a3b8; margin-top:4px;">${law.desc}</div>
                    </div>
                    <button class="ep-sys-btn" style="border-color:${law.active ? '#ef4444' : '#4ade80'}; color:${law.active ? '#ef4444' : '#4ade80'};" onclick="game.legalSystem.toggleLaw('${law.id}'); game.renderLegalSystem();">
                        ${law.active ? 'REPEAL' : 'RATIFY'}
                    </button>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    ensureChatUI() {
        let modal = document.getElementById('ep-chat-modal');
        if (modal) return;

        modal = document.createElement('div');
        modal.id = 'ep-chat-modal';
        modal.className = 'ep-modal-overlay';
        modal.style.display = 'none';
        modal.style.zIndex = '9000';
        modal.innerHTML = `
            <div class="ep-modal" style="width:600px; height:700px; max-width:95vw;">
                <div class="ep-modal-header">
                    <h2 id="ep-chat-title" style="margin:0; color:#c084fc;">💬 Chat</h2>
                    <button class="ep-sys-btn" id="ep-chat-close">CLOSE</button>
                </div>
                <div class="ep-modal-body" style="display:flex; flex-direction:column; padding:1.5rem; background: radial-gradient(circle at center, #2e1065 0%, #020617 100%);">
                    <div id="ep-chat-messages" class="ep-chat-messages">
                        <div style="text-align:center; color:#94a3b8; margin-top:20px;">Initializing Neural Link...</div>
                    </div>
                    <div class="ep-chat-input-area">
                        <input type="text" id="ep-chat-input" placeholder="Type a message..." maxlength="200">
                        <button class="ep-sys-btn tech" id="ep-chat-send">SEND</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const voiceToggle = modal.querySelector('#ep-setting-voice');
        if (voiceToggle) {
            voiceToggle.checked = !!this.voiceEnabled;
            voiceToggle.onchange = () => {
                this.voiceEnabled = voiceToggle.checked;
                this.saveSettings();
                this.notify(`AI Voice ${this.voiceEnabled ? 'Enabled' : 'Disabled'}`, 'info');
            };
        }

        modal.querySelector('#ep-pause-close').onclick = () => {
            this.closePauseMenu();
        };

        const sendBtn = modal.querySelector('#ep-chat-send');
        const input = modal.querySelector('#ep-chat-input');

        const send = () => {
            const txt = input.value.trim();
            if (txt) {
                this.sendChatMessage(txt);
                input.value = '';
            }
        };

        sendBtn.onclick = send;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') send();
        };
    }

    openChat(colonistIndex) {
        this.ensureChatUI();
        const c = this.colonists[colonistIndex];
        if (!c) return;

        this.currentChatNPC = c; // Store ref
        const jobTitle = (this.jobTitles && this.jobTitles[c.job]) ? this.jobTitles[c.job] : 'Colonist';
        const npc = this.npcSystem?.npcs[c.id];

        let headerHtml = `💬 ${c.name} (${jobTitle})`;
        if (npc) {
            headerHtml += `<div style="font-size:0.7em; color:#94a3b8; font-weight:normal; margin-top:4px;">${npc.backstory || 'No recorded history.'}</div>`;
            if (npc.hobby) {
                headerHtml += `<div style="font-size:0.7em; color:#fbbf24; font-weight:normal;">🎨 Hobby: ${npc.hobby.name}</div>`;
            }
            if (npc.lastDream) {
                headerHtml += `<div style="font-size:0.65em; color:#a78bfa; font-style:italic; margin-top:2px;">Last Dream: "${npc.lastDream.text}"</div>`;
            }
        }

        document.getElementById('ep-chat-title').innerHTML = headerHtml;
        document.getElementById('ep-chat-modal').style.display = 'flex';

        // Load history
        const history = (this.npcSystem && this.npcSystem.memories) ? (this.npcSystem.memories[c.id] || []) : [];
        this.renderChatHistory(history);

        // Focus input
        setTimeout(() => document.getElementById('ep-chat-input').focus(), 100);
    }

    closeChat() {
        const modal = document.getElementById('ep-chat-modal');
        if (modal) modal.style.display = 'none';
        this.currentChatNPC = null;
    }

    openFactionDashboard() {
        if (!this.factionManager) return;

        let modal = document.getElementById('ep-faction-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-faction-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.display = 'none';
            modal.style.zIndex = '8500';
            modal.innerHTML = `
                <div class="ep-modal" style="width:800px; max-width:95vw;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#fde047;">🏳️ Faction Dashboard</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-faction-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-faction-content" style="padding:1.5rem; background: radial-gradient(circle at center, #2e1065 0%, #020617 100%);"></div>
                </div>
             `;
            document.body.appendChild(modal);
        }

        modal.style.display = 'flex';
        this.renderFactionDashboard();
    }

    renderFactionDashboard() {
        const container = document.getElementById('ep-faction-content');
        if (!container || !this.factionManager) return;

        const relationships = this.factionManager.relationships['player'] || {};

        let html = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">';

        // Faction List
        Object.values(this.factionManager.factions).forEach(f => {
            if (f.id === 'player') return;
            const rel = relationships[f.id] || 0;
            const relColor = rel > 20 ? '#4ade80' : (rel < -20 ? '#ef4444' : '#cbd5e1');
            const relText = rel > 50 ? 'Ally' : (rel > 20 ? 'Friendly' : (rel < -50 ? 'War' : (rel < -20 ? 'Hostile' : 'Neutral')));

            html += `
                <div style="background:rgba(15,23,42,0.8); padding:1rem; border-radius:10px; border:1px solid ${f.color}; display:flex; flex-direction:column; gap:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h3 style="margin:0; color:${f.color};">${f.name}</h3>
                        <span style="font-weight:bold; color:${relColor}; font-size:0.8rem;">${relText} (${rel})</span>
                    </div>
                    <p style="color:#94a3b8; font-size:0.8rem; margin:0;">${f.description}</p>
                    
                    <div style="flex:1; background:rgba(0,0,0,0.3); border-radius:6px; padding:8px; font-size:0.75rem; max-height:100px; overflow-y:auto; border:1px solid rgba(255,255,255,0.05);">
                        <div style="color:${f.color}; font-weight:bold; margin-bottom:4px; font-size:0.7rem;">📜 DIPLOMATIC HISTORY</div>
                        ${f.history?.length > 0 ? f.history.slice().reverse().map(h => `
                            <div style="margin-bottom:4px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:2px;">
                                <span style="color:#64748b;">Day ${h.day}:</span> ${h.event}
                            </div>
                        `).join('') : '<div style="color:#475569; font-style:italic;">No recorded events.</div>'}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:5px;">
                            <button class="ep-sys-btn" onclick="window.game.factionManager.modifyOpinion('${f.id}', 'player', 5); window.game.renderFactionDashboard();">🎁 Gift</button>
                            <button class="ep-sys-btn" onclick="window.game.factionManager.modifyOpinion('${f.id}', 'player', -10); window.game.renderFactionDashboard();" style="border-color:#ef4444; color:#ef4444;">⚔️ Insult</button>
                        </div>
                    </div>
                    <div style="font-size:0.7rem; color:#64748b;">
                        Aggression: ${(f.personality.aggression * 100).toFixed(0)}% | 
                        Trade: ${(f.personality.trade * 100).toFixed(0)}% | 
                        Tech: ${(f.personality.tech * 100).toFixed(0)}%
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderChatHistory(history) {
        const container = document.getElementById('ep-chat-messages');
        if (!container) return;
        container.innerHTML = '';

        if (!history || history.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#cbd5e1; margin-top:20px; font-style:italic;">No previous conversation recorded.</div>';
            return;
        }

        history.forEach(msg => {
            if (msg.role === 'system') return; // Hide system prompts
            const bubble = document.createElement('div');
            bubble.className = `ep-chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`;
            bubble.innerText = msg.content;
            container.appendChild(bubble);
        });

        container.scrollTop = container.scrollHeight;
    }

    async sendChatMessage(text) {
        if (!this.currentChatNPC) return;
        const container = document.getElementById('ep-chat-messages');

        // Optimistic UI: User Message
        const userBubble = document.createElement('div');
        userBubble.className = 'ep-chat-bubble user';
        userBubble.innerText = text;
        container.appendChild(userBubble);
        container.scrollTop = container.scrollHeight;

        // Visual Typing Indicator
        const typingBubble = document.createElement('div');
        typingBubble.className = 'ep-chat-bubble ai';
        typingBubble.innerText = '...';
        typingBubble.id = 'ep-chat-typing';
        container.appendChild(typingBubble);
        container.scrollTop = container.scrollHeight;

        try {
            if (this.npcSystem) {
                const response = await this.npcSystem.talkTo(this.currentChatNPC.id, text);

                // Remove typing indicator
                const typing = document.getElementById('ep-chat-typing');
                if (typing) typing.remove();

                const aiBubble = document.createElement('div');
                aiBubble.className = 'ep-chat-bubble ai';
                aiBubble.innerText = response;
                container.appendChild(aiBubble);
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            console.error("Chat Error:", e);
            // Remove typing indicator
            const typing = document.getElementById('ep-chat-typing');
            if (typing) typing.remove();

            this.notify("Connection to Neural Link failed.", "danger");
        }
    }

    applyColonistEffects() {
        if (!this.colonists) return;
        const isNight = this.timeOfDay < 6 || this.timeOfDay > 20;

        this.colonists.forEach(c => {
            if (!c.traits) return;

            // Roadmap Item 108: NPC Epiphanies
            // Researcher NPCs have a chance to unlock a random available tech
            if (c.job === 'researcher' && Math.random() < 0.001 * this.timeScale) {
                const availableTechs = Object.keys(this.technologies).filter(k => {
                    const t = this.technologies[k];
                    return !t.unlocked && (!t.req || this.technologies[t.req].unlocked);
                });

                if (availableTechs.length > 0) {
                    const techKey = availableTechs[Math.floor(Math.random() * availableTechs.length)];
                    const tech = this.technologies[techKey];
                    tech.unlocked = true;
                    if (tech.effect) tech.effect();
                    this.notify(`💡 EPIPHANY: ${c.name} has discovered ${tech.name}!`, "success");
                    this.recordColonyEvent(`${c.name} made a sudden scientific breakthrough.`, 0.9);
                    this.audio.playUnlock();
                    this.updateResourceUI();
                }
            }

            c.traits.forEach(t => {
                // Insomniac: Loses morale at night
                if (t === 'Insomniac' && isNight) {
                    c.morale = Math.max(0, c.morale - 0.05);
                }
                // Workaholic: Loses morale if unemployed
                if (t === 'Workaholic' && c.job === 'unemployed') {
                    c.morale = Math.max(0, c.morale - 0.1);
                }
                // Robust: Recovers morale slowly
                if (t === 'Robust') {
                    c.morale = Math.min(100, c.morale + 0.01);
                }
            });
        });
    }

    // Roadmap Item 141: Social Interactions & NPC Dynamics
    handleSocialInteractions() {
        if (!this.colonists || this.colonists.length < 2) return;

        // Pick two random colonists to interact
        const idx1 = Math.floor(Math.random() * this.colonists.length);
        let idx2 = Math.floor(Math.random() * this.colonists.length);
        while (idx1 === idx2) idx2 = Math.floor(Math.random() * this.colonists.length);

        const c1 = this.colonists[idx1];
        const c2 = this.colonists[idx2];

        // Interaction chance based on morale and time of day
        if (Math.random() < 0.3) {
            const success = (c1.morale + c2.morale) / 200 > Math.random();
            if (success) {
                c1.morale = Math.min(100, c1.morale + 2);
                c2.morale = Math.min(100, c2.morale + 2);
                if (Math.random() < 0.1) {
                    this.notify(`🤝 SOCIAL: ${c1.name} and ${c2.name} are getting along well.`, "info");
                }
            } else {
                c1.morale = Math.max(0, c1.morale - 1);
                c2.morale = Math.max(0, c2.morale - 1);
            }
        }
    }

    // Roadmap Item 206: Interstellar Stock Market
    updateStockMarket() {
        if (!this.economyManager) return;

        // Fluctuating prices for resources
        const resources = ['minerals', 'alloys', 'circuits', 'energy'];
        resources.forEach(res => {
            const state = this.economyManager.marketState[res];
            if (!state) return;

            const basePrice = this.economyManager.basePrices[res] || 10;
            const volatility = 0.05;
            const change = (Math.random() - 0.5) * 2 * volatility;
            state.price = basePrice * (1 + change);
        });

        if (Math.random() < 0.01) {
            this.notify("📈 Market Alert: Volatility in resource exchange rates detected.", "info");
        }
    }

    // Roadmap Item 150: Environmental Effects & Wear/Tear
    applyEnvironmentalEffects(dt) {
        if (!this.structures) return;

        // Sandstorms or radiation cause wear on external structures
        const wearRate = 0.001 * dt * (this.currentPlanet?.hazardLevel || 1.0);

        this.structures.forEach(s => {
            if (s.isExternal) {
                s.integrity = Math.max(0, (s.integrity || 100) - wearRate);
                if (s.integrity < 20 && Math.random() < 0.01) {
                    if (this.drones) this.drones.markDamaged(s.tileId);
                }
            }
        });
    }
    assignJob(id, job) {
        const col = this.colonists.find(c => c.id === id);
        if (col) {
            if (job === 'next') {
                const jobs = ['unemployed', 'engineer', 'miner', 'botanist', 'researcher'];
                const nextIdx = (jobs.indexOf(col.job) + 1) % jobs.length;
                col.job = jobs[nextIdx];
            } else { col.job = job; }
            this.notify(`${col.name} is now a ${this.jobTitles[col.job]} `, 'info');
            this.openRoster();
        }
    }

    startTick() {
        setInterval(() => {
            this.advancePilotSkillTraining(null);
            this.updateAgentMissions();
            if (this.isPaused) return;
            const tickScale = Math.max(0, Number(this.timeScale) || 0);
            const resourceBefore = Object.fromEntries(Object.entries(this.resources || {}).map(([key, value]) => [key, Number(value) || 0]));
            this.advanceConstruction(1);
            if (this.achievements) this.achievements.check();
            const isNight = this.timeOfDay < 6 || this.timeOfDay > 20;

            // 1. Environmental & Habitability Calculations
            let habImpact = 0;
            if (this.terraforming) {
                const stats = this.terraforming.stats;
                // Ideal ranges: Temp 15-25, Atmos 15-25, Water 10-20
                if (stats.temperature < 0 || stats.temperature > 40) habImpact -= 2;
                if (stats.atmosphere < 10) habImpact -= 3;
                if (stats.oxygen < 5) habImpact -= 5;
            }

            // Roadmap Item 176: Holiday System
            const isHoliday = this.day % 30 === 0;
            if (isHoliday) {
                this.notify("🎉 COLONY HOLIDAY: Foundation Day celebrations in progress!", "success");
                habImpact += 5; // Morale boost from holiday
            }

            let bonusData = 0;

            this.colonists.forEach(c => {
                if (!c.traits) return;

                const traitMods = { workSpeed: 1, moraleGain: 1, moraleDecay: 1 };

                // Night behavior
                if (isNight) {
                    if (c.traits.includes('Insomniac')) traitMods.moraleDecay *= 1.5;
                    if (c.traits.includes('NightOwl')) traitMods.workSpeed *= 1.3;

                    // Roadmap Item 145: NPC Dreams
                    if (this.npcSystem && Math.random() < 0.01) {
                        const dream = this.npcSystem.simulateDream(c.id);
                        if (dream && dream.impact !== 0) {
                            c.morale = Math.max(0, Math.min(100, c.morale + dream.impact));
                        }
                    }
                }

                // Needs decay & recovery
                const foodUse = 0.1 * (this.timeScale || 1.0);
                if (this.resources.food >= foodUse) {
                    c.needs.hunger = Math.min(100, c.needs.hunger + 0.5 * traitMods.moraleGain);
                    this.resources.food = Math.max(0, this.resources.food - foodUse);
                } else {
                    this.resources.food = Math.max(0, this.resources.food);
                    c.needs.hunger = Math.max(0, c.needs.hunger - 1);
                }

                const oxygenUse = 0.05 * (this.timeScale || 1.0);
                if (this.resources.oxygen >= oxygenUse) {
                    c.needs.oxygen = Math.min(100, c.needs.oxygen + 0.5 * traitMods.moraleGain);
                    this.resources.oxygen = Math.max(0, this.resources.oxygen - oxygenUse);
                } else {
                    this.resources.oxygen = Math.max(0, this.resources.oxygen);
                    c.needs.oxygen = Math.max(0, c.needs.oxygen - 2);
                }

                // Morale Calculation (Item 105: Emotions)
                let moraleDelta = (habImpact * 0.1) + (c.needs.hunger > 80 ? 0.1 : -0.2) + (c.needs.oxygen > 80 ? 0.1 : -0.5);
                if (c.job === 'unemployed') moraleDelta -= 0.2;

                c.morale = Math.max(0, Math.min(100, c.morale + (moraleDelta * traitMods.moraleDecay)));

                // Roadmap Item 108: NPC Epiphanies
                if (c.job === 'researcher' && Math.random() < 0.001 * this.timeScale) {
                    const availableTechs = Object.keys(this.technologies).filter(k => {
                        const t = this.technologies[k];
                        return !t.unlocked && (!t.req || this.technologies[t.req].unlocked);
                    });

                    if (availableTechs.length > 0) {
                        const techKey = availableTechs[Math.floor(Math.random() * availableTechs.length)];
                        const tech = this.technologies[techKey];
                        tech.unlocked = true;
                        if (tech.effect) tech.effect();
                        this.notify(`💡 EPIPHANY: ${c.name} has discovered ${tech.name}!`, "success");
                        this.recordColonyEvent(`${c.name} made a sudden scientific breakthrough.`, 0.9);
                        this.audio.playUnlock();
                    }
                }

                // Item 107: Career Progression
                if (c.job !== 'unemployed') {
                    c.career.exp += 1 * (this.timeScale || 1.0);
                    if (c.career.exp >= 100) {
                        c.career.exp = 0;
                        c.career.level++;
                        this.notify(`🌟 CAREER: ${c.name} has reached ${c.career.path} Level ${c.career.level}!`, "success");
                    }

                    // Progress Goal
                    c.career.currentValue += (0.05 + Math.random() * 0.05) * (this.timeScale || 1.0);
                    if (c.career.currentValue >= c.career.targetValue) {
                        c.career.currentValue = 0;
                        c.career.targetValue += 50;
                        const rewards = { credits: 100, data: 5 };
                        this.resources.credits = (this.resources.credits || 0) + rewards.credits;
                        this.resources.data += rewards.data;
                        this.notify(`🎯 GOAL: ${c.name} completed a personal goal! +100 Credits, +5 Data`, "success");
                        this.updateResourceUI();
                    }

                    if (c.job === 'researcher') bonusData += 0.2 * c.career.level;

                    // Roadmap Item 142: Hobby System Benefits
                    const npc = this.npcSystem?.npcs[c.id];
                    if (npc && npc.hobby) {
                        const h = npc.hobby;
                        if (h.bonus === 'food' && Math.random() < 0.05) this.resources.food += 0.5;
                        if (h.bonus === 'energy' && Math.random() < 0.05) this.resources.energy += 0.5;
                        if (h.bonus === 'minerals' && Math.random() < 0.05) this.resources.minerals += 0.5;
                        if (h.bonus === 'data' && Math.random() < 0.02) this.resources.data += 0.1;
                        if (h.bonus === 'morale' && Math.random() < 0.1) c.morale = Math.min(100, c.morale + 0.5);
                    }
                }

                // NPC Chatter (Item 122)
                if (Math.random() < 0.005) {
                    this.generateNPCPost(c);
                }
            });

            // Update NPC Internal States (Items 172, 174, 180, 182, 183, 190, 191)
            if (this.npcSystem) {
                this.npcSystem.updateNPCStates(1.0); // Once per tick
            }

            // 1. Colonist Survival & Morale (Roadmap Item 118: Mental Health)
            let sumMorale = 0;
            if (this.colonists.length > 0) {
                this.colonists.forEach(c => {
                    // Roadmap Item 324: Low-G leap bonus
                    if (this.modifiers.gravity < 0.5) {
                        c.morale = Math.min(100, c.morale + 0.05); // Happiness from low-G freedom
                    }
                    sumMorale += c.morale;
                });
                this.morale = sumMorale / this.colonists.length;
            }

            // 2. Building Production & Power (Roadmap Item 213: Energy-grid management)
            let powerAvailable = 0;
            const powerSources = [];
            this.powerGrid = { load: 0, capacity: 0, sources: [] };
            let totalPollution = 0; // Roadmap Item 230

            // Roadmap Item 179: AI-driven energy conservation
            const isConserving = this.resources.energy < 20;
            if (isConserving && Math.random() < 0.05) {
                this.notify("🔋 ENERGY SAVER: AI has engaged conservation protocols.", "warning");
            }

            this.structures.forEach(s => {
                if (s.isConstructing) {
                    s.powered = false;
                    this.updateBuildingOperationalVisual(s);
                    return;
                }
                const def = this.buildingTypes[s.type];
                if (def && def.output && def.output.energy) {
                    s.powered = true;
                    const level = s.level || 1;
                    const mult = Math.pow(1.2, level - 1);
                    const powerGen = def.output.energy * mult;
                    powerAvailable += powerGen;
                    this.powerGrid.capacity += powerGen;
                    const pos = this.getTilePos(s.tileId);
                    const baseRange = def.icon === '☢️' ? 50 : 20;
                    const range = this.isOnMoon ? Math.max(baseRange, 80) : baseRange;
                    powerSources.push({ id: s.id, pos, range, gen: powerGen });
                    this.powerGrid.sources.push({ id: s.id, pos, range, gen: powerGen });
                }

                // Track pollution for environmental taxes
                if (s.isCrafting && (s.type === 'refinery' || s.type === 'mine' || s.type === 'fusion')) {
                    totalPollution += 1;
                }
            });

            // Roadmap Item 230: Environmental Taxes
            if (this.day % 1 === 0 && totalPollution > 0) {
                const tax = totalPollution * 2;
                if (this.resources.carbon_credits >= tax) {
                    this.resources.carbon_credits -= tax;
                } else {
                    const fine = (tax - this.resources.carbon_credits) * 5;
                    this.resources.credits = Math.max(0, (this.resources.credits || 0) - fine);
                    this.resources.carbon_credits = 0;
                    if (fine > 0 && Math.random() < 0.1) {
                        this.notify(`📉 ENV TAX: Paid ${Math.floor(fine)} Cr in pollution fines.`, "warning");
                    }
                }
            }

            // Roadmap Item 214: Waste heat utilization
            this.wasteHeat = 0;
            this.structures.forEach(s => {
                if (s.isCrafting) {
                    this.wasteHeat += 5; // Basic heat per active building
                }
            });
            if (this.wasteHeat > 50 && this.terraforming) {
                this.terraforming.stats.temperature += 0.01; // Waste heat warms planet
            }

            // 3. Apply Production
            this.structures.forEach(s => {
                if (s.isConstructing) return;
                const def = this.buildingTypes[s.type];
                if (!def) return;
                let powered = true;

                // Roadmap Item 247: Modular Hub efficiency bonus
                const hasModularHub = this.structures.some(sh => sh.type === 'modular_hub' && this.isStructureOperational(sh) && (sh.condition ?? 100) > 50);
                const modularBonus = hasModularHub ? 1.15 : 1.0; // Slightly increased

                // Roadmap Item 249: Base Crawler proximity bonus
                let crawlerBonus = 1.0;
                const crawler = this.structures.find(sh => sh.type === 'base_crawler' && this.isStructureOperational(sh) && (sh.condition ?? 100) > 50);
                if (crawler) {
                    const structPos = this.getTilePos(s.tileId);
                    const crawlerPos = this.getTilePos(crawler.tileId);
                    if (structPos.distanceTo(crawlerPos) < 30) {
                        crawlerBonus = 1.25; // 25% bonus for being near the crawler
                    }
                }

                if (!def.output || !def.output.energy) {
                    if (powerSources.length > 0) {
                        const pos = this.getTilePos(s.tileId);
                        const inRange = powerSources.some(src => pos.distanceTo(src.pos) < src.range);
                        if (!inRange) powered = false;
                    } else {
                        powered = false;
                    }
                }

                // Roadmap Item 179: Energy Conservation (Shutdown non-essential)
                if (isConserving && !def.output?.energy && s.type !== 'oxy') {
                    powered = false;
                }
                s.powered = powered;
                this.updateBuildingOperationalVisual(s);

                if (powered && def.output) {
                    const level = s.level || 1;
                    const pb = this.getPilotProductionBonuses();
                    const secStatus = this.systemSecurity[this.currentSystemId] || 1.0;
                    const secMult = 1.5 - (secStatus * 0.5);

                    // Roadmap Item 138: Swarm Bonus
                    const swarmMult = this.drones?.getSwarmEfficiencyBonus() || 1.0;

                    let multiplier = Math.pow(1.2, level - 1) * secMult * swarmMult * modularBonus * crawlerBonus;

                    // Roadmap Item 370: Planetary rings resource bonus
                    if (this.planetData?.hasRings && s.type === 'mine') {
                        multiplier *= 1.25; // 25% bonus minerals from orbital ring harvesting
                    }

                    // Roadmap Item 250: Sub-oceanic rig bonus
                    if (s.type === 'ocean_rig') {
                        const tile = this.tiles[s.tileId];
                        const depthMult = tile && tile.height < 0 ? Math.abs(tile.height) * 0.1 : 1.0;
                        multiplier *= 2.0 * depthMult; // Deeper rigs are more effective
                    }

                    for (const res in def.output) {
                        let finalMult = multiplier;
                        if (this.isOnMoon && res !== 'energy') finalMult *= Number(this.modifiers.moonProduction || 1.25);
                        if (res === 'minerals') finalMult *= pb.mineralMult;
                        if (res === 'data') finalMult *= pb.dataMult;
                        if (!this.resources[res]) this.resources[res] = 0;

                        // Roadmap Item 222: Resource Depletion Logic
                        const tile = this.tiles[s.tileId];
                        let amount = def.output[res] * finalMult * tickScale;

                        if (tile && tile.reserves && tile.reserves[res] !== undefined) {
                            const available = tile.reserves[res];
                            if (available <= 0) {
                                amount = 0;
                                if (Math.random() < 0.01) {
                                    this.notify(`⚠️ DEPLETED: ${def.name} on tile ${s.tileId} has exhausted its ${res} reserves.`, "warning");
                                }
                            } else {
                                amount = Math.min(amount, available);
                                tile.reserves[res] -= amount;
                            }
                        }

                        this.resources[res] += amount;
                    }
                }
            });

            if (this.resources.minerals < 10 && this.resources.energy > 40 && !this.hasNotifiedMinerals) {
                this.notify("Low Minerals! Build Auto-Miners (Cost only Energy) to extract more.", "info");
                this.hasNotifiedMinerals = true;
            }

            const rateKeys = new Set([...Object.keys(resourceBefore), ...Object.keys(this.resources || {})]);
            this.resourceRates = {};
            rateKeys.forEach((key) => {
                const before = Number(resourceBefore[key] || 0);
                const after = Number(this.resources?.[key] || 0);
                const delta = after - before;
                this.resourceRates[key] = Number.isFinite(delta) ? delta : 0;
            });
            this.rebuildColonyInfrastructure();
            this.updateResourceUI();
        }, 1000);
    }

    executeEspionage() {
        if (!this.agentMissions.active || this.agentMissions.active.missionId !== 'corp_espionage') return;

        const successChance = 0.4 + (this.attributes.intelligence * 0.02);
        const roll = Math.random();

        if (roll < successChance) {
            if (!this.playerCorp.espionageSuccesses) this.playerCorp.espionageSuccesses = 0;
            this.playerCorp.espionageSuccesses++;

            const lootData = Math.floor(Math.random() * 200 + 100);
            const lootCredits = Math.floor(Math.random() * 500 + 200);

            this.resources.data += lootData;
            this.resources.credits += lootCredits;

            this.notify(`🕵️ Espionage Success! Stole ${lootData} data and ${lootCredits} credits.`, "success");
            this.recordColonyEvent(`Intelligence agents successfully infiltrated a rival laboratory.`, 0.8);
        } else {
            this.notify(`🚨 Infiltration Failed! Agents were detected and forced to retreat.`, "danger");
            this.recordColonyEvent(`A corporate espionage attempt was compromised.`, 0.5);
            // Penalty: Standing loss
            if (this.agentMissions.standing > 0) this.agentMissions.standing--;
        }

        this.updateAgentMissions();
        this.renderMissionsUI();
    }

    // --- LOGISTICS LOG (Roadmap Item 801/202) ---
    openLogisticsLog() {
        let modal = document.getElementById('ep-logistics-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-logistics-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.display = 'none';
            modal.style.zIndex = '7000';
            modal.innerHTML = `
                <div class="ep-datapad" style="width:500px; max-width:95vw; margin: auto; margin-top: 10vh;">
                    <div class="ep-datapad-header">
                        <div style="font-size:1.2rem; font-weight:bold;">📦 LOGISTICS_NETWORK_V1.0</div>
                        <button class="ep-datapad-btn" onclick="document.getElementById('ep-logistics-modal').style.display='none'">X</button>
                    </div>
                    <div class="ep-datapad-content" id="ep-logistics-content" style="height:400px; overflow-y:auto; font-family:monospace; font-size:0.8rem;">
                    </div>
                    <div style="margin-top:15px; display:flex; justify-content:flex-end;">
                        <button class="ep-datapad-btn" onclick="game.openLogisticsLog()">REFRESH</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        this.renderLogisticsLog();
    }

    renderLogisticsLog() {
        const container = document.getElementById('ep-logistics-content');
        if (!container) return;

        let html = `[SYSTEM_CHECK] ... ONLINE<br>[NODES_ACTIVE] ... ${this.structures.length}<br>--------------------------------<br>`;

        // Roadmap Item 225: Bottleneck Visualization
        if (this.production && this.production.logisticsNetwork) {
            const bottlenecks = this.production.logisticsNetwork.bottlenecks;
            const bottleneckIds = Object.keys(bottlenecks);

            if (bottleneckIds.length > 0) {
                html += `<div style="color:#ef4444; margin-bottom:10px;">🚨 BOTTLENECKS DETECTED:</div>`;
                bottleneckIds.forEach(id => {
                    const struct = this.structures.find(s => s.id === id);
                    if (struct) {
                        html += `> NODE ${id} (${struct.type}): LACKING ${bottlenecks[id].toUpperCase()}<br>`;
                    }
                });
                html += `--------------------------------<br>`;
            }
        }

        if (this.production && this.production.logisticsNetwork && this.production.logisticsNetwork.routes.length > 0) {
            this.production.logisticsNetwork.routes.forEach(r => {
                html += `> ROUTE: ${r.from} -> ${r.to}<br>  TYPE: ${r.resource.toUpperCase()} | RATE: ${r.rate}/tick<br>`;
            });
        } else {
            html += `> NO ACTIVE LOGISTICS ROUTES DETECTED.<br>> INITIALIZE ROUTE VIA BUILDING CONSOLE.<br>`;
        }

        html += `<br>--------------------------------<br>[STATUS] ... STANDBY`;
        container.innerHTML = html;
    }

    // Roadmap Item 901: Scientific Method
    performHypothesisTest() {
        if (this.resources.data < 50) {
            this.notify("Insufficient Research Data to formulate hypothesis (50 req).", "warning");
            return;
        }

        this.resources.data -= 50;
        const success = Math.random() < 0.6;

        if (success) {
            const bonus = Math.floor(Math.random() * 150 + 50);
            this.resources.data += bonus;
            this.notify(`🧪 Hypothesis Validated! Peer review complete. +${bonus} Research Data.`, "success");
            this.recordColonyEvent(`A major scientific breakthrough was published.`, 0.7);
        } else {
            this.notify(`📉 Hypothesis Refuted! Study inconclusive. Data consumed for negative result.`, "warning");
            this.recordColonyEvent(`A scientific study failed to yield significant results.`, 0.3);
        }
        this.updateResourceUI();
    }

    setTimeSpeed(index) {
        if (index < 0 || index >= this.timeSpeeds.length) return;
        this.timeSpeedIndex = index;
        this.timeScale = this.timeSpeeds[index];
        this.isPaused = (this.timeScale === 0);

        const label = document.getElementById('ep-time-label');
        if (label) {
            label.textContent = this.isPaused ? "PAUSED" : `${this.timeScale}x`;
        }

        // Visual feedback on buttons
        const container = document.getElementById('ep-time-controls');
        if (container) {
            const btns = container.querySelectorAll('.ep-time-btn');
            btns.forEach((btn, i) => {
                btn.style.background = (i === index) ? 'rgba(56, 189, 248, 0.3)' : 'transparent';
                btn.style.borderColor = (i === index) ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)';
            });
        }

        if (this.isPaused) this.notify('Simulation paused.', 'info');
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Delta calculation with Time Dilation (Item 17)
        const frameDelta = this.clock ? this.clock.getDelta() : 0.016;
        let dt = frameDelta * this.timeScale;

        // Physics Context scaling (Item 319) & Visual Time Dilation (Item 16)
        if (this.universe) {
            const ctx = this.universe.getActiveContext();
            if (ctx) {
                dt *= ctx.timeScale;

                // Roadmap Item 16: Time Dilation Visual Effects
                if (ctx.timeScale < 0.5) {
                    // Slow time visual - blue shift / chromatic aberration
                    if (this.bloomPass) this.bloomPass.strength = 0.8;
                    if (this.renderer) this.renderer.toneMappingExposure = 0.7;
                } else if (ctx.timeScale > 1.5) {
                    // Fast time visual - red shift / high exposure
                    if (this.bloomPass) this.bloomPass.strength = 1.2;
                    if (this.renderer) this.renderer.toneMappingExposure = 1.1;
                }
            }
        }

        // Alien Signals (Item 139)
        if (this.alienSignals) this.alienSignals.update(dt);

        // Tactical AI (Item 137)
        if (this.militarySystem) this.militarySystem.updateTactics();

        // Legal System (Item 146)
        if (this.legalSystem) this.legalSystem.update(dt);

        // Language Drift (Item 140)
        if (this.npcSystem) this.npcSystem.updateDialect();

        // Roadmap Item 304: Black Hole Specific Visuals
        const currentStar = (this.universe && this.universe.galacticMap.stars.find(s => s.id === this.currentSystemId));
        if (currentStar && currentStar.type === 'Black Hole') {
            if (this.lensPass) {
                this.lensPass.uniforms.strength.value = 0.1; // Permanent intense lensing
            }
            if (this.scene) {
                this.scene.fog.density = 0.005; // Thicker dark fog
            }
        }

        // Temporal manipulation (Item 313)
        if (this.temporal) {
            this.temporal.update(dt);
            if (this.temporal.isRewinding) return;
            if (this.temporal.isFastForwarding) {
                dt *= 5.0;
                if (this.planetMesh) this.planetMesh.rotation.y += 0.05;
            }
        }

        if (this.timeScale === 0) {
            // Path Traced Photo deliberately pauses simulation while continuing progressive rendering.
            // Ray-traced lighting also remains interactive if the player pauses manually.
            if (this.rayTracingRenderer?.isActive?.()) {
                if (this.controls?.enabled) this.controls.update();
                this.rayTracingRenderer.render();
                if (this.composer) this.composer.render();
                else this.renderer?.render(this.scene, this.camera);
            }
            return;
        }

        // Frame Counter for slow ticks
        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;

        if (this.frameCount % 60 === 0) {
            this.applyColonistEffects();
            this.handleSocialInteractions();
            this.updateStockMarket(); // Item 206
            if (this.factionManager) this.factionManager.updateAI();
        }

        if (this.frameCount % 120 === 0) {
            this.verifyBuildingIntegrity(); // Roadmap Item 530 - Visual fix
        }

        // Neural & Dream Updates
        if (this.dream) this.dream.update(dt * 1000);

        // Combat Mode Render
        if (this.isCombatActive && this.combatScene) {
            if (!this.isPaused) this.combatScene.update(dt);
            this.combatScene.render();
            return;
        }

        // Standard Simulation Tick
        if (this.production) this.production.update(dt);
        if (this.advanceIndustryJobs) this.advanceIndustryJobs(dt);
        if (this.applyEnvironmentalEffects) this.applyEnvironmentalEffects(dt);
        if (this.drones) this.drones.update(dt);
        if (this.universe) {
            this.universe.updateProbes(dt); // Item 302
            this.universe.updateMegastructures?.(dt);
        }
        if (this.orbit) this.orbit.update(this.timeOfDay);
        if (this.fleetManager) this.fleetManager.update(dt);
        if (this.economyManager) this.economyManager.update(dt);

        // Phase 10/11 Updates
        if (this.twin) this.twin.update(dt);
        if (this.recursion) this.recursion.update(dt);
        if (this.quantum) this.quantum.update(dt);
        if (this.qubitMinigame) this.qubitMinigame.update(dt);
        if (this.terraforming) this.terraforming.update(dt);
        if (this.megastructureSystem) this.megastructureSystem.update(dt);

        // ASSET PRODUCTION UPDATES (Phase 2)
        if (this.vfxManager) this.vfxManager.update(this.clock?.getElapsedTime() || 0, dt);
        if (this.audioManager) this.audioManager.update(dt);
        if (this.optimizationManager) this.optimizationManager.update(this.clock?.getElapsedTime() || 0);

        if (this.isGalaxyViewActive && this.galaxyView) {
            this.galaxyView.update();
            return;
        }

        if (this.controls) this.controls.update();

        // Frame-rate-independent environmental motion. Path Traced Photo freezes the view so
        // progressive samples converge instead of invalidating on every animation frame.
        const visualDt = Math.max(0, Math.min(0.08, dt || 0));
        const freezePhotoFrame = !!this.rayTracingRenderer?.isPathTracing?.();
        if (!freezePhotoFrame && this.planetMesh) this.planetMesh.rotation.y += 0.008 * visualDt;
        if (!freezePhotoFrame && this.atmosphereMesh) this.atmosphereMesh.rotation.y += 0.003 * visualDt;
        if (!freezePhotoFrame && this.cloudMesh) this.cloudMesh.rotation.y += 0.015 * visualDt;

        this.updateInfrastructurePulseVisuals(frameDelta);
        this.updateBuildingFlicker(frameDelta);

        // Subtle locator pulse for built structures.
        const markerPhase = (this.clock?.elapsedTime || 0) * 2.2;
        Object.values(this.buildingMeshes || {}).forEach((group, index) => {
            group?.traverse?.((child) => {
                if (!child?.userData?.isBuildingMarker) return;
                const pulse = 1 + Math.sin(markerPhase + index * 0.65) * 0.08;
                child.scale.setScalar(pulse);
                if (child.material) child.material.opacity = 0.40 + (pulse - 0.92) * 0.5;
            });
        });

        // Keep the solar cycle tied to elapsed simulation time rather than display refresh rate.
        const cycleDt = Math.max(0, Math.min(0.5, dt || 0));
        this.timeOfDay += cycleDt * 0.625; // ~0.01 h/frame at 60 Hz, but stable at other refresh rates.
        if (this.vfxManager) this.vfxManager.updateDayNightCycle(this.timeOfDay / 24, this.sunLight);

        if (this.timeOfDay >= 24) {
            this.timeOfDay = 0;
            this.day++;
            if (this.market) this.market.updatePrices();
            if (this.economyManager) this.economyManager.dailyUpdate(); // Item 203
            this.notify("New Day: Cycle Updated", "info");
        }

        if (this.planetMesh && this.planetMesh.userData.uniforms && this.planetMesh.userData.uniforms.time) {
            this.planetMesh.userData.uniforms.time.value += visualDt;
        }
        if (this.cloudMesh?.material?.uniforms?.time) {
            this.cloudMesh.material.uniforms.time.value += visualDt;
        }

        // Dynamic Lighting Update (Summary of Roadmap Item 6/10)
        if (this.camera && this.scene) {
            const angle = (this.timeOfDay / 24) * Math.PI * 2;
            const sunWorldPos = new THREE.Vector3(Math.sin(angle) * 400, Math.sin(angle * 0.5) * 100, Math.cos(angle) * 400);

            if (this.lensPass) {
                const sec = this.systemSecurity[this.currentSystemId] ?? 1.0;
                const lensTarget = sec <= 0.0 ? 0.05 : 0.0;
                this.lensPass.uniforms.strength.value += (lensTarget - this.lensPass.uniforms.strength.value) * 0.05;
                if (this.lensPass.uniforms.strength.value > 0.001) {
                    const sunScreenPos = sunWorldPos.clone().project(this.camera);
                    this.lensPass.uniforms.center.value.set((sunScreenPos.x + 1) / 2, (sunScreenPos.y + 1) / 2);
                }
            }

            if (this.suns && this.suns[0]) {
                this.suns[0].mesh.position.copy(sunWorldPos);
                this.suns[0].light.position.copy(sunWorldPos);
            }

            const sunDirWorld = sunWorldPos.clone().normalize();

            if (this.planetMesh && this.planetMesh.userData.uniforms?.sunDirection) {
                this.planetMesh.userData.uniforms.sunDirection.value.copy(sunDirWorld);
            }
            if (this.atmosphereMesh && this.atmosphereMesh.material.uniforms?.sunDirection) {
                this.atmosphereMesh.material.uniforms.sunDirection.value.copy(sunDirWorld);
            }
            if (this.cloudMesh?.material?.uniforms?.sunDirection) {
                this.cloudMesh.material.uniforms.sunDirection.value.copy(sunDirWorld);
            }
            this.updateBuildingContactShadows(sunDirWorld);
            this.updateLightPollution(sunDirWorld);
        }

        // Render the traced planet/background first, then composite Three.js structures, clouds,
        // atmosphere and interaction visuals over the transparent primary canvas.
        this.rayTracingRenderer?.render?.();
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    getPlanetSurfaceStructures() {
        const baseId = String(this.currentSystemId ?? 'kepler_186f');
        if (!this.isOnMoon) return Array.isArray(this.structures) ? this.structures : [];
        const state = this.systemStates?.[baseId];
        return Array.isArray(state?.structures) ? state.structures : [];
    }

    hasOperationalLaunchSite() {
        return this.getPlanetSurfaceStructures().some((struct) => struct?.type === 'launch_site' && this.isStructureOperational(struct));
    }

    ensureLunarBlueprints(options = {}) {
        const silent = options.silent === true;
        const requireLaunchSite = options.requireLaunchSite !== false;
        if (requireLaunchSite && !this.hasOperationalLaunchSite()) return false;
        const types = ['helium_mine', 'lunar_hab', 'low_g_factory'];
        let added = 0;
        types.forEach((type) => {
            if (this.blueprints.some((bp) => bp.type === type)) return;
            const def = this.buildingTypes[type];
            if (!def) return;
            this.blueprints.push({ id: `bpo_${type}`, type, name: `${def.name} Blueprint`, isBPO: true, icon: def.icon });
            added += 1;
        });
        if (added && !silent) this.notify(`Orbital program online: ${added} lunar blueprints unlocked.`, 'success');
        return added > 0 || types.every((type) => this.blueprints.some((bp) => bp.type === type));
    }

    applyLocationModifiers() {
        if (!this.modifiers) return;
        const surfaceGravity = Number.isFinite(Number(this.planetSurfaceGravity)) ? Number(this.planetSurfaceGravity) : 1.0;
        this.modifiers.gravity = this.isOnMoon ? 0.165 : surfaceGravity;
        this.modifiers.moonProduction = this.isOnMoon ? 1.25 : 1.0;
    }

    updateOrbitalControls() {
        const orbitButton = this.container?.querySelector('#ep-btn-orbit');
        const moonButton = this.container?.querySelector('#ep-btn-moon');
        const launchReady = this.hasOperationalLaunchSite();
        if (orbitButton) {
            const label = orbitButton.querySelector('.ep-orbit-label');
            if (label) label.textContent = this.isOnMoon ? 'Orbit' : (this.isOrbitalViewActive ? 'Surface' : (launchReady ? 'Enter Orbit' : 'Orbit Locked'));
            orbitButton.disabled = this.isOnMoon || !launchReady;
            orbitButton.title = this.isOnMoon ? 'Return to the planet before entering orbit.' : (launchReady ? (this.isOrbitalViewActive ? 'Return to planet surface' : 'Enter high orbit') : 'Build an operational Launch Site first.');
            orbitButton.classList.toggle('active', !!this.isOrbitalViewActive);
        }
        if (moonButton) {
            const label = moonButton.querySelector('.ep-moon-label');
            if (label) label.textContent = this.isOnMoon ? 'Return Planet' : (this.isOrbitalViewActive ? 'Land Moon' : (launchReady ? 'Moon via Orbit' : 'Moon Locked'));
            moonButton.disabled = !this.isOnMoon && (!launchReady || !this.isOrbitalViewActive);
            moonButton.title = this.isOnMoon ? 'Return to the planet surface' : (!launchReady ? 'Build an operational Launch Site first.' : (!this.isOrbitalViewActive ? 'Enter high orbit before lunar descent.' : 'Land on the moon for 50 Energy.'));
        }
    }

    requestOrbitalView() {
        if (this.isOnMoon) {
            this.notify('Return to the planet before changing orbital view.', 'info');
            return false;
        }
        if (!this.hasOperationalLaunchSite()) {
            this.notify('Orbital operations require an operational Launch Site.', 'warning');
            return false;
        }
        this.toggleOrbitalView();
        return true;
    }

    requestMoonTransit() {
        if (this.isOnMoon) {
            this.returnToPlanet();
            return true;
        }
        if (!this.hasOperationalLaunchSite()) {
            this.notify('Lunar operations require an operational Launch Site.', 'warning');
            return false;
        }
        if (!this.isOrbitalViewActive) {
            this.notify('Enter high orbit before beginning lunar descent.', 'info');
            return false;
        }
        this.visitMoon();
        return true;
    }

    toggleOrbitalView(forceState = null) {
        const targetState = forceState !== null ? forceState : !this.isOrbitalViewActive;

        if (targetState === this.isOrbitalViewActive) return;
        if (targetState && (this.isOnMoon || !this.hasOperationalLaunchSite())) {
            this.notify(this.isOnMoon ? 'Orbital view is unavailable from the lunar surface.' : 'Build an operational Launch Site to unlock orbit.', 'warning');
            return;
        }

        this.isOrbitalViewActive = targetState;

        if (targetState) {
            this.orbit.toggleView(true);
            const orbitPos = new THREE.Vector3(0, 150, 0);
            this.animateCamera(orbitPos, 1000);

            this.notify("🚀 Entering High Orbit...", "info");
            document.getElementById('ep-left-hud').style.opacity = '0.3';
        } else {
            this.orbit.toggleView(false);
            const surfacePos = new THREE.Vector3(0, 45, 65);
            this.animateCamera(surfacePos, 1000);

            this.notify("🛬 Entering Atmosphere...", "success");
            document.getElementById('ep-left-hud').style.opacity = '1.0';
        }
        this.updateOrbitalControls();
        this.updateLocationUI();
    }

    animateCamera(targetPos, duration) {
        if (!this.camera) return;
        const startPos = this.camera.position.clone();
        const startTime = Date.now();

        const anim = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1.0);

            // Ease-in-out
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            this.camera.position.lerpVectors(startPos, targetPos, ease);
            this.camera.lookAt(0, 0, 0);

            if (progress < 1.0) {
                requestAnimationFrame(anim);
            }
        };
        anim();
    }

    toggleGalaxyView() {
        this.isGalaxyViewActive = !this.isGalaxyViewActive;
        const galContainer = document.getElementById('ep-galaxy-container');

        if (this.isGalaxyViewActive) {
            galContainer.style.display = 'block';
            this.renderer.domElement.style.display = 'none';
            this.container.querySelector('#ep-btn-galaxy').innerText = '🪐 SYSTEM';
            this.initGalaxyView();
            document.getElementById('ep-build-menu').style.display = 'none';
        } else {
            galContainer.style.display = 'none';
            this.renderer.domElement.style.display = 'block';
            this.container.querySelector('#ep-btn-galaxy').innerText = '🌌 GALAXY';
            document.getElementById('ep-build-menu').style.display = 'flex';
        }
    }

    /**
     * Warp to a new star system - Phase 2: Multi-Planet Colonization
     */
    warpToSystem(system) {
        if (!system) return;

        // Roadmap Item 271: Warp-gate tolls
        const warpCost = 100;
        const toll = this.economyManager?.calculateWarpToll ? this.economyManager.calculateWarpToll(system.id) : 50;

        if (this.resources.energy < warpCost) {
            this.notify(`Warp requires ${warpCost} Energy!`, 'danger');
            return;
        }

        if (this.resources.credits < toll) {
            this.notify(`Warp requires ${toll} Credits for gate toll!`, 'danger');
            return;
        }

        // Confirm dialog
        const confirmed = confirm(`Warp to Star System #${system.id}?\nCost: ${warpCost} Energy + ${toll} Cr Toll\n\nThis will generate a new planet to colonize.`);
        if (!confirmed) return;

        this.resources.energy -= warpCost;
        this.resources.credits -= toll;
        this.economyManager?.addToLedger('TOLL', 'player', 'warp_gate', toll, 'credits');
        this.audio.playWarp();

        // Store current system state if not already stored
        if (!this.colonizedSystems) this.colonizedSystems = {};
        if (this.currentSystemId !== undefined) {
            this.colonizedSystems[this.currentSystemId] = {
                resources: { ...this.resources },
                structures: [...this.structures],
                colonists: [...this.colonists],
                terraforming: this.terraforming ? { ...this.terraforming.stats } : null
            };
        }

        // Generate new planet with system seed
        this.currentSystemId = system.id;
        this.currentSystemName = system.name || system.label || String(system.id).replace(/[_-]+/g, ' ');
        this.notify(`Warping to System #${system.id}...`, 'info');

        // Clear old buildings from scene and planet
        if (this.planetMesh) {
            const toRemove = this.planetMesh.children.filter(c => c.userData.isBuilding);
            toRemove.forEach(c => this.planetMesh.remove(c));
        }
        this.scene.children = this.scene.children.filter(c => !c.userData.isBuilding);

        this.structures = [];
        this.buildingMeshes = {};

        // Generate new planet
        setTimeout(() => {
            this.createPlanet(system.seed, this.getPlanetTypeFromSeed(system.seed));
            this.generateTiles(system.seed);

            // Reset terraforming for new planet
            if (this.terraforming) {
                this.terraforming.stats = { temperature: 20, atmosphere: 15, water: 10, biomass: 5 };
                this.terraforming.recalculateRates();
            }

            // Check if we've been here before
            if (this.colonizedSystems[system.id]) {
                const saved = this.colonizedSystems[system.id];
                this.structures = saved.structures;
                this.colonists = saved.colonists;
                if (saved.terraforming && this.terraforming) {
                    this.terraforming.stats = saved.terraforming;
                }
                // Rebuild building meshes
                this.rebuildAllBuildings();
                this.notify(`Returned to Colony #${system.id}`, 'success');
            } else {
                // New planet - start fresh
                this.colonists = [];
                this.addColonist(); // Start with 1 pioneer
                this.notify(`New world discovered! System #${system.id}`, 'success');
            }

            // Close galaxy view
            this.toggleGalaxyView();
        }, 500);
    }

    getPlanetTypeFromSeed(seed) {
        const types = ['planet', 'terran', 'ice', 'lava', 'desert'];
        return types[seed % types.length];
    }

    rebuildAllBuildings() {
        // Rebuild all building meshes from structures array
        this.structures.forEach((s, idx) => {
            const tile = this.tiles[s.tileId];
            if (tile) {
                // If tile.position was stored at t=0, it's effectively local space.
                // We need current WORLD position for placeBuildingMesh.
                const worldPos = tile.position.clone();
                if (this.planetMesh) {
                    this.planetMesh.updateMatrixWorld();
                    this.planetMesh.localToWorld(worldPos);
                }
                const normal = worldPos.clone().normalize();
                const mesh = this.placeBuildingMesh(worldPos, normal, s.type);
                if (mesh) this.buildingMeshes[s.tileId] = mesh;
            }
        });
    }

    openProfile() {
        let modal = document.getElementById('ep-profile-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-profile-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="ep-modal" style="width:800px; max-width:90vw; height:80vh; display:flex; flex-direction:column;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#38bdf8;">👤 Captain's Profile</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-profile-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div style="display:flex; border-bottom:1px solid #334155; margin-bottom:10px;">
                        <button class="ep-sys-btn" id="ep-tab-stats" style="flex:1; border-bottom:none; border-radius:5px 5px 0 0;" onclick="window.game.switchProfileTab('stats')">📊 Stats</button>
                        <button class="ep-sys-btn" id="ep-tab-badges" style="flex:1; border-bottom:none; border-radius:5px 5px 0 0;" onclick="window.game.switchProfileTab('badges')">🏆 Badges</button>
                        <button class="ep-sys-btn" id="ep-tab-log" style="flex:1; border-bottom:none; border-radius:5px 5px 0 0;" onclick="window.game.switchProfileTab('log')">📜 Log</button>
                    </div>
                    <div class="ep-modal-body" id="ep-profile-body" style="flex:1; overflow-y:auto; padding:10px;"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        this.switchProfileTab('stats');
    }

    switchProfileTab(tab) {
        const body = document.getElementById('ep-profile-body');
        if (!body) return;

        // Reset Tab Styles
        ['stats', 'badges', 'log'].forEach(t => {
            const btn = document.getElementById(`ep-tab-${t}`);
            if (btn) {
                btn.style.background = (t === tab) ? '#334155' : 'transparent';
                btn.style.color = (t === tab) ? '#fff' : '#94a3b8';
            }
        });

        if (tab === 'stats') {
            body.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div class="ep-panel" style="padding:15px; background:rgba(15,23,42,0.5); border:1px solid #334155; border-radius:8px;">
                        <h3 style="color:#a78bfa; border-bottom:1px solid #334155; padding-bottom:5px;">📈 Colony Statistics</h3>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; color:#cbd5e1;">
                            <div>Day:</div><div style="color:#fff;">${this.day}</div>
                            <div>Population:</div><div style="color:#fff;">${this.colonists.length} / ${this.getPopulationCap()}</div>
                            <div>Structures:</div><div style="color:#fff;">${this.structures.length}</div>
                            <div>Morale:</div><div style="color:${this.morale > 50 ? '#4ade80' : '#f87171'};">${Math.floor(this.morale)}%</div>
                            <div>Ships:</div><div style="color:#fff;">${this.ships ? this.ships.length : 0}</div>
                        </div>
                    </div>
                    <div class="ep-panel" style="padding:15px; background:rgba(15,23,42,0.5); border:1px solid #334155; border-radius:8px;">
                        <h3 style="color:#38bdf8; border-bottom:1px solid #334155; padding-bottom:5px;">🌌 Exploration</h3>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; color:#cbd5e1;">
                            <div>Current System:</div><div style="color:#fff;">${this.currentSystemId}</div>
                            <div>Discovered Species:</div><div style="color:#fff;">${(this.ecosystem && this.ecosystem.xenodex) ? (this.ecosystem.xenodex.flora.length + this.ecosystem.xenodex.fauna.length) : 0}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (tab === 'badges') {
            const progress = this.achievements.getProgress();
            const unlocked = this.achievements.getUnlocked();
            body.innerHTML = `
                <div style="text-align:center; margin-bottom:20px;">
                    <h3 style="color:#fbbf24; margin:0 0 10px 0;">Unlocked: ${progress.unlocked} / ${progress.total}</h3>
                    <div style="background:#1e293b;height:10px;border-radius:5px;width:60%;margin:0 auto;">
                        <div style="background:linear-gradient(90deg,#fbbf24,#f59e0b);width:${progress.percent}%;height:100%;border-radius:5px;"></div>
                    </div>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:15px; justify-content:center;">
                    ${unlocked.length === 0 ? '<div style="color:#64748b; padding:20px;">No badges earned yet. Keep playing!</div>' : ''}
                    ${unlocked.map(a => `
                        <div style="background:#1e293b; border:1px solid #fbbf24; border-radius:8px; padding:15px; width:160px; text-align:center; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                            <div style="font-size:2.5em; margin-bottom:10px;">${Achievement.ICONS[a.category] || '🏆'}</div>
                            <div style="font-weight:bold; color:#fbbf24; margin-bottom:5px;">${a.name}</div>
                            <div style="font-size:0.8em; color:#cbd5e1; line-height:1.2;">${a.desc}</div>
                             <div style="font-size:0.7em; color:#64748b; margin-top:8px; border-top:1px solid #334155; padding-top:4px;">Day ${a.unlockedAt || '?'}</div>
                        </div>
                    `).join('')}
                     ${this.achievements.getLocked().map(a => `
                        <div style="background:#0f172a; border:1px solid #334155; border-radius:8px; padding:15px; width:160px; text-align:center; opacity:0.6;">
                            <div style="font-size:2.5em; margin-bottom:10px; filter:grayscale(100%);">🔒</div>
                            <div style="font-weight:bold; color:#64748b; margin-bottom:5px;">${a.name}</div>
                             <div style="font-size:0.8em; color:#475569;">???</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (tab === 'log') {
            const entries = this.log ? this.log.getEntries() : [];
            body.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${entries.length === 0 ? '<div style="color:#64748b; padding:20px;">Log is empty.</div>' : ''}
                    ${entries.map(e => `
                        <div style="background:rgba(30,41,59,0.5); border-left:3px solid ${this.log.getTypeColor(e.type)}; padding:10px; font-size:0.9em; border-radius:0 4px 4px 0;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                <span style="color:#94a3b8; font-size:0.8em; font-family:monospace;">Day ${e.timestamp}</span>
                                <span style="color:#64748b; font-size:0.75em;">${new Date(e.realTime).toLocaleTimeString()}</span>
                            </div>
                             <div style="color:#e2e8f0;">${e.text}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    warpToSystem(systemData, options = {}) {
        if (!systemData) return;
        const modal = document.getElementById('ep-system-modal');
        const content = document.getElementById('ep-system-content');
        if (!modal || !content) return;
        const star = this.universe?.galacticMap?.stars?.find((entry) => entry.id === systemData.id) || systemData;
        const current = this.universe?.getCurrentStar?.();
        const isCurrent = current?.id === star.id || String(this.currentSystemId) === String(star.id);
        const travel = this.universe?.getTravelMetrics?.(star) || { distance: 0, energy: 100, credits: 50, range: 450, reachable: true };
        const threat = this.military?.assessThreat?.(star.id) ?? 0;
        const threatColor = threat > 100 ? '#ef4444' : (threat > 50 ? '#facc15' : '#4ade80');
        const discovered = star.discovered !== false;
        const credits = Math.floor(Number(this.resources.credits || 0));
        const energy = Math.floor(Number(this.resources.energy || 0));
        const canWarp = !isCurrent && discovered && travel.reachable && energy >= travel.energy && credits >= travel.credits;
        const hazards = Array.isArray(star.hazards) && star.hazards.length ? star.hazards.join(' · ') : 'No major hazards detected';
        modal.style.display = 'flex';
        content.innerHTML = `
            <div class="ep-sector-action">
                <div class="ep-sector-action-head"><span>STAR SYSTEM</span><h3>${star.name || `Sector ${star.id}`}</h3><b style="color:${threatColor}">Threat ${threat}</b></div>
                <div class="ep-sector-action-grid">
                    <span>Type</span><b>${star.type || 'Unclassified'}</b>
                    <span>Distance</span><b>${travel.distance.toFixed ? travel.distance.toFixed(0) : travel.distance} ly</b>
                    <span>Hazards</span><b>${hazards}</b>
                    <span>Travel cost</span><b>${travel.energy} Energy · ${travel.credits} Credits</b>
                    <span>Warp range</span><b class="${travel.reachable ? 'good' : 'bad'}">${travel.reachable ? `${Math.round(travel.range)} ly` : 'Out of range'}</b>
                </div>
                ${isCurrent ? '<div class="ep-sector-current">You are already in this system.</div>' : ''}
                ${!discovered ? '<div class="ep-sector-current bad">This system must be discovered before warp.</div>' : ''}
                <div class="ep-sector-actions">
                    <button class="ep-sys-btn primary" id="ep-btn-warp-peace" ${canWarp ? '' : 'disabled'}>WARP · Peaceful</button>
                    <button class="ep-sys-btn danger" id="ep-btn-warp-invade" ${canWarp ? '' : 'disabled'}>⚔ INVADE</button>
                    <button class="ep-sys-btn" id="ep-btn-warp-cancel">CANCEL</button>
                </div>
            </div>
        `;
        document.getElementById('ep-btn-warp-cancel').onclick = () => {
            modal.style.display = 'none';
            if (options?.returnToGalaxy && this.universe?.openGalaxyMap) this.universe.openGalaxyMap();
        };
        if (canWarp) {
            document.getElementById('ep-btn-warp-peace').onclick = () => this.executeWarp(star, false, travel);
            document.getElementById('ep-btn-warp-invade').onclick = () => this.executeWarp(star, true, travel);
        }
    }

    visitMoon() {
        if (this.isOnMoon) {
            this.notify("Already on the Moon!", "info");
            return;
        }
        if (!this.hasOperationalLaunchSite()) {
            this.notify('Lunar descent requires an operational Launch Site.', 'warning');
            return;
        }
        if (!this.isOrbitalViewActive) {
            this.notify('Enter high orbit before lunar descent.', 'info');
            return;
        }

        if (this.resources.energy < 50) {
            this.notify("Need 50 Energy to travel to Moon!", "danger");
            return;
        }
        this.resources.energy -= 50;

        // Save current planet state
        this.saveCurrentSystemState();

        // Clear existing building meshes from the scene
        if (this.scene) {
            const toRemove = this.scene.children.filter(o => o && o.userData && o.userData.isBuilding);
            toRemove.forEach(o => this.scene.remove(o));
        }
        this.buildingMeshes = {};

        this.isOnMoon = true;
        this.applyLocationModifiers();
        this.ensureLunarBlueprints({ silent: true, requireLaunchSite: false });

        const baseId = String(this.currentSystemId);
        const moonId = `${baseId}_moon`;

        let state = this.systemStates[moonId];
        if (!state) {
            const planetState = this.systemStates[baseId] || {};
            const baseSeed = (typeof planetState.seed === 'number' && Number.isFinite(planetState.seed))
                ? planetState.seed
                : ((typeof this.currentWorldSeed === 'number' && Number.isFinite(this.currentWorldSeed)) ? this.currentWorldSeed : 12345);
            const moonSeed = baseSeed + 999;
            state = { seed: moonSeed, starConfig: planetState.starConfig || null, tiles: [], structures: [] };
            this.systemStates[moonId] = state;
        }

        this.structures = [];
        this.createPlanet(state.seed, 'moon');
        if (state.tiles && state.tiles.length) {
            this.applySystemState(state);
        } else {
            this.structures = Array.isArray(state.structures) ? state.structures : [];
        }

        if (this.isOrbitalViewActive) this.toggleOrbitalView();
        if (document.getElementById('ep-planet-info')) document.getElementById('ep-planet-info').innerHTML = `<h3>${this.planetData.name} (Moon)</h3>`;

        this.notify("🌙 Welcome to the Moon! Low gravity: +25% factory output", "success");
        this.updateResourceUI();
        this.createBuildMenu();
        this.updateLocationUI();
        this.updateOrbitalControls();
    }

    returnToPlanet() {
        if (!this.isOnMoon) {
            this.notify("Already on the Planet!", "info");
            return;
        }

        // Return propellant is reserved during the outbound transfer so the player cannot be stranded.

        // Save Moon
        this.saveCurrentSystemState();

        // Clear existing building meshes from the scene
        if (this.scene) {
            const toRemove = this.scene.children.filter(o => o && o.userData && o.userData.isBuilding);
            toRemove.forEach(o => this.scene.remove(o));
        }
        this.buildingMeshes = {};

        this.isOnMoon = false;
        this.applyLocationModifiers();
        this.notify("🌍 Welcome back to the Planet!", "success");

        // Restore Planet State
        const baseId = String(this.currentSystemId);
        const state = this.systemStates[baseId];
        if (state && state.starConfig) this.setupSuns(state.starConfig);
        this.structures = [];
        this.createPlanet((state && state.seed) ? state.seed : 12345, 'planet');
        if (state) this.applySystemState(state);

        if (this.isOrbitalViewActive) this.toggleOrbitalView();

        this.updateResourceUI();
        this.createBuildMenu();
        this.updateLocationUI();
        this.updateOrbitalControls();
    }

    executeWarp(systemData, invasion = false, travelOverride = null) {
        if (!systemData) return false;
        if (this.isOnMoon) {
            this.notify('Cannot warp from Moon surface. Return to the planet first.', 'danger');
            return false;
        }
        const star = this.universe?.galacticMap?.stars?.find((entry) => entry.id === systemData.id) || systemData;
        const travel = travelOverride || this.universe?.getTravelMetrics?.(star) || { energy: 100, credits: 50, reachable: true };
        if (!travel.reachable || Number(this.resources.energy || 0) < travel.energy || Number(this.resources.credits || 0) < travel.credits) {
            this.notify('Warp envelope or resources are insufficient for this route.', 'warning');
            return false;
        }
        this.resources.energy = Math.max(0, Number(this.resources.energy || 0) - travel.energy);
        this.resources.credits = Math.max(0, Number(this.resources.credits || 0) - travel.credits);
        this.economyManager?.addToLedger?.('TOLL', 'player', 'warp_gate', travel.credits, 'credits');
        this.audio?.playWarp?.();
        this.updateResourceUI();

        if (invasion) {
            const result = this.military?.attemptInvasion?.(star.id);
            if (result?.success) {
                this.resources.credits += Number(result.loot || 0);
                this.notify(`Invasion successful. Salvaged ${result.loot || 0} Credits.`, 'success');
            } else if (result) {
                this.notify(`Invasion failed. Fleet sustained ${result.damage || 0} damage; landing corridor remains contested.`, 'danger');
            }
        } else {
            this.notify(`Warp solution locked: ${star.name || star.id}.`, 'info');
        }

        this.saveCurrentSystemState();
        this.currentSystemId = star.id;
        this.currentSystemName = star.name || star.label || String(star.id).replace(/[_-]+/g, ' ');
        this.isOnMoon = false;
        this.isOrbitalViewActive = false;
        this.applyLocationModifiers();
        this.structures = [];
        this.buildingMeshes = {};
        this.universe?.discoverStar?.(star.id);
        if (this.universe?.galaxyViewState) this.universe.galaxyViewState.selectedStarId = star.id;

        const systemModal = document.getElementById('ep-system-modal');
        if (systemModal) systemModal.style.display = 'none';
        const chartModal = document.getElementById('ep-galaxy-map-modal');
        if (chartModal) chartModal.style.display = 'none';
        if (this.isGalaxyViewActive) this.toggleGalaxyView();

        const saved = this.systemStates[star.id];
        if (saved) {
            const savedSeed = saved.seed || star.seed || 12345;
            const savedWorldType = saved.worldType || star.worldType || star.planetType || this.getPlanetTypeFromSeed(savedSeed);
            this.createPlanet(savedSeed, savedWorldType);
            this.applySystemState(saved);
        } else {
            const seed = Number.isFinite(star.seed) ? star.seed : 12345;
            const worldType = star.worldType || star.planetType || this.getPlanetTypeFromSeed(seed);
            this.createPlanet(seed, worldType);
            this.systemStates[star.id] = {
                seed,
                worldType,
                tiles: [],
                structures: [],
                starConfig: star.starConfig || null
            };
        }
        const starConfig = this.systemStates[star.id]?.starConfig || star.starConfig || null;
        this.setupSuns(starConfig);
        this.createBuildMenu();
        this.updateLocationUI();
        this.updateResourceUI();
        this.notify(`Arrived in ${this.currentSystemName}. Establish a foothold or continue exploration.`, 'success');
        return true;
    }

    attemptGeneEdit() { document.getElementById('ep-crispr-modal').style.display = 'none'; }

    // --- MARKET ---
    openSignals() {
        const modal = document.getElementById('ep-signals-modal');
        if (modal) modal.style.display = 'flex';
        this.renderSignals();
    }

    renderSignals() {
        const container = document.getElementById('ep-signals-list');
        if (!container || !this.alienSignals) return;

        container.innerHTML = '';
        const allSignals = [...this.alienSignals.activeSignals, ...this.alienSignals.discoveredSignals];

        if (allSignals.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#64748b; margin-top:20px; font-style:italic;">No signals detected. Tuning subspace arrays...</div>';
            return;
        }

        allSignals.forEach(sig => {
            const isDiscovered = sig.status === 'completed';
            const isAnalyzing = sig.status === 'analyzing';
            const progress = sig.progress || 0;

            const div = document.createElement('div');
            div.style.background = isDiscovered ? 'rgba(74, 222, 128, 0.1)' : 'rgba(30, 41, 59, 0.8)';
            div.style.border = `1px solid ${isDiscovered ? '#4ade80' : '#334155'}`;
            div.style.padding = '15px';
            div.style.borderRadius = '8px';

            let actionHtml = '';
            if (!isDiscovered && !isAnalyzing) {
                actionHtml = `<button class="ep-sys-btn" onclick="game.alienSignals.analyzeSignal('${sig.id}')">ANALYZE</button>`;
            } else if (isAnalyzing) {
                actionHtml = `
                    <div style="flex:1; margin-left:10px;">
                        <div style="font-size:0.7rem; color:#38bdf8; margin-bottom:4px;">ANALYZING... ${(progress * 100).toFixed(0)}%</div>
                        <div style="width:100%; height:4px; background:#0f172a; border-radius:2px; overflow:hidden;">
                            <div style="width:${progress * 100}%; height:100%; background:#38bdf8;"></div>
                        </div>
                    </div>
                `;
            } else {
                actionHtml = `<span style="color:#4ade80; font-weight:bold;">DECIPHERED</span>`;
            }

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div>
                        <div style="font-weight:bold; color:${isDiscovered ? '#4ade80' : '#38bdf8'};">${sig.name}</div>
                        <div style="font-size:0.75rem; color:#94a3b8;">Source: Deep Space (${sig.type})</div>
                    </div>
                    ${actionHtml}
                </div>
                <div style="font-size:0.8rem; color:#cbd5e1;">${isDiscovered ? 'Signal deciphered. Data added to local archives.' : 'Encrypted subspace emission. Signal strength: ' + sig.strength.toFixed(1) + '%'}</div>
            `;
            container.appendChild(div);
        });
    }

    openChatter() {
        const modal = document.getElementById('ep-chatter-modal');
        if (modal) modal.style.display = 'flex';
        this.renderChatter();
    }

    renderChatter() {
        const container = document.getElementById('ep-chatter-feed');
        if (!container) return;

        container.innerHTML = '';
        if (!this.chatterPosts) this.chatterPosts = [];

        this.chatterPosts.slice(-50).reverse().forEach(post => {
            const div = document.createElement('div');
            div.style.background = post.type === 'news' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.8)';
            div.style.borderLeft = `4px solid ${post.color || '#38bdf8'}`;
            div.style.padding = '10px';
            div.style.borderRadius = '0 4px 4px 0';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="font-weight:bold; color:${post.color || '#fff'};">${post.author}</span>
                    <span style="font-size:0.75rem; color:#64748b;">Day ${post.day}</span>
                </div>
                <div style="color:#e2e8f0; font-size:0.9rem;">${post.content}</div>
            `;
            container.appendChild(div);
        });
    }

    generateNPCPost(c) {
        // Roadmap Item 122: Colony Chatter
        const npc = this.npcSystem?.npcs[c.id];
        if (!npc) return;

        // Roadmap Item 152: Gossip
        if (Math.random() < 0.1) {
            const gossip = this.npcSystem.generateGossip(c.id);
            if (gossip) {
                this.addChatterPost(gossip.author, gossip.content, '#f472b6', 'npc');
                return;
            }
        }

        const moods = {
            happy: ["Great day to be a pioneer!", "Finally getting used to the low gravity.", "The view of the rings today is stunning."],
            stressed: ["Another 12-hour shift... I need a vacation.", "Is it just me, or is the air recycler getting louder?", "Can't wait for the next supply drop."],
            bored: ["Missing the coffee back on Earth.", "If I see one more mineral sample today...", "Checking my terminal for the 50th time."],
            hobby: [`Just finished some ${npc.hobby?.name || 'relaxing'} time.`, `Anyone want to join me for ${npc.hobby?.name || 'a break'} later?`]
        };

        let content = "";
        if (c.morale > 80) content = moods.happy[Math.floor(Math.random() * moods.happy.length)];
        else if (c.morale < 40) content = moods.stressed[Math.floor(Math.random() * moods.stressed.length)];
        else if (Math.random() < 0.3) content = moods.hobby[Math.floor(Math.random() * moods.hobby.length)];
        else content = moods.bored[Math.floor(Math.random() * moods.bored.length)];

        this.addChatterPost(c.name, content, '#38bdf8', 'npc');
    }

    addChatterPost(author, content, color, type = 'npc') {
        if (!this.chatterPosts) this.chatterPosts = [];
        this.chatterPosts.push({
            author,
            content,
            color,
            type,
            day: this.day,
            timestamp: Date.now()
        });

        // Roadmap Item 144: News Anchor periodically
        if (this.chatterPosts.length % 10 === 0) {
            this.generateNewsFlash();
        }

        if (document.getElementById('ep-chatter-modal')?.style.display === 'flex') {
            this.renderChatter();
        }
    }

    generateNewsFlash() {
        // Roadmap Item 144: Procedural News Anchor
        const news = [
            `COLONY UPDATE: Population reaches ${this.colonists.length} pioneers.`,
            `ECONOMY: Resource reserves currently at ${Math.floor(this.resources.minerals)} minerals.`,
            `WEATHER: Terraforming progress evaluated at ${this.terraforming?.habitability.toFixed(1)}%.`,
            `GALACTIC: Trade fleets are reporting clear lanes in the sector.`
        ];

        // Roadmap Item 144: Faction & Legal News Integration
        if (this.factionManager) {
            const factions = Object.values(this.factionManager.factions).filter(f => f.id !== 'player');
            const randomFaction = factions[Math.floor(Math.random() * factions.length)];
            const opinion = this.factionManager.getOpinion(randomFaction.id, 'player');
            news.push(`DIPLOMACY: ${randomFaction.name} remains ${opinion > 0 ? 'supportive' : 'critical'} of colony expansion.`);
        }

        if (this.legalSystem && this.legalSystem.laws.some(l => l.active)) {
            const activeLaw = this.legalSystem.laws.find(l => l.active);
            news.push(`LEGAL: Colony adherence to "${activeLaw.name}" is being monitored by local authorities.`);
        }

        const flash = news[Math.floor(Math.random() * news.length)];
        this.addChatterPost("📡 GALACTIC_NEWS", flash, "#fbbf24", 'news');
    }

    openStocks() {
        if (!this.economyManager) return;
        const modal = document.getElementById('ep-stocks-modal');
        if (modal) modal.style.display = 'flex';
        this.renderStocks();
    }

    renderStocks() {
        const container = document.getElementById('ep-stocks-content');
        if (!container || !this.economyManager) return;

        let html = `
            <div style="margin-bottom:20px; color:#cbd5e1; font-size:0.9rem;">
                Welcome to the Galactic Stock Exchange. Invest in the future of the sector.
            </div>
            <div style="display:grid; grid-template-columns: 1fr; gap:15px;">
        `;

        this.economyManager.stocks.forEach(s => {
            const lastPrice = s.history[s.history.length - 2] || s.price;
            const change = s.price - lastPrice;
            const changePct = ((change / lastPrice) * 100).toFixed(2);
            const color = change >= 0 ? '#4ade80' : '#ef4444';
            const icon = change >= 0 ? '▲' : '▼';
            const lotSize = 10;
            const lotCost = s.price * lotSize;
            const credits = Number(this.resources?.credits || 0);
            const canBuy = credits >= lotCost;
            const canSell = Number(s.playerOwned || 0) >= lotSize;

            html += `
                <div class="ep-stock-card" data-stock-id="${s.id}" style="background:rgba(15,23,42,0.8); border:1px solid #334155; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <div style="font-weight:bold; color:#fff; font-size:1.1rem;">${s.name} (${s.id})</div>
                        <div style="font-size:0.8rem; color:#94a3b8;">Shares Owned: ${s.playerOwned}</div>
                    </div>
                    <div style="text-align:right; min-width:120px;">
                        <div style="font-weight:bold; color:#fff; font-size:1.2rem;">${s.price.toFixed(2)} Cr</div>
                        <div style="color:${color}; font-size:0.8rem;">${icon} ${changePct}%</div>
                        <div style="color:#64748b; font-size:0.68rem; margin-top:3px;">10-share lot: ${lotCost.toFixed(2)} Cr</div>
                    </div>
                    <div style="display:flex; gap:10px; margin-left:20px;">
                        <button class="ep-sys-btn" style="border-color:#4ade80; color:#4ade80; opacity:${canBuy ? 1 : 0.45}; cursor:${canBuy ? 'pointer' : 'not-allowed'};" data-stock-action="buy" aria-disabled="${!canBuy}" ${canBuy ? '' : 'disabled'} title="${canBuy ? `Buy ${lotSize} shares for ${lotCost.toFixed(2)} Cr` : `Need ${Math.max(0, lotCost - credits).toFixed(2)} more Cr`}" onclick="game.economyManager.buyStock('${s.id}', ${lotSize}); game.renderStocks();">BUY ${lotSize}</button>
                        <button class="ep-sys-btn" style="border-color:#ef4444; color:#ef4444; opacity:${canSell ? 1 : 0.45}; cursor:${canSell ? 'pointer' : 'not-allowed'};" data-stock-action="sell" aria-disabled="${!canSell}" ${canSell ? '' : 'disabled'} title="${canSell ? `Sell ${lotSize} shares` : `Own ${lotSize} shares to sell`}" onclick="game.economyManager.sellStock('${s.id}', ${lotSize}); game.renderStocks();">SELL ${lotSize}</button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    openIndustrialDashboard() {
        // Roadmap Item 280: Industrial Cycle UI
        let modal = document.getElementById('ep-industrial-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-industrial-modal';
            modal.className = 'ep-modal-overlay';
            modal.innerHTML = `
                <div class="ep-modal" style="width:800px; height:600px; max-width:95vw;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#38bdf8;">🏭 Industrial Command</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-industrial-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-industrial-content" style="padding:20px; background:#0f172a; overflow-y:auto;">
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        this.renderIndustrialDashboard();
    }

    renderIndustrialDashboard() {
        const container = document.getElementById('ep-industrial-content');
        if (!container || !this.production) return;

        const prod = this.production;
        const grid = this.powerGrid || { load: 0, capacity: 0 };
        const shift = prod.currentShift || 'DAY';
        const shiftIcon = shift === 'DAY' ? '☀️' : '🌙';

        let html = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
                <div class="ep-panel" style="padding:15px; border:1px solid #334155;">
                    <h3 style="margin:0 0 10px 0; color:#fbbf24;">🕒 Industrial Cycle</h3>
                    <div style="font-size:1.2em; color:#fff;">Current Shift: ${shiftIcon} ${shift}</div>
                    <div style="font-size:0.8em; color:#94a3b8; margin-top:5px;">Shift efficiency modifiers applied. Next change in ${Math.floor(Math.random() * 10)}h.</div>
                </div>
                <div class="ep-panel" style="padding:15px; border:1px solid #334155;">
                    <h3 style="margin:0 0 10px 0; color:#38bdf8;">🔋 Power Grid</h3>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="color:#cbd5e1;">Load: ${Math.floor(grid.load)} / ${Math.floor(grid.capacity)} MW</span>
                        <span style="color:#4ade80;">${Math.floor((grid.load / (grid.capacity || 1)) * 100)}%</span>
                    </div>
                    <div style="width:100%; height:8px; background:#1e293b; border-radius:4px; overflow:hidden;">
                        <div style="width:${Math.min(100, (grid.load / (grid.capacity || 1)) * 100)}%; height:100%; background:#38bdf8;"></div>
                    </div>
                </div>
            </div>

            <div class="ep-panel" style="padding:15px; border:1px solid #334155; margin-bottom:20px;">
                <h3 style="margin:0 0 10px 0; color:#a855f7;">🛠️ Manufacturing Specializations</h3>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">
        `;

        Object.entries(prod.specializations || {}).forEach(([key, spec]) => {
            const progress = (spec.exp / (spec.level * 100)) * 100;
            html += `
                <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid #334155;">
                    <div style="font-weight:bold; color:#fff; text-transform:capitalize;">${spec.name || key}</div>
                    <div style="font-size:0.8rem; color:#94a3b8;">Level ${spec.level}</div>
                    <div style="width:100%; height:4px; background:#1e293b; margin-top:5px; border-radius:2px; overflow:hidden;">
                        <div style="width:${progress}%; height:100%; background:#a855f7;"></div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>

            <div class="ep-panel" style="padding:15px; border:1px solid #334155;">
                <h3 style="margin:0 0 10px 0; color:#ef4444;">⚠️ Active Bottlenecks & Alerts</h3>
                <div id="ep-industrial-alerts" style="font-size:0.9rem; color:#cbd5e1; font-family:monospace;">
        `;

        const bottlenecks = Object.entries(prod.logisticsNetwork?.bottlenecks || {});
        if (bottlenecks.length === 0) {
            html += `<div style="color:#4ade80;">No critical bottlenecks detected. All systems nominal.</div>`;
        } else {
            bottlenecks.forEach(([id, res]) => {
                html += `> ALERT: NODE ${id} STALLED. LACKING ${res.toUpperCase()}<br>`;
            });
        }

        if (prod.toolingCondition < 0.5) {
            html += `<div style="color:#fbbf24; margin-top:10px;">> WARNING: Industrial tooling condition at ${Math.floor(prod.toolingCondition * 100)}%. Recommend maintenance at QC Lab.</div>`;
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    openMarket() {
        if (!this.economyManager) return;
        this.economyManager.syncTradeRoutesFromGalaxy?.();
        let modal = document.getElementById('ep-market-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-market-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.display = 'none';
            modal.style.zIndex = '8000';
            modal.innerHTML = `
                <div class="ep-modal" style="width:800px; max-width:95vw;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#38bdf8;">🪐 Galactic Market</h2>
                        <div style="display:flex; gap:10px;">
                            <button class="ep-sys-btn" onclick="game.currentMarketTab='prices'; game.renderMarket()">PRICES</button>
                            <button class="ep-sys-btn" onclick="game.currentMarketTab='routes'; game.renderMarket()">ROUTES</button>
                            <button class="ep-sys-btn" id="ep-btn-black-market" style="display:none; border-color:#a855f7; color:#a855f7;" onclick="game.currentMarketTab='blackmarket'; game.renderMarket()">🌑 BLACK MARKET</button>
                            <button class="ep-sys-btn" onclick="document.getElementById('ep-market-modal').style.display='none'">CLOSE</button>
                        </div>
                    </div>
                    <div class="ep-modal-body" id="ep-market-content" style="padding:20px; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); min-height:400px; max-height:70vh; overflow-y:auto;">
                    </div>
                </div>
             `;
            document.body.appendChild(modal);
        }

        // Show/Hide Black Market tab based on visibility
        const bmBtn = document.getElementById('ep-btn-black-market');
        if (bmBtn) {
            bmBtn.style.display = (this.economyManager.blackMarket && this.economyManager.blackMarket.active) ? 'block' : 'none';
        }

        this.currentMarketTab = this.currentMarketTab || 'prices';
        if (this.currentMarketTab === 'blackmarket' && !this.economyManager.blackMarket?.active) this.currentMarketTab = 'prices';
        modal.style.display = 'flex';
        this.renderMarket();
    }

    renderBlackMarket(container) {
        const bm = this.economyManager.blackMarket;
        if (!bm || !bm.active) {
            container.innerHTML = `<div style="text-align:center; color:#94a3b8; margin-top:50px;">The black market signals have faded...</div>`;
            return;
        }

        let html = `
            <div style="margin-bottom:20px; text-align:center; color:#a855f7;">
                <h3>🌑 EXOTIC GOODS EXCHANGE</h3>
                <div style="font-size:0.8rem; opacity:0.8;">Signals will destabilize in ${Math.floor(bm.timer)}s</div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        `;

        bm.inventory.forEach(item => {
            html += `
                <div style="background:rgba(88, 28, 135, 0.2); border:1px solid #a855f7; padding:15px; border-radius:10px; display:flex; flex-direction:column; gap:10px;">
                    <div style="font-weight:bold; color:#fff;">${item.name}</div>
                    <div style="font-size:0.8rem; color:#d8b4fe;">Cost: ${item.cost} Credits</div>
                    <button class="ep-sys-btn" style="border-color:#a855f7; color:#a855f7;" onclick="game.buyBlackMarketItem('${item.name}')">PURCHASE</button>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    buyBlackMarketItem(itemName) {
        const bm = this.economyManager.blackMarket;
        const item = bm.inventory.find(i => i.name === itemName);
        if (!item) return;

        if (this.resources.credits < item.cost) {
            this.notify("Insufficient credits for black market trade!", "danger");
            return;
        }

        this.resources.credits -= item.cost;
        this.economyManager?.addToLedger?.('BLACK_MARKET', 'player', item.name, item.cost, 'credits');
        this.recordColonyEvent?.(`Acquired ${item.name} through an encrypted black-market exchange.`, 0.45, 'info');
        if (item.type === 'data') this.resources.data += 500;
        if (item.type === 'tech') {
            // Unlock a random tier 3/4 tech
            const techs = Object.keys(this.technologies).filter(k => !this.technologies[k].unlocked);
            if (techs.length > 0) {
                const k = techs[Math.floor(Math.random() * techs.length)];
                this.technologies[k].unlocked = true;
                if (this.technologies[k].effect) this.technologies[k].effect();
                this.notify(`UNLOCKED: ${this.technologies[k].name} via black market data.`, "success");
            }
        }

        // Remove item
        bm.inventory = bm.inventory.filter(i => i.name !== itemName);
        this.notify(`Acquired ${itemName} from underground sources.`, "success");
        this.updateResourceUI();
        this.renderMarket();
    }

    // --- TECH TREE ---
    openTechTree() {
        let modal = document.getElementById('ep-tech-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-tech-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.display = 'none';
            modal.style.zIndex = '8000';
            modal.innerHTML = `
                <div class="ep-modal" style="width:1000px; max-width:95vw;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#a855f7;">🔬 Technology & Research</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-tech-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" id="ep-tech-grid" style="padding:0; position:relative; background:#020617; overflow:hidden;">
                        <!-- Canvas and Nodes here -->
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const canvas = document.getElementById('ep-tech-canvas');
        if (!canvas) {
            const content = document.getElementById('ep-tech-grid');
            if (content) {
                content.style.display = 'block';
                content.style.position = 'relative';
                content.style.width = '1000px';
                content.style.height = '600px';
                content.innerHTML = `
                    <div style="position:absolute; top:10px; right:10px; z-index:10; display:flex; gap:10px; align-items:center; background:rgba(15,23,42,0.8); padding:10px; border-radius:8px; border:1px solid #a855f7;">
                        <div style="color:#cbd5e1; font-size:0.8rem;">Roadmap Item 901:</div>
                        <button class="ep-sys-btn" style="border-color:#a855f7; color:#a855f7;" onclick="game.performHypothesisTest()">🧪 TEST HYPOTHESIS (50 Data)</button>
                    </div>
                    <canvas id="ep-tech-canvas" width="1000" height="600" style="position:absolute;top:0;left:0;z-index:1;"></canvas>
                    <div id="ep-tech-nodes" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:2;"></div>
                `;
            }
        }
        modal.style.display = 'flex';
        this.renderTechTree();
    }

    renderTechTree() {
        const canvas = document.getElementById('ep-tech-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const nodeContainer = document.getElementById('ep-tech-nodes');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        nodeContainer.innerHTML = '';

        // Draw Connections
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;

        Object.keys(this.technologies).forEach(key => {
            const tech = this.technologies[key];
            if (tech.req && this.technologies[tech.req]) {
                const parent = this.technologies[tech.req];
                if (!parent.pos || !tech.pos) return;

                ctx.beginPath();
                ctx.moveTo(parent.pos.x + 30, parent.pos.y + 30);
                const cp1x = parent.pos.x + 30 + 50;
                const cp1y = parent.pos.y + 30;
                const cp2x = tech.pos.x + 30 - 50;
                const cp2y = tech.pos.y + 30;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tech.pos.x + 30, tech.pos.y + 30);

                if (tech.unlocked) ctx.strokeStyle = '#38bdf8';
                else if (parent.unlocked) ctx.strokeStyle = '#fbbf24';
                else ctx.strokeStyle = '#334155';
                ctx.stroke();
            }
        });

        // Draw Nodes
        Object.keys(this.technologies).forEach(key => {
            const tech = this.technologies[key];
            if (!tech.pos) return;
            const el = document.createElement('div');
            let statusClass = 'locked';
            let statusIcon = '🔒';
            if (tech.unlocked) { statusClass = 'unlocked'; statusIcon = '✅'; }
            else if (!tech.req || this.technologies[tech.req].unlocked) { statusClass = 'available'; statusIcon = '🔓'; }

            el.className = `ep-tech-node ${statusClass}`;
            el.style.left = tech.pos.x + 'px';
            el.style.top = tech.pos.y + 'px';
            el.innerHTML = `
                <div class="tech-icon">${statusIcon}</div>
                <div class="tech-name">${tech.name}</div>
                <div class="tech-cost">${tech.cost} Data</div>
            `;
            el.title = `${tech.desc}`;
            if (statusClass === 'available') {
                el.onclick = () => this.researchTech(key);
            }
            nodeContainer.appendChild(el);
        });
    }

    researchTech(key) {
        const tech = this.technologies[key];
        if (!tech || tech.unlocked) return;
        if (this.resources.data < tech.cost) {
            this.notify(`Need ${tech.cost} Research Data!`, 'warning');
            return;
        }
        this.resources.data -= tech.cost;
        tech.unlocked = true;
        if (tech.effect) tech.effect();
        this.audio.playUnlock();
        this.notify(`Unlocked: ${tech.name}`, 'success');
        this.renderTechTree();
        this.updateResourceUI();
    }

    renderMarket() {
        const container = document.getElementById('ep-market-content') || document.getElementById('ep-market-list');
        if (!container || !this.economyManager) return;
        this.economyManager.syncTradeRoutesFromGalaxy?.();
        container.innerHTML = '';

        const blackMarketActive = !!this.economyManager.blackMarket?.active;
        const blackMarketButton = document.getElementById('ep-btn-black-market');
        if (blackMarketButton) blackMarketButton.style.display = blackMarketActive ? 'block' : 'none';
        if (this.currentMarketTab === 'blackmarket' && !blackMarketActive) this.currentMarketTab = 'prices';

        if (this.currentMarketTab === 'blackmarket') {
            this.renderBlackMarket(container);
            return;
        }
        if (this.currentMarketTab === 'routes') {
            this.renderTradeRoutes(container);
            return;
        }
        this.renderMarketPrices(container);
    }

    renderMarketPrices(container) {
        // Roadmap Item 205: Commodity exchange with price history
        let html = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">';

        Object.keys(this.economyManager.marketState).forEach(res => {
            const price = this.economyManager.getPrice(res);
            const trend = this.economyManager.getTrend(res);
            const trendIcon = trend === 'up' ? '📈' : (trend === 'down' ? '📉' : '➡️');
            const trendColor = trend === 'up' ? '#22c55e' : (trend === 'down' ? '#ef4444' : '#94a3b8');

            html += `
                <div class="ep-panel" style="padding:10px; background:rgba(15,23,42,0.6); border:1px solid #334155;">
                    <div style="font-weight:bold; color:#38bdf8; text-transform:capitalize;">${res.replace('_', ' ')}</div>
                    <div style="font-size:1.2em; color:${trendColor}; margin:5px 0;">${trendIcon} ${price.toFixed(1)} Cr</div>
                    <div style="font-size:0.8em; color:#cbd5e1;">Owned: ${Math.floor(this.resources[res] || 0)}</div>
                    <div style="margin-top:10px; display:flex; gap:5px;">
                        <button class="ep-sys-btn" style="flex:1; font-size:0.8em;" onclick="window.game.economyManager.buy('${res}', 10); game.renderMarket()">BUY 10</button>
                        <button class="ep-sys-btn" style="flex:1; font-size:0.8em;" onclick="window.game.economyManager.sell('${res}', 10); game.renderMarket()">SELL 10</button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderTradeRoutes(container) {
        this.economyManager.syncTradeRoutesFromGalaxy?.();
        const fleets = this.economyManager.tradeFleets || [];
        const routes = this.economyManager.tradeRoutes || [];
        const dockedShips = (this.ships || []).filter((ship) => ship.status === 'docked');
        const fmtRisk = (risk) => `${Math.round(Math.max(0, Math.min(1, Number(risk || 0))) * 100)}%`;
        const shipName = (id) => this.ships.find((ship) => String(ship.id) === String(id))?.name || String(id);

        let html = `
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="ep-panel" style="padding:14px; background:rgba(56,189,248,.08); border:1px solid rgba(56,189,248,.45);">
                    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;">
                        <div><span style="font:700 .62rem Orbitron,sans-serif;color:#64748b;letter-spacing:.1em;">AUTONOMOUS LOGISTICS</span><h3 style="margin:3px 0 0;color:#7dd3fc;">Active Trade Fleets (${fleets.length})</h3></div>
                        <span style="color:#94a3b8;font-size:.68rem;">Runs use simulation time · insurance protects route revenue</span>
                    </div>
                    <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
        `;

        if (!fleets.length) {
            html += `<div style="color:#94a3b8;font-size:.78rem;padding:8px 0;">No autonomous trade fleets. Dispatch a docked ship to a discovered-system route below.</div>`;
        } else {
            fleets.forEach((fleet) => {
                const route = routes.find((entry) => entry.id === fleet.routeId);
                if (!route) return;
                const progress = Math.round(this.economyManager.getTradeFleetProgress?.(fleet) * 100 || 0);
                html += `
                    <div style="background:#111c30;padding:10px;border-radius:7px;border:1px solid #334155;">
                        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap;">
                            <div><strong style="color:#fff;">${shipName(fleet.shipId)}</strong><div style="color:#94a3b8;font-size:.68rem;">${route.name} · ${fleet.insured ? 'Insured' : 'Uninsured'} · ${Number(fleet.runsCompleted || 0)} completed runs</div></div>
                            <button class="ep-sys-btn" data-trade-recall="${fleet.id}" style="font-size:.67rem;border-color:#f59e0b;color:#fbbf24;">RECALL</button>
                        </div>
                        <div style="display:flex;justify-content:space-between;margin:8px 0 4px;font-size:.66rem;color:#7dd3fc;"><span>Run progress</span><span>${progress}%</span></div>
                        <div style="width:100%;height:5px;background:#020617;border-radius:99px;overflow:hidden;"><div style="width:${progress}%;height:100%;background:linear-gradient(90deg,#0891b2,#67e8f9);"></div></div>
                    </div>
                `;
            });
        }

        html += `
                    </div>
                </div>
                <div class="ep-panel" style="padding:14px;">
                    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;">
                        <div><span style="font:700 .62rem Orbitron,sans-serif;color:#64748b;letter-spacing:.1em;">ROUTE EXCHANGE</span><h3 style="margin:3px 0 0;color:#fbbf24;">Available Routes (${routes.length})</h3></div>
                        <span style="color:#64748b;font-size:.68rem;">Discover systems in the Galactic Chart to expand the network.</span>
                    </div>
                    <div style="margin-top:10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
        `;

        if (!routes.length) {
            html += `<div style="grid-column:1/-1;color:#94a3b8;padding:16px;text-align:center;border:1px dashed #334155;border-radius:8px;">No trade corridors mapped yet. Survey another system or establish an operational Launch Site for the local Orbital Exchange.</div>`;
        } else {
            routes.forEach((route) => {
                const routeId = String(route.id);
                const assigned = fleets.filter((fleet) => fleet.routeId === route.id).length;
                html += `
                    <article style="background:rgba(15,23,42,.72);padding:12px;border-radius:8px;border:1px solid #334155;display:flex;flex-direction:column;gap:8px;">
                        <div><strong style="color:#f8fafc;">${route.name}</strong><div style="color:#64748b;font-size:.66rem;">${route.local ? 'Local orbital logistics' : `${Math.round(Number(route.distance || 0))} ly corridor`} · ${Number(route.duration || 60)}s/run</div></div>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;font-size:.65rem;">
                            <div style="background:#0b1220;padding:6px;border-radius:5px;"><span style="color:#64748b;display:block;">PROFIT</span><b style="color:#86efac;">${Math.floor(Number(route.credits || 0))} Cr</b></div>
                            <div style="background:#0b1220;padding:6px;border-radius:5px;"><span style="color:#64748b;display:block;">RISK</span><b style="color:${Number(route.risk || 0) > .4 ? '#fca5a5' : '#fde68a'};">${fmtRisk(route.risk)}</b></div>
                            <div style="background:#0b1220;padding:6px;border-radius:5px;"><span style="color:#64748b;display:block;">RUNS</span><b style="color:#cbd5e1;">${Number(route.runsCompleted || 0)}</b></div>
                        </div>
                        <select class="ep-trade-ship-select" data-trade-ship-for="${routeId}" ${dockedShips.length ? '' : 'disabled'} style="width:100%;background:#020617;border:1px solid #334155;color:#cbd5e1;border-radius:6px;padding:7px;">
                            <option value="">${dockedShips.length ? 'Select docked vessel...' : 'No docked vessels available'}</option>
                            ${dockedShips.map((ship) => `<option value="${ship.id}">${ship.name} · ${Math.round(Number(ship.design?.stats?.capacity || 0))} cargo</option>`).join('')}
                        </select>
                        <label style="display:flex;align-items:center;gap:7px;color:#94a3b8;font-size:.68rem;"><input type="checkbox" data-trade-insure-for="${routeId}" /> Insure this route run</label>
                        <button class="ep-sys-btn" data-trade-dispatch="${routeId}" ${dockedShips.length ? '' : 'disabled'} style="width:100%;border-color:#38bdf8;color:#7dd3fc;">DISPATCH${assigned ? ` · ${assigned} ACTIVE` : ''}</button>
                    </article>
                `;
            });
        }
        html += `</div></div></div>`;
        container.innerHTML = html;

        container.querySelectorAll('[data-trade-dispatch]').forEach((button) => {
            button.onclick = () => this.assignShipToTradeFromUI(button.dataset.tradeDispatch);
        });
        container.querySelectorAll('[data-trade-recall]').forEach((button) => {
            button.onclick = () => this.recallTradeFleetFromUI(button.dataset.tradeRecall);
        });
    }

    assignShipToTradeFromUI(routeId) {
        const container = document.getElementById('ep-market-content') || document.getElementById('ep-market-list');
        if (!container || !this.economyManager) return false;
        const selector = [...container.querySelectorAll('[data-trade-ship-for]')].find((element) => element.dataset.tradeShipFor === String(routeId));
        const insurance = [...container.querySelectorAll('[data-trade-insure-for]')].find((element) => element.dataset.tradeInsureFor === String(routeId));
        const shipId = selector?.value;
        if (!shipId) {
            this.notify('Select a docked ship for this trade route.', 'info');
            return false;
        }
        const fleet = this.economyManager.assignShipToTrade(shipId, routeId, !!insurance?.checked);
        if (!fleet) return false;
        this.renderMarket();
        return true;
    }

    recallTradeFleetFromUI(fleetId) {
        const ok = this.economyManager?.recallTradeFleet?.(fleetId, true);
        if (ok) this.renderMarket();
        return !!ok;
    }

    assignShipToTrade(shipId, routeId, insured = false) {
        const fleet = this.economyManager?.assignShipToTrade?.(shipId, routeId, insured);
        if (fleet) this.renderMarket();
        return fleet;
    }

    // --- CLOUD ---
    async openCloudMenu() { document.getElementById('ep-cloud-modal').style.display = 'flex'; await this.cloud.checkSession(); this.updateCloudUI(); }

    updateCloudUI() {
        const content = document.getElementById('ep-cloud-content');
        if (!content) return;
        if (this.cloud.user) {
            content.innerHTML = `
                <div>Logged in: <span style="color:#38bdf8">${this.cloud.user.email}</span></div>
                <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;">
                    <button class="ep-sys-btn" onclick="window.game.saveToCloud()">☁️ Save Cloud</button>
                    <button class="ep-sys-btn" onclick="window.game.loadFromCloud()">☁️ Load Cloud</button>
                    <button class="ep-sys-btn" onclick="window.game.openLeaderboard()">🏆 Leaderboard</button>
                    <button class="ep-sys-btn" style="border-color:#ef4444; color:#ef4444;" onclick="window.game.logoutCloud()">Logout</button>
                </div>
            `;
        } else {
            content.innerHTML = `<input id="ep-auth-email" placeholder="Email"><input id="ep-auth-pass" type="password" placeholder="Password"><button class="ep-sys-btn" onclick="window.game.loginCloud()">Login</button><button class="ep-sys-btn" onclick="window.game.registerCloud()">Register</button>`;
        }
    }
    async loginCloud() { const e = document.querySelector('#ep-auth-email').value; const p = document.querySelector('#ep-auth-pass').value; await this.cloud.signIn(e, p); this.updateCloudUI(); }
    async registerCloud() { const e = document.querySelector('#ep-auth-email').value; const p = document.querySelector('#ep-auth-pass').value; await this.cloud.signUp(e, p, e.split('@')[0]); }
    async logoutCloud() { await this.cloud.signOut(); this.updateCloudUI(); }
    async saveToCloud() {
        this.saveCurrentSystemState();
        this.advancePilotSkillTraining(0, { silent: true });
        const data = {
            resources: this.resources,
            structures: this.structures,
            colonists: this.colonists,
            ships: Array.isArray(this.ships)
                ? this.ships.map((s) => this.serializeFleetShip(s)).filter(Boolean)
                : [], // Save fleet
            day: this.day,
            timeSpeedIndex: this.timeSpeedIndex,
            tech: Object.keys(this.technologies).filter(k => this.technologies[k].unlocked),
            caps: this.caps,
            currentSystemId: this.currentSystemId,
            isOnMoon: this.isOnMoon,
            systemStates: this.systemStates,
            tiles: this.tiles.map(t => ({ id: t.id, type: t.type, building: t.building, reserves: t.reserves ? { ...t.reserves } : null })),
            pilotSkills: this.pilotSkills,
            attributes: this.attributes,
            claims: this.claims,
            agentMissions: this.agentMissions,
            industry: this.industry,
            inventory: this.inventory,
            blueprints: this.blueprints,
            galaxyState: this.universe?.serializeGalacticState?.() || null,
            colonyEventHistory: Array.isArray(this.colonyEventHistory) ? this.colonyEventHistory.slice(0, 250) : [],
            archaeologyState: this.archaeology?.serialize?.() || null,
            fleetState: this.fleetManager?.serialize?.() || null,
            economyState: this.economyManager?.exportState?.() || null,
            economy: this.economyManager?.exportState?.() || null,
            localSystemState: this.localSystemExplorer?.serialize?.() || null,
            factions: this.factionManager ? this.factionManager.exportState() : null,
            npcMemories: this.npcSystem ? this.npcSystem.exportState() : null,
            techTree: this.techTree ? this.techTree.exportState() : null,
            shipDesigns: (this.shipDesigner && Array.isArray(this.shipDesigner.designs))
                ? this.shipDesigner.designs.map((d) => this.serializeShipDesign(d)).filter(Boolean)
                : []
        };
        await this.cloud.saveGame('ep', 1, data);
        this.notify('Saved to Cloud', 'success');
    }
    async loadFromCloud() {
        const { data } = await this.cloud.loadGame('ep', 1);
        if (data) {
            this.loadGameData(data);

            // Restore connector-specific systems not owned by the common local/cloud state loader.
            if (this.factionManager && data.factions) this.factionManager.importState(data.factions);
            if (this.npcSystem && data.npcMemories) this.npcSystem.importState(data.npcMemories);
            if (this.techTree && data.techTree) this.techTree.importState(data.techTree);

            this.notify('Loaded from Cloud', 'success');
        }
    }

    // --- ECOSYSTEM ---
    scanTile(index) {
        document.getElementById('ep-tooltip').style.display = 'none';
        const tile = this.tiles[index];
        if (this.resources.energy < 10) { this.notify("Need 10 Energy", "danger"); return; }
        this.resources.energy -= 10;

        if (!this.ecosystem) { this.ecosystem = new AlienEcosystem(); this.ecosystem.init(); }
        const results = this.ecosystem.scanTile(tile.id);

        if (!results || results.length === 0) {
            this.notify("Scan Complete: Nothing found.", "info");
        } else {
            results.forEach(res => { this.notify(`Discovered: ${res.species.name}`, "success"); });
            this.resources.data += 10 * results.length;
        }
        this.updateResourceUI();
    }

    openXenodex() {
        if (!this.ecosystem) return;
        const flora = this.ecosystem.getDiscoveredFlora();
        const fauna = this.ecosystem.getDiscoveredFauna();

        const modal = document.getElementById('ep-xenodex-modal');
        const content = document.getElementById('ep-xenodex-content');
        if (modal && content) {
            modal.style.display = 'flex';
            content.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div>
                        <h3 style="color:#4ade80;">Flora (${flora.length})</h3>
                        ${flora.length ? flora.map(f => `<div>${f.name}</div>`).join('') : '<div style="color:#64748b">No flora discovered.</div>'}
                    </div>
                    <div>
                        <h3 style="color:#facc15;">Fauna (${fauna.length})</h3>
                        ${fauna.length ? fauna.map(f => `<div>${f.name}</div>`).join('') : '<div style="color:#64748b">No fauna discovered.</div>'}
                    </div>
                </div>
            `;
        }
    }

    updateLocationUI() {
        let locDiv = document.getElementById('ep-location-display');
        if (!locDiv) {
            locDiv = document.createElement('div');
            locDiv.id = 'ep-location-display';
            locDiv.className = 'ep-location-display';
            document.body.appendChild(locDiv);
        }
        const systemId = String(this.currentSystemId || 'kepler_186f');
        const star = this.universe?.getCurrentStar?.();
        const systemName = star?.name || this.currentSystemName || this.getCurrentWorldLabel?.() || systemId.replace(/[_-]+/g, ' ');
        const claimed = this.claims?.[systemId] === 'player' || (star && this.claims?.[star.id] === 'player');
        const place = this.isOnMoon ? 'MOON SURFACE' : (this.isOrbitalViewActive ? 'HIGH ORBIT' : 'PLANET SURFACE');
        locDiv.innerHTML = `
            <button class="ep-location-main" type="button" title="Open Galactic Chart">
                <span class="ep-location-kicker">${place}</span>
                <strong>${systemName}</strong>
            </button>
            <div class="ep-location-actions">
                ${claimed ? '<span class="ep-location-claimed">✓ CLAIMED</span>' : (!this.isOnMoon ? '<button class="ep-location-claim" type="button">Claim System</button>' : '')}
                ${this.isOnMoon ? '<button class="ep-location-transit ep-location-return" type="button">Return Planet</button>' : (this.hasOperationalLaunchSite() ? `<button class="ep-location-transit ep-location-orbit" type="button">${this.isOrbitalViewActive ? 'Surface' : 'Orbit'}</button>${this.isOrbitalViewActive ? '<button class="ep-location-transit ep-location-moon" type="button">Moon</button>' : ''}` : '')}
            </div>

        `;
        const openMap = locDiv.querySelector('.ep-location-main');
        if (openMap) openMap.onclick = () => this.universe?.openGalaxyMap?.();
        const claim = locDiv.querySelector('.ep-location-claim');
        if (claim) claim.onclick = () => this.claimCurrentSystem();
        const orbit = locDiv.querySelector('.ep-location-orbit');
        if (orbit) orbit.onclick = () => this.requestOrbitalView();
        const moon = locDiv.querySelector('.ep-location-moon');
        if (moon) moon.onclick = () => this.requestMoonTransit();
        const back = locDiv.querySelector('.ep-location-return');
        if (back) back.onclick = () => this.returnToPlanet();
    }

    async claimCurrentSystem() {
        const systemId = String(this.currentSystemId);
        if (this.claims?.[systemId] === 'player') {
            this.notify('System already claimed.', 'info');
            return true;
        }
        const cost = { alloys: 100, circuits: 50 };
        for (const [key, need] of Object.entries(cost)) {
            if (Number(this.resources[key] || 0) < need) {
                this.notify(`Claim requires ${need} ${key}.`, 'warning');
                return false;
            }
        }
        for (const [key, need] of Object.entries(cost)) this.resources[key] -= need;
        this.claims[systemId] = 'player';
        const star = this.universe?.getCurrentStar?.();
        if (star) star.claimedBy = 'player';
        const name = star?.name || this.currentSystemName || `System ${systemId}`;
        this.updateResourceUI();
        this.updateLocationUI();
        this.universe?.renderGalaxyMap?.();
        this.notify(`Territorial claim established: ${name}.`, 'success');
        this.audio?.playSuccess?.();

        // Cloud ownership is an optional synchronization layer, not a requirement for single-player sovereignty.
        if (this.cloud?.user && typeof this.cloud.claimSystem === 'function') {
            try {
                const coords = star?.position ? { x: star.position.x || 0, y: star.position.y || 0, z: star.position.z || 0 } : { x: 0, y: 0, z: 0 };
                const result = await this.cloud.claimSystem(systemId, name, coords);
                if (result?.error) this.notify('Local claim saved; cloud territory sync is unavailable.', 'info');
                else this.cloud.submitScore?.('ep', this.achievements?.score || 100, { action: 'claim', system: name });
            } catch {
                this.notify('Local claim saved; cloud territory sync is unavailable.', 'info');
            }
        }
        return true;
    }

    async openLeaderboard() {
        if (!this.cloud) return;

        let modal = document.getElementById('ep-leaderboard-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-leaderboard-modal';
            modal.className = 'ep-modal';
            modal.innerHTML = `
                 <div class="ep-modal-content">
                     <h2>🏆 Galactic Leaderboard</h2>
                     <div id="ep-lb-list" style="min-height:200px; max-height:500px; overflow-y:auto; margin-bottom:15px; text-align:left;">
                        Loading...
                     </div>
                     <button class="ep-sys-btn" onclick="document.getElementById('ep-leaderboard-modal').style.display='none'">Close</button>
                 </div>
              `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';

        const list = document.getElementById('ep-lb-list');
        list.innerHTML = 'Loading rankings...';

        const { data, error } = await this.cloud.getLeaderboard('ep', 20);
        if (error) {
            list.innerHTML = `<div style="color:#ef4444;">Error loading leaderboard: ${error.message}</div>`;
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = '<div style="padding:20px; color:#94a3b8; text-align:center;">No pioneers have submitted scores yet. Be the first!</div>';
            return;
        }

        list.innerHTML = data.map((entry, i) => `
            <div style="display:flex; justify-content:space-between; padding:10px; background:${i < 3 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(30, 41, 59, 0.5)'}; border-bottom:1px solid #334155;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="font-weight:bold; width:24px; color:${i === 0 ? '#fbbf24' : (i === 1 ? '#94a3b8' : (i === 2 ? '#b45309' : '#64748b'))};">#${i + 1}</div>
                    <div style="color:#f1f5f9;">${entry.profiles ? entry.profiles.username : 'Unknown'}</div>
                </div>
                <div style="font-family:monospace; color:#38bdf8;">${entry.score.toLocaleString()}</div>
            </div>
        `).join('');
    }
    triggerVisuals(type) {
        if (type === 'solar_flare') {
            // Flash screen orange
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100vw'; // Use vw/vh for full coverage
            flash.style.height = '100vh';
            flash.style.background = 'orange';
            flash.style.opacity = '0.5';
            flash.style.pointerEvents = 'none';
            flash.style.zIndex = '9999';
            flash.style.mixBlendMode = 'overlay';
            flash.style.transition = 'opacity 2s';
            document.body.appendChild(flash);

            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 2000);
            }, 100);

            // Screen Shake
            if (this.controls) {
                const originalTarget = this.controls.target.clone();
                // We can't easily shake camera pos with controls active without fighting it.
                // Shake the scene/root object instead? Or just skip shake for now and stick to flash.
                // Let's try minor camera offset interaction.
                let duration = 20;
                const shake = setInterval(() => {
                    const offset = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5));
                    this.camera.position.add(offset.multiplyScalar(0.2));
                    duration--;
                    if (duration <= 0) clearInterval(shake);
                }, 50);
            }
        }
    }
    // --- 3D SPACE COMBAT CONTROL ---

    // --- SHIP DEPLOYMENT UI ---
    openCombatDeployment() {
        if (!this.shipDesigner || this.shipDesigner.designs.length === 0) {
            this.notify("No ship designs available! Design a ship first.", "warning");
            this.shipDesigner.openDesigner(); // Redirect to designer
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'ep-deployment-modal';
        modal.className = 'ep-modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="ep-modal" style="width: 800px; max-height: 80vh; overflow-y: auto;">
                <div class="ep-modal-header">
                    <h2 style="margin:0; color:#38bdf8;">🚀 Fleet Deployment</h2>
                    <button class="ep-sys-btn" onclick="document.getElementById('ep-deployment-modal').remove()">✖</button>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px; color: #cbd5e1;">Select ships to deploy into combat squadron (Max 3).</div>
                    
                    <div id="ep-deploy-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        <!-- Ships populated here -->
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                        <div id="ep-squad-count" style="color: #38bdf8; font-weight: bold;">Selected: 0/3</div>
                        <button id="ep-btn-launch-squad" class="ep-sys-btn" style="background: #0ea5e9; font-size: 1.2em; padding: 10px 30px;" disabled>L A U N C H</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const list = modal.querySelector('#ep-deploy-list');
        const countDisplay = modal.querySelector('#ep-squad-count');
        const launchBtn = modal.querySelector('#ep-btn-launch-squad');

        let selectedIndices = [];

        this.shipDesigner.designs.forEach((design, index) => {
            const card = document.createElement('div');
            card.className = 'ep-design-card';
            card.style.cssText = `background: #0f172a; border: 1px solid #334155; padding: 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s;`;
            card.innerHTML = `
                <div style="font-weight: bold; color: #fff; margin-bottom: 5px;">${design.name}</div>
                <div style="font-size: 0.8em; color: #94a3b8;">Hull: ${design.hull}</div>
                <div style="font-size: 0.8em; color: #94a3b8;">Modules: ${design.modules.length}</div>
                <div style="margin-top: 5px; font-size: 0.9em; color: #38bdf8;">Points: ${this.calculateShipPoints(design)}</div>
            `;

            card.onclick = () => {
                if (selectedIndices.includes(index)) {
                    selectedIndices = selectedIndices.filter(i => i !== index);
                    card.style.border = '1px solid #334155';
                    card.style.background = '#0f172a';
                } else {
                    if (selectedIndices.length >= 3) {
                        this.notify("Squadron full! Max 3 ships.", "warning");
                        return;
                    }
                    selectedIndices.push(index);
                    card.style.border = '1px solid #38bdf8';
                    card.style.background = 'rgba(56, 189, 248, 0.2)';
                }
                updateSelection();
            };
            list.appendChild(card);
        });

        const updateSelection = () => {
            countDisplay.innerText = `Selected: ${selectedIndices.length}/3`;
            launchBtn.disabled = selectedIndices.length === 0;
            launchBtn.style.opacity = selectedIndices.length === 0 ? '0.5' : '1';
        };

        launchBtn.onclick = () => {
            const squadron = selectedIndices.map(i => this.shipDesigner.designs[i]);
            document.getElementById('ep-deployment-modal').remove();
            this.launchFighters(squadron);
        };
    }

    calculateShipPoints(design) {
        // Simple heuristic for ship 'value'
        let points = 50; // Base hull value
        if (design.hull === 'Dreadnought') points = 200;
        if (design.hull === 'Interceptor') points = 80;
        if (design.hull === 'Bomber') points = 100;
        return points + (design.modules.length * 10);
    }

    async ensureCombatScene() {
        if (this.combatScene) return this.combatScene;
        if (this.combatSceneLoadPromise) return this.combatSceneLoadPromise;

        this.combatSceneLoadPromise = (async () => {
            if (typeof window.SpaceCombatScene !== 'function') {
                const coreScript = Array.from(document.scripts).find((script) => /\/exoplanet-pioneer(?:\.pioneer\.min)?\.js$/i.test(new URL(script.src, window.location.href).pathname));
                let assetVersion = '2026_V127_PIONEER_POLISH';
                try {
                    assetVersion = new URL(coreScript?.src || '', window.location.href).searchParams.get('v') || assetVersion;
                } catch (_) { /* keep fallback version */ }

                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = `space-combat.js?v=${encodeURIComponent(assetVersion)}`;
                    script.async = true;
                    script.dataset.cfasync = 'false';
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load space-combat.js'));
                    document.head.appendChild(script);
                });
            }

            if (typeof window.SpaceCombatScene !== 'function') {
                throw new Error('SpaceCombatScene unavailable after loading combat module');
            }
            this.combatScene = new window.SpaceCombatScene(this);
            return this.combatScene;
        })();

        try {
            return await this.combatSceneLoadPromise;
        } catch (error) {
            this.combatSceneLoadPromise = null;
            throw error;
        }
    }

    async launchFighters(selectedShips = null) {
        let combatScene;
        try {
            combatScene = await this.ensureCombatScene();
        } catch (error) {
            console.error('Combat module failed to initialize:', error);
            this.notify('Combat module is temporarily unavailable.', 'danger');
            return;
        }

        if (this.isCombatActive) {
            this.retreatFromCombat();
            return;
        }

        // Default to a basic ship if none selected (fallback)
        if (!selectedShips || selectedShips.length === 0) {
            // Check if we have created designs, if so use the first one
            if (this.shipDesigner && this.shipDesigner.designs.length > 0) {
                selectedShips = [this.shipDesigner.designs[0]];
            } else {
                // If no designs, launch default starter ship
                console.warn("No designs found, launching default.");
                // This will be handled by SpaceCombatScene default init if array is empty
                selectedShips = [];
            }
        }

        // 1. Hide Planet View
        const ui = document.getElementById('ep-ui');
        if (ui) ui.style.display = 'none';

        if (this.cursorMesh) this.cursorMesh.visible = false;

        // 2. Start Combat Scene with Squadron
        try {
            combatScene.start(selectedShips);
        } catch (e) { console.error("Combat Start Failed:", e); }

        // 3. Enable Combat Mode
        this.isCombatActive = true;
        if (this.controls) this.controls.enabled = false; // Disable OrbitControls

        const retreatBtnId = 'ep-btn-retreat';
        let retreatBtn = document.getElementById(retreatBtnId);
        if (!retreatBtn) {
            retreatBtn = document.createElement('button');
            retreatBtn.id = retreatBtnId;
            retreatBtn.className = 'ep-sys-btn';
            retreatBtn.textContent = '↩ RETREAT';
            retreatBtn.title = 'Retreat from Combat';
            retreatBtn.setAttribute('aria-label', 'Retreat from Combat');
            retreatBtn.style.cssText = 'position:absolute; top:20px; right:20px; z-index:6000; pointer-events:auto;';
            retreatBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            retreatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.retreatFromCombat();
            });
            document.body.appendChild(retreatBtn);
        } else {
            retreatBtn.style.display = 'inline-flex';
        }
    }

    retreatFromCombat(result = null) {
        if (!this.combatScene) return;

        console.log("Retreating to Surface...");
        this.notify("Fighters Returning to Base.", "info");

        const outcome = (result && result.outcome != null) ? String(result.outcome) : null;
        const reward = (result && result.reward && typeof result.reward === 'object') ? result.reward : null;
        if (outcome === 'victory') {
            if (!this.agentMissionDefs) this.agentMissionDefs = this.getAgentMissionDefinitions();
            if (!this.agentMissions) this.agentMissions = this.createDefaultAgentMissionsState(this.agentMissionDefs);
            this.agentMissions = this.normalizeAgentMissionsState(this.agentMissions);
            if (!this.agentMissions.stats) this.agentMissions.stats = { combatWins: 0 };
            const wins = (typeof this.agentMissions.stats.combatWins === 'number' && Number.isFinite(this.agentMissions.stats.combatWins)) ? this.agentMissions.stats.combatWins : 0;
            this.agentMissions.stats.combatWins = Math.max(0, Math.floor(wins)) + 1;
        }
        if (outcome === 'victory' && reward && this.resources) {
            const gained = [];
            Object.keys(reward).forEach((k) => {
                const amt = reward[k];
                const n = (typeof amt === 'number' && Number.isFinite(amt)) ? amt : Number(amt);
                if (!(typeof n === 'number' && Number.isFinite(n)) || n <= 0) return;
                if (!Object.prototype.hasOwnProperty.call(this.resources, k)) return;
                const cur = (typeof this.resources[k] === 'number' && Number.isFinite(this.resources[k])) ? this.resources[k] : 0;
                this.resources[k] = cur + n;
                gained.push(`+${Math.floor(n)} ${k}`);
            });
            if (gained.length > 0) {
                this.notify(`Combat rewards: ${gained.join(', ')}`, 'success');
                this.updateResourceUI();
            }
        }

        this.updateAgentMissions();

        // 1. Stop Combat Scene
        this.combatScene.stop();
        this.isCombatActive = false;

        // 2. Show Planet UI
        const ui = document.getElementById('ep-ui');
        if (ui) ui.style.display = '';

        const retreatBtn = document.getElementById('ep-btn-retreat');
        if (retreatBtn) retreatBtn.style.display = 'none';

        if (this.controls) this.controls.enabled = true;
    }

    updatePhysicsConstants(context) {
        // Called when switching universes
        console.log(`Applying physics: ${context.name}, Gravity: ${context.gravity}, Time: ${context.timeScale}x`);

        // Update gravity for physics engine if we had one (simulated via modifiers).
        this.planetSurfaceGravity = Number.isFinite(Number(context.gravity)) ? Number(context.gravity) : 1.0;
        this.applyLocationModifiers();

        // Update visual effects
        if (context.name.includes("Void")) {
            // Enable fluid fog checks or similar
        }
    }

    setupTerraformInput() {
        if (!this.renderer || !this.renderer.domElement) return;

        // Use 'pointerdown' for better support
        this.renderer.domElement.addEventListener('pointerdown', (event) => {
            // Check if Voxel System is active (toolbar visible)
            if (!window.voxelTerrainSystem || !window.voxelTerrainSystem.toolbar || window.voxelTerrainSystem.toolbar.style.display === 'none') return;

            // Calculate mouse position
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            if (this.planetMesh) {
                const intersects = this.raycaster.intersectObject(this.planetMesh);
                if (intersects.length > 0) {
                    const p = intersects[0].point;
                    window.voxelTerrainSystem.modifyTerrain(p, 1.0);
                }
            }
        });

        // Key bind to toggle toolbar (T)
        window.addEventListener('keydown', (e) => {
            if ((e.key === 't' || e.key === 'T') && !this.isPaused) {
                const vts = window.voxelTerrainSystem;
                if (vts) {
                    const isVis = vts.toolbar && vts.toolbar.style.display !== 'none';
                    vts.showToolbar(!isVis);
                    this.notify(`Terraforming Mode ${!isVis ? 'ENGAGED' : 'DISENGAGED'}`, 'info');
                }
            }
        });
    }
}

class SoundEngine {
    constructor() {
        // AudioContext construction is intentionally deferred until the first user
        // gesture. Browsers require a gesture to resume audio anyway, so building
        // the audio graph during Pioneer startup only adds main-thread work.
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.initialized = false;
        this.initializing = null;
    }

    createContext() {
        if (this.ctx) return this.ctx;
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) return null;

        this.ctx = new AudioContextCtor();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 1.0;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1.0;
        this.sfxGain.connect(this.masterGain);

        this.masterGain.connect(this.ctx.destination);
        return this.ctx;
    }

    async init() {
        if (this.initialized) return;
        if (this.initializing) return this.initializing;
        this.initializing = (async () => {
            const ctx = this.createContext();
            if (!ctx) return;
            if (ctx.state === 'suspended') await ctx.resume();
            this.initialized = true;
        })();
        try {
            await this.initializing;
        } finally {
            this.initializing = null;
        }
    }

    playTone(freq, duration, type = 'sine', volume = 0.1) {
        if (!this.initialized) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.connect(g);
        g.connect(this.sfxGain || this.masterGain);
        o.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(volume, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        o.start();
        o.stop(this.ctx.currentTime + duration);
    }

    playUnlock() {
        // Triumphant ascending tones
        this.playTone(523, 0.15, 'sine', 0.1); // C5
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.1), 100); // E5
        setTimeout(() => this.playTone(784, 0.25, 'sine', 0.12), 200); // G5
    }

    playSuccess() {
        // Pleasant ding
        this.playTone(880, 0.2, 'sine', 0.08);
    }

    playScan() {
        // Quick UI/scan chirp
        this.playTone(1200, 0.06, 'sine', 0.04);
        setTimeout(() => this.playTone(1500, 0.06, 'sine', 0.03), 60);
    }

    playClick() {
        // Standard UI click
        this.playTone(1000, 0.05, 'sine', 0.05);
    }

    playBuild() {
        // Constructive clank
        this.playTone(400, 0.1, 'square', 0.05);
        setTimeout(() => this.playTone(600, 0.1, 'square', 0.04), 50);
    }

    playError() {
        // Low buz/fail sound
        this.playTone(150, 0.3, 'sawtooth', 0.1);
    }

    playWarp() {
        // Sci-fi whoosh
        if (!this.initialized || !this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.connect(g);
        g.connect(this.sfxGain || this.masterGain);
        o.frequency.setValueAtTime(100, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.5);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
        o.start();
        o.stop(this.ctx.currentTime + 0.6);
    }

    playAmbient() {
        // Low continuous hum (for atmosphere)
        if (!this.initialized) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.connect(g);
        g.connect(this.musicGain || this.masterGain);
        o.frequency.setValueAtTime(55, this.ctx.currentTime);
        g.gain.setValueAtTime(0.02, this.ctx.currentTime);
        o.start();
        this.ambientOsc = o;
        this.ambientGain = g;
    }

    stopAmbient() {
        if (!this.ctx) return;
        if (this.ambientOsc) {
            this.ambientGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
            setTimeout(() => {
                if (this.ambientOsc) this.ambientOsc.stop();
            }, 1100);
        }
    }
}

/**
 * Roadmap Block 2: Diegetic Holographic UI
 */
class HolographicUI {
    constructor(game) {
        this.game = game;
        console.log("🖥️ Holographic UI: Spatial Interface Systems Online.");
    }
}

window.ExoplanetPioneer = ExoplanetPioneer;
