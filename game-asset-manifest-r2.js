/**
 * Game Asset Manifest - R2 Version
 * Centralized registry for all production-ready game assets served from R2.
 * Links logic to visual/auditory assets.
 * 
 * Assets are served from: https://exoplanet-assets.adybag14.workers.dev/
 */

const R2_BASE_URL = 'https://exoplanet-assets.adybag14.workers.dev';

const GAME_ASSET_MANIFEST_R2 = {
    // Category 1: 3D Models & PBR Materials (100 Items)
    models: {
        habitats: {
            livingQuarter: { id: 'hab_living_quarter', name: 'Modular Habitat: Living Quarter', path: `${R2_BASE_URL}/models/habitats/living_quarter.gltf`, metadata: { capacity: 4 } },
            bioDome: { id: 'hab_bio_dome', name: 'Modular Habitat: Bio-Dome', path: `${R2_BASE_URL}/models/habitats/bio_dome.gltf`, metadata: { capacity: 2 } },
            commandCenter: { id: 'hab_command_center', name: 'Modular Habitat: Command Center', path: `${R2_BASE_URL}/models/habitats/command_center.glb`, metadata: { capacity: 6 } },
            outpostTower: { id: 'hab_outpost_tower', name: 'Frontier Outpost Tower', path: `${R2_BASE_URL}/models/habitats/outpost_tower.glb`, metadata: { sensorRange: 200 } },
            outpostTowerVariant: { id: 'hab_outpost_tower_v2', name: 'Outpost Tower Variant', path: `${R2_BASE_URL}/models/habitats/outpost_tower_variant.gltf` },
            airlock: { id: 'hab_airlock', name: 'Pressurized Airlock Module', path: `${R2_BASE_URL}/models/habitats/airlock.glb` }
        },
        props: {
            cryoPod: { id: 'prop_cryo_pod', name: 'Interior Prop: Cryo-Pod', path: `${R2_BASE_URL}/models/props/cryo_pod.glb`, metadata: { interactable: true } },
            holographicConsole: { id: 'prop_holo_console', name: 'Interior Prop: Holographic Console', path: `${R2_BASE_URL}/models/props/holo_console.glb`, metadata: { interactable: true } },
            scientificSensor: { id: 'prop_scientific_sensor', name: 'Scientific Sensor', path: `${R2_BASE_URL}/models/props/scientific_sensor.gltf`, metadata: { deployable: true } },
            emergencyBeacon: { id: 'prop_emergency_beacon', name: 'Emergency Beacon', path: `${R2_BASE_URL}/models/props/emergency_beacon.glb`, metadata: { animated: true } },
            dataPad: { id: 'prop_data_pad', name: 'Interactive Data Pad', path: `${R2_BASE_URL}/models/props/datapad.glb`, metadata: { interactable: true } },
            bridgeTable: { id: 'prop_bridge_table', name: '3D Holo-Bridge Table', path: `${R2_BASE_URL}/models/props/bridge_table.glb`, metadata: { animated: true } },
            captainsLog: { id: 'prop_captains_log', name: "Captain's Log Tablet", path: `${R2_BASE_URL}/models/props/captains_log.glb` },
            lifeSupportTank: { id: 'prop_life_support_tank', name: 'Life Support Tank', path: `${R2_BASE_URL}/models/props/life_support_tank.glb`, metadata: { animated: true } },
            cockpitInstruments: { id: 'prop_cockpit_inst', name: 'Cockpit Instrument Pack', path: `${R2_BASE_URL}/models/props/instruments.gltf` },
            exteriorLights: { id: 'prop_ext_lights', name: 'Exterior Light Kit', path: `${R2_BASE_URL}/models/props/ext_lights.glb` }
        },
        industrial: {
            oreCrusher: { id: 'ind_ore_crusher', name: 'Ore Crusher', path: `${R2_BASE_URL}/models/industrial/ore_crusher.glb`, metadata: { animated: true } },
            atmProcessor: { id: 'ind_atm_processor', name: 'Atmospheric Processor', path: `${R2_BASE_URL}/models/industrial/atm_processor.glb`, metadata: { animated: true } },
            energyConduits: { id: 'ind_energy_conduits', name: 'Energy Conduits', path: `${R2_BASE_URL}/models/infra/energy_conduits.glb`, metadata: { emissive: true } },
            repairDrone: { id: 'ind_repair_drone', name: 'Maintenance & Repair Drone', path: `${R2_BASE_URL}/models/industrial/repair_drone.glb` },
            assemblyLine: { id: 'ind_assembly_line', name: 'Modular Assembly Line', path: `${R2_BASE_URL}/models/industrial/assembly_line.glb` },
            assemblyLineVariant: { id: 'ind_assembly_line_v2', name: 'Assembly Line Variant', path: `${R2_BASE_URL}/models/industrial/assembly_line_variant.gltf` },
            chemicalVat: { id: 'ind_chemical_vat', name: 'Chemical Storage Vat', path: `${R2_BASE_URL}/models/industrial/chemical_vat.glb` },
            smelter: { id: 'ind_smelter', name: 'Arc Smelter', path: `${R2_BASE_URL}/models/industrial/smelter.glb` },
            press: { id: 'ind_press', name: 'Hydraulic Press', path: `${R2_BASE_URL}/models/industrial/press.glb` }
        },
        ships: {
            viper: { id: 'ship_viper', name: 'Viper Class Light Interceptor', path: `${R2_BASE_URL}/models/ships/viper.glb`, metadata: { speed: 85 } },
            behemoth: { id: 'ship_behemoth', name: 'Behemoth Class Heavy Freighter', path: `${R2_BASE_URL}/models/ships/behemoth.glb`, metadata: { cargo: 5000 } },
            escapePod: { id: 'ship_escape_pod', name: 'Escape Pod', path: `${R2_BASE_URL}/models/logistics/escape_pod.glb` },
            landingGear: { id: 'ship_gear', name: 'Modular Landing Gear Set', path: `${R2_BASE_URL}/models/ships/parts/landing_gear.glb` },
            thrusterGimbal: { id: 'ship_thruster', name: 'High-Output Thruster Gimbal', path: `${R2_BASE_URL}/models/ships/parts/thruster.glb` }
        },
        characters: {
            pioneerSuit: { id: 'char_pioneer_suit', name: 'Pioneer Suit Mk I', path: `${R2_BASE_URL}/models/characters/pioneer_suit.glb` },
            xenoBiologist: { id: 'char_xeno_biologist', name: 'Xeno-Biologist Suit', path: `${R2_BASE_URL}/models/characters/xeno_biologist.glb` },
            playerAvatar: { id: 'char_player_avatar', name: 'Player Avatar', path: `${R2_BASE_URL}/models/characters/player_avatar.glb` }
        },
        comms: {
            buoy: { id: 'comm_buoy', name: 'Communication Buoy', path: `${R2_BASE_URL}/models/comms/buoy.glb` },
            dishLarge: { id: 'comm_dish_large', name: 'Large Communications Dish', path: `${R2_BASE_URL}/models/comms/dish_large.glb` }
        },
        defense: {
            autoTurret: { id: 'def_auto_turret', name: 'Automated Turret', path: `${R2_BASE_URL}/models/defense/auto_turret.glb` },
            missileBattery: { id: 'def_missile_battery', name: 'Missile Battery', path: `${R2_BASE_URL}/models/defense/missile_battery.glb` },
            pointLaser: { id: 'def_point_laser', name: 'Point Defense Laser', path: `${R2_BASE_URL}/models/defense/point_laser.glb` }
        },
        engines: {
            antimatter: { id: 'eng_antimatter', name: 'Antimatter Drive', path: `${R2_BASE_URL}/models/engines/antimatter.glb` },
            ion: { id: 'eng_ion', name: 'Ion Thruster', path: `${R2_BASE_URL}/models/engines/ion.glb` }
        },
        env: {
            asteroids: {
                asteroidBase: { id: 'env_asteroid_base', name: 'Asteroid Base', path: `${R2_BASE_URL}/models/env/asteroids/asteroid_base.glb` }
            }
        },
        equipment: {
            gravBoots: { id: 'equip_grav_boots', name: 'Gravity Boots', path: `${R2_BASE_URL}/models/equipment/grav_boots.glb` }
        },
        fauna: {
            duck: { id: 'fauna_duck', name: 'Space Duck', path: `${R2_BASE_URL}/models/fauna/duck.glb` },
            duckTest: { id: 'fauna_duck_test', name: 'Space Duck Test', path: `${R2_BASE_URL}/models/fauna/duck_test.glb` },
            fox: { id: 'fauna_fox', name: 'Space Fox', path: `${R2_BASE_URL}/models/fauna/fox.glb` },
            hexStalker: { id: 'fauna_hex_stalker', name: 'Hex Stalker', path: `${R2_BASE_URL}/models/fauna/hex_stalker.glb` },
            skyWhale: { id: 'fauna_sky_whale', name: 'Sky Whale', path: `${R2_BASE_URL}/models/fauna/sky_whale.glb` }
        },
        flora: {
            crystallineFern: { id: 'flora_crystalline_fern', name: 'Crystalline Fern', path: `${R2_BASE_URL}/models/flora/crystalline_fern.glb` },
            glowCap: { id: 'flora_glow_cap', name: 'Glow Cap', path: `${R2_BASE_URL}/models/flora/glow_cap.glb` }
        },
        furniture: {
            pilotSeat: { id: 'furn_pilot_seat', name: 'Pilot Seat', path: `${R2_BASE_URL}/models/furniture/pilot_seat.glb` },
            workbench: { id: 'furn_workbench', name: 'Workbench', path: `${R2_BASE_URL}/models/furniture/workbench.glb` }
        },
        infra: {
            powerPylon: { id: 'infra_power_pylon', name: 'Power Pylon', path: `${R2_BASE_URL}/models/infra/power_pylon.glb` },
            shieldPylon: { id: 'infra_shield_pylon', name: 'Shield Pylon', path: `${R2_BASE_URL}/models/infra/shield_pylon.glb` }
        },
        logistics: {
            cargo: { id: 'log_cargo', name: 'Cargo Container', path: `${R2_BASE_URL}/models/logistics/cargo.glb` },
            escapePod: { id: 'log_escape_pod', name: 'Escape Pod', path: `${R2_BASE_URL}/models/logistics/escape_pod.glb` }
        },
        mega: {
            dysonRingSegment: { id: 'mega_dyson_ring', name: 'Dyson Ring Segment', path: `${R2_BASE_URL}/models/mega/dyson_ring_segment.glb` },
            spaceElevatorBase: { id: 'mega_space_elevator', name: 'Space Elevator Base', path: `${R2_BASE_URL}/models/mega/space_elevator_base.glb` }
        },
        resources: {
            iceCore: { id: 'res_ice_core', name: 'Ice Core', path: `${R2_BASE_URL}/models/resources/ice_core.glb` },
            rareEarth: { id: 'res_rare_earth', name: 'Rare Earth', path: `${R2_BASE_URL}/models/resources/rare_earth.glb` }
        },
        ruins: {
            alienTemple: { id: 'ruins_alien_temple', name: 'Alien Temple', path: `${R2_BASE_URL}/models/ruins/alien_temple.glb` },
            fossil: { id: 'ruins_fossil', name: 'Ancient Fossil', path: `${R2_BASE_URL}/models/ruins/fossil.glb` }
        },
        science: {
            labBench: { id: 'sci_lab_bench', name: 'Laboratory Bench', path: `${R2_BASE_URL}/models/science/lab_bench.glb` },
            radarArray: { id: 'sci_radar_array', name: 'Radar Array', path: `${R2_BASE_URL}/models/science/radar_array.glb` }
        }
    },
    // Category 2: 2D Textures & Sprites
    textures: {
        // Textures would follow same pattern
        // Example: terrain: { grass: { path: `${R2_BASE_URL}/textures/terrain/grass.jpg` } }
    },
    // Category 3: Audio Files
    audio: {
        // Audio files would follow same pattern
        // Example: sfx: { engine: { path: `${R2_BASE_URL}/audio/sfx/engine.wav` } }
    }
};

// Export for use in the game
if (typeof window !== 'undefined') {
    window.GAME_ASSET_MANIFEST = GAME_ASSET_MANIFEST_R2;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_ASSET_MANIFEST_R2;
}

export default GAME_ASSET_MANIFEST_R2;
