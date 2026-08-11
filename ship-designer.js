/**
 * Ship Designer System
 * Allows players to design custom ships using modular parts.
 */

class ShipModule {
    constructor(id, name, type, stats, cost, desc) {
        this.id = id;
        this.name = name;
        this.type = type; // 'hull', 'engine', 'weapon', 'shield'
        this.stats = stats; // { hp, speed, damage, range, capacity }
        this.cost = cost; // { alloys, energy, circuits }
        this.desc = desc;
    }

    toString() {
        return this.name;
    }
}

class ShipDesign {
    constructor(name, hull, engine, weapons = [], shields = []) {
        this.id = 'design_' + Date.now().toString(36);
        this.name = name;
        this.hull = hull;
        this.engine = engine;
        this.weapons = weapons;
        this.shields = shields;
        this.modules = [this.hull, this.engine, ...this.weapons, ...this.shields].filter(m => m);
        
        // Roadmap Item 406: Custom Hull Color
        this.hullColor = '#38bdf8'; 

        // Roadmap Item 402: Internal deck-plan layout
        this.deckPlan = this.generateInitialDeckPlan();
        
        // Roadmap Item 405: Component-based health tracking
        this.componentHealth = this.initComponentHealth();

        this.stats = this.calculateStats();
        this.cost = this.calculateCost();
    }

    generateInitialDeckPlan() {
        if (!this.hull) return [];
        const slots = this.hull.stats.capacity || 4;
        const deck = [];
        for (let i = 0; i < slots; i++) {
            deck.push({ id: `slot_${i}`, type: 'general', module: null });
        }
        return deck;
    }

    initComponentHealth() {
        const health = {};
        this.modules.forEach(m => {
            health[m.id] = 100; // 100% health for each module
        });
        return health;
    }

    calculateStats() {
        const s = { hp: 0, speed: 0, damage: 0, range: 0, capacity: 0, tier: 1 };

        // Roadmap Item 404: Ship-class tiers
        if (this.hull) {
            s.hp += this.hull.stats.hp || 0;
            s.capacity += this.hull.stats.capacity || 0;
            s.speed += this.hull.stats.speed || 0;
            
            if (this.hull.id.includes('titan')) s.tier = 5;
            else if (this.hull.id.includes('dreadnought')) s.tier = 4;
            else if (this.hull.id.includes('cruiser') || this.hull.id.includes('carrier')) s.tier = 3;
            else if (this.hull.id.includes('frigate') || this.hull.id.includes('destroyer')) s.tier = 2;
            else s.tier = 1;
        }

        // Engine
        if (this.engine) {
            s.speed += this.engine.stats.speed || 0;
        }

        // Weapons
        this.weapons.forEach(w => {
            s.damage += w.stats.damage || 0;
            s.range = Math.max(s.range, w.stats.range || 0);
        });

        // Shields
        this.shields.forEach(sh => {
            s.hp += sh.stats.hp || 0; // Shields add effectively to HP for now
        });

        return s;
    }

    calculateCost() {
        const c = { alloys: 0, energy: 0, circuits: 0 };
        const modules = [this.hull, this.engine, ...this.weapons, ...this.shields].filter(m => m);

        modules.forEach(m => {
            if (m.cost) {
                c.alloys += m.cost.alloys || 0;
                c.energy += m.cost.energy || 0;
                c.circuits += m.cost.circuits || 0;
            }
        });
        return c;
    }
}

class ShipDesigner {
    constructor(game) {
        this.game = game;
        this.modules = {};
        this.designs = [];
        this.unlockedModules = []; // IDs
    }

    init() {
        this.registerModules();
        this.unlockInitialModules();
        console.log("Ship Designer Initialized");
    }

