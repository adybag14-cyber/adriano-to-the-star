/**
 * Fleet System
 * Manages active ships, fleet capacity, and fleet operations.
 */

class FleetManager {
    constructor(game) {
        this.game = game;
        this.maxSize = 10; // Increased base cap for wings
        this.wings = {
            'Alpha': { name: 'Alpha Wing', bonus: 'damage', ships: [], type: 'interceptor' },
            'Beta': { name: 'Beta Wing', bonus: 'speed', ships: [], type: 'bomber' },
            'Gamma': { name: 'Gamma Wing', bonus: 'defense', ships: [], type: 'support' }
        };
        this.missions = {
            'scout_patrol': { name: 'Sector Patrol', duration: 10, risk: 0.5, reward: { data: 50 }, req: { speed: 10 } },
            'asteroid_mining': { name: 'Asteroid Belt', duration: 30, risk: 0.1, reward: { minerals: 100 }, req: { capacity: 20 } },
            'trader_protection': { name: 'Escort Duty', duration: 60, risk: 0.2, reward: { credits: 200 }, req: { damage: 20 } },
            'salvage_run': { name: 'Salvage Operation', duration: 45, risk: 0.3, reward: { alloys: 50, circuits: 10 }, req: { capacity: 30 } }, // Item 263
            'convoy_escort': { name: 'Convoy Escort', duration: 90, risk: 0.05, reward: { credits: 500 }, req: { damage: 40, defense: 30 } }, // Item 270
            'event_horizon': { name: 'Event Horizon Probe', duration: 120, risk: 0.8, reward: { dark_matter: 5, data: 2000 }, req: { speed: 80, defense: 50 } }, // Item 366
            'anomaly_survey': { name: 'Anomaly Survey', duration: 60, risk: 0.2, reward: { data: 500 }, req: { science: 20 } }, // Item 363
            'prototype_test': { name: 'Prototype Testing', duration: 180, risk: 0.4, reward: { credits: 1000, data: 1000 }, req: { tier: 3 } }, // Item 430
            'bounty_hunt': { name: 'Bounty Hunting', duration: 240, risk: 0.6, reward: { credits: 1000, data: 100 }, req: { damage: 50, defense: 20 } }, // Item 466
            'mercenary_contract': { name: 'Mercenary Contract', duration: 180, risk: 0.4, reward: { credits: 500, alloys: 200 }, req: { capacity: 40, defense: 30 } }, // Item 467
            'distress_signal': { name: 'Item 465: Search & Rescue', duration: 90, risk: 0.3, reward: { credits: 300, data: 50 }, req: { speed: 30 } },
            'jump_calibration': { name: 'Item 474: Jump Drive Calibration', duration: 60, risk: 0.1, reward: { data: 200 }, req: { tier: 2 } },
            'slingshot_run': { name: 'Item 476: Gravitational Slingshot', duration: 45, risk: 0.5, reward: { credits: 400 }, req: { speed: 50 } },
            'grand_prix': { name: 'Item 496: Galactic Grand Prix', duration: 120, risk: 0.6, reward: { credits: 5000, reputation: 20 }, req: { speed: 100 } },
            'rogue_ai_hunt': { name: 'Item 495: Rogue AI Suppression', duration: 240, risk: 0.8, reward: { circuits: 500, data: 1000 }, req: { damage: 80 } },
            'precursor_dig': { name: 'Item 470: Precursor Salvage', duration: 360, risk: 0.7, reward: { dark_matter: 10, credits: 5000 }, req: { science: 50, tier: 4 } }
        };

        // Roadmap Item 261: Shipyard Automation
        this.shipyardQueue = [];
        this.automationLevel = 1; // 1 = Manual, 2 = Assisted, 3 = Full AI

        // Roadmap Item 402: Fleet Formations
        this.formations = {
            'V-Shape': { name: 'V-Shape', bonus: { damage: 1.1, speed: 1.0 }, desc: 'Offensive focus.' },
            'Line': { name: 'Line', bonus: { range: 1.2, speed: 0.9 }, desc: 'Broadside coverage.' },
            'Turtle': { name: 'Turtle', bonus: { defense: 1.3, speed: 0.7 }, desc: 'Defensive wall.' }
        };
        this.activeFormation = 'V-Shape';
        this.missionHistory = [];
        this.missionSequence = 0;
        this.automatedMiningEnabled = false;
    }

    setFormation(name) {
        if (this.formations[name]) {
            this.activeFormation = name;
            this.game.notify(`Fleet re-aligned to ${name} formation.`, "info");
            this.renderFleetList();
        }
    }

    init() {
        if (!this.game.ships) this.game.ships = [];
        this.automatedDeployment = false; // Roadmap Item 173
        console.log("Fleet Manager Initialized");
    }

