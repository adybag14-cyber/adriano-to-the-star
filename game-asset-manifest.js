/**
 * Game Asset Manifest
 * Centralized registry for all production-ready game assets.
 * Links logic to visual/auditory assets.
 * 
 * Assets are served from R2 CDN: https://exoplanet-assets.adybag14.workers.dev/
 */

const R2_BASE_URL = 'https://exoplanet-assets.adybag14.workers.dev';

const GAME_ASSET_MANIFEST = {
    // Category 1: 3D Models & PBR Materials (100 Items)
    models: {
        habitats: {
            livingQuarter: { id: 'hab_living_quarter', name: 'Modular Habitat: Living Quarter', path: `${R2_BASE_URL}/models/habitats/living_quarter.gltf', metadata: { capacity: 4 } },
            bioDome: { id: 'hab_bio_dome', name: 'Modular Habitat: Bio-Dome', path: `${R2_BASE_URL}/models/habitats/bio_dome.gltf', metadata: { capacity: 2 } },
            commandCenter: { id: 'hab_command_center', name: 'Modular Habitat: Command Center', path: `${R2_BASE_URL}/models/habitats/command_center.glb', metadata: { capacity: 6 } },
            outpostTower: { id: 'hab_outpost_tower', name: 'Frontier Outpost Tower', path: `${R2_BASE_URL}/models/habitats/outpost_tower.glb', metadata: { sensorRange: 200 } },
            outpostTowerVariant: { id: 'hab_outpost_tower_v2', name: 'Outpost Tower Variant', path: `${R2_BASE_URL}/models/habitats/outpost_tower_variant.gltf' },
            airlock: { id: 'hab_airlock', name: 'Pressurized Airlock Module', path: `${R2_BASE_URL}/models/habitats/airlock.glb' }
        },
        props: {
            cryoPod: { id: 'prop_cryo_pod', name: 'Interior Prop: Cryo-Pod', path: `${R2_BASE_URL}/models/props/cryo_pod.glb', metadata: { interactable: true } },
            holographicConsole: { id: 'prop_holo_console', name: 'Interior Prop: Holographic Console', path: `${R2_BASE_URL}/models/props/holo_console.glb', metadata: { interactable: true } },
            scientificSensor: { id: 'prop_scientific_sensor', name: 'Scientific Sensor', path: `${R2_BASE_URL}/models/props/scientific_sensor.gltf', metadata: { deployable: true } },
            emergencyBeacon: { id: 'prop_emergency_beacon', name: 'Emergency Beacon', path: `${R2_BASE_URL}/models/props/emergency_beacon.glb', metadata: { animated: true } },
            dataPad: { id: 'prop_data_pad', name: 'Interactive Data Pad', path: `${R2_BASE_URL}/models/props/datapad.glb', metadata: { interactable: true } },
            bridgeTable: { id: 'prop_bridge_table', name: '3D Holo-Bridge Table', path: `${R2_BASE_URL}/models/props/bridge_table.glb', metadata: { animated: true } },
            captainsLog: { id: 'prop_captains_log', name: "Captain's Log Tablet", path: `${R2_BASE_URL}/models/props/captains_log.glb' },
            lifeSupportTank: { id: 'prop_life_support_tank', name: 'Life Support Tank', path: `${R2_BASE_URL}/models/props/life_support_tank.glb', metadata: { animated: true } },
            cockpitInstruments: { id: 'prop_cockpit_inst', name: 'Cockpit Instrument Pack', path: `${R2_BASE_URL}/models/props/instruments.gltf' },
            exteriorLights: { id: 'prop_ext_lights', name: 'Exterior Light Kit', path: `${R2_BASE_URL}/models/props/ext_lights.glb' }
        },
        industrial: {
            oreCrusher: { id: 'ind_ore_crusher', name: 'Ore Crusher', path: `${R2_BASE_URL}/models/industrial/ore_crusher.glb', metadata: { animated: true } },
            atmProcessor: { id: 'ind_atm_processor', name: 'Atmospheric Processor', path: `${R2_BASE_URL}/models/industrial/atm_processor.glb', metadata: { animated: true } },
            energyConduits: { id: 'ind_energy_conduits', name: 'Energy Conduits', path: `${R2_BASE_URL}/models/infra/energy_conduits.glb', metadata: { emissive: true } },
            repairDrone: { id: 'ind_repair_drone', name: 'Maintenance & Repair Drone', path: `${R2_BASE_URL}/models/industrial/repair_drone.glb' },
            assemblyLine: { id: 'ind_assembly_line', name: 'Modular Assembly Line', path: `${R2_BASE_URL}/models/industrial/assembly_line.glb' },
            assemblyLineVariant: { id: 'ind_assembly_line_v2', name: 'Assembly Line Variant', path: `${R2_BASE_URL}/models/industrial/assembly_line_variant.gltf' },
            chemicalVat: { id: 'ind_chemical_vat', name: 'Chemical Storage Vat', path: `${R2_BASE_URL}/models/industrial/chemical_vat.glb' },
            smelter: { id: 'ind_smelter', name: 'Arc Smelter', path: `${R2_BASE_URL}/models/industrial/smelter.glb' },
            press: { id: 'ind_press', name: 'Hydraulic Press', path: `${R2_BASE_URL}/models/industrial/press.glb' }
        },
        ships: {
            viper: { id: 'ship_viper', name: 'Viper Class Light Interceptor', path: `${R2_BASE_URL}/models/ships/viper.glb', metadata: { speed: 85 } },
            behemoth: { id: 'ship_behemoth', name: 'Behemoth Class Heavy Freighter', path: `${R2_BASE_URL}/models/ships/behemoth.glb', metadata: { cargo: 5000 } },
            escapePod: { id: 'ship_escape_pod', name: 'Escape Pod', path: `${R2_BASE_URL}/models/logistics/escape_pod.glb' },
            landingGear: { id: 'ship_gear', name: 'Modular Landing Gear Set', path: `${R2_BASE_URL}/models/ships/parts/landing_gear.glb' },
            thrusterGimbal: { id: 'ship_thruster', name: 'High-Output Thruster Gimbal', path: `${R2_BASE_URL}/models/ships/parts/thruster.glb' }
        },
        characters: {
            pioneerSuit: { id: 'char_pioneer_suit', name: 'Pioneer Suit Mk I', path: `${R2_BASE_URL}/models/characters/pioneer_suit.glb' },
            xenoBiologist: { id: 'char_xeno_biologist', name: 'Xeno-Biologist Suit', path: `${R2_BASE_URL}/models/characters/xeno_biologist.glb' },
            playerAvatar: { id: 'char_player_avatar', name: 'Final Player Avatar', path: `${R2_BASE_URL}/models/characters/player_avatar.glb', metadata: { customizable: true } }
        },
        flora: {
            glowCap: { id: 'flora_glow_cap', name: 'Glow-Cap Mushroom', path: `${R2_BASE_URL}/models/flora/glow_cap.glb' },
            crystallineFern: { id: 'flora_crystalline_fern', name: 'Crystalline Fern', path: `${R2_BASE_URL}/models/flora/crystalline_fern.glb' }
        },
        fauna: {
            hexStalker: { id: 'fauna_hex_stalker', name: 'Hex-Legged Stalker', path: `${R2_BASE_URL}/models/fauna/hex_stalker.glb' },
            skyWhale: { id: 'fauna_sky_whale', name: 'Sky-Whale', path: `${R2_BASE_URL}/models/fauna/sky_whale.glb' },
            duck: { id: 'fauna_duck', name: 'Experimental Duck', path: `${R2_BASE_URL}/models/fauna/duck.glb' },
            duckTest: { id: 'fauna_duck_test', name: 'Experimental Duck (Test)', path: `${R2_BASE_URL}/models/fauna/duck_test.glb' },
            fox: { id: 'fauna_fox', name: 'Arctic Fox', path: `${R2_BASE_URL}/models/fauna/fox.glb' }
        },
        resources: {
            rareEarth: { id: 'res_rare_earth', name: 'Rare Earth Mineral', path: `${R2_BASE_URL}/models/resources/rare_earth.glb' },
            iceCore: { id: 'res_ice_core', name: 'Ice Core', path: `${R2_BASE_URL}/models/resources/ice_core.glb' }
        },
        megastructures: {
            dysonRing: { id: 'mega_dyson_ring', name: 'Dyson Ring Segment A', path: `${R2_BASE_URL}/models/mega/dyson_ring_segment.glb' },
            spaceElevator: { id: 'mega_space_elevator', name: 'Space Elevator Base Anchor', path: `${R2_BASE_URL}/models/mega/space_elevator_base.glb' },
            stargate: { id: 'mega_stargate', name: 'Interstellar Star-Gate', path: `${R2_BASE_URL}/models/mega/stargate.gltf' }
        },
        vehicles: {
            lunarRover: { id: 'veh_lunar_rover', name: 'Lunar Rover Chassis', path: `${R2_BASE_URL}/models/vehicles/lunar_rover.glb' }
        },
        furniture: {
            pilotSeat: { id: 'furn_pilot_seat', name: 'Ergonomic Pilot Seat', path: `${R2_BASE_URL}/models/furniture/pilot_seat.glb' },
            modularWorkbench: { id: 'furn_workbench', name: 'Modular Workbench', path: `${R2_BASE_URL}/models/furniture/workbench.glb' }
        },
        defense: {
            autoTurret: { id: 'def_auto_turret', name: 'Automatic Defense Turret', path: `${R2_BASE_URL}/models/defense/auto_turret.glb' },
            missileBattery: { id: 'def_missile_battery', name: 'SAM Missile Battery', path: `${R2_BASE_URL}/models/defense/missile_battery.glb' },
            pointLaser: { id: 'def_point_laser', name: 'Point-Defense Laser', path: `${R2_BASE_URL}/models/defense/point_laser.glb' }
        },
        science: {
            radarArray: { id: 'sci_radar_array', name: 'Surface Radar Array', path: `${R2_BASE_URL}/models/science/radar_array.glb' },
            hydroponicsTray: { id: 'sci_hydro_tray', name: 'Hydroponics Tray', path: `${R2_BASE_URL}/models/science/hydro_tray.glb' },
            fusionReactor: { id: 'sci_fusion_reactor', name: 'Fusion Reactor Core', path: `${R2_BASE_URL}/models/power/fusion_reactor.gltf' },
            weatherStation: { id: 'sci_weather_station', name: 'Weather Station', path: `${R2_BASE_URL}/models/science/weather_station.glb' },
            seismicSensor: { id: 'sci_seismic_sensor', name: 'Seismic Sensor', path: `${R2_BASE_URL}/models/science/seismic_sensor.glb' },
            seismicSensorVariant: { id: 'sci_seismic_sensor_v2', name: 'Seismic Sensor (Variant)', path: `${R2_BASE_URL}/models/science/seismic_sensor.gltf' },
            telescopeArray: { id: 'sci_telescope', name: 'Radio Telescope Array', path: `${R2_BASE_URL}/models/science/telescope.glb' },
            telescopeVariant: { id: 'sci_telescope_v2', name: 'Optical Telescope (Variant)', path: `${R2_BASE_URL}/models/science/telescope_variant.gltf' },
            particleAccel: { id: 'sci_particle_accel', name: 'Particle Accelerator Ring', path: `${R2_BASE_URL}/models/science/particle_accel.gltf' },
            labBench: { id: 'sci_lab_bench', name: 'Automated Lab Bench', path: `${R2_BASE_URL}/models/science/lab_bench.glb' }
        },
        ruins: {
            ancientRelic: { id: 'ruin_relic', name: 'Ancient Relic', path: `${R2_BASE_URL}/models/ruins/relic.glb' },
            fossilizedRemains: { id: 'ruin_fossil', name: 'Fossilized Remains', path: `${R2_BASE_URL}/models/ruins/fossil.glb' },
            alienTemple: { id: 'ruin_alien_temple', name: 'Alien Temple Monolith', path: `${R2_BASE_URL}/models/ruins/alien_temple.glb' },
            undergroundHive: { id: 'ruin_hive', name: 'Underground Hive Organic Walls', path: `${R2_BASE_URL}/models/ruins/hive_walls.glb' }
        },
        environment: {
            asteroidBase: { id: 'env_asteroid_base', name: 'Asteroid Research Base', path: `${R2_BASE_URL}/models/env/asteroids/asteroid_base.glb' }
        },
        communications: {
            commDish: { id: 'com_dish_large', name: 'Large Communication Dish', path: `${R2_BASE_URL}/models/comms/dish_large.glb' },
            interstellarBuoy: { id: 'com_buoy', name: 'Interstellar Relay Buoy', path: `${R2_BASE_URL}/models/comms/buoy.glb' }
        },
        logistics: {
            dockingRing: { id: 'log_docking_ring', name: 'Standard Galactic Interface', path: `${R2_BASE_URL}/models/logistics/docking_ring.gltf' },
            cargoContainer: { id: 'log_cargo_container', name: 'Modular Cargo Container', path: `${R2_BASE_URL}/models/logistics/cargo.glb' }
        },
        engines: {
            ionEngine: { id: 'eng_ion', name: 'Ion Engine', path: `${R2_BASE_URL}/models/engines/ion.glb' },
            antimatterEngine: { id: 'eng_antimatter', name: 'Antimatter Engine', path: `${R2_BASE_URL}/models/engines/antimatter.glb' }
        },
        miscellaneous: {
            colonyFlag: { id: 'misc_flag', name: 'Colony Physics Flag', path: `${R2_BASE_URL}/models/misc/flag.gltf' },
            frontierTent: { id: 'misc_tent', name: 'Frontier Survival Tent', path: `${R2_BASE_URL}/models/misc/tent.gltf' }
        },
        infrastructure: {
            powerPylon: { id: 'infra_power_pylon', name: 'Power Distribution Pylon', path: `${R2_BASE_URL}/models/infra/power_pylon.glb' },
            shieldPylon: { id: 'infra_shield_pylon', name: 'Shield Pylon', path: `${R2_BASE_URL}/models/infra/shield_pylon.glb' }
        },
        equipment: {
            gravBoots: { id: 'eq_grav_boots', name: 'Magnetic Gravity Boots', path: `${R2_BASE_URL}/models/equipment/grav_boots.glb' },
            jetpack: { id: 'eq_jetpack', name: 'Explorer Jetpack', path: `${R2_BASE_URL}/models/equipment/jetpack.gltf' },
            scanner: { id: 'eq_scanner', name: 'Handheld Scanner', path: `${R2_BASE_URL}/models/equipment/scanner.gltf' }
        }
    },
    materials: {
        regolith: { id: 'mat_regolith', name: 'Weathered Lunar Regolith', resolution: '4K', textures: { albedo: 'assets/materials/regolith/albedo.png', normal: 'assets/materials/regolith/normal.png' } },
        titanium: { id: 'mat_titanium', name: 'Brushed Aerospace Titanium', resolution: '4K', textures: { albedo: 'assets/materials/titanium/albedo.png', metalness: 'assets/materials/titanium/metalness.png' } },
        carbonFiber: { id: 'mat_carbon_fiber', name: 'Reinforced Carbon Fiber', resolution: '4K', textures: { albedo: 'assets/materials/carbon_fiber/albedo.png', roughness: 'assets/materials/carbon_fiber/roughness.png' } },
        radiantEnergy: { id: 'mat_energy_core', name: 'Radiant Energy Core', resolution: '4K', textures: { emissive: 'assets/materials/core/emissive.png' } },
        damagedHull: { id: 'mat_damaged_hull', name: 'Damaged Hull Plating', resolution: '4K', textures: { albedo: 'assets/materials/hull/damaged.png', normal: 'assets/materials/hull/damaged_n.png' } },
        volcanicBasalt: { id: 'mat_volcanic', name: 'Volcanic Basalt', resolution: '4K', textures: { albedo: 'assets/materials/volcanic/albedo.png' } },
        glacialIce: { id: 'mat_glacial', name: 'Glacial Ice', resolution: '4K', textures: { albedo: 'assets/materials/ice/albedo.png', transmission: 'assets/materials/ice/trans.png' } },
        obsidianGlass: { id: 'mat_obsidian', name: 'Obsidian Glass', resolution: '4K', textures: { albedo: 'assets/materials/obsidian/albedo.png' } },
        oxidizedCopper: { id: 'mat_copper', name: 'Oxidized Copper', resolution: '4K', textures: { albedo: 'assets/materials/copper/albedo.png' } },
        bioSlime: { id: 'mat_bio_slime', name: 'Bio-Luminescent Slime', resolution: '4K', textures: { albedo: 'assets/materials/bio/albedo.png', emissive: 'assets/materials/bio/emissive.png' } },
        wornFabric: { id: 'mat_worn_fabric', name: 'Worn Fabric', resolution: '4K', textures: { albedo: 'assets/materials/fabric/albedo.png' } },
        reinforcedGlass: { id: 'mat_reinforced_glass', name: 'Reinforced Glass', resolution: '4K', textures: { transmission: 'assets/materials/glass/trans.png' } },
        moltenCore: { id: 'mat_molten_core', name: 'Molten Core', resolution: '4K', textures: { emissive: 'assets/materials/core/molten.png' } },
        circuitryPattern: { id: 'mat_circuitry', name: 'Advanced Circuitry Mesh', resolution: '4K', textures: { albedo: 'assets/materials/tech/circuits.png' } },
        paddingInsulation: { id: 'mat_insulation', name: 'Habitat Padding', resolution: '4K', textures: { albedo: 'assets/materials/hab/padding.png' } },
        liquidWater: { id: 'mat_water', name: 'Liquid Water Shader Material', metadata: { shader: 'water' } },
        lavaFlow: { id: 'mat_lava', name: 'Lava Flow Shader Material', metadata: { shader: 'lava' } },
        chromeFinish: { id: 'mat_chrome', name: 'Polished Chrome Finish', resolution: '4K' },
        goldLeaf: { id: 'mat_gold_leaf', name: 'Reflective Gold Leaf', resolution: '4K' },
        rustedIron: { id: 'mat_rusted_iron', name: 'Corroded Rusted Iron', resolution: '4K' },
        alienBiomass: { id: 'mat_alien_bio', name: 'Pulsing Alien Biomass', resolution: '4K' },
        crystalLattice: { id: 'mat_crystal_lat', name: 'Resonant Crystal Lattice', resolution: '4K' },
        frozenMethane: { id: 'mat_frozen_methane', name: 'Frozen Methane Slush', resolution: '4K' },
        leadShield: { id: 'mat_lead_shield', name: 'Radiation Lead Shielding', resolution: '4K' },
        naniteMesh: { id: 'mat_nanite_mesh', name: 'Self-Repairing Nanite Mesh', resolution: '4K' }
    },
    environment: {
        skyboxNebula: { id: 'env_skybox_nebula', name: 'Nebula Skybox Pack', resolution: '8K', path: 'assets/textures/skybox/nebula/' },
        skyboxDeepSpace: { id: 'env_skybox_deep_space', name: 'Deep Space Skybox Pack', resolution: '8K', path: 'assets/textures/skybox/deep/' },
        planetRing: { id: 'env_planet_ring', name: 'Planet Ring Kit', path: `${R2_BASE_URL}/models/env/planet_ring.glb' },
        asteroidField: { id: 'env_asteroid_field', name: 'Asteroid Field Pack', path: `${R2_BASE_URL}/models/env/asteroids/' }
    },
    audio: {
        foley: {
            bootsMetal: { id: 'aud_boots_metal', name: 'Foley: Boots on Metal', spatial: true, path: 'assets/audio/foley/metal.wav' },
            bootsSand: { id: 'aud_boots_sand', name: 'Foley: Boots on Sand', spatial: true, path: 'assets/audio/foley/sand.wav' },
            bootsIce: { id: 'aud_boots_ice', name: 'Foley: Boots on Ice', spatial: true, path: 'assets/audio/foley/ice.wav' }
        },
        ambience: {
            emptySpace: { id: 'aud_amb_space', name: 'Ambience: Empty Space', loop: true, path: 'assets/audio/amb/space.mp3' },
            hangar: { id: 'aud_amb_hangar', name: 'Ambience: High-Tech Hangar', loop: true, path: 'assets/audio/amb/hangar.mp3' },
            forest: { id: 'aud_amb_forest', name: 'Ambience: Alien Forest', loop: true, path: 'assets/audio/amb/forest.mp3' }
        },
        sfx: {
            laserRifle: { id: 'aud_sfx_laser', name: 'SFX: Laser Rifle', path: 'assets/audio/sfx/laser.wav' },
            railgun: { id: 'aud_sfx_railgun', name: 'SFX: Railgun', path: 'assets/audio/sfx/railgun.wav' },
            shieldImpact: { id: 'aud_sfx_shield', name: 'SFX: Shield Impact', path: 'assets/audio/sfx/shield.wav' }
        },
        music: {
            mainTheme: { id: 'aud_mus_main', name: 'Music: Main Theme', loop: true, path: 'assets/audio/music/main.mp3' },
            combatHigh: { id: 'aud_mus_combat', name: 'Music: Combat High-Intensity', loop: true, path: 'assets/audio/music/combat.mp3' },
            explorationZen: { id: 'aud_mus_zen', name: 'Music: Exploration Zen', loop: true, path: 'assets/audio/music/zen.mp3' }
        }
    },
    vfx: {
        ionTrail: { id: 'vfx_ion_trail', name: 'Ion Engine Trail', type: 'particle' },
        rocketExhaust: { id: 'vfx_rocket_exhaust', name: 'Chemical Rocket Exhaust', type: 'particle' },
        warpTunnel: { id: 'vfx_warp_tunnel', name: 'Warp Tunnel Effect', type: 'particle' },
        meteorEntry: { id: 'vfx_meteor_entry', name: 'Meteor Entry Fireball', type: 'particle' },
        shieldImpact: { id: 'vfx_shield_impact', name: 'Shield Impact Hex-Ripple', type: 'shader' },
        shipExplosion: { id: 'vfx_ship_explosion', name: 'Large Ship Explosion', type: 'complex' },
        blackHole: { id: 'vfx_black_hole', name: 'Black Hole Lensing', type: 'shader' },
        supernova: { id: 'vfx_supernova', name: 'Supernova Flash', type: 'complex' },
        dayNightCycle: { id: 'vfx_day_night', name: 'Day/Night Cycle Lighting', type: 'lighting' },
        motionBlur: { id: 'vfx_motion_blur', name: 'Motion Blur Post-FX', type: 'postfx' },
        bloom: { id: 'vfx_bloom', name: 'Bloom Post-FX', type: 'postfx' },
        chromaticAberration: { id: 'vfx_chromatic', name: 'Chromatic Aberration Post-FX', type: 'postfx' },
        filmGrain: { id: 'vfx_film_grain', name: 'Film Grain Post-FX', type: 'postfx' },
        vignette: { id: 'vfx_vignette', name: 'Vignette Post-FX', type: 'postfx' }
    }
};

if (typeof window !== 'undefined') {
    window.GAME_ASSET_MANIFEST = GAME_ASSET_MANIFEST;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_ASSET_MANIFEST;
}