    registerModules() {
        // --- HULLS ---
        this.addModule(new ShipModule('hull_interceptor', 'Interceptor Hull', 'hull', { hp: 75, speed: 15, capacity: 2 }, { alloys: 40, circuits: 10 }, 'Ultra-fast dominance fighter.'));
        this.addModule(new ShipModule('hull_corvette', 'Corvette Hull', 'hull', { hp: 120, speed: 10, capacity: 4 }, { alloys: 60 }, 'Balanced patrol craft.'));
        this.addModule(new ShipModule('hull_bomber', 'Bomber Hull', 'hull', { hp: 150, speed: 8, capacity: 6 }, { alloys: 100, energy: 20 }, 'Heavy payload delivery system.'));
        this.addModule(new ShipModule('hull_frigate', 'Frigate Hull', 'hull', { hp: 300, speed: 6, capacity: 8 }, { alloys: 200 }, 'Backbone of the fleet.'));
        this.addModule(new ShipModule('hull_destroyer', 'Destroyer Hull', 'hull', { hp: 600, speed: 4, capacity: 10 }, { alloys: 400, circuits: 50 }, 'Anti-ship weapons platform.'));
        this.addModule(new ShipModule('hull_cruiser', 'Cruiser Hull', 'hull', { hp: 1200, speed: 2, capacity: 14 }, { alloys: 800, circuits: 100 }, 'Long-range command vessel.'));
        this.addModule(new ShipModule('hull_carrier', 'Carrier Hull', 'hull', { hp: 2000, speed: 1.5, capacity: 30, hangarValue: 20 }, { alloys: 1500, circuits: 200 }, 'Fighter deployment platform.'));
        this.addModule(new ShipModule('hull_dreadnought', 'Dreadnought Hull', 'hull', { hp: 5000, speed: 0.8, capacity: 20, dpsMultiplier: 1.5 }, { alloys: 3000, circuits: 500 }, 'Flying fortress.'));
        this.addModule(new ShipModule('hull_titan', 'Titan Hull', 'hull', { hp: 15000, speed: 0.4, capacity: 40, canMountDoomsday: true }, { alloys: 10000, energy: 2000, circuits: 1000 }, 'The ultimate projection of power.'));

        // --- ENGINES (Sub-light & FTL) ---
        this.addModule(new ShipModule('eng_ion', 'Ion Drive', 'engine', { speed: 20, propulsionType: 'ion' }, { energy: 20, circuits: 10 }, 'Standard efficient propulsion.'));
        this.addModule(new ShipModule('eng_fusion', 'Fusion Drive', 'engine', { speed: 40, propulsionType: 'fusion' }, { energy: 50, circuits: 30 }, 'High-thrust combat drive.'));
        this.addModule(new ShipModule('eng_antimatter', 'Antimatter Drive', 'engine', { speed: 80, propulsionType: 'antimatter' }, { energy: 200, circuits: 100 }, 'Experimental high-speed propulsion.'));
        this.addModule(new ShipModule('eng_slipspace', 'Slipspace Drive', 'engine', { speed: 120, propulsionType: 'slipstream', ftlType: 'slipstream' }, { energy: 500, circuits: 200, unknown_material: 10 }, 'Instantaneous tactical relocation.'));
        
        // Roadmap Item 419: FTL Types
        this.addModule(new ShipModule('ftl_warp_core', 'Warp Drive Mk.I', 'engine', { speed: 10, ftlType: 'warp', efficiency: 1.0 }, { energy: 300, alloys: 100 }, 'Stable FTL travel via space-time folding.'));
        this.addModule(new ShipModule('ftl_jump_drive', 'Jump Drive', 'engine', { speed: 0, ftlType: 'jump', range: 500 }, { energy: 1000, circuits: 500 }, 'Point-to-point instantaneous jumping.'));
        
        // Roadmap Item 420: Specialized Sub-light
        this.addModule(new ShipModule('eng_plasma', 'Plasma Thrusters', 'engine', { speed: 60, propulsionType: 'plasma' }, { energy: 100, alloys: 50 }, 'High acceleration, high energy cost.'));

        // --- WEAPONS ---
        this.addModule(new ShipModule('wep_laser', 'Laser Cannon', 'weapon', { damage: 15, range: 60 }, { alloys: 10, energy: 10, circuits: 5 }, 'Rapid-fire directed energy.'));
        this.addModule(new ShipModule('wep_plasma', 'Plasma Repeater', 'weapon', { damage: 45, range: 40 }, { alloys: 30, energy: 30, circuits: 15 }, 'Superheated bolts, low accuracy.'));
        this.addModule(new ShipModule('wep_missile', 'Missile Battery', 'weapon', { damage: 80, range: 150 }, { alloys: 50, circuits: 30 }, 'Long-range guidance.'));
        this.addModule(new ShipModule('wep_railgun', 'Railgun Turret', 'weapon', { damage: 120, range: 90 }, { alloys: 120, energy: 60, circuits: 25 }, 'Heavy kinetic penetrator.'));
        this.addModule(new ShipModule('wep_torpedo', 'Proton Torpedo', 'weapon', { damage: 300, range: 200 }, { alloys: 200, energy: 100, circuits: 50 }, 'Capital ship killer. Slow reload.'));
        this.addModule(new ShipModule('wep_flak', 'Flak Cannon', 'weapon', { damage: 10, range: 30 }, { alloys: 40, circuits: 10 }, 'Area denial anti-fighter system.'));
        this.addModule(new ShipModule('wep_doomsday_judgment', 'Judgment Beam', 'weapon', { damage: 5000, range: 500, isDoomsday: true }, { energy: 1000, circuits: 500 }, 'Titan-only weapon. Erases anything in its path.'));

        // --- SHIELDS ---
        this.addModule(new ShipModule('mod_shield_basic', 'Deflector Shield', 'shield', { hp: 80 }, { energy: 40, circuits: 20 }, 'Basic energy barrier.'));
        this.addModule(new ShipModule('mod_shield_heavy', 'Fortress Shield', 'shield', { hp: 300 }, { energy: 150, circuits: 60 }, 'Sustained heavy protection.'));
        this.addModule(new ShipModule('mod_shield_regenerative', 'Bi-Weave Shield', 'shield', { hp: 150 }, { energy: 100, circuits: 100 }, 'Fast regeneration cycles.'));

        // --- ARMOR ---
        this.addModule(new ShipModule('mod_armor_ablative', 'Ablative Plating', 'shield', { hp: 200, armorType: 'ablative' }, { alloys: 100 }, 'Sacrificial layers against beams.')); // Item 417
        this.addModule(new ShipModule('mod_armor_reactive', 'Reactive Armor', 'shield', { hp: 150, armorType: 'reactive' }, { alloys: 150, circuits: 50 }, 'Explosive plates against kinetics.')); // Item 417
        this.addModule(new ShipModule('mod_armor_nano', 'Nano-Armor', 'shield', { hp: 100, armorType: 'nano' }, { alloys: 200, composite: 50 }, 'Self-repairing alloy surface.')); // Item 417

        // --- UTILITY ---
        this.addModule(new ShipModule('wep_mining', 'Mining Beam', 'weapon', { damage: 5, range: 25 }, { alloys: 20, circuits: 20 }, 'Resource extraction tool.'));
        this.addModule(new ShipModule('mod_repair', 'Nano-Repair Bots', 'shield', { hp: 50 }, { alloys: 100, circuits: 100 }, 'Passive hull regeneration.'));
        this.addModule(new ShipModule('mod_repair_drone', 'Repair Drone Hub', 'shield', { repairRate: 5, drones: 2 }, { alloys: 150, circuits: 100 }, 'Item 436: Automated drones that repair ship hull during combat.'));
        this.addModule(new ShipModule('mod_fuel_pod', 'Refueling Pod', 'shield', { energyCap: 200 }, { alloys: 50, circuits: 20 }, 'Item 437: Increases ship energy reserves for extended operations.'));
        this.addModule(new ShipModule('mod_ammo_rack', 'Ammo Magazine', 'shield', { ammoCap: 50 }, { alloys: 80 }, 'Item 438: Increases ammunition capacity for projectile weapons.'));
        this.addModule(new ShipModule('mod_pd_autocannon', 'Point-Defense Turret', 'weapon', { damage: 2, isPD: true }, { alloys: 20, circuits: 10 }, 'Automated defense against missiles.')); // Item 411
        this.addModule(new ShipModule('mod_stealth_cloak', 'Cloaking Device', 'shield', { isStealth: true }, { circuits: 200, energy: 100 }, 'Reduces target priority and sensor signature.')); // Item 413
        this.addModule(new ShipModule('mod_ewar_jammer', 'ECM Jammer', 'shield', { isEWAR: true }, { circuits: 150, energy: 50 }, 'Jams enemy tracking and communications.')); // Item 412
        this.addModule(new ShipModule('mod_eccm_package', 'ECCM Suite', 'shield', { isECCM: true }, { circuits: 100, energy: 30 }, 'Item 450: Countermeasures against enemy jamming.'));
        
        // --- TACTICAL MODULES ---
        this.addModule(new ShipModule('mod_emp_emitter', 'EMP Generator', 'weapon', { damage: 5, empStrength: 40 }, { energy: 200, circuits: 100 }, 'Item 441: Disables enemy electronics and shields.'));
        this.addModule(new ShipModule('mod_boarding_drone', 'Boarding Drone Hub', 'weapon', { damage: 10, boardingPower: 25 }, { alloys: 200, circuits: 150 }, 'Item 442: Deploys automated drones to infiltrate enemy hulls.'));
        this.addModule(new ShipModule('mod_mine_layer', 'Mine Layer', 'weapon', { damage: 50, isMine: true }, { alloys: 100, energy: 50 }, 'Item 443: Deploys proximity mines in the combat zone.'));
        this.addModule(new ShipModule('mod_siege_cannon', 'Bombardment Cannon', 'weapon', { damage: 20, isSiege: true }, { alloys: 500, energy: 200 }, 'Item 444: Optimized for orbital bombardment of surface structures.'));
        
        // --- HANGAR SPECIALIZATIONS ---
        this.addModule(new ShipModule('mod_interceptor_bay', 'Interceptor Bay', 'shield', { fighterBonus: 1.5 }, { alloys: 150, circuits: 80 }, 'Item 447: Specialized hangar for anti-fighter interceptors.'));
        this.addModule(new ShipModule('mod_bomber_bay', 'Bomber Bay', 'shield', { fighterBonus: 2.0 }, { alloys: 200, circuits: 100 }, 'Item 448: Specialized hangar for heavy anti-hull bombers.'));
        this.addModule(new ShipModule('mod_sig_coating', 'Signature Coating', 'shield', { stealthBonus: 0.3 }, { circuits: 150, energy: 50 }, 'Item 452: Reduces sensor signature and target priority.'));
        this.addModule(new ShipModule('mod_decoys', 'Decoy Launcher', 'weapon', { decoyCount: 3 }, { alloys: 50, circuits: 50 }, 'Item 453: Deploys thermal decoys to redirect incoming fire.'));
        this.addModule(new ShipModule('mod_tractor_beam', 'Tractor Beam', 'weapon', { salvageBonus: 1.5 }, { alloys: 100, circuits: 100 }, 'Item 454: Aids in salvage operations and ship towing.'));
        this.addModule(new ShipModule('mod_ai_core_basic', 'Neural AI Core', 'engine', { agility: 1.5, speed: 1.2 }, { circuits: 300, composite: 50 }, 'Item 460: Advanced autopilot for improved evasion and speed.'));
        this.addModule(new ShipModule('mod_neural_link', 'Neural Link Interface', 'engine', { pilotSync: 1.2, speed: 1.1 }, { circuits: 500, data: 200 }, 'Item 461: Direct brain-to-ship interface for extreme reaction times.'));
        this.addModule(new ShipModule('mod_firefighting_sys', 'Auto-Fire Suppression', 'shield', { fireResist: 0.8 }, { alloys: 100, circuits: 50 }, 'Item 463: Automated teams and systems to combat internal fires.'));
        this.addModule(new ShipModule('mod_xeno_hull', 'Xeno-Tech Organic Hull', 'hull', { hp: 500, regen: 5 }, { exotic_matter: 10, alloys: 1000 }, 'Item 469: Living hull plating recovered from ancient wreckage.'));
        this.addModule(new ShipModule('mod_precursor_core', 'Precursor Power Core', 'engine', { energyCap: 1000, speed: 2.0 }, { precursor_artifact: 1, circuits: 1000 }, 'Item 470: Restored ancient reactor with nearly infinite output.'));
        
        // --- COSMETIC & VANITY ---
        this.addModule(new ShipModule('mod_vanity_bobble', 'Captain Bobblehead', 'shield', { moraleBonus: 5 }, { credits: 100 }, 'Item 488: A small companion for the bridge. Increases crew morale.'));
        this.addModule(new ShipModule('mod_custom_thruster', 'Prismatic Thrusters', 'engine', { thrustColor: 'rainbow' }, { energy: 50, circuits: 20 }, 'Item 487: Customizes engine exhaust colors.'));
        
        // --- FACTION SPECIALS & ARTIFACTS ---
        this.addModule(new ShipModule('mod_faction_railgun', 'Void-Shard Railgun', 'weapon', { damage: 200, range: 120 }, { reputation: 50, alloys: 500 }, 'Item 468: Faction-exclusive kinetic weapon using exotic crystal shards.'));
        this.addModule(new ShipModule('mod_artifact_sensor', 'Eye of the Void', 'shield', { detectionBonus: 2.0, stealth: 0.5 }, { artifact_id: 'void_eye' }, 'Item 497: A reality-warping artifact that allows seeing through any cloak.'));

        // --- CONTROL & UTILITY ---
        this.addModule(new ShipModule('mod_rcs_standard', 'RCS Thrusters', 'engine', { agility: 1.2, speed: 5 }, { alloys: 30, circuits: 10 }, 'Item 421: Improved rotation and maneuverability.'));
        this.addModule(new ShipModule('mod_inertial_dampener', 'Inertial Dampener', 'shield', { stability: 1.5, energyCost: 5 }, { alloys: 100, circuits: 50 }, 'Item 422: Reduces structural stress during high-G maneuvers.'));
    }