    update(dt) {
        const simDt = Math.max(0, Number(dt) || 0);
        this.game.ships.forEach(ship => {
            if (!ship?.design) return;
            if (!ship.stats) ship.stats = {};
            const designStats = ship.design.stats || {};
            ship.stats.wear = Number(ship.stats.wear || 0) + 0.001 * simDt;
            if (ship.stats.wear > 50 && Math.random() < 0.01 * simDt) {
                this.game.notify(`MAINTENANCE: ${ship.name} is accumulating space-dust and micrometeorite wear.`, 'warning');
            }

            const currentStar = this.game.universe?.galacticMap?.stars?.find((star) =>
                String(star.id) === String(ship.currentStarId || this.game.currentSystemId)
            ) || this.game.universe?.getCurrentStar?.();
            const solarWindBonus = (currentStar && (currentStar.type === 'Blue Giant' || currentStar.type === 'Pulsar')) ? 1.4 : 1.0;
            const hasSolarSail = !!ship.design?.hull?.id?.includes?.('solar');
            const windMult = (hasSolarSail ? 1.2 : 1.0) * solarWindBonus;
            const pulsarNav = this.game.technologies?.pulsar_nav?.unlocked ? 1.3 : 1.0;
            const relativisticMult = Number(designStats.speed || 0) > 50 ? 1.5 : 1.0;
            const cryoMult = ship.hasCryoPods ? 1.25 : 1.0;

            if (ship.design?.hull?.id?.includes?.('carrier') && ship.status === 'docked') {
                this.performHangarMaintenance(ship, simDt);
            }

            if (ship.status === 'mission' && ship.mission) {
                const missionDef = this.missions[ship.mission.type];
                if (!missionDef) {
                    ship.status = 'docked';
                    ship.mission = null;
                } else {
                    if (!Number.isFinite(Number(ship.mission.durationSeconds))) {
                        const legacyDurationMs = Number(ship.mission.duration || 0);
                        ship.mission.durationSeconds = legacyDurationMs > 500 ? legacyDurationMs / 1000 : (legacyDurationMs || missionDef.duration);
                    }
                    if (!Number.isFinite(Number(ship.mission.remaining))) {
                        const legacyStart = Number(ship.mission.startTime || 0);
                        if (legacyStart > 0 && Number(ship.mission.duration || 0) > 0) {
                            ship.mission.remaining = Math.max(0, (legacyStart + Number(ship.mission.duration) - Date.now()) / 1000);
                        } else {
                            ship.mission.remaining = Number(ship.mission.durationSeconds || missionDef.duration);
                        }
                    }
                    const missionRate = Math.max(0.1, windMult * pulsarNav * relativisticMult * cryoMult);
                    ship.mission.elapsed = Number(ship.mission.elapsed || 0) + simDt * missionRate;
                    ship.mission.remaining = Math.max(0, Number(ship.mission.remaining || 0) - simDt * missionRate);
                    if (ship.mission.remaining <= 0) this.completeMission(ship);
                }
            }

            if (ship.status === 'docked' && Number(ship.stats.hp || 0) < Number(ship.stats.maxHp || 0)) {
                this.performDryDockRepair(ship, simDt);
            }
        });

        if (this.game.day > 250 && Math.random() < 0.0001 * simDt) this.triggerFlagshipEncounter();
        this.updateShipyard(simDt);
        if (this.automatedDeployment && Math.random() < 0.005 * simDt) this.executeAutoCoordination();
        this.updateAutomatedMining(simDt);
    }

    updateAutomatedMining(dt) {
        if (!this.automatedMiningEnabled) return;

        const miningShips = this.game.ships.filter(s => s.status === 'docked' && s.design.stats.capacity > 10);
        if (miningShips.length > 0 && Math.random() < 0.01 * dt) {
            const ship = miningShips[Math.floor(Math.random() * miningShips.length)];
            this.startMission(ship, 'asteroid_mining');
            this.game.notify(`🤖 AUTO-MINING: ${ship.name} deployed to asteroid belt.`, "info");
        }
    }

    updateShipyard(dt) {
        if (this.shipyardQueue.length === 0) return;

        // Roadmap Item 232: 3D Hull Printer boost
        const hasHullPrinter = this.game.structures.some(s => s.type === 'hull_printer' && s.condition > 50);
        const printerMult = hasHullPrinter ? 2.5 : 1.0;

        const currentJob = this.shipyardQueue[0];
        currentJob.progress += (0.1 * this.automationLevel * printerMult) * dt;

        if (currentJob.progress >= 1.0) {
            const design = currentJob.design;
            if (this.game && typeof this.game.createShipFromDesign === 'function') {
                this.game.createShipFromDesign(design);
                this.game.notify(`🏗️ SHIPYARD: Automated construction of ${design.name} complete.`, "success");
            }
            this.shipyardQueue.shift();
            this.openFleetUI(); // Refresh
        }
    }

    performHangarMaintenance(ship, dt) {
        // Roadmap Item 411: Carriers slowly restore fighter wings while docked
        if (!ship.stats.fighterCount) ship.stats.fighterCount = ship.design.hull.stats.hangarValue || 0;
        const maxFighters = ship.design.hull.stats.hangarValue || 0;

        if (ship.stats.fighterCount < maxFighters) {
            ship.stats.fighterCount = Math.min(maxFighters, ship.stats.fighterCount + 0.1 * dt);
        }
    }

    performDryDockRepair(ship, dt) {
        // Roadmap Item 262 & 405: Dry-dock repairs (Hull & Components)
        const repairRate = 2.0; // HP per second
        const componentRepairRate = 5.0; // % per second
        const costPerHP = 0.5; // Credits

        // 1. Repair Hull HP
        const needed = ship.stats.maxHp - ship.stats.hp;
        if (needed > 0) {
            const canRepair = Math.min(needed, repairRate * dt);
            const cost = canRepair * costPerHP;

            if (this.game.resources.credits >= cost) {
                this.game.resources.credits -= cost;
                ship.stats.hp += canRepair;
                if (ship.stats.hp >= ship.stats.maxHp) {
                    ship.stats.hp = ship.stats.maxHp;
                    this.game.notify(`🔧 DRY-DOCK: ${ship.name} hull fully repaired.`, "success");
                }
            }
        }

        // 2. Repair Components (Roadmap Item 405)
        if (ship.componentHealth) {
            Object.keys(ship.componentHealth).forEach(modId => {
                if (ship.componentHealth[modId] < 100) {
                    const modNeeded = 100 - ship.componentHealth[modId];
                    const modRepair = Math.min(modNeeded, componentRepairRate * dt);
                    const modCost = modRepair * 0.2; // Cheaper than hull

                    if (this.game.resources.credits >= modCost) {
                        this.game.resources.credits -= modCost;
                        ship.componentHealth[modId] += modRepair;
                        if (ship.componentHealth[modId] >= 100) {
                            ship.componentHealth[modId] = 100;
                            this.game.notify(`🔧 DRY-DOCK: ${ship.name} component ${modId} restored.`, "success");
                        }
                    }
                }
            });
        }
    }

