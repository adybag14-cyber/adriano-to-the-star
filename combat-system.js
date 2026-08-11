/**
 * Combat System
 * Handles tactical auto-battles between fleets.
 */

class CombatManager {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.isPaused = false; // Roadmap Item 432: Tactical Pause
        this.playerFleet = [];
        this.enemyFleet = [];
        this.combatLog = [];
        this.round = 0;
        this.autoPlayInterval = null;
        
        // Roadmap Item 415: Combat Stance
        this.stance = 'Balanced'; // 'Aggressive', 'Defensive', 'Balanced'
    }

    startCombat(playerShips, encounter) {
        this.active = true;
        this.playerFleet = playerShips;
        this.enemyFleet = encounter.ships;
        this.reward = encounter.reward;
        this.combatLog = [`Combat Started against ${encounter.name}!`];
        this.round = 0;

        // Roadmap Item 426: Initialize Formations
        this.playerFormation = 'Line'; // Default
        this.enemyFormation = 'V-Shape';

        // Roadmap Item 416: Initialize Shield Frequencies
        [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
            if (!ship.shieldFrequency) ship.shieldFrequency = Math.floor(Math.random() * 5) + 1; // 1-5
        });

        this.openCombatUI();
        this.updateCombatUI();
    }

    resolveRound() {
        if (!this.active || this.isPaused) return;
        this.round++;
        this.log(`--- Round ${this.round} ---`);

        // Roadmap Block 7: Timeline Sniping & Dimensional Warfare
        if (this.round % 5 === 0 && Math.random() < 0.1) {
            this.executeTimelineSniping();
        }

        // Roadmap Item 475: Asteroid Field Hazards
        if (Math.random() < 0.05) {
            const victim = [...this.playerFleet, ...this.enemyFleet].filter(s => s.stats.hp > 0)[Math.floor(Math.random() * (this.playerFleet.length + this.enemyFleet.length))];
            if (victim) {
                const impactDmg = 15;
                victim.stats.hp -= impactDmg;
                this.log(`☄️ ASTEROID IMPACT: ${victim.name} struck by space debris (-${impactDmg} HP)!`, 'danger');
            }
        }

        // Roadmap Item 478: Ion Storm Hazards
        if (Math.random() < 0.03) {
            this.log(`⛈️ ION STORM: Electro-magnetic interference detected. Shields and EWAR affected!`, 'warning');
            [...this.playerFleet, ...this.enemyFleet].forEach(s => {
                if (s.stats.shield > 0) s.stats.shield = Math.max(0, s.stats.shield - 10);
                s.empStun = Math.max(s.empStun || 0, 1);
            });
        }

        // Roadmap Item 441: Reduce EMP Stun
        [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
            if (ship.empStun > 0) ship.empStun--;
        });

        // Roadmap Item 442: Boarding Drone Damage
        [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
            if (ship.boardingDrones > 0 && ship.stats.hp > 0) {
                const droneDmg = ship.boardingDrones * 5;
                ship.stats.hp -= droneDmg;
                this.log(`🚁 HULL BREACH: Boarding drones are eating through ${ship.name} (-${droneDmg} HP).`, 'danger');
            }
        });

        // Roadmap Item 431: Fleet command and control (C2) AI
        this.updateFleetAI();

        // Roadmap Item 433: Newtonian Physics Foundation (Positioning checks)
        this.updateNewtonianSim();

        // Roadmap Items 445-446: Orbital Defenses
        this.resolveOrbitalDefenses();

        // Roadmap Item 463: Firefighting Teams
        [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
            if (ship.stats.hp > 0 && ship.onFire) {
                // Fire logic ...
            }
        });

        // Roadmap Item 480: Oxygen Management
        [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
            if (ship.stats.hp > 0 && (ship.stats.hp / ship.stats.maxHp) < 0.2) {
                if (!ship.oxygenAlert) {
                    ship.oxygenAlert = true;
                    this.log(`💨 OXYGEN CRITICAL: Life support failing on ${ship.name}!`, 'danger');
                }
                const asphyxiationDmg = 5;
                ship.stats.hp -= asphyxiationDmg;
            }
        });

        // Roadmap Item 479: Radiation Damage to Crew
        if (this.game.universeManager?.currentStar?.type === 'Neutron Star' || this.game.universeManager?.currentStar?.type === 'Pulsar') {
            if (this.round % 5 === 0) {
                this.log(`☢️ RADIATION: High-energy particles penetrating hulls. Crew health declining!`, 'warning');
                [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
                    if (ship.stats.hp > 0) ship.stats.hp -= 2;
                });
            }
        }

        // Roadmap Item 418: Structural Integrity under high-G maneuvers
        if (this.stance === 'Aggressive') {
            this.playerFleet.forEach(ship => {
                if (ship.stats.hp > 0 && Math.random() < 0.05) {
                    const stressDmg = Math.floor(Math.random() * 5 + 2);
                    ship.stats.hp -= stressDmg;
                    this.log(`⚠️ STRUCTURAL STRESS: ${ship.name} took ${stressDmg} dmg from high-G combat maneuvers.`, 'warning');
                }
            });
        }

        // Roadmap Item 436: Repair Drones logic
        [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
            if (ship.stats.hp > 0 && ship.stats.hp < ship.stats.maxHp) {
                const droneHub = ship.design.modules.find(m => m.id === 'mod_repair_drone');
                if (droneHub) {
                    const repairAmt = (droneHub.stats.repairRate || 5) * (droneHub.stats.drones || 1);
                    ship.stats.hp = Math.min(ship.stats.maxHp, ship.stats.hp + repairAmt);
                    if (this.round % 3 === 0) this.log(`🛠️ REPAIR DRONES: ${ship.name} hull being restored (+${repairAmt} HP).`);
                }
            }
        });

        // Roadmap Item 410: Regenerative Shields
        [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
            if (ship.stats.hp > 0 && ship.design.shields.length > 0) {
                const regen = ship.design.shields.some(s => s.id.includes('regenerative')) ? 10 : 2;
                ship.stats.shield = Math.min(ship.stats.maxShield || 50, (ship.stats.shield || 0) + regen);
            }
        });
        this.playerFleet.forEach(ship => {
            if (ship.stats.hp <= 0) return;
            const target = this.findTarget(this.enemyFleet);
            if (target) {
                this.attack(ship, target);
            }
        });

        // Enemy turn
        this.enemyFleet.forEach(ship => {
            if (ship.stats.hp <= 0) return;
            const target = this.findTarget(this.playerFleet);
            if (target) {
                this.attack(ship, target);
            }
        });

        this.updateCombatUI();
        this.checkCombatStatus();
    }

    // Roadmap Item 3755: Timeline Sniping
    executeTimelineSniping() {
        this.log("⏳ TEMPORAL ANOMALY: A tachyon pulse from an alternate timeline struck the field!", "warning");
        const allShips = [...this.playerFleet, ...this.enemyFleet].filter(s => s.stats.hp > 0);
        if (allShips.length === 0) return;

        const victim = allShips[Math.floor(Math.random() * allShips.length)];
        const effects = ['repair', 'damage', 'shift'];
        const effect = effects[Math.floor(Math.random() * effects.length)];

        if (effect === 'repair') {
            victim.stats.hp = victim.stats.maxHp;
            this.log(`✨ TEMPORAL REWIND: ${victim.name} has been restored to pristine condition.`);
        } else if (effect === 'damage') {
            victim.stats.hp *= 0.5;
            this.log(`💥 TIMELINE SNIPE: ${victim.name} took damage from a future strike!`);
        } else {
            victim.empStun = 2;
            this.log(`🌀 REALITY SHIFT: ${victim.name} is caught between dimensions and cannot move.`);
        }
    }

    findTarget(fleet) {
        // Simple mechanic: target living ship with lowest HP
        const living = fleet.filter(s => s.stats.hp > 0);
        if (living.length === 0) return null;

        // Roadmap Item 413, 414 & 452: Stealth/Cloaking, Heat & Signature Reduction
        const prioritized = living.sort((a, b) => {
            const getStealthMult = (ship) => {
                let mult = 1.0;
                if (ship.design && ship.design.modules.some(m => m.id.includes('stealth'))) mult *= 0.2;
                if (ship.design && ship.design.modules.some(m => m.id === 'mod_sig_coating')) mult *= 0.7; // Item 452
                return mult;
            };

            const aStealth = getStealthMult(a);
            const bStealth = getStealthMult(b);
            
            // Roadmap Item 415: Radar/Lidar sensor ranges
            // EWAR modules increase detection against stealth
            const playerDetection = this.playerFleet.some(s => s.design && s.design.modules.some(m => m.id.includes('ewar'))) ? 1.5 : 1.0;
            const enemyDetection = this.enemyFleet.some(s => s.design && s.design.modules.some(m => m.id.includes('ewar'))) ? 1.5 : 1.0;

            const detection = b.isEnemy ? playerDetection : enemyDetection;
            const aVal = a.stats.hp / (aStealth * detection);
            const bVal = b.stats.hp / (bStealth * detection);
            return aVal - bVal;
        });

        return prioritized[0];
    }

    resolveOrbitalDefenses() {
        // Roadmap Item 445: Planet-to-space defense batteries
        const batteries = this.game.structures.filter(s => s.type === 'defense_battery' && s.health > 0);
        if (batteries.length > 0 && this.enemyFleet.some(s => s.stats.hp > 0)) {
            const target = this.findTarget(this.enemyFleet);
            if (target) {
                const totalDmg = batteries.length * 25;
                target.stats.hp = Math.max(0, target.stats.hp - totalDmg);
                this.log(`🔋 PLANETARY DEFENSE: Surface batteries firing on ${target.name} for ${totalDmg} dmg!`, 'success');
            }
        }

        // Roadmap Item 446: Space station defense grids
        const stationsWithGrids = this.game.universeManager?.galacticMap.spaceStations.filter(s => s.defenseGrid && s.defenseGrid.active);
        if (stationsWithGrids && stationsWithGrids.length > 0 && this.enemyFleet.some(s => s.stats.hp > 0)) {
            stationsWithGrids.forEach(station => {
                const target = this.findTarget(this.enemyFleet);
                if (target) {
                    const gridDmg = station.defenseGrid.level * 40;
                    target.stats.hp = Math.max(0, target.stats.hp - gridDmg);
                    this.log(`🛡️ STATION DEFENSE: Defense Grid at ${station.starId} engaged ${target.name} (-${gridDmg} HP).`, 'success');
                }
            });
        }
    }

    updateNewtonianSim() {
        // Roadmap Item 433: Real-time Newtonian physics combat foundation
        // Simulated inertia and vector-based positioning impact
        [...this.playerFleet, ...this.enemyFleet].forEach(ship => {
            if (ship.stats.hp <= 0) return;
            if (!ship.vectors) ship.vectors = { velocity: 0, angular: 0, x: 0, y: 0 };
            
            // Influence of RCS (Item 421) on inertia
            const agility = ship.design.modules.find(m => m.id.includes('rcs')) ? 1.5 : 1.0;
            ship.vectors.velocity = Math.min(ship.design.stats.speed, ship.vectors.velocity + 2 * agility);

            // Item 433: Newtonian drift based on current velocity
            ship.vectors.x += ship.vectors.velocity * 0.1;
            ship.vectors.y += Math.sin(this.round) * 5; // Slight drift
        });
    }

    updateFleetAI() {
        // Roadmap Item 431: Automated stance adjustment based on fleet health
        const playerHP = this.playerFleet.reduce((sum, s) => sum + s.stats.hp, 0);
        const playerMaxHP = this.playerFleet.reduce((sum, s) => sum + s.stats.maxHp, 0);
        const ratio = playerHP / playerMaxHP;

        if (ratio < 0.3 && this.stance !== 'Defensive') {
            this.stance = 'Defensive';
            this.log("🤖 FLEET AI: Damage critical. Switching to Defensive Stance.", "warning");
        } else if (ratio > 0.8 && this.enemyFleet.length < this.playerFleet.length && this.stance !== 'Aggressive') {
            this.stance = 'Aggressive';
            this.log("🤖 FLEET AI: Superiority detected. Switching to Aggressive Stance.", "success");
        }
    }

    attack(attacker, defender) {
        let damage = attacker.design.stats.damage || 5;

        // Roadmap Item 481: Internal Atmospheric Venting
        if (defender.onFire && Math.random() < 0.1) {
            this.log(`🌬️ VENTING: ${defender.name} is venting atmosphere to extinguish fires!`, 'info');
            defender.onFire = false;
            defender.stats.hp -= 5; // Damage from decompression
        }

        // Roadmap Item 471: Veteran Buffs
        if (attacker.isVeteran) {
            damage *= 1.25;
            if (Math.random() < 0.05) this.log(`🎖️ VETERAN STRIKE: ${attacker.name} used elite tactics for extra damage!`, 'success');
        }

        // Roadmap Item 461: Neural Link Pilot Sync
        const neuralLink = attacker.design && attacker.design.modules.find(m => m.id === 'mod_neural_link');
        if (neuralLink) {
            const syncMult = neuralLink.stats.pilotSync || 1.2;
            damage *= syncMult;
            if (Math.random() < 0.1) this.log(`🧠 NEURAL LINK: ${attacker.name}'s pilot is in deep sync. Tracking optimized.`, 'success');
        }

        // Roadmap Item 460: AI Core Autopilot Effects
        const hasAICore = attacker.design && attacker.design.modules.some(m => m.id === 'mod_ai_core_basic');
        if (hasAICore) {
            damage *= 1.2; // Improved firing solutions
            if (this.round % 4 === 0) this.log(`🤖 AI CORE: ${attacker.name}'s neural processor optimized tactical systems.`, 'success');
        }

        // Roadmap Item 426: Formation Bonuses
        if (this.playerFormation === 'V-Shape' && !attacker.isEnemy) damage *= 1.2;
        if (this.enemyFormation === 'Circle' && defender.isEnemy) damage *= 0.8; // Defensive

        // Roadmap Item 439: Overheating mechanics
        if (!attacker.heat) attacker.heat = 0;
        attacker.heat += damage * 0.1;
        if (attacker.heat > 100) {
            this.log(`🔥 OVERHEAT: ${attacker.name} weapons offline for calibration!`, 'warning');
            attacker.heat = 50; // Reset heat after forced cooling
            return; // Skip attack
        }

        // Roadmap Item 435: Pilot "Ace" system
        if (attacker.isAce) {
            damage *= 1.5;
            if (Math.random() < 0.1) {
                this.log(`✨ ACE PILOT: ${attacker.name} executed a precision strike!`, 'success');
                damage *= 2.0;
            }
        }

        // Roadmap Item 434: Impact of crew morale on combat efficiency
        if (!attacker.isEnemy && attacker.crew && attacker.crew.length > 0) {
            const avgMorale = attacker.crew.reduce((sum, id) => {
                const npc = this.game.npcSystem.npcs[id];
                const colonist = this.game.colonists.find(c => c.id === id);
                return sum + (colonist ? (colonist.morale || 50) : 50);
            }, 0) / attacker.crew.length;
            
            const moraleMult = 0.5 + (avgMorale / 100); 
            damage *= moraleMult;
            if (avgMorale < 30 && Math.random() < 0.1) {
                this.log(`⚠️ LOW MORALE: ${attacker.name}'s crew is hesitant! Damage reduced.`, 'warning');
            }
        }

        // Roadmap Item 415: Stance Modifiers
        if (!attacker.isEnemy) {
            if (this.stance === 'Aggressive') damage *= 1.3;
            if (this.stance === 'Defensive') damage *= 0.7;
        }

        // Roadmap Item 441: EMP Effects (Disable defender)
        if (defender.empStun > 0) {
            this.log(`⚡ DISABLED: ${defender.name} is rebooting from EMP shock.`, 'info');
            return; // Skip attack
        }

        // --- Capital Ship Logic ---
        // 1. Dreadnought Multiplier
        if (attacker.design.hull && attacker.design.hull.stats.dpsMultiplier) {
            damage *= attacker.design.hull.stats.dpsMultiplier;
        }

        // 2. Carrier Hangar Support
        if (attacker.design.hull && attacker.design.hull.stats.hangarValue) {
            // Roadmap Item 425: Carrier operations (Launching strike craft)
            const fighterCount = attacker.stats.fighterCount || attacker.design.hull.stats.hangarValue || 0;
            
            // Roadmap Items 447-449: Squadron Management
            const modules = attacker.design.modules || [];
            const isInterceptorSpec = modules.some(m => m.id === 'mod_interceptor_bay');
            const isBomberSpec = modules.some(m => m.id === 'mod_bomber_bay');
            
            let fighterDps = fighterCount * 0.5;
            if (isInterceptorSpec) {
                fighterDps *= 1.5; // High damage against other fighters/missiles
                this.log(`✈️ INTERCEPTORS: ${attacker.name} deployed specialized anti-fighter squadrons.`);
            } else if (isBomberSpec) {
                fighterDps *= 2.0; // High damage against hulls
                this.log(`✈️ BOMBERS: ${attacker.name} launched heavy torpedo bombers.`);
            } else {
                this.log(`✈️ FIGHTERS: ${attacker.name} launched standard multi-role squadrons.`);
            }
            
            damage += fighterDps;
            
            if (this.round % 3 === 0) {
                this.log(`✈️ ${attacker.name}'s fighter wings (${Math.floor(fighterCount)} craft) are strafing ${defender.name}!`);
                
                // Roadmap Item 411: Point-defense against fighters
                const enemyPD = defender.design.weapons.filter(mw => mw.stats.isPD).length;
                if (enemyPD > 0 && Math.random() < 0.2) {
                    const lost = Math.min(fighterCount, Math.floor(Math.random() * enemyPD + 1));
                    attacker.stats.fighterCount = Math.max(0, fighterCount - lost);
                    this.log(`🛡️ PD ALERT: ${defender.name} shot down ${lost} fighters from ${attacker.name}!`, 'warning');
                }
            }
        }

        // 3. Doomsday Weapon Logic (Judgment Beam)
        const doomsdayWeapon = attacker.design.weapons.find(w => w.stats.isDoomsday);
        if (doomsdayWeapon) {
            // Doomsday weapons only fire every 5 rounds due to massive recharge
            if (this.round % 5 === 0) {
                damage = doomsdayWeapon.stats.damage;
                this.log(`💥 JUDGMENT BEAM ACTIVATED! ${attacker.name} erases ${defender.name}!`, 'warning');
                if (window.hapticFeedbackSystem) window.hapticFeedbackSystem.triggerHaptic("explosion", 1000, 1.0);
            } else {
                damage = 0; // Charging...
                if (this.round % 5 === 4) {
                    this.log(`☢️ ${attacker.name}'s Doomsday weapon is 90% CHARGED...`);
                }
            }
        }

        // --- Detailed Weapon Types (Roadmap 406-408) ---
        attacker.design.weapons.forEach(w => {
            let wDmg = w.stats.damage || 0;
            
            // Roadmap Item 441: EMP Emitter
            if (w.id.includes('emp_emitter')) {
                if (defender.stats.shield > 0) {
                    const empDmg = (w.stats.empStrength || 40);
                    defender.stats.shield = Math.max(0, defender.stats.shield - empDmg);
                    this.log(`⚡ EMP: ${attacker.name} drained ${Math.floor(empDmg)} shield units from ${defender.name}.`);
                } else if (Math.random() < 0.3) {
                    defender.empStun = 2; // Stun for 2 rounds
                    this.log(`⚡ EMP CRITICAL: ${defender.name} systems short-circuited!`, 'warning');
                }
                wDmg = 0; // EMP deals no direct hull damage
            }

            // Roadmap Item 443: Mine Layers
            if (w.id.includes('mine_layer') && this.round === 1) {
                this.log(`💣 MINES: ${attacker.name} deployed a proximity field around the fleet.`);
            }

            // Roadmap Item 442: Boarding Drones
            if (w.id.includes('boarding_drone') && Math.random() < 0.15) {
                this.log(`🚁 BOARDING DRONE: ${attacker.name} launched a leech pod at ${defender.name}!`);
                defender.boardingDrones = (defender.boardingDrones || 0) + 1;
            }

            // Roadmap Item 411: Point-Defense Interception
            if (w.id.includes('missile') || w.id.includes('torpedo')) {
                const pdValue = defender.design.weapons.filter(mw => mw.stats.isPD).length;
                if (pdValue > 0 && Math.random() < pdValue * 0.2) {
                    this.log(`🛡️ POINT-DEFENSE: ${defender.name} intercepted incoming ordnance from ${attacker.name}!`, 'info');
                    wDmg = 0;
                }
            }

            // Item 406: Beam Weapons (Reliable tracking)
            if (w.id.includes('laser')) {
                // Roadmap Item 417: Ablative Armor vs Beams
                if (defender.design.modules.some(m => m.stats.armorType === 'ablative')) {
                    wDmg *= 0.5;
                    this.log(`🛡️ ARMOR: Ablative plates absorbing ${attacker.name}'s beam fire.`);
                }
            }
            
            // Item 407: Kinetic Weapons (High Hull Dmg, reduced by shields)
            if (w.id.includes('railgun')) {
                // Roadmap Item 417: Reactive Armor vs Kinetics
                if (defender.design.modules.some(m => m.stats.armorType === 'reactive')) {
                    wDmg *= 0.4;
                    this.log(`🛡️ ARMOR: Reactive charges neutralizing ${attacker.name}'s kinetic slugs.`);
                } else if (defender.stats.shield > 0) {
                    wDmg *= 0.5; 
                } else {
                    wDmg *= 1.5;
                }
            }

            // Item 408: Missile Weapons (Pierces Shields)
            if (w.id.includes('missile') || w.id.includes('torpedo')) {
                if (defender.stats.shield > 0 && Math.random() < 0.3) {
                    this.log(`🚀 ${attacker.name}'s ordnance bypassed ${defender.name}'s shields!`);
                    defender.stats.hp -= wDmg * 0.5;
                    wDmg *= 0.5;
                }
            }
            
            damage += wDmg;
        });

        // Roadmap Item 405: Component-based damage
        if (damage > 0 && Math.random() < 0.3) {
            this.applyComponentDamage(defender);
        }

        // Roadmap Items 414 & 450: EWAR, ECM, and ECCM
        const hasEWAR = attacker.wing === 'Gamma' || (attacker.design && attacker.design.modules.some(m => m.id.includes('ewar')));
        if (hasEWAR) {
            // Roadmap Item 450: ECCM (Electronic Counter-Countermeasures)
            const hasECCM = defender.design && defender.design.modules.some(m => m.id.includes('eccm'));
            const jamChance = hasECCM ? 0.05 : 0.2;
            
            if (Math.random() < jamChance) {
                this.log(`📡 EWAR: ${attacker.name} is jamming ${defender.name}'s sensors!`, 'info');
                defender.isJammed = true;
            } else if (hasECCM) {
                this.log(`📡 ECCM: ${defender.name} filtered out ${attacker.name}'s jamming signals.`, 'success');
            }
        }

        // Apply to Shields first (Roadmap Item 409/410)
        if (defender.stats.shield > 0) {
            // Roadmap Item 453: Thermal Decoys
            const decoys = defender.design && defender.design.modules.find(m => m.id === 'mod_decoys');
            if (decoys && Math.random() < 0.25) {
                this.log(`🔥 DECOYS: ${defender.name} deployed thermal decoys! Incoming fire redirected.`, 'info');
                damage *= 0.2; // Major damage reduction
            }

            // Roadmap Item 416: Shield Frequency Modulation
            if (this.round % 3 === 0 && Math.random() < 0.2) {
                defender.shieldFrequency = Math.floor(Math.random() * 5) + 1;
                this.log(`📡 ${defender.name} modulated shield frequencies.`, 'info');
            }

            const matchingFreq = attacker.design.weapons.some(w => w.stats.frequency === defender.shieldFrequency);
            const shieldDmgMult = matchingFreq ? 1.5 : 1.0;

            const shieldDmg = Math.min(defender.stats.shield, damage * shieldDmgMult);
            
            // Roadmap Item 440: Shield Bleed-through
            const bleedRatio = 0.1;
            const bledDmg = damage * bleedRatio;
            defender.stats.hp -= bledDmg;
            damage -= bledDmg;

            defender.stats.shield -= shieldDmg;
            damage -= (shieldDmg / shieldDmgMult);
            if (shieldDmg > 0) {
                this.log(`${defender.name} shields absorbed ${Math.floor(shieldDmg)} dmg.${matchingFreq ? ' (FREQ MATCH!)' : ''}`);
            }
        }

        defender.stats.hp -= damage;
        if (damage > 0) {
            this.log(`${attacker.name} fires at ${defender.name} for ${Math.floor(damage)} dmg!`);
        }

        if (defender.stats.hp <= 0) {
            defender.stats.hp = 0;
            this.log(`${defender.name} was destroyed!`, 'danger');

            // Roadmap Item 500: Cinematic Kill-Cam (Log Effect)
            this.log(`🎥 KILL-CAM: Critical blow delivered by ${attacker.name} to ${defender.name}'s ${Math.random() > 0.5 ? 'reactor' : 'bridge'}.`, 'warning');

            // Roadmap Item 483: Ship History Tracking
            if (!attacker.history) attacker.history = [];
            attacker.history.push({ event: `Destroyed ${defender.name}`, round: this.round, date: Date.now() });

            // Roadmap Item 482: Self-destruct sequence
            if (Math.random() < 0.15) {
                const splashDmg = 20;
                attacker.stats.hp = Math.max(0, attacker.stats.hp - splashDmg);
                this.log(`💥 SELF-DESTRUCT: ${defender.name} reactor went critical! ${attacker.name} took ${splashDmg} proximity damage.`, 'danger');
            }

            // Roadmap Item 464: Lifeboats
            if (Math.random() < 0.5) {
                this.log(`🛰️ LIFEBOATS: Escape pods detected leaving the wreckage of ${defender.name}.`, 'info');
            }
        }

        // Roadmap Item 413: Boarding Parties
        if (defender.stats.hp < 30 && !defender.isEnemy && Math.random() < 0.05) {
            this.log(`🚨 BOARDING ALERT: Enemy parties have entered ${defender.name}!`, 'danger');
            const marineDefense = attacker.crew ? attacker.crew.length * 2 : 5;
            if (Math.random() * 100 > marineDefense) {
                defender.stats.hp -= 15;
                this.log(`💀 CRITICAL: Boarding party Sabotaged ${defender.name}'s reactor!`, 'danger');
            } else {
                this.log(`🛡️ REPELLED: Marines successfully repelled the boarding party on ${defender.name}.`, 'success');
            }
        }

        // Roadmap Item 444: Orbital Bombardment
        const siegeWeapon = attacker.design.weapons.find(w => w.stats.isSiege);
        if (siegeWeapon && attacker.isEnemy) {
            if (Math.random() < 0.1) {
                const targetStruct = this.game.structures[Math.floor(Math.random() * this.game.structures.length)];
                if (targetStruct) {
                    targetStruct.health = Math.max(0, (targetStruct.health || 100) - 20);
                    this.log(`☄️ BOMBARDMENT: ${attacker.name} fired on planetary surface! ${targetStruct.type} damaged.`, 'danger');
                }
            }
        }
    }

    applyComponentDamage(ship) {
        // Roadmap Item 405: Component-based damage
        if (!ship.design || !ship.design.modules) return;
        const modules = ship.design.modules;
        const targetModule = modules[Math.floor(Math.random() * modules.length)];

        if (!ship.componentHealth) ship.componentHealth = {};
        if (ship.componentHealth[targetModule.id] === undefined) ship.componentHealth[targetModule.id] = 100;

        const dmg = Math.floor(Math.random() * 20 + 10);
        ship.componentHealth[targetModule.id] = Math.max(0, ship.componentHealth[targetModule.id] - dmg);

        this.log(`⚠️ CRITICAL HIT: ${ship.name}'s ${targetModule.name} damaged! (${ship.componentHealth[targetModule.id]}%)`, 'warning');

        // Apply stat penalties based on component damage
        if (targetModule.type === 'engine' && ship.componentHealth[targetModule.id] < 50) {
            ship.stats.speed *= 0.7; // Engines damaged -> slower
            this.log(`🐌 ${ship.name} engines sputtering. Speed reduced.`, 'warning');
        }
        if (targetModule.type === 'weapon' && ship.componentHealth[targetModule.id] < 30) {
            ship.stats.damage *= 0.5; // Weapons damaged -> less damage
            this.log(`🚫 ${ship.name} weapon systems malfunctioning!`, 'warning');
        }
    }

    log(msg, type = 'info') {
        this.combatLog.push({ text: msg, type: type });
    }

    checkCombatStatus() {
        const playerAlive = this.playerFleet.some(s => s.stats.hp > 0);
        const enemyAlive = this.enemyFleet.some(s => s.stats.hp > 0);

        if (!playerAlive) {
            this.endCombat(false);
        } else if (!enemyAlive) {
            this.endCombat(true);
        }
    }

    endCombat(victory) {
        this.active = false;
        clearInterval(this.autoPlayInterval);

        if (victory) {
            this.log("VICTORY! Enemy fleet eliminated.", "success");
            this.game.notify("Combat Victory! Resources salvaged.", "success");
            
            // Roadmap Item 471: Ship Veteran Status
            this.playerFleet.forEach(ship => {
                if (ship.stats.hp > 0) {
                    ship.experience = (ship.experience || 0) + 10;
                    if (ship.experience >= 100) {
                        ship.isVeteran = true;
                        this.log(`🎖️ VETERAN: ${ship.name} has reached elite status! Stats boosted.`, 'success');
                    }
                }
            });

            // Roadmap Item 413 & 454: Salvage and Tractor Beam Bonus
            let baseSalvage = 100;
            const hasTractor = this.playerFleet.some(s => s.design && s.design.modules.some(m => m.id === 'mod_tractor_beam'));
            if (hasTractor) {
                baseSalvage *= 1.5;
                this.log(`🏗️ TRACTOR BEAM: Salvage yields increased by 50%!`, 'success');
            }
            this.game.resources.data += baseSalvage;

            // Give Rewards
            if (this.reward) {
                let alloyReward = this.reward.alloys || 0;
                if (hasTractor) alloyReward = Math.floor(alloyReward * 1.5);
                this.game.resources.alloys += alloyReward;
                this.game.resources.credits += this.reward.credits || 0;
            }
        } else {
            this.log("DEFEAT! Your fleet was destroyed.", "danger");
            this.game.notify("Combat Defeat! Ships lost.", "danger");
        }

        // Show close button
        const btn = document.getElementById('ep-btn-retreat');
        if (btn) {
            btn.innerText = "Close Combat";
            btn.onclick = () => this.closeCombatUI();
        }
    }

    // UI ========================================================

    openCombatUI() {
        let modal = document.getElementById('ep-combat-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-combat-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.zIndex = '2000'; // Above everything
            modal.innerHTML = `
                <div class="ep-modal" style="width:800px; height:600px; background:#0f172a; border:2px solid #ef4444; display:flex; flex-direction:column;">
                    <div style="padding:10px; background:#450a0a; color:#fff; font-weight:bold; display:flex; justify-content:space-between;">
                        <span>⚠️ COMBAT ALERT</span>
                        <span>Round <span id="ep-combat-round">0</span></span>
                    </div>
                    
                    <div style="flex:1; display:flex; padding:10px; gap:10px; overflow:hidden;">
                        <!-- Player Fleet -->
                        <div style="flex:1; border:1px solid #334155; padding:5px; overflow-y:auto;">
                            <h4 style="color:#4ade80; margin:0 0 10px 0; text-align:center;">Your Fleet</h4>
                            <div id="ep-combat-player"></div>
                        </div>

                        <!-- Log -->
                        <div style="flex:1; border:1px solid #334155; background:#000; padding:10px; font-family:monospace; font-size:0.9em; overflow-y:auto;" id="ep-combat-log">
                        </div>

                        <!-- Enemy Fleet -->
                        <div style="flex:1; border:1px solid #334155; padding:5px; overflow-y:auto;">
                            <h4 style="color:#ef4444; margin:0 0 10px 0; text-align:center;">Hostiles</h4>
                            <div id="ep-combat-enemy"></div>
                        </div>
                    </div>

                    <div style="padding:10px; display:flex; justify-content:center; gap:10px; background:#1e293b;">
                         <!-- Roadmap Item 432: Tactical Pause -->
                         <button class="ep-sys-btn" onclick="window.game.combat.isPaused = !window.game.combat.isPaused; this.innerText = window.game.combat.isPaused ? 'RESUME' : 'PAUSE';" style="width:100px; border-color:#facc15; color:#facc15;">PAUSE</button>
                         
                         <!-- Roadmap Item 415: Stance Selector -->
                         <select onchange="window.game.combat.stance = this.value" style="background:#0f172a; color:#fff; border:1px solid #334155; padding:5px; border-radius:4px;">
                            <option value="Balanced">Balanced Stance</option>
                            <option value="Aggressive">Aggressive Stance</option>
                            <option value="Defensive">Defensive Stance</option>
                         </select>
                         <button class="ep-sys-btn" id="ep-btn-combat-next" style="width:150px;">Next Round</button>
                         <button class="ep-sys-btn" id="ep-btn-combat-auto" style="width:150px; background:#f472b6; color:#000;">Auto-Battle</button>
                         <button class="ep-sys-btn" id="ep-btn-retreat" style="width:150px; border-color:#ef4444; color:#ef4444;">Retreat</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.style.display = 'flex';

        // Connect Buttons
        document.getElementById('ep-btn-combat-next').onclick = () => this.resolveRound();

        document.getElementById('ep-btn-combat-auto').onclick = () => {
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
                document.getElementById('ep-btn-combat-auto').innerText = "Auto-Battle";
            } else {
                this.autoPlayInterval = setInterval(() => this.resolveRound(), 1000);
                document.getElementById('ep-btn-combat-auto').innerText = "Stop Auto";
            }
        };

        const retreatBtn = document.getElementById('ep-btn-retreat');
        retreatBtn.innerText = "Retreat";
        retreatBtn.onclick = () => {
            this.game.notify("Retreated from battle!", "warning");
            this.closeCombatUI();
        };
    }

    closeCombatUI() {
        if (this.autoPlayInterval) clearInterval(this.autoPlayInterval);
        document.getElementById('ep-combat-modal').style.display = 'none';
        this.active = false;

        // Roadmap Item 428: Salvaging wrecked ships
        const beforeCount = this.game.ships.length;
        const lostShips = this.game.ships.filter(s => s.stats.hp <= 0);
        
        lostShips.forEach(ship => {
            if (Math.random() < 0.4) {
                // Recover some alloys or a module
                const recovery = Math.floor(ship.design.cost.alloys * 0.2);
                this.game.resources.alloys += recovery;
                this.game.notify(`🩹 SALVAGE: Recovered ${recovery} Alloys from the wreck of ${ship.name}.`, "info");
            }
        });

        this.game.ships = this.game.ships.filter(s => s.stats.hp > 0);
        const lost = beforeCount - this.game.ships.length;
        if (lost > 0) {
            this.game.notify(`${lost} ships were lost in battle.`, "danger");
            if (this.game.fleetManager) this.game.fleetManager.renderFleetList();
        }
    }

    updateCombatUI() {
        document.getElementById('ep-combat-round').innerText = this.round;

        const renderShip = (s) => `
            <div style="padding:5px; border:1px solid ${s.stats.hp > 0 ? '#334155' : '#ef4444'}; margin-bottom:5px; background:${s.stats.hp > 0 ? 'transparent' : '#450a0a55'}; opacity:${s.stats.hp > 0 ? 1 : 0.5};">
                <div style="font-size:0.9em;">${s.name}</div>
                <div style="height:4px; background:#333; margin-top:2px;">
                    <div style="width:${(s.stats.hp / s.stats.maxHp) * 100}%; background:${s.stats.hp > 0 ? (s.isEnemy ? '#ef4444' : '#4ade80') : 'transparent'}; height:100%;"></div>
                </div>
                <div style="font-size:0.7em; text-align:right;">${s.stats.hp}/${s.stats.maxHp} HP</div>
            </div>
        `;

        document.getElementById('ep-combat-player').innerHTML = this.playerFleet.map(renderShip).join('');
        document.getElementById('ep-combat-enemy').innerHTML = this.enemyFleet.map(renderShip).join('');

        const logEl = document.getElementById('ep-combat-log');
        // Just render last 20 logs
        const recentLogs = this.combatLog.slice(-20);
        logEl.innerHTML = recentLogs.map(l => {
            let color = '#ccc';
            if (l.text.includes('destroyed')) color = '#ef4444';
            if (l.text.includes('VICTORY')) color = '#facc15';
            return `<div style="color:${color}; margin-bottom:2px;">${l.text}</div>`;
        }).join('');
        logEl.scrollTop = logEl.scrollHeight;
    }
}

window.CombatManager = CombatManager;