    addModule(module) {
        this.modules[module.id] = module;
    }

    unlockInitialModules() {
        // Unlock everything for sandbox/testing purposes
        this.unlockedModules = Object.keys(this.modules);
    }

    getAvailableModules(type) {
        return Object.values(this.modules).filter(m => m.type === type && this.unlockedModules.includes(m.id));
    }

    saveDesign(design) {
        this.designs.push(design);
        this.game.notify(`Ship Design Saved: ${design.name}`, 'success');
        
        // Roadmap Item 484: Galactic Leaderboard Submission
        this.submitToLeaderboard(design);
        
        // Roadmap Item 485: Blueprint Sharing Marketplace
        this.listOnMarketplace(design);
    }

    submitToLeaderboard(design) {
        const score = (design.stats.damage * 2) + (design.stats.hp / 10);
        console.log(`🏆 LEADERBOARD: Design ${design.name} submitted with performance score ${Math.floor(score)}.`);
    }

    listOnMarketplace(design) {
        console.log(`🛒 MARKETPLACE: Design ${design.name} listed for other pioneers to license.`);
    }

    // UI METHODS ========================================================

    ensureDesignerModal() {
        let modal = document.getElementById('ep-designer-modal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'ep-designer-modal';
        modal.className = 'ep-modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="ep-modal ep-designer-window" style="width:min(1080px,94vw);height:min(760px,88vh);overflow:hidden;display:flex;flex-direction:column;">
                <div class="ep-modal-header">
                    <div><span style="font:700 .62rem Orbitron,sans-serif;color:#64748b;letter-spacing:.12em;">NAVAL ENGINEERING</span><h2 style="margin:2px 0 0;color:#f472b6;">Starship Designer</h2></div>
                    <button class="ep-sys-btn" id="ep-designer-close">CLOSE</button>
                </div>
                <div class="ep-modal-body" style="padding:12px;overflow:auto;display:flex;flex-direction:column;gap:10px;min-height:0;">
                    <div style="display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:10px;align-items:center;">
                        <input id="ep-design-name" value="Pathfinder" maxlength="48" aria-label="Ship design name" style="background:#020617;border:1px solid #334155;color:#f8fafc;border-radius:7px;padding:9px 10px;font:700 .78rem Orbitron,sans-serif;" />
                        <div style="display:flex;gap:5px;flex-wrap:wrap;">
                            <button class="ep-sys-btn" id="ep-tab-modules">MODULES</button>
                            <button class="ep-sys-btn" id="ep-tab-deckplan">DECK PLAN</button>
                            <button class="ep-sys-btn" id="ep-tab-paint">PAINT</button>
                        </div>
                    </div>

                    <div id="ep-designer-modules-view" style="display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:12px;min-height:0;">
                        <section style="display:grid;grid-template-columns:1fr 1fr;gap:8px;min-height:0;">
                            <div class="ep-panel" style="padding:8px;min-height:0;"><h3 style="margin:0 0 6px;color:#7dd3fc;font-size:.72rem;">HULLS</h3><div id="ep-design-hulls" style="display:flex;flex-direction:column;gap:5px;max-height:210px;overflow:auto;"></div></div>
                            <div class="ep-panel" style="padding:8px;min-height:0;"><h3 style="margin:0 0 6px;color:#7dd3fc;font-size:.72rem;">ENGINES</h3><div id="ep-design-engines" style="display:flex;flex-direction:column;gap:5px;max-height:210px;overflow:auto;"></div></div>
                            <div class="ep-panel" style="padding:8px;min-height:0;"><h3 style="margin:0 0 6px;color:#fca5a5;font-size:.72rem;">WEAPONS / UTILITY</h3><div id="ep-design-weapons" style="display:flex;flex-direction:column;gap:5px;max-height:210px;overflow:auto;"></div></div>
                            <div class="ep-panel" style="padding:8px;min-height:0;"><h3 style="margin:0 0 6px;color:#c4b5fd;font-size:.72rem;">SHIELDS / SUPPORT</h3><div id="ep-design-shields" style="display:flex;flex-direction:column;gap:5px;max-height:210px;overflow:auto;"></div></div>
                        </section>
                        <aside class="ep-panel" style="padding:10px;display:flex;flex-direction:column;gap:8px;min-height:0;">
                            <canvas id="ep-ship-preview-canvas" width="420" height="260" style="width:100%;aspect-ratio:21/13;max-height:260px;background:radial-gradient(circle,#0f2942,#020617 70%);border:1px solid #1e3a5f;border-radius:8px;"></canvas>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:.68rem;color:#94a3b8;">
                                <div id="ep-stat-hp">Hull/Shield <span style="color:#fff">0</span></div>
                                <div id="ep-stat-dmg">Damage <span style="color:#fff">0</span></div>
                                <div id="ep-stat-range">Range <span style="color:#fff">0</span></div>
                                <div id="ep-stat-speed">Speed <span style="color:#fff">0</span></div>
                                <div id="ep-stat-cap">Slots <span style="color:#fff">0</span></div>
                                <div id="ep-stat-cost-alloys">Alloys <span style="color:#fbbf24">0</span></div>
                                <div id="ep-stat-cost-energy">Energy <span style="color:#fbbf24">0</span></div>
                                <div id="ep-stat-cost-circuits">Circuits <span style="color:#fbbf24">0</span></div>
                            </div>
                            <p style="margin:0;color:#64748b;font-size:.63rem;line-height:1.45;">Choose a hull and engine first. Weapons and support modules occupy hull slots. Saving creates a reusable shipyard design; Fleet performs construction.</p>
                        </aside>
                    </div>

                    <div id="ep-designer-deckplan-view" style="display:none;min-height:280px;">
                        <div class="ep-panel" style="padding:10px;"><h3 style="margin:0 0 8px;color:#7dd3fc;">Internal Module Deck</h3><div id="ep-design-slots" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;"></div></div>
                    </div>

                    <div id="ep-designer-paint-view" style="display:none;min-height:280px;">
                        <div class="ep-panel" style="padding:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                            <label for="ep-design-hull-color" style="color:#cbd5e1;">Hull accent</label>
                            <input id="ep-design-hull-color" type="color" value="#38bdf8" style="width:64px;height:40px;border:0;background:transparent;" />
                            <span style="color:#64748b;font-size:.68rem;">The color is stored with the active draft and preview configuration.</span>
                        </div>
                    </div>

                    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:auto;padding-top:4px;">
                        <button class="ep-sys-btn" id="ep-designer-cancel">CANCEL</button>
                        <button class="ep-sys-btn" id="ep-btn-save-design" style="border-color:#f472b6;color:#f9a8d4;background:rgba(219,39,119,.12);">SAVE DESIGN TO SHIPYARD</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const close = () => { modal.style.display = 'none'; };
        modal.querySelector('#ep-designer-close').onclick = close;
        modal.querySelector('#ep-designer-cancel').onclick = close;
        modal.querySelector('#ep-tab-modules').onclick = () => this.setTab('modules');
        modal.querySelector('#ep-tab-deckplan').onclick = () => this.setTab('deckplan');
        modal.querySelector('#ep-tab-paint').onclick = () => this.setTab('paint');
        modal.querySelector('#ep-design-hull-color').addEventListener('input', (event) => {
            if (!this.currentDraft) return;
            this.currentDraft.hullColor = event.target.value;
            this.updatePreview();
        });
        return modal;
    }

    openDesigner(retrofitShip = null) {
        const modal = this.ensureDesignerModal();

        // Roadmap Item 429: Retrofitting old hulls
        if (retrofitShip) {
            this.currentDraft = {
                hull: retrofitShip.design.hull,
                engine: retrofitShip.design.engine,
                weapons: [...retrofitShip.design.weapons],
                shields: [...retrofitShip.design.shields],
                slots: [...retrofitShip.design.deckPlan.map(s => s.module)],
                hullColor: retrofitShip.design.hullColor || '#38bdf8',
                retrofitId: retrofitShip.id
            };
            this.game.notify(`🔧 RETROFITTING: Adjusting configuration for ${retrofitShip.name}.`, "info");
        } else {
            this.currentDraft = { hull: null, engine: null, weapons: [], shields: [], slots: [], hullColor: '#38bdf8' };
        }

        const color = modal.querySelector('#ep-design-hull-color');
        if (color) color.value = this.currentDraft.hullColor || '#38bdf8';
        this.renderDesignerUI();
        this.setTab('modules');
        modal.style.display = 'flex';

        const saveBtn = document.getElementById('ep-btn-save-design');
        if (saveBtn) {
            saveBtn.innerText = retrofitShip ? "APPLY RETROFIT & UPDATE VESSEL" : "SAVE DESIGN TO SHIPYARD";
            saveBtn.onclick = () => this.finalizeDesign();
        }
    }

    setTab(tabId) {
        this.currentTab = tabId;
        const modulesView = document.getElementById('ep-designer-modules-view');
        const deckplanView = document.getElementById('ep-designer-deckplan-view');
        const paintView = document.getElementById('ep-designer-paint-view');
        const tabModules = document.getElementById('ep-tab-modules');
        const tabDeckplan = document.getElementById('ep-tab-deckplan');
        const tabPaint = document.getElementById('ep-tab-paint');
        
        if (tabId === 'modules') {
            if (modulesView) modulesView.style.display = 'flex';
            if (deckplanView) deckplanView.style.display = 'none';
            if (paintView) paintView.style.display = 'none';
            if (tabModules) tabModules.style.background = 'rgba(56, 189, 248, 0.2)';
            if (tabDeckplan) tabDeckplan.style.background = 'transparent';
            if (tabPaint) tabPaint.style.background = 'transparent';
        } else if (tabId === 'deckplan') {
            if (modulesView) modulesView.style.display = 'none';
            if (deckplanView) deckplanView.style.display = 'flex';
            if (paintView) paintView.style.display = 'none';
            if (tabModules) tabModules.style.background = 'transparent';
            if (tabDeckplan) tabDeckplan.style.background = 'rgba(56, 189, 248, 0.2)';
            if (tabPaint) tabPaint.style.background = 'transparent';
            this.renderDeckPlanUI();
        } else if (tabId === 'paint') {
            if (modulesView) modulesView.style.display = 'none';
            if (deckplanView) deckplanView.style.display = 'none';
            if (paintView) paintView.style.display = 'flex';
            if (tabModules) tabModules.style.background = 'transparent';
            if (tabDeckplan) tabDeckplan.style.background = 'transparent';
            if (tabPaint) tabPaint.style.background = 'rgba(56, 189, 248, 0.2)';
        }
    }

    renderDeckPlanUI() {
        const container = document.getElementById('ep-design-slots');
        if (!container) return;
        container.innerHTML = '';

        if (!this.currentDraft.hull) {
            container.innerHTML = '<div style="grid-column:1/-1; color:#ef4444; text-align:center; padding:20px;">Select a hull chassis first!</div>';
            return;
        }

        const slots = this.currentDraft.slots || [];
        slots.forEach((assigned, i) => {
            const slot = document.createElement('div');
            slot.className = 'ep-panel';
            slot.style.cssText = `
                padding: 10px;
                text-align: center;
                border: 1px ${assigned ? 'solid #38bdf8' : 'dashed #334155'};
                min-height: 80px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                cursor: pointer;
                background: ${assigned ? 'rgba(56, 189, 248, 0.1)' : 'transparent'};
                transition: all 0.2s;
            `;
            
            slot.innerHTML = `
                <div style="font-size:0.6rem; color:#94a3b8; margin-bottom:5px; text-transform:uppercase;">SLOT ${i+1}</div>
                <div style="color:${assigned ? '#4ade80' : '#475569'}; font-size:0.8rem; font-weight:bold;">
                    ${assigned ? assigned.name : 'EMPTY'}
                </div>
                ${assigned ? `<div style="font-size:0.6rem; color:#64748b;">${assigned.type.toUpperCase()}</div>` : ''}
                ${!assigned ? `<div style="font-size:0.6rem; color:#38bdf8; margin-top:5px;">CLICK TO ASSIGN</div>` : ''}
            `;
            
            slot.onclick = () => {
                if (assigned) {
                    this.currentDraft.slots[i] = null;
                    this.updatePreview();
                    this.renderDeckPlanUI();
                } else {
                    this.setTab('modules');
                    this.game.notify(`Select a weapon or shield to assign to Slot ${i+1}`, "info");
                }
            };
            
            container.appendChild(slot);
        });
    }

    renderDesignerUI() {
        if (!this.currentDraft) this.currentDraft = { hull: null, engine: null, weapons: [], shields: [], slots: [] };
        if (!this.currentDraft.slots) this.currentDraft.slots = [];

        const renderList = (type, containerId, clickHandler) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            this.getAvailableModules(type).forEach(m => {
                const el = document.createElement('div');
                el.className = 'ep-design-item';
                el.dataset.moduleId = m.id;
                el.dataset.moduleType = type;
                el.setAttribute('role', 'button');
                el.tabIndex = 0;
                el.setAttribute('aria-label', `Select ${m.name}`);
                el.style.cssText = 'padding:10px; background:rgba(255,255,255,0.05); border:1px solid transparent; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.2s;';
                el.innerHTML = `
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold; color:#e2e8f0;">${m.name}</span>
                        <span style="font-size:0.75em; color:#94a3b8;">${m.desc}</span>
                    </div>
                    <span style="font-size:0.8em; color:#fbbf24;">${m.cost.alloys || 0} A</span>
                `;

                const isSelected = (type === 'hull' && this.currentDraft.hull === m) ||
                    (type === 'engine' && this.currentDraft.engine === m) ||
                    (this.currentDraft.slots && this.currentDraft.slots.includes(m));

                if (isSelected) {
                    el.style.borderColor = '#38bdf8';
                    el.style.background = 'rgba(56, 189, 248, 0.2)';
                    el.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.2)';
                }

                el.onclick = () => clickHandler(m);
                el.onkeydown = (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        clickHandler(m);
                    }
                };
                el.onmouseenter = () => { if (!isSelected) el.style.background = 'rgba(255,255,255,0.1)'; };
                el.onmouseleave = () => { if (!isSelected) el.style.background = 'rgba(255,255,255,0.05)'; };
                container.appendChild(el);
            });
        };

        const handleSlotAssignment = (m) => {
            if (!this.currentDraft.hull) {
                this.game.notify("Select a hull first!", "warning");
                return;
            }
            const existingIdx = this.currentDraft.slots.indexOf(m);
            if (existingIdx > -1) {
                this.currentDraft.slots[existingIdx] = null;
            } else {
                const emptyIdx = this.currentDraft.slots.indexOf(null);
                if (emptyIdx > -1) {
                    this.currentDraft.slots[emptyIdx] = m;
                } else {
                    this.game.notify("No empty slots available!", "warning");
                }
            }
            this.updatePreview();
        };

        renderList('hull', 'ep-design-hulls', (m) => { 
            this.currentDraft.hull = m; 
            this.currentDraft.slots = new Array(m.stats.capacity || 4).fill(null);
            this.updatePreview(); 
        });
        renderList('engine', 'ep-design-engines', (m) => { this.currentDraft.engine = m; this.updatePreview(); });
        renderList('weapon', 'ep-design-weapons', handleSlotAssignment);
        renderList('shield', 'ep-design-shields', handleSlotAssignment);

        this.updatePreview();
    }

    updatePreview() {
        const refreshHighlight = (type, containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            Array.from(container.children).forEach(el => {
                el.style.borderColor = 'transparent';
                el.style.background = 'rgba(255,255,255,0.05)';
                el.style.boxShadow = 'none';

                const span = el.querySelector('span');
                if (!span) return;
                const name = span.innerText;
                const m = Object.values(this.modules).find(mod => mod.name === name);
                if (m) {
                    const isSelected = (type === 'hull' && this.currentDraft.hull === m) ||
                        (type === 'engine' && this.currentDraft.engine === m) ||
                        (this.currentDraft.slots && this.currentDraft.slots.includes(m));

                    if (isSelected) {
                        el.style.borderColor = '#38bdf8';
                        el.style.background = 'rgba(56, 189, 248, 0.2)';
                        el.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.2)';
                    }
                }
            });
        };

        refreshHighlight('hull', 'ep-design-hulls');
        refreshHighlight('engine', 'ep-design-engines');
        refreshHighlight('weapon', 'ep-design-weapons');
        refreshHighlight('shield', 'ep-design-shields');

        const weapons = (this.currentDraft.slots || []).filter(m => m && m.type === 'weapon');
        const shields = (this.currentDraft.slots || []).filter(m => m && m.type === 'shield');

        const tempDesign = new ShipDesign('Preview', this.currentDraft.hull, this.currentDraft.engine, weapons, shields);
        tempDesign.deckPlan = (this.currentDraft.slots || []).map((m, i) => ({ id: `slot_${i}`, type: 'general', module: m }));

        const updateStat = (id, val, suffix = '') => {
            const el = document.querySelector(`#${id} span`);
            if (el) el.innerText = val + suffix;
        };

        updateStat('ep-stat-hp', tempDesign.stats.hp);
        updateStat('ep-stat-dmg', tempDesign.stats.damage);
        updateStat('ep-stat-range', tempDesign.stats.range);
        updateStat('ep-stat-speed', tempDesign.stats.speed);
        updateStat('ep-stat-cap', tempDesign.stats.capacity);

        updateStat('ep-stat-cost-alloys', tempDesign.cost.alloys);
        updateStat('ep-stat-cost-energy', tempDesign.cost.energy);
        updateStat('ep-stat-cost-circuits', tempDesign.cost.circuits);

        if (!this.renderer) {
            const canvas = document.getElementById('ep-ship-preview-canvas');
            if (canvas) this.renderer = new ShipRenderer(canvas);
        }
        if (this.renderer) {
            this.renderer.render(this.currentDraft);
        }
    }

    finalizeDesign() {
        if (!this.currentDraft.hull) { this.game.notify("Hull Required!", "danger"); return; }
        if (!this.currentDraft.engine) { this.game.notify("Engine Required!", "danger"); return; }

        const name = document.getElementById('ep-design-name').value || "Unknown Class";
        const weapons = (this.currentDraft.slots || []).filter(m => m && m.type === 'weapon');
        const shields = (this.currentDraft.slots || []).filter(m => m && m.type === 'shield');
        const design = new ShipDesign(name, this.currentDraft.hull, this.currentDraft.engine, weapons, shields);
        design.deckPlan = (this.currentDraft.slots || []).map((m, i) => ({ id: `slot_${i}`, type: 'general', module: m }));
        design.hullColor = this.currentDraft.hullColor || '#38bdf8';

        // Roadmap Item 429: Retrofitting - Update existing ship if applicable
        if (this.currentDraft.retrofitId) {
            const ship = this.game.ships.find(s => s.id === this.currentDraft.retrofitId);
            if (ship) {
                ship.design = design;
                ship.stats.hp = Math.min(ship.stats.hp, design.stats.hp);
                ship.stats.maxHp = design.stats.hp;
                this.game.notify(`✅ RETROFIT COMPLETE: ${ship.name} updated.`, "success");
            }
        } else {
            this.saveDesign(design);
            this.game?.notify?.(`Design ${design.name} submitted to Fleet Shipyard.`, "success");
        }

        document.getElementById('ep-designer-modal').style.display = 'none';

        if (this.game.fleetManager) {
            this.game.fleetManager.openFleetUI();
        }
    }

    getModuleInSlot(index) {
        if (!this.currentDraft.slots) return null;
        return this.currentDraft.slots[index];
    }
}

class ShipRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    render(design) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Grid Background
        this.drawGrid(ctx, w, h);

        if (!design.hull) return;

        ctx.save();
        ctx.translate(cx, cy);

        // Scale based on hull size generally
        let scale = 1.0;
        if (design.hull.id.includes('titan')) scale = 0.4;
        else if (design.hull.id.includes('dreadnought')) scale = 0.5;
        else if (design.hull.id.includes('carrier')) scale = 0.55;
        else if (design.hull.id.includes('battleship') || design.hull.id.includes('cruiser')) scale = 0.7;
        ctx.scale(scale, scale);

        // 1. Draw Engine Flames (Behind)
        if (design.engine) {
            this.drawEngineFlames(ctx, design.engine);
        }

        // 2. Draw Hull (Body)
        this.drawHull(ctx, design.hull);

        // 3. Draw Engine Nozzles (On Hull)
        if (design.engine) {
            this.drawEngineHardware(ctx, design.engine);
        }

        // 4. Draw Weapons
        if (design.weapons && design.weapons.length > 0) {
            this.drawWeapons(ctx, design.weapons, design.hull);
        }

        // 5. Draw Shields (Overlay)
        if (design.shields && design.shields.length > 0) {
            this.drawShields(ctx, design.shields);
        }

        ctx.restore();
    }

    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.lineWidth = 1;
        const size = 40;
        for (let x = 0; x < w; x += size) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += size) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    drawHull(ctx, hull) {
        // Style
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.strokeStyle = this.currentDraft?.hullColor || '#38bdf8'; // Roadmap Item 406
        ctx.lineWidth = 3;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 15;

        ctx.beginPath();

        switch (hull.id) {
            case 'hull_corvette':
                // Triangle / Needle
                ctx.moveTo(0, -60);
                ctx.lineTo(25, 40);
                ctx.lineTo(0, 30);
                ctx.lineTo(-25, 40);
                ctx.closePath();
                break;
            case 'hull_frigate':
                // Arrowhead
                ctx.moveTo(0, -80);
                ctx.lineTo(35, 20);
                ctx.lineTo(45, 60);
                ctx.lineTo(0, 50);
                ctx.lineTo(-45, 60);
                ctx.lineTo(-35, 20);
                ctx.closePath();
                break;
            case 'hull_destroyer':
                // Angular heavy
                ctx.moveTo(0, -100);
                ctx.lineTo(30, -40);
                ctx.lineTo(40, 20);
                ctx.lineTo(50, 70);
                ctx.lineTo(0, 80);
                ctx.lineTo(-50, 70);
                ctx.lineTo(-40, 20);
                ctx.lineTo(-30, -40);
                ctx.closePath();
                break;
            case 'hull_cruiser':
                // Elongated Hex
                ctx.moveTo(0, -120);
                ctx.lineTo(30, -80);
                ctx.lineTo(30, 80);
                ctx.lineTo(50, 100);
                ctx.lineTo(0, 90);
                ctx.lineTo(-50, 100);
                ctx.lineTo(-30, 80);
                ctx.lineTo(-30, -80);
                ctx.closePath();
                break;
            case 'hull_carrier':
                // Wide, flat deck look
                ctx.moveTo(-60, -100);
                ctx.lineTo(60, -100);
                ctx.lineTo(70, 100);
                ctx.lineTo(-70, 100);
                ctx.closePath();
                // Flight deck stripes
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 2;
                for (let i = -80; i < 80; i += 40) {
                    ctx.beginPath(); ctx.moveTo(-30, i); ctx.lineTo(30, i); ctx.stroke();
                }
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 3;
                break;
            case 'hull_dreadnought':
                // Massive
                ctx.moveTo(0, -150);
                ctx.lineTo(40, -100);
                ctx.lineTo(60, 0);
                ctx.lineTo(80, 100);
                ctx.lineTo(30, 120);
                ctx.lineTo(0, 110);
                ctx.lineTo(-30, 120);
                ctx.lineTo(-80, 100);
                ctx.lineTo(-60, 0);
                ctx.lineTo(-40, -100);
                ctx.closePath();
                break;
            case 'hull_titan':
                // Gigantic Spear/Diamond
                ctx.moveTo(0, -200);
                ctx.lineTo(60, -50);
                ctx.lineTo(100, 100);
                ctx.lineTo(0, 180);
                ctx.lineTo(-100, 100);
                ctx.lineTo(-60, -50);
                ctx.closePath();
                // Core glow
                ctx.fill();
                ctx.save();
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#f472b6';
                ctx.fillStyle = 'rgba(244, 114, 182, 0.5)';
                ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                break;
            default:
                ctx.arc(0, 0, 50, 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#0ea5e9';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.fillRect(-5, -20, 10, 15);
    }

    drawEngineFlames(ctx, engine) {
        // Glowy flames
        const thrust = engine.stats.speed;
        const len = thrust * 1.5 + 20;

        ctx.fillStyle = '#f59e0b'; // Amber
        if (engine.id === 'eng_fusion') ctx.fillStyle = '#3b82f6'; // Blue
        if (engine.id === 'eng_antimatter') ctx.fillStyle = '#a855f7'; // Purple

        ctx.globalAlpha = 0.6;
        ctx.shadowBlur = 20;
        ctx.shadowColor = ctx.fillStyle;

        // Draw multiple plumes based on engine type logic (simplified)
        // Center plume
        this.drawPlume(ctx, 0, 40, 15, len);

        if (thrust > 30) {
            this.drawPlume(ctx, 20, 40, 10, len * 0.8);
            this.drawPlume(ctx, -20, 40, 10, len * 0.8);
        }

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    drawPlume(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + w / 2, y);
        ctx.fill();
    }

    drawEngineHardware(ctx, engine) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-10, 30, 20, 10); // Center nozzle
    }

    drawWeapons(ctx, weapons, hull) {
        // Mount positions vary by hull, but for procedural simplicity we'll fan them out
        let positions = [];
        if (weapons.length === 1) positions = [{ x: 0, y: -10 }];
        else if (weapons.length === 2) positions = [{ x: -20, y: 0 }, { x: 20, y: 0 }];
        else if (weapons.length === 3) positions = [{ x: 0, y: -40 }, { x: -25, y: 10 }, { x: 25, y: 10 }];
        else positions = [{ x: -20, y: -20 }, { x: 20, y: -20 }, { x: -35, y: 20 }, { x: 35, y: 20 }];

        weapons.forEach((w, i) => {
            if (!positions[i]) return;
            const pos = positions[i];

            ctx.save();
            ctx.translate(pos.x, pos.y);

            // Draw Turret
            ctx.fillStyle = '#ef4444'; // Red for weapon
            if (w.id.includes('mining')) ctx.fillStyle = '#fcd34d'; // Yellow
            if (w.id.includes('railgun')) ctx.fillStyle = '#fff';

            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            // Barrel
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -15);
            ctx.stroke();

            ctx.restore();
        });
    }

    drawShields(ctx, shields) {
        // Draw Bubble
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.3;

        let size = 80;
        if (shields.some(s => s.id === 'mod_shield_heavy')) size = 110;

        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(96, 165, 250, 0.1)';
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

window.ShipModule = ShipModule;
window.ShipDesign = ShipDesign;
window.ShipDesigner = ShipDesigner;