    queueShipBuild(design) {
        // Roadmap Item 261: Queue a ship for automated construction
        this.shipyardQueue.push({
            design: design,
            progress: 0
        });
        this.game.notify(`🏗️ SHIPYARD: ${design.name} added to automated construction queue.`, "info");
    }

    executeAutoCoordination() {
        // AI selects idle ships and assigns missions based on colony needs
        const idleShips = this.game.ships.filter(s => s.status === 'docked');
        if (idleShips.length === 0) return;

        const ship = idleShips[Math.floor(Math.random() * idleShips.length)];
        const missionKeys = Object.keys(this.missions);
        const mKey = missionKeys[Math.floor(Math.random() * missionKeys.length)];

        this.startMission(ship, mKey);
        this.game.notify(`🤖 FLEET AI: Automatically coordinated ${ship.name} for ${this.missions[mKey].name}.`, "info");
    }

    getFleetPower() {
        return this.game.ships.reduce((total, ship) => {
            return total + (ship.design.stats.damage * 10) + (ship.design.stats.hp / 2);
        }, 0);
    }

    triggerFlagshipEncounter() {
        // Roadmap Item 380: Faction 'Flagship' encounter logic
        if (!this.game.factionManager) return;
        const hostileFactions = Object.values(this.game.factionManager.factions).filter(f =>
            f.id !== 'player' && this.game.factionManager.getOpinion(f.id, 'player') < -50
        );

        if (hostileFactions.length === 0) return;
        const faction = hostileFactions[Math.floor(Math.random() * hostileFactions.length)];

        this.game.notify(`⚠️ CAPITAL SHIP SIGNATURE: ${faction.name} Flagship detected in high orbit!`, "danger");
        this.game.recordColonyEvent(`A hostile ${faction.name} Flagship has arrived to blockade the system.`, 0.9);

        // Potential combat trigger
        if (this.game.combat) {
            // startCombat([playerShips], [flagshipEncounter])
        }
    }

