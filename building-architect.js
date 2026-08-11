class BuildingArchitect {
    constructor(scene) {
        this.scene = scene;
        this.textureCache = {};
        this.geometries = {}; // Cache geometries if possible, though strict cloning is needed for interaction
        this.baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.6,
            flatShading: false
        });
    }

    createBuilding(type, position, normal) {
        let meshGroup = new THREE.Group();

        switch (type) {
            case 'solar':
                meshGroup = this.createSolarArray();
                break;
            case 'hab':
                meshGroup = this.createHabitat();
                break;
            case 'mine':
                meshGroup = this.createAutoMiner();
                break;
            case 'fusion':
                meshGroup = this.createFusionReactor();
                break;
            case 'storage': // Alias for store
            case 'silo':    // Alias for store
            case 'store':
                meshGroup = this.createSilo();
                break;
            case 'farm':
                meshGroup = this.createHydroponics();
                break;
            case 'lab':
                meshGroup = this.createResearchLab();
                break;
            case 'oxy':
                meshGroup = this.createOxygenGenerator();
                break;
            case 'refinery':
                meshGroup = this.createRefinery();
                break;
            case 'chip_fab':
                meshGroup = this.createChipFab();
                break;
            case 'drone_hub':
                meshGroup = this.createDroneHub();
                break;
            case 'launch_site':
                meshGroup = this.createLaunchSite();
                break;
            case 'moon_mine':
            case 'helium_mine':
                meshGroup = this.createHeliumMine();
                break;
            case 'moon_hab':
            case 'lunar_hab':
                meshGroup = this.createLunarHabitat();
                break;
            case 'low_g_factory':
                meshGroup = this.createLowGFactory();
                break;
            // --- Megablock 5: Type IV Megastructures ---
            case 'dyson_segment':
                meshGroup = this.createDysonSegment();
                break;
            case 'space_elevator':
                meshGroup = this.createSpaceElevator();
                break;
            case 'stellar_engine':
                meshGroup = this.createStellarEngine();
                break;
            default: // Generic box for others for now
                // Add a visual indicator for unhandled types instead of just a box
                console.warn(`BuildingArchitect: Unhandled type '${type}', using placeholder.`);
                const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                const mat = this.baseMaterial.clone();
                mat.color.setHex(0xff00ff); // Magenta for missing textures error look
                const mesh = new THREE.Mesh(geo, mat);
                meshGroup.add(mesh);
        }

        // Align to planet surface (only if position is provided, otherwise assume neutral orientation for parenting)
        if (position && (position.x !== 0 || position.y !== 0 || position.z !== 0)) {
            meshGroup.position.copy(position);
            meshGroup.lookAt(position.clone().add(normal));
            meshGroup.rotateX(Math.PI / 2); // Align up to normal
        }

        // Add shadow logic to all children
        meshGroup.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (!child.userData.isBuildingPart) child.userData.isBuilding = true; // Mark main parts
            }
        });

        meshGroup.userData.isBuilding = true; // Main group tag

        return meshGroup;
    }

    // --- PROCEDURAL GENERATORS ---

    createSolarArray() {
        const group = new THREE.Group();

        // 1. Base Pillar with tech details
        const pillarGeo = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 6);
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a3a,
            roughness: 0.3,
            metalness: 0.9
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.y = 0.75;
        group.add(pillar);

        // Glowing tech ring on pillar
        const ringGeo = new THREE.TorusGeometry(0.22, 0.04, 8, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 1.2;
        group.add(ring);

        // 2. Solar Panels (Wing style) - Enhanced
        const panelGeo = new THREE.BoxGeometry(1.4, 0.03, 2.8);
        if (!this.textureCache.solar) this.textureCache.solar = this.generateSolarTexture();

        const panelMat = new THREE.MeshStandardMaterial({
            map: this.textureCache.solar,
            roughness: 0.1,
            metalness: 0.95,
            emissive: 0x001155,
            emissiveIntensity: 0.5
        });

        const panelL = new THREE.Mesh(panelGeo, panelMat);
        panelL.position.set(-1.0, 1.5, 0);
        panelL.rotation.z = Math.PI / 8;
        group.add(panelL);

        const panelR = new THREE.Mesh(panelGeo, panelMat);
        panelR.position.set(1.0, 1.5, 0);
        panelR.rotation.z = -Math.PI / 8;
        group.add(panelR);

        // 3. Central Hub with GLOW
        const hubGeo = new THREE.OctahedronGeometry(0.35, 0);
        const hubMat = new THREE.MeshStandardMaterial({
            color: 0x111122,
            emissive: 0x0088ff,
            emissiveIntensity: 0.8,
            metalness: 1.0,
            roughness: 0.1
        });
        const hub = new THREE.Mesh(hubGeo, hubMat);
        hub.position.y = 1.5;
        hub.rotation.y = Math.PI / 4;
        group.add(hub);

        // Energy glow light
        const light = new THREE.PointLight(0x00aaff, 0.6, 3);
        light.position.y = 1.5;
        group.add(light);

        return group;
    }

    createHabitat() {
        const group = new THREE.Group();
        group.rotation.y = Math.random() * Math.PI;

        // 1. Central Bio-Dome (Glowing Hex Panels)
        const domeGeo = new THREE.IcosahedronGeometry(1.4, 2);
        if (!this.textureCache.glass) this.textureCache.glass = this.generateHexTexture();

        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xaaffff,
            metalness: 0.3,
            roughness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            map: this.textureCache.glass,
            emissive: 0x004466,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });

        const dome = new THREE.Mesh(domeGeo, glassMat);
        dome.position.y = 0.6;
        group.add(dome);

        // 2. Base Structure with glowing trim
        const baseGeo = new THREE.CylinderGeometry(1.5, 1.7, 0.5, 12);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.8,
            roughness: 0.2
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = -0.25;
        group.add(base);

        // Glowing base ring
        const baseRingGeo = new THREE.TorusGeometry(1.6, 0.06, 8, 32);
        const baseRingMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.y = -0.1;
        group.add(baseRing);

        // 3. Airlock with LED strip
        const airlockGeo = new THREE.BoxGeometry(0.9, 0.7, 1.2);
        const airlock = new THREE.Mesh(airlockGeo, baseMat);
        airlock.position.set(0, -0.1, 1.4);
        group.add(airlock);

        // Airlock door glow
        const doorGeo = new THREE.PlaneGeometry(0.6, 0.5);
        const doorMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.8 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 0, 2.01);
        group.add(door);

        // 4. Interior Warm Light
        const light = new THREE.PointLight(0xffcc44, 1.0, 5);
        light.position.set(0, 0.6, 0);
        group.add(light);

        // Inner Greenery with glow
        const vegGeo = new THREE.IcosahedronGeometry(0.7, 1);
        const vegMat = new THREE.MeshStandardMaterial({
            color: 0x22cc44,
            flatShading: true,
            emissive: 0x115522,
            emissiveIntensity: 0.3
        });
        const veg = new THREE.Mesh(vegGeo, vegMat);
        veg.position.y = 0.4;
        group.add(veg);

        return group;
    }

    createAutoMiner() {
        const group = new THREE.Group();

        // 1. Rig Frame
        const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 4);
        const legMat = new THREE.MeshStandardMaterial({ color: 0xff8800, metalness: 0.6 }); // Industrial Orange

        for (let i = 0; i < 3; i++) {
            const leg = new THREE.Mesh(legGeo, legMat);
            const angle = (i / 3) * Math.PI * 2;
            leg.position.set(Math.cos(angle) * 0.8, 1, Math.sin(angle) * 0.8);
            leg.lookAt(0, 2, 0); // Slanted inward
            group.add(leg);
        }

        // 2. Drill Head
        const drillGeo = new THREE.ConeGeometry(0.4, 1.5, 8);
        if (!this.textureCache.metal) this.textureCache.metal = this.generateMetalTexture();
        const drillMat = new THREE.MeshStandardMaterial({
            map: this.textureCache.metal,
            metalness: 0.9,
            roughness: 0.3
        });
        const drill = new THREE.Mesh(drillGeo, drillMat);
        drill.position.y = 0.5;
        drill.rotation.x = Math.PI; // Point down
        group.add(drill);

        // 3. Top Motor
        const motorGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        const motorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const motor = new THREE.Mesh(motorGeo, motorMat);
        motor.position.y = 2.0;
        group.add(motor);

        return group;
    }

    createFusionReactor() {
        const group = new THREE.Group();

        // 1. Torus Core (Tokamak) - SUPER GLOW
        const torusGeo = new THREE.TorusGeometry(1.2, 0.5, 24, 48);
        const torusMat = new THREE.MeshStandardMaterial({
            color: 0xffdd88,
            emissive: 0xff6600,
            emissiveIntensity: 1.5,
            metalness: 0.9,
            roughness: 0.1
        });
        const torus = new THREE.Mesh(torusGeo, torusMat);
        torus.rotation.x = Math.PI / 2;
        torus.position.y = 1.0;
        group.add(torus);

        // Plasma core glow
        const plasmaGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const plasmaMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const plasma = new THREE.Mesh(plasmaGeo, plasmaMat);
        plasma.position.y = 1.0;
        group.add(plasma);

        // Reactor light
        const reactorLight = new THREE.PointLight(0xff8800, 2.0, 8);
        reactorLight.position.y = 1.0;
        group.add(reactorLight);

        // 2. Containment Rings
        const ringGeo = new THREE.TorusGeometry(1.6, 0.1, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });

        const r1 = new THREE.Mesh(ringGeo, ringMat);
        r1.rotation.y = Math.PI / 2;
        r1.position.y = 0.8;
        group.add(r1);

        const r2 = new THREE.Mesh(ringGeo, ringMat);
        r2.position.y = 0.8;
        group.add(r2);

        return group;
    }

    createSilo() {
        const group = new THREE.Group();

        // Triple Tank Config
        const tankGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 12);
        if (!this.textureCache.metal) this.textureCache.metal = this.generateMetalTexture();
        const mat = new THREE.MeshStandardMaterial({ map: this.textureCache.metal, metalness: 0.5, roughness: 0.4, color: 0xeeeeee });

        const positions = [
            { x: -0.5, z: 0.4 },
            { x: 0.5, z: 0.4 },
            { x: 0, z: -0.5 }
        ];

        positions.forEach(pos => {
            const tank = new THREE.Mesh(tankGeo, mat);
            tank.position.set(pos.x, 0.9, pos.z);
            group.add(tank);

            // Tank Cap
            const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat);
            cap.position.set(pos.x, 1.8, pos.z);
            group.add(cap);
        });

        // Support Struts
        const strutGeo = new THREE.BoxGeometry(1.6, 0.2, 0.2);
        const strut = new THREE.Mesh(strutGeo, new THREE.MeshStandardMaterial({ color: 0x555555 }));
        strut.position.y = 1.0;
        strut.position.z = 0.4;
        group.add(strut);

        return group;
    }

    createRefinery() {
        const group = new THREE.Group();

        if (!this.textureCache.metal) this.textureCache.metal = this.generateMetalTexture();
        const industrialMat = new THREE.MeshStandardMaterial({ map: this.textureCache.metal, metalness: 0.6, roughness: 0.5, color: 0xcd7f32 }); // Bronze/Rust

        // 1. Main Furnace Unit
        const furnaceGeo = new THREE.BoxGeometry(1.5, 1.0, 1.5);
        const furnace = new THREE.Mesh(furnaceGeo, industrialMat);
        furnace.position.y = 0.5;
        group.add(furnace);

        // 2. Smokestacks
        const stackGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8);
        const stackMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });

        const stack1 = new THREE.Mesh(stackGeo, stackMat);
        stack1.position.set(-0.5, 1.5, -0.5);
        group.add(stack1);

        const stack2 = new THREE.Mesh(stackGeo, stackMat);
        stack2.position.set(0.5, 1.25, 0.5);
        group.add(stack2);

        // 3. Smoke Particles (Simulated with simple spheres for static mesh)
        // (Dynamic particles handled by effects system, this is just visual structure)

        // 4. Pipes
        const pipeGeo = new THREE.TorusGeometry(0.6, 0.1, 8, 16, Math.PI);
        const pipe = new THREE.Mesh(pipeGeo, new THREE.MeshStandardMaterial({ color: 0x888888 }));
        pipe.position.set(0.8, 0.5, 0);
        pipe.rotation.y = Math.PI / 2;
        group.add(pipe);

        return group;
    }

    createChipFab() {
        const group = new THREE.Group();

        // High Tech White/Blue aesthetic
        const cleanMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 });
        const blueGlow = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0088aa, emissiveIntensity: 0.6 });

        // 1. Main Facility (Sleek Box)
        const mainGeo = new THREE.BoxGeometry(1.8, 0.8, 1.8);
        const main = new THREE.Mesh(mainGeo, cleanMat);
        main.position.y = 0.4;
        group.add(main);

        // 2. Second Floor / Cooling Unit
        const topGeo = new THREE.BoxGeometry(1.2, 0.6, 1.2);
        const top = new THREE.Mesh(topGeo, cleanMat);
        top.position.y = 1.1;
        group.add(top);

        // 3. Cooling Fans / Vents (Blue strips)
        const ventGeo = new THREE.BoxGeometry(1.25, 0.1, 1.0);
        const vent = new THREE.Mesh(ventGeo, blueGlow);
        vent.position.y = 1.2;
        group.add(vent);

        // 4. Neon Circuit Lines (Thin strips on side)
        const circuitGeo = new THREE.BoxGeometry(1.85, 0.05, 1.0);
        const circuit = new THREE.Mesh(circuitGeo, blueGlow);
        circuit.position.y = 0.6;
        group.add(circuit);

        return group;
    }

    createDroneHub() {
        const group = new THREE.Group();

        // 1. Helipad Base
        const padGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.2, 16);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = 0.1;
        group.add(pad);

        // H Marking
        const hGeo = new THREE.BoxGeometry(0.8, 0.25, 0.2);
        const hMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xaaaa00, emissiveIntensity: 0.2 });

        const h1 = new THREE.Mesh(hGeo, hMat);
        h1.position.y = 0.15;
        group.add(h1);

        const h2 = new THREE.Mesh(hGeo, hMat);
        h2.position.y = 0.15;
        h2.rotation.y = Math.PI / 2;
        group.add(h2); // Valid cross shape

        // 2. Control Tower
        const towerGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(-0.8, 0.75, -0.8);
        group.add(tower);

        // Radar Dish
        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.1, 0.2, 8), hMat);
        dish.position.set(-0.8, 1.6, -0.8);
        group.add(dish);

        return group;
    }

    createLaunchSite() {
        const group = new THREE.Group();

        // 1. Launch Pad
        const padGeo = new THREE.BoxGeometry(1.5, 0.2, 1.5);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1.0 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = 0.1;
        group.add(pad);

        // 2. Rocket (Simple schematic representation)
        // Body
        const rocketGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.0, 8);
        const rocketMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const rocket = new THREE.Mesh(rocketGeo, rocketMat);
        rocket.position.y = 1.2;
        group.add(rocket);

        // Nose
        const noseGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
        const nose = new THREE.Mesh(noseGeo, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
        nose.position.y = 2.3;
        group.add(nose);

        // 3. Launch Tower / Gantry
        const towerGeo = new THREE.BoxGeometry(0.3, 2.2, 0.3);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xff8800, wireframe: false }); // Ginty orange
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(0.6, 1.1, 0);
        group.add(tower);

        // Connection arm
        const armGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        const arm = new THREE.Mesh(armGeo, towerMat);
        arm.position.set(0.3, 1.8, 0);
        group.add(arm);

        return group;
    }

    createResearchLab() {
        const group = new THREE.Group();
        // Main block
        const main = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
        main.position.y = 0.4;
        group.add(main);

        // Dish
        const dishGeo = new THREE.SphereGeometry(0.6, 16, 16, 0, Math.PI * 2, 0, 1); // Hemisphere-ish
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.5 });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(0.5, 1.5, 0);
        dish.rotation.z = 0.5;
        group.add(dish);

        return group;
    }

    // --- ULTIMATE BUILDINGS ---

    createUltimateSolar() {
        // "Dyson Node": Floating Energy Sphere
        const group = new THREE.Group();

        // Glowing Core
        const coreGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 2.0;
        group.add(core);

        // Orbital Rings
        const ringGeo = new THREE.TorusGeometry(2.0, 0.1, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1.0 });

        const r1 = new THREE.Mesh(ringGeo, ringMat);
        r1.position.y = 2.0;
        r1.rotation.x = Math.PI / 2;
        group.add(r1);

        const r2 = new THREE.Mesh(ringGeo, ringMat);
        r2.position.y = 2.0;
        r2.rotation.y = Math.PI / 2;
        group.add(r2);

        // Base Emitters
        const baseGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.75;
        group.add(base);

        return group;
    }

    createUltimateHab() {
        // "Arcology Spire"
        const group = new THREE.Group();

        // Main Tower
        const towerGeo = new THREE.CylinderGeometry(0.8, 1.5, 3.5, 8);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = 1.75;
        group.add(tower);

        // Windows (Emissive rings)
        const winGeo = new THREE.CylinderGeometry(0.81, 1.51, 3.5, 8, 4, true);
        const winMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.3, wireframe: true });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.y = 1.75;
        group.add(win);

        // Skybridge hints
        const bridgeGeo = new THREE.BoxGeometry(0.4, 0.2, 2.0);
        const bridge = new THREE.Mesh(bridgeGeo, towerMat);
        bridge.position.y = 2.5;
        group.add(bridge);

        return group;
    }

    createUltimateMine() {
        // "Planetary Cracker"
        const group = new THREE.Group();

        // Massive Drill Frame
        const frameGeo = new THREE.BoxGeometry(2.5, 0.5, 2.5);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 0.25;
        group.add(frame);

        // Laser Drill
        const drillGeo = new THREE.CylinderGeometry(0.2, 0.8, 3.0, 16);
        const drillMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000, emissiveIntensity: 0.5 });
        const drill = new THREE.Mesh(drillGeo, drillMat);
        drill.position.y = 2.0;
        group.add(drill);

        // Gantry Towers
        const towerGeo = new THREE.BoxGeometry(0.5, 3.0, 0.5);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xff8800 }); // Industrial Orange

        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(coord => {
            const tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.set(coord[0], 1.5, coord[1]);
            group.add(tower);
        });

        return group;
    }

    createUltimateRefinery() {
        // "Industrial City"
        const group = new THREE.Group();

        // Central Blast Furnace
        const mainGeo = new THREE.CylinderGeometry(1.5, 2.0, 2.5, 12);
        const mainMat = new THREE.MeshStandardMaterial({ color: 0x552200, roughness: 0.9, flatShading: true });
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 1.25;
        group.add(main);

        // Surrounding Smoke Stacks
        const stackGeo = new THREE.CylinderGeometry(0.2, 0.3, 3.5, 8);
        const stackMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

        for (let i = 0; i < 4; i++) {
            const stack = new THREE.Mesh(stackGeo, stackMat);
            const angle = (i / 4) * Math.PI * 2;
            const r = 2.0;
            stack.position.set(Math.cos(angle) * r, 1.75, Math.sin(angle) * r);
            group.add(stack);
        }

        return group;
    }

    createUltimateChipFab() {
        // "Quantum Core"
        const group = new THREE.Group();

        // Monolith
        const monoGeo = new THREE.BoxGeometry(1.5, 3.0, 1.5);
        const monoMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0.9 });
        const mono = new THREE.Mesh(monoGeo, monoMat);
        mono.position.y = 1.5;
        group.add(mono);

        // Data Streams (Emissive lines)
        const lineGeo = new THREE.PlaneGeometry(1.6, 3.1);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        // Simplified visual for data streams

        // Rotating Rings
        const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

        const r1 = new THREE.Mesh(ringGeo, ringMat);
        r1.position.y = 1.5;
        r1.rotation.x = Math.PI / 4;
        group.add(r1);

        return group;
    }

    // --- ULTIMATE BUILDINGS ---

    createUltimateSolar() {
        // "Dyson Node": Floating Energy Sphere
        const group = new THREE.Group();

        // Glowing Core
        const coreGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 2.0;
        group.add(core);

        // Orbital Rings
        const ringGeo = new THREE.TorusGeometry(2.0, 0.1, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1.0 });

        const r1 = new THREE.Mesh(ringGeo, ringMat);
        r1.position.y = 2.0;
        r1.rotation.x = Math.PI / 2;
        group.add(r1);

        const r2 = new THREE.Mesh(ringGeo, ringMat);
        r2.position.y = 2.0;
        r2.rotation.y = Math.PI / 2;
        group.add(r2);

        // Base Emitters
        const baseGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.75;
        group.add(base);

        return group;
    }

    createUltimateHab() {
        // "Arcology Spire"
        const group = new THREE.Group();

        // Main Tower
        const towerGeo = new THREE.CylinderGeometry(0.8, 1.5, 3.5, 8);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = 1.75;
        group.add(tower);

        // Windows (Emissive rings)
        const winGeo = new THREE.CylinderGeometry(0.81, 1.51, 3.5, 8, 4, true);
        const winMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.3, wireframe: true });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.y = 1.75;
        group.add(win);

        // Skybridge hints
        const bridgeGeo = new THREE.BoxGeometry(0.4, 0.2, 2.0);
        const bridge = new THREE.Mesh(bridgeGeo, towerMat);
        bridge.position.y = 2.5;
        group.add(bridge);

        return group;
    }

    createUltimateMine() {
        // "Planetary Cracker"
        const group = new THREE.Group();

        // Massive Drill Frame
        const frameGeo = new THREE.BoxGeometry(2.5, 0.5, 2.5);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 0.25;
        group.add(frame);

        // Laser Drill
        const drillGeo = new THREE.CylinderGeometry(0.2, 0.8, 3.0, 16);
        const drillMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000, emissiveIntensity: 0.5 });
        const drill = new THREE.Mesh(drillGeo, drillMat);
        drill.position.y = 2.0;
        group.add(drill);

        // Gantry Towers
        const towerGeo = new THREE.BoxGeometry(0.5, 3.0, 0.5);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xff8800 }); // Industrial Orange

        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(coord => {
            const tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.set(coord[0], 1.5, coord[1]);
            group.add(tower);
        });

        return group;
    }

    createUltimateRefinery() {
        // "Industrial City"
        const group = new THREE.Group();

        // Central Blast Furnace
        const mainGeo = new THREE.CylinderGeometry(1.5, 2.0, 2.5, 12);
        const mainMat = new THREE.MeshStandardMaterial({ color: 0x552200, roughness: 0.9, flatShading: true });
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 1.25;
        group.add(main);

        // Surrounding Smoke Stacks
        const stackGeo = new THREE.CylinderGeometry(0.2, 0.3, 3.5, 8);
        const stackMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

        for (let i = 0; i < 4; i++) {
            const stack = new THREE.Mesh(stackGeo, stackMat);
            const angle = (i / 4) * Math.PI * 2;
            const r = 2.0;
            stack.position.set(Math.cos(angle) * r, 1.75, Math.sin(angle) * r);
            group.add(stack);
        }

        return group;
    }

    createUltimateChipFab() {
        // "Quantum Core"
        const group = new THREE.Group();

        // Monolith
        const monoGeo = new THREE.BoxGeometry(1.5, 3.0, 1.5);
        const monoMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0.9 });
        const mono = new THREE.Mesh(monoGeo, monoMat);
        mono.position.y = 1.5;
        group.add(mono);

        // Data Streams (Emissive lines)
        const lineGeo = new THREE.PlaneGeometry(1.6, 3.1);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        // Simplified visual for data streams

        // Rotating Rings
        const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

        const r1 = new THREE.Mesh(ringGeo, ringMat);
        r1.position.y = 1.5;
        r1.rotation.x = Math.PI / 4;
        group.add(r1);

        return group;
    }

    // --- TEXTURE GENERATORS (Canvas API) ---

    generateSolarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; // Power of 2
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Dark Blue Base
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 128, 128);

        // Grid lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;

        // Cells
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 8; j++) {
                ctx.fillStyle = '#1e3a8a'; // Lighter blue cell
                ctx.fillRect(i * 32 + 2, j * 16 + 2, 28, 12);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    generateHexTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff'; // White background (mapped to tint)
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 4;

        // Draw Hexagons... manually or just a grid for speed
        // Simple Grid for "Reinforced Glass" look
        ctx.beginPath();
        for (let x = 0; x <= 256; x += 32) {
            ctx.moveTo(x, 0); ctx.lineTo(x, 256);
        }
        for (let y = 0; y <= 256; y += 32) {
            ctx.moveTo(0, y); ctx.lineTo(256, y);
        }
        ctx.stroke();

        return new THREE.CanvasTexture(canvas);
    }

    generateMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Noise for scratchy metal
        const id = ctx.createImageData(128, 128);
        const data = id.data;
        for (let i = 0; i < data.length; i += 4) {
            const val = 150 + Math.random() * 50;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
            data[i + 3] = 255;
        }

        ctx.putImageData(id, 0, 0);

        // Rivets
        ctx.fillStyle = '#555';
        for (let i = 10; i < 128; i += 40) {
            ctx.fillRect(i, 5, 4, 4);
            ctx.fillRect(i, 119, 4, 4);
        }

        return new THREE.CanvasTexture(canvas);
    }

    // --- NEWLY IMPLEMENTED METHODS (Placed Correctly) ---

    createHydroponics() {
        const group = new THREE.Group();
        // 1. Greenhouse Dome
        const domeGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.8, 8);
        const domeMat = new THREE.MeshPhysicalMaterial({
            color: 0x4ade80, transparent: true, opacity: 0.6, roughness: 0.2, transmission: 0.5
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 0.4;
        group.add(dome);

        // 2. Plants inside
        const plantGeo = new THREE.DodecahedronGeometry(0.6);
        const plantMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const plant = new THREE.Mesh(plantGeo, plantMat);
        plant.position.y = 0.3;
        plant.scale.set(0.8, 0.8, 0.8);
        group.add(plant);

        // 3. Base
        const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 2.0), this.baseMaterial);
        base.position.y = 0;
        group.add(base);
        return group;
    }

    createOxygenGenerator() {
        const group = new THREE.Group();
        // 1. Tanks
        const tankGeo = new THREE.CapsuleGeometry(0.4, 1.2, 4);
        const tankMat = new THREE.MeshStandardMaterial({ color: 0xa5f3fc, metalness: 0.5, roughness: 0.2 });

        const t1 = new THREE.Mesh(tankGeo, tankMat);
        t1.position.set(-0.5, 0.8, 0);
        group.add(t1);

        const t2 = new THREE.Mesh(tankGeo, tankMat);
        t2.position.set(0.5, 0.8, 0);
        group.add(t2);

        // 2. Pipe
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.0), this.baseMaterial);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.y = 0.8;
        group.add(pipe);

        return group;
    }

    createResearchLab() {
        const group = new THREE.Group();
        // 1. Main Block
        const main = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), new THREE.MeshStandardMaterial({ color: 0xa855f7 }));
        main.position.y = 0.5;
        group.add(main);

        // 2. Dish/Antenna
        const dish = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.5, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide }));
        dish.position.set(0, 1.25, 0);
        dish.rotation.x = 0.5;
        group.add(dish);

        return group;
    }

    createHeliumMine() { return this.createAutoMiner(); } // Reuse for now
    createLunarHabitat() { return this.createHabitat(); } // Reuse
    createLowGFactory() { return this.createRefinery(); } // Reuse

    // --- MEGASTRUCTURE GENERATORS (Megablock 5) ---

    /**
     * Item 4002: Dyson Shell construction modular segment.
     */
    createDysonSegment() {
        const group = new THREE.Group();
        // Massive Curved Panel
        const panelGeo = new THREE.BoxGeometry(10, 0.5, 10);
        const panelMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 1.0, 
            roughness: 0.1,
            emissive: 0x002244
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        group.add(panel);

        // Energy collectors (Hex grid)
        const collectorGeo = new THREE.CylinderGeometry(4, 4, 0.6, 6);
        const collectorMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
        const collector = new THREE.Mesh(collectorGeo, collectorMat);
        collector.position.y = 0.3;
        group.add(collector);

        console.log("🏗️ Megastructure Segment Constructed: Dyson Shell Module");
        return group;
    }

    /**
     * Item 4006: Space Elevator logistics managing.
     */
    createSpaceElevator() {
        const group = new THREE.Group();
        // Main Anchor Base
        const anchorGeo = new THREE.CylinderGeometry(5, 8, 2, 32);
        const anchor = new THREE.Mesh(anchorGeo, this.baseMaterial);
        group.add(anchor);

        // Vertical Cable (Schismatic representation)
        const cableGeo = new THREE.CylinderGeometry(0.2, 0.2, 50, 8);
        const cableMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        const cable = new THREE.Mesh(cableGeo, cableMat);
        cable.position.y = 25;
        group.add(cable);

        // Climber Car
        const car = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
        car.position.y = 5;
        group.add(car);

        return group;
    }

    /**
     * Item 4001: Stellar Engine physics for moving solar systems.
     */
    createStellarEngine() {
        const group = new THREE.Group();
        // Shkadov Thruster (Half-mirror)
        const mirrorGeo = new THREE.SphereGeometry(20, 32, 16, 0, Math.PI);
        const mirrorMat = new THREE.MeshPhysicalMaterial({ 
            color: 0xffffff, 
            metalness: 1.0, 
            roughness: 0.0,
            transmission: 0.1,
            side: THREE.DoubleSide
        });
        const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
        mirror.rotation.x = Math.PI / 2;
        group.add(mirror);

        // Propulsion Glow
        const glow = new THREE.PointLight(0xffffff, 10, 100);
        glow.position.y = -10;
        group.add(glow);

        return group;
    }
}