    openCrewManagement(shipId) {
        const ship = this.game.ships.find(s => s.id === shipId);
        if (!ship) return;

        let modal = document.getElementById('ep-crew-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-crew-modal';
            modal.className = 'ep-modal-overlay';
            document.body.appendChild(modal);
        }

        const availableNPCs = Object.values(this.game.npcSystem.npcs).filter(npc => !npc.assignedShipId);

        modal.innerHTML = `
            <div class="ep-modal" style="width:500px; background:#0f172a; border:1px solid #38bdf8;">
                <div class="ep-modal-header">
                    <h3>👥 CREW ASSIGNMENT: ${ship.name}</h3>
                    <button onclick="document.getElementById('ep-crew-modal').style.display='none'">×</button>
                </div>
                <div class="ep-modal-body" style="padding:20px; display:flex; flex-direction:column; gap:10px;">
                    ${availableNPCs.map(npc => `
                        <div class="ep-panel" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                            <div>
                                <div style="font-weight:bold; color:#fff;">${npc.name}</div>
                                <div style="font-size:0.75em; color:#94a3b8;">${npc.role}</div>
                            </div>
                            <button class="ep-sys-btn" onclick="window.game.assignNPCToShip('${npc.id}', '${ship.id}'); document.getElementById('ep-crew-modal').style.display='none';">ASSIGN</button>
                        </div>
                    `).join('')}
                    ${availableNPCs.length === 0 ? '<div style="text-align:center; color:#64748b;">No more available personnel.</div>' : ''}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    dockShips(shipIdA, shipIdB) {
        // Roadmap Item 427: Ship-to-ship docking
        const shipA = this.game.ships.find(s => s.id === shipIdA);
        const shipB = this.game.ships.find(s => s.id === shipIdB);
        if (!shipA || !shipB) return;

        if (shipA.status !== 'docked' || shipB.status !== 'docked') {
            this.game.notify("Both ships must be in port to perform orbital docking.", "warning");
            return;
        }

        this.game.notify(`🔗 DOCKING: ${shipA.name} and ${shipB.name} have established a hard-link.`, "success");

        // Roadmap Items 437-438: Fuel and Ammo Logistics Transfer
        let transferred = false;

        // Fuel transfer from ship with fuel pod
        if (shipA.design.modules.some(m => m.id === 'mod_fuel_pod') && shipB.stats.fuel < shipB.stats.maxFuel) {
            const amount = Math.min(shipA.stats.fuel, shipB.stats.maxFuel - shipB.stats.fuel);
            if (amount > 0) {
                shipA.stats.fuel -= amount;
                shipB.stats.fuel += amount;
                this.game.notify(`${shipA.name} transferred ${Math.floor(amount)} units of fuel to ${shipB.name}.`, "info");
                transferred = true;
            }
        }

        // Ammo transfer from ship with ammo rack
        if (shipA.design.modules.some(m => m.id === 'mod_ammo_rack') && shipB.stats.ammo < shipB.stats.maxAmmo) {
            const amount = Math.min(shipA.stats.ammo, shipB.stats.maxAmmo - shipB.stats.ammo);
            if (amount > 0) {
                shipA.stats.ammo -= amount;
                shipB.stats.ammo += amount;
                this.game.notify(`${shipA.name} transferred ${Math.floor(amount)} units of ammo to ${shipB.name}.`, "info");
                transferred = true;
            }
        }

        if (!transferred) {
            this.game.notify("Docking complete, but no resources were transferred.", "info");
        }
    }

    scrapShip(shipId) {
        const idx = this.game.ships.findIndex(s => s.id === shipId);
        if (idx > -1) {
            const ship = this.game.ships[idx];

            // Roadmap Item 264: Decommissioning bonuses
            const bonusMult = this.game.technologies?.recycling?.unlocked ? 0.75 : 0.5;

            // Refund some resources
            const refund = { alloys: 0, circuits: 0 };
            if (ship.design && ship.design.cost) {
                refund.alloys = Math.floor(ship.design.cost.alloys * bonusMult);
                refund.circuits = Math.floor(ship.design.cost.circuits * bonusMult);
            }

            this.game.resources.alloys = (this.game.resources.alloys || 0) + refund.alloys;
            this.game.resources.circuits = (this.game.resources.circuits || 0) + refund.circuits;

            this.game.ships.splice(idx, 1);
            this.game.notify(`Ship Decommissioned. Refunded ${refund.alloys} Alloys, ${refund.circuits} Circuits.`, "info");
            this.game.updateResourceUI();
            this.openFleetUI(); // Refresh
        }
    }

    hashUnit(value) {
        const text = String(value ?? '');
        let hash = 2166136261;
        for (let i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0) / 0xffffffff;
    }

    getShipMissionStats(ship) {
        const design = ship?.design || {};
        const base = design.stats || {};
        const modules = Array.isArray(design.modules)
            ? design.modules
            : [design.hull, design.engine, ...(design.weapons || []), ...(design.shields || [])].filter(Boolean);
        let detection = 0;
        let shieldHp = 0;
        modules.forEach((module) => {
            const stats = module?.stats || {};
            detection += Number(stats.detectionBonus || 0) * 25;
            if (module?.type === 'shield') shieldHp += Number(stats.hp || 0);
        });
        const stats = {
            speed: Number(base.speed || 0),
            capacity: Number(base.capacity || 0),
            damage: Number(base.damage || 0),
            defense: Math.max(0, Number(base.hp || ship?.stats?.maxHp || 0) / 10 + shieldHp / 20),
            science: Math.max(0, Number(base.range || 0) * 0.2 + detection + Number(base.tier || 1) * 5),
            tier: Math.max(1, Number(base.tier || 1))
        };

        const formation = this.formations[this.activeFormation];
        if (formation?.bonus?.damage) stats.damage *= Number(formation.bonus.damage);
        if (formation?.bonus?.speed) stats.speed *= Number(formation.bonus.speed);
        if (this.activeFormation === 'Line') stats.science *= 1.08;
        if (this.activeFormation === 'Turtle') stats.defense *= 1.3;

        if (ship?.wing === 'Alpha') stats.damage *= 1.1;
        if (ship?.wing === 'Beta') stats.speed *= 1.1;
        if (ship?.wing === 'Gamma') stats.defense *= 1.15;
        const commandLevel = Number(this.game?.pilotSkills?.fleet_command || 0);
        const commandMult = 1 + Math.max(0, commandLevel) * 0.02;
        stats.speed *= commandMult;
        stats.damage *= commandMult;
        stats.defense *= commandMult;
        return stats;
    }

    formatMissionRequirements(requirements = {}) {
        const labels = { speed: 'SPD', capacity: 'CAP', damage: 'DMG', defense: 'DEF', science: 'SCI', tier: 'TIER' };
        return Object.entries(requirements || {}).map(([key, need]) => `${labels[key] || key.toUpperCase()} ${need}`).join(' · ');
    }

    getMissionEligibility(ship, missionKey) {
        const mission = this.missions[missionKey];
        if (!ship || !mission) return { valid: false, reasons: ['Unknown vessel or mission'], stats: {} };
        if (ship.status !== 'docked') return { valid: false, reasons: ['Vessel is not docked'], stats: this.getShipMissionStats(ship) };
        if (missionKey === 'prototype_test' && !String(ship.name || '').includes('Prototype')) {
            return { valid: false, reasons: ['Prototype vessel required'], stats: this.getShipMissionStats(ship) };
        }
        const stats = this.getShipMissionStats(ship);
        const reasons = [];
        Object.entries(mission.req || {}).forEach(([key, need]) => {
            const actual = Number(stats[key] || 0);
            if (actual + 1e-6 < Number(need || 0)) reasons.push(`${key}: ${actual.toFixed(key === 'tier' ? 0 : 1)}/${need}`);
        });
        return { valid: reasons.length === 0, reasons, stats };
    }

    getMissionSuccessChance(ship, missionKey, eligibility = null) {
        const mission = this.missions[missionKey];
        if (!mission) return 0;
        const result = eligibility || this.getMissionEligibility(ship, missionKey);
        if (!result.valid) return 0;
        const requirements = Object.entries(mission.req || {});
        let margin = 0;
        if (requirements.length) {
            margin = requirements.reduce((sum, [key, need]) => {
                const ratio = Number(result.stats[key] || 0) / Math.max(1, Number(need || 1));
                return sum + Math.max(0, Math.min(2, ratio) - 1);
            }, 0) / requirements.length;
        }
        const crewBonus = Math.min(0.06, (ship.crew?.length || 0) * 0.01);
        const formationBonus = this.activeFormation === 'Turtle' ? 0.035 : (this.activeFormation === 'V-Shape' ? 0.015 : 0.02);
        return Math.max(0.35, Math.min(0.98, 1 - Number(mission.risk || 0) * 0.55 + margin * 0.12 + crewBonus + formationBonus));
    }

    startSelectedMission(shipId) {
        const ship = this.game.ships.find((entry) => String(entry.id) === String(shipId));
        const select = document.querySelector(`.ep-fleet-mission-select[data-ship-id="${CSS.escape(String(shipId))}"]`);
        if (!ship || !select?.value) {
            this.game.notify('Select an eligible fleet mission first.', 'info');
            return false;
        }
        return this.startMission(ship, select.value);
    }

    startMission(ship, missionKey) {
        const mission = this.missions[missionKey];
        if (!mission || !ship) return false;
        const eligibility = this.getMissionEligibility(ship, missionKey);
        if (!eligibility.valid) {
            this.game.notify(`${mission.name} unavailable: ${eligibility.reasons.join(', ')}`, 'warning');
            return false;
        }

        const successChance = this.getMissionSuccessChance(ship, missionKey, eligibility);
        this.missionSequence += 1;
        const id = `fleet_${this.missionSequence}_${Date.now().toString(36)}`;
        const outcomeRoll = this.hashUnit(`${id}:${ship.id}:${missionKey}:${Math.floor(Number(this.game.day || 0))}`);
        ship.status = 'mission';
        ship.currentStarId = ship.currentStarId || String(this.game.currentSystemId || 'kepler_186f');
        ship.mission = {
            id,
            type: missionKey,
            durationSeconds: Number(mission.duration || 1),
            remaining: Number(mission.duration || 1),
            elapsed: 0,
            risk: Number(mission.risk || 0),
            successChance,
            outcomeRoll,
            startedDay: Number(this.game.day || 0),
            originStarId: String(ship.currentStarId)
        };
        this.game.notify(`${ship.name} deployed on ${mission.name}.`, 'info');
        this.game.recordColonyEvent?.(`${ship.name} departed on fleet mission: ${mission.name}.`, Math.max(0.25, Number(mission.risk || 0)), 'info');
        this.renderFleetList();
        return true;
    }

    completeMission(ship) {
        const missionState = ship?.mission;
        const mission = missionState ? this.missions[missionState.type] : null;
        if (!ship || !missionState || !mission) return false;
        const successChance = Number.isFinite(Number(missionState.successChance))
            ? Number(missionState.successChance)
            : this.getMissionSuccessChance(ship, missionState.type);
        const roll = Number.isFinite(Number(missionState.outcomeRoll))
            ? Number(missionState.outcomeRoll)
            : this.hashUnit(`${missionState.id || ship.id}:${missionState.type}`);
        const success = roll <= successChance;
        const maxHp = Math.max(1, Number(ship.stats?.maxHp || ship.design?.stats?.hp || 100));
        let damage = 0;
        const awarded = {};

        if (success) {
            Object.entries(mission.reward || {}).forEach(([resource, raw]) => {
                const amount = Number(raw || 0);
                if (!Number.isFinite(amount)) return;
                this.game.resources[resource] = Number(this.game.resources[resource] || 0) + amount;
                awarded[resource] = amount;
            });
            ship.stats.wear = Number(ship.stats.wear || 0) + Number(mission.risk || 0) * 1.5;
            this.game.notify(`${ship.name} completed ${mission.name}.`, 'success');
        } else {
            damage = Math.max(1, Math.ceil(maxHp * (0.08 + Number(mission.risk || 0) * 0.22)));
            ship.stats.hp = Math.max(1, Number(ship.stats.hp || maxHp) - damage);
            ship.stats.wear = Number(ship.stats.wear || 0) + Number(mission.risk || 0) * 5;
            this.game.notify(`${ship.name} aborted ${mission.name} after taking ${damage} hull damage.`, 'warning');
        }

        const historyEntry = {
            id: missionState.id || `fleet_history_${Date.now().toString(36)}`,
            shipId: ship.id,
            shipName: ship.name,
            missionKey: missionState.type,
            missionName: mission.name,
            success,
            successChance,
            roll,
            damage,
            rewards: awarded,
            completedDay: Number(this.game.day || 0),
            durationSeconds: Number(missionState.durationSeconds || mission.duration || 0)
        };
        this.missionHistory.unshift(historyEntry);
        if (this.missionHistory.length > 60) this.missionHistory.length = 60;
        ship.status = 'docked';
        ship.mission = null;
        this.game.recordColonyEvent?.(
            success
                ? `${ship.name} returned successfully from ${mission.name}.`
                : `${ship.name} returned damaged after aborting ${mission.name}.`,
            Math.max(0.35, Number(mission.risk || 0)),
            success ? 'success' : 'warning'
        );
        this.game.updateResourceUI();
        if (document.getElementById('ep-fleet-modal') && document.getElementById('ep-fleet-modal').style.display !== 'none') this.renderFleetList();
        return historyEntry;
    }

    prepareForShipRestore() {
        Object.values(this.wings).forEach((wing) => { wing.ships = []; });
    }

    serialize() {
        return {
            version: 2,
            maxSize: this.maxSize,
            activeFormation: this.activeFormation,
            automationLevel: this.automationLevel,
            automatedDeployment: !!this.automatedDeployment,
            automatedMiningEnabled: !!this.automatedMiningEnabled,
            missionSequence: Number(this.missionSequence || 0),
            missionHistory: this.missionHistory.slice(0, 60),
            shipyardQueue: this.shipyardQueue.map((job) => ({
                designId: job.design?.id || job.designId || null,
                progress: Math.max(0, Math.min(1, Number(job.progress || 0)))
            })).filter((job) => job.designId)
        };
    }

    restore(raw) {
        if (!raw || typeof raw !== 'object') {
            this.rebuildWingAssignments();
            return false;
        }
        if (Number.isFinite(Number(raw.maxSize))) this.maxSize = Math.max(1, Math.floor(Number(raw.maxSize)));
        if (raw.activeFormation && this.formations[raw.activeFormation]) this.activeFormation = raw.activeFormation;
        if (Number.isFinite(Number(raw.automationLevel))) this.automationLevel = Math.max(1, Math.min(3, Math.floor(Number(raw.automationLevel))));
        this.automatedDeployment = !!raw.automatedDeployment;
        this.automatedMiningEnabled = !!raw.automatedMiningEnabled;
        this.missionSequence = Math.max(0, Math.floor(Number(raw.missionSequence || 0)));
        this.missionHistory = Array.isArray(raw.missionHistory) ? raw.missionHistory.slice(0, 60).map((entry) => ({ ...entry })) : [];
        const designs = this.game.shipDesigner?.designs || [];
        this.shipyardQueue = Array.isArray(raw.shipyardQueue) ? raw.shipyardQueue.map((job) => {
            const design = designs.find((entry) => String(entry.id) === String(job.designId));
            return design ? { design, progress: Math.max(0, Math.min(1, Number(job.progress || 0))) } : null;
        }).filter(Boolean) : [];
        this.rebuildWingAssignments();
        return true;
    }

    rebuildWingAssignments() {
        Object.values(this.wings).forEach((wing) => { wing.ships = []; });
        (this.game.ships || []).forEach((ship) => {
            if (ship?.wing && this.wings[ship.wing] && !this.wings[ship.wing].ships.includes(ship.id)) this.wings[ship.wing].ships.push(ship.id);
        });
    }

    openFleetUI() {
        let modal = document.getElementById('ep-fleet-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-fleet-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="ep-modal" style="width:900px; max-width:95vw; height:85vh; display:flex; flex-direction:column; background:rgba(15, 23, 42, 0.95); border:1px solid #334155; box-shadow:0 0 50px rgba(0,0,0,0.8);">
                    <div class="ep-modal-header" style="background:rgba(30, 41, 59, 0.8); border-bottom:1px solid #334155; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                        <h2 style="margin:0; color:#f472b6; text-shadow:0 0 10px rgba(244, 114, 182, 0.5);">🚀 Fleet Command</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-fleet-modal').style.display='none'">CLOSE</button>
                    </div>
                    
                    <div style="padding:15px; background:rgba(15, 23, 42, 0.6); border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
                        <span id="ep-fleet-stats" style="color:#e2e8f0; font-family:'Orbitron', sans-serif; font-size:1.1em;">Fleet Strength: 0 | Ships: 0/5</span>
                        
                        <!-- Roadmap Item 402: Formation Selection -->
                        <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.3); padding:5px 10px; border-radius:8px; border:1px solid #334155;">
                            <span style="font-size:0.8rem; color:#94a3b8;">Formation:</span>
                            <select id="ep-fleet-formation" style="background:transparent; border:none; color:#38bdf8; font-family:'Orbitron'; font-size:0.8rem; outline:none;" onchange="window.game.fleetManager.setFormation(this.value)">
                                <option value="V-Shape">V-Shape</option>
                                <option value="Line">Line</option>
                                <option value="Turtle">Turtle</option>
                            </select>
                        </div>

                        <button class="ep-sys-btn" id="ep-btn-new-design" style="background:linear-gradient(45deg, #db2777, #f472b6); color:#fff; font-weight:bold; border:none; box-shadow:0 0 15px rgba(219, 39, 119, 0.5);">🛠️ NEW DESIGN</button>
                    </div>

                    <div class="ep-modal-body" id="ep-fleet-list" style="flex:1; overflow-y:auto; padding:20px; display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:20px;">
                        <!-- Ship Cards -->
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('ep-btn-new-design').onclick = () => {
                modal.style.display = 'none';
                this.game.shipDesigner.openDesigner();
            };
        }

        this.renderFleetList();
        const formationSelect = modal.querySelector('#ep-fleet-formation');
        if (formationSelect) formationSelect.value = this.activeFormation;
        modal.style.display = 'flex';
    }

    runDutyStation(station) {
        // Roadmap Item 462: Bridge "Duty Stations" placeholder
        this.game.notify(`Directing attention to ${station.toUpperCase()} station. Synergy bonus active!`, "success");
    }

    shareFleetResources() {
        // Roadmap Item 473: Fleet-wide resource sharing
        let totalFuel = 0;
        let totalMaxFuel = 0;
        this.game.ships.forEach(s => {
            if (s.stats.fuel !== undefined) {
                totalFuel += s.stats.fuel;
                totalMaxFuel += s.stats.maxFuel || 100;
            }
        });

        if (totalMaxFuel > 0) {
            const avg = totalFuel / this.game.ships.length;
            this.game.ships.forEach(s => {
                if (s.stats.fuel !== undefined) s.stats.fuel = avg;
            });
            this.game.notify("🔄 LOGISTICS: Fleet-wide fuel equalization complete.", "info");
            this.renderFleetList();
        }
    }

    buildShipFromSelectedDesign() {
        const select = document.getElementById('ep-fleet-build-design');
        if (!select) return;

        const designId = select.value;
        if (!designId) return;

        const designs = (this.game.shipDesigner && Array.isArray(this.game.shipDesigner.designs))
            ? this.game.shipDesigner.designs
            : [];
        const design = designs.find((d) => d && d.id != null && String(d.id) === String(designId));

        if (!design) {
            this.game.notify('Ship design not found.', 'warning');
            return;
        }

        if (this.game && typeof this.game.buildShipFromDesign === 'function') {
            this.game.buildShipFromDesign(design);
        }
        this.openFleetUI();
    }

    assignToWing(shipId, wingName) {
        const ship = this.game.ships.find(s => s.id === shipId);
        if (!ship) return;

        // Remove from old wing if any
        Object.values(this.wings).forEach(w => {
            const idx = w.ships.indexOf(shipId);
            if (idx > -1) w.ships.splice(idx, 1);
        });

        if (wingName !== 'none') {
            this.wings[wingName].ships.push(shipId);
            ship.wing = wingName;
            this.game.notify(`${ship.name} assigned to ${this.wings[wingName].name}`, "success");
        } else {
            ship.wing = null;
        }
        this.renderFleetList();
    }

    renderFleetList() {
        const container = document.getElementById('ep-fleet-list');
        const statsEl = document.getElementById('ep-fleet-stats');
        if (!container || !statsEl) return;

        container.innerHTML = '';
        statsEl.innerText = `Fleet Strength: ${Math.floor(this.getFleetPower())} | Ships: ${this.game.ships.length}/${this.maxSize}`;

        // Render Wings Overview
        const wingHeader = document.createElement('div');
        wingHeader.style.cssText = 'grid-column:1/-1; display:flex; gap:20px; margin-bottom:10px;';
        Object.entries(this.wings).forEach(([id, w]) => {
            const activeBonus = this.game && this.game.pilotSkills ? (this.game.pilotSkills.fleet_command || 0) * 2 : 0;
            wingHeader.innerHTML += `
                <div style="flex:1; background:rgba(30, 41, 59, 0.4); border:1px solid #334155; border-radius:8px; padding:10px;">
                    <div style="color:#60a5fa; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">${w.name}</div>
                    <div style="color:#94a3b8; font-size:1.1rem; font-weight:bold;">${w.ships.length} Units</div>
                    <div style="font-size:0.7rem; color:#4ade80;">Bonus: +${activeBonus}% ${w.bonus}</div>
                </div>
            `;
        });
        container.appendChild(wingHeader);

        if (this.missionHistory.length) {
            const historyCard = document.createElement('div');
            historyCard.style.cssText = 'grid-column:1/-1; background:rgba(2,6,23,.45); border:1px solid #273449; border-radius:9px; padding:10px;';
            historyCard.innerHTML = `
                <div style="font:700 .7rem Orbitron,sans-serif;color:#94a3b8;margin-bottom:7px;">RECENT MISSION LOG</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">
                    ${this.missionHistory.slice(0, 4).map((entry) => `<div style="padding:7px;border-radius:6px;background:rgba(15,23,42,.7);font-size:.66rem;color:#cbd5e1;"><strong style="color:${entry.success ? '#86efac' : '#fca5a5'}">${entry.success ? 'SUCCESS' : 'ABORTED'}</strong> · ${entry.missionName}<br><span style="color:#64748b">${entry.shipName}${entry.damage ? ` · ${entry.damage} dmg` : ''}</span></div>`).join('')}
                </div>
            `;
            container.appendChild(historyCard);
        }

        const designs = (this.game.shipDesigner && Array.isArray(this.game.shipDesigner.designs))
            ? this.game.shipDesigner.designs
            : [];

        const shipyardCard = document.createElement('div');
        shipyardCard.style.cssText = `
            grid-column:1/-1;
            background:rgba(30, 41, 59, 0.4);
            border:1px solid #334155;
            border-radius:12px;
            padding:15px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:15px;
            flex-wrap:wrap;
        `;

        if (designs.length === 0) {
            shipyardCard.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="font-weight:bold; color:#38bdf8;">🛠️ Shipyard</div>
                    <div style="color:#94a3b8; font-size:0.9em;">No designs available. Create a blueprint to build ships.</div>
                </div>
                <button class="ep-sys-btn" style="background:linear-gradient(45deg, #db2777, #f472b6); color:#fff; font-weight:bold; border:none; box-shadow:0 0 15px rgba(219, 39, 119, 0.5);" onclick="document.getElementById('ep-fleet-modal').style.display='none'; window.game.shipDesigner.openDesigner();">🛠️ NEW DESIGN</button>
            `;
        } else {
            const options = designs.map(d => `<option value="${d.id}">${d.name} (${Math.floor(d.cost.alloys)} A / ${Math.floor(d.cost.energy)} E)</option>`).join('');
            shipyardCard.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="font-weight:bold; color:#38bdf8;">🛠️ Shipyard</div>
                    <div style="color:#94a3b8; font-size:0.9em;">Build a new ship from an existing blueprint.</div>
                </div>
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <select id="ep-fleet-build-design" style="background:rgba(0,0,0,0.35); border:1px solid #334155; color:#e2e8f0; padding:8px 10px; border-radius:8px; min-width:260px;">
                        ${options}
                    </select>
                    <button class="ep-sys-btn" style="background:rgba(56, 189, 248, 0.2); border-color:#38bdf8; color:#38bdf8; font-weight:bold;" onclick="window.game.fleetManager.buildShipFromSelectedDesign()">BUILD</button>
                </div>
            `;
        }
        container.appendChild(shipyardCard);

        if (this.game.ships.length === 0) {
            const emptyCard = document.createElement('div');
            emptyCard.style.cssText = 'grid-column:1/-1; text-align:center; color:#64748b; margin-top:20px; display:flex; flex-direction:column; align-items:center; gap:20px;';
            emptyCard.innerHTML = `
                <div style="font-size:4em; opacity:0.2;">🚀</div>
                <div style="font-size:1.2em;">No ships in fleet.</div>
            `;
            container.appendChild(emptyCard);
            return;
        }

        this.game.ships.forEach(ship => {
            const card = document.createElement('div');
            const isDocked = ship.status === 'docked';
            const statusColor = isDocked ? '#4ade80' : '#facc15';

            // Roadmap Item 472: Customized UI for different ship types
            let typeColor = '#38bdf8';
            if (ship.design.hull.id.includes('titan')) typeColor = '#f472b6';
            else if (ship.design.hull.id.includes('carrier')) typeColor = '#fbbf24';
            else if (ship.design.hull.id.includes('destroyer')) typeColor = '#ef4444';

            card.style.cssText = `
                background:rgba(30, 41, 59, 0.6); 
                border:1px solid ${isDocked ? '#334155' : statusColor}; 
                border-left: 4px solid ${typeColor};
                border-radius:12px; 
                padding:15px; 
                display:flex; 
                flex-direction:column; 
                gap:10px; 
                position:relative;
                transition: transform 0.2s, box-shadow 0.2s;
                backdrop-filter: blur(5px);
            `;

            const hpPct = (ship.stats.hp / ship.stats.maxHp) * 100;
            const crewCount = ship.crew ? ship.crew.length : 0;
            const crewCap = (ship.design.stats.tier || 1) * 2;
            const wingOptions = Object.keys(this.wings).map(wid => `<option value="${wid}" ${ship.wing === wid ? 'selected' : ''}>${this.wings[wid].name}</option>`).join('');
            const missionOptions = Object.entries(this.missions).map(([key, mission]) => {
                const eligibility = this.getMissionEligibility(ship, key);
                const req = this.formatMissionRequirements(mission.req);
                const suffix = eligibility.valid ? '' : ` · LOCKED (${eligibility.reasons.join(', ')})`;
                return `<option value="${key}" ${eligibility.valid ? '' : 'disabled'}>${mission.name} · ${mission.duration}s · ${req || 'No requirement'}${suffix}</option>`;
            }).join('');
            const activeMission = ship.mission ? this.missions[ship.mission.type] : null;
            const missionStatus = activeMission
                ? `${activeMission.name} · ${Math.max(0, Number(ship.mission.remaining || 0)).toFixed(1)}s remaining · ${Math.round(Number(ship.mission.successChance || 0) * 100)}% projected success`
                : 'Docked and available for deployment.';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold; color:#f472b6; font-size:1.1em;">${ship.name}</span>
                        <span style="font-size:0.8em; color:#94a3b8;">${ship.design.hull.name} Class</span>
                    </div>
                    <span style="font-size:0.7em; letter-spacing:1px; font-weight:bold; color:${statusColor}; border:1px solid ${statusColor}; padding:2px 8px; border-radius:12px; background:${statusColor}22;">${ship.status.toUpperCase()}</span>
                </div>
                <div style="margin:5px 0;">
                    <div style="display:flex; justify-content:space-between; font-size:0.7em; color:#cbd5e1; margin-bottom:2px;">
                        <span>Hull Integrity</span>
                        <span>${Math.floor(ship.stats.hp)}/${ship.stats.maxHp}</span>
                    </div>
                    <div style="background:#0f172a; height:6px; border-radius:3px; overflow:hidden;">
                        <div style="width:${hpPct}%; background:${hpPct > 50 ? '#4ade80' : '#ef4444'}; height:100%;"></div>
                    </div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <span style="font-size:0.75rem; color:#94a3b8;">Wing:</span>
                    <select style="flex:1; background:rgba(0,0,0,0.3); border:1px solid #334155; color:#eee; font-size:0.75rem; border-radius:4px; padding:4px;" 
                            onchange="window.game.fleetManager.assignToWing('${ship.id}', this.value)">
                        <option value="none">Unassigned</option>
                        ${wingOptions}
                    </select>
                </div>
                <div style="font-size:0.7rem; color:#94a3b8;">Crew: ${crewCount}/${crewCap}</div>
                <div class="ep-fleet-mission-status" style="font-size:0.68rem; color:${activeMission ? '#facc15' : '#86efac'}; padding:7px 8px; border-radius:6px; background:rgba(2,6,23,.45);">${missionStatus}</div>
                <div style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:6px; width:100%;">
                    <select class="ep-fleet-mission-select" data-ship-id="${ship.id}" ${isDocked ? '' : 'disabled'} style="min-width:0; background:#0f172a; border:1px solid #334155; color:#cbd5e1; border-radius:6px; padding:6px; font-size:.66rem;">
                        <option value="">Select mission...</option>
                        ${missionOptions}
                    </select>
                    <button class="ep-sys-btn ep-fleet-deploy" data-ship-id="${ship.id}" ${isDocked ? '' : 'disabled'} style="border-color:#38bdf8; color:#7dd3fc;" onclick="window.game.fleetManager.startSelectedMission('${ship.id}')">DEPLOY</button>
                </div>
                <div style="display:flex; gap:5px; width:100%; margin-top:5px;">
                    <button class="ep-sys-btn" style="flex:1; font-size:0.65em;" onclick="window.game.fleetManager.runDutyStation('helm')">DUTY</button>
                    <button class="ep-sys-btn" style="flex:1; font-size:0.65em;" onclick="window.game.fleetManager.shareFleetResources()">SHARE</button>
                </div>
                <div style="display:flex; gap:5px; width:100%;">
                    <button class="ep-sys-btn" style="flex:1; font-size:0.7em; padding:4px;" onclick="window.game.fleetManager.openCrewManagement('${ship.id}')">Manage Crew</button>
                    <button class="ep-sys-btn" style="flex:1; font-size:0.7em; padding:4px; border-color:#ef4444; color:#ef4444;" onclick="window.game.fleetManager.scrapShip('${ship.id}')" ${isDocked ? '' : 'disabled'}>Scrap</button>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

window.FleetManager = FleetManager;
