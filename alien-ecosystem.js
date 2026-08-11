
class AlienEcosystem {
    constructor() {
        this.species = {
            flora: [],
            fauna: []
        };
        this.tileLife = {}; // Map tileID -> { flora: id, fauna: id, scanned: boolean }
        this.xenodex = {
            flora: [], // Discovered flora IDs
            fauna: []  // Discovered fauna IDs
        };

        this.prefixes = ['Xeno', 'Cryo', 'Pyro', 'Hydro', 'Litho', 'Aero', 'Bio', 'Mech'];
        this.suffixes = ['phyte', 'saur', 'pod', 'morph', 'vore', 'synth', 'form'];
        
        // Roadmap Item 509: Fauna Designer State
        this.customFauna = []; // Player-designed species
    }

    // Roadmap Item 509: Fauna Designer logic
    createCustomSpecies(name, traits, behavior, diet) {
        const id = `custom_fauna_${Date.now()}`;
        const species = {
            id,
            name,
            traits, // Array of strings (e.g. ['Armored', 'Fast', 'Toxic'])
            behavior,
            diet,
            isCustom: true,
            desc: `A player-designed ${behavior.toLowerCase()} ${diet.toLowerCase()} creature.`
        };
        this.customFauna.push(species);
        this.species.fauna.push(species);
        console.log(`🧬 New Species Designed: ${name}`);
        return species;
    }

    openFaunaDesignerUI() {
        let modal = document.getElementById('ep-fauna-designer-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-fauna-designer-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.cssText = 'display:none; z-index:6000;';
            modal.innerHTML = `
                <div class="ep-modal" style="width:600px; max-width:95vw; background:#020617; border:1px solid #a855f7;">
                    <div class="ep-modal-header">
                        <h2 style="margin:0; color:#a855f7;">🧬 Fauna Designer</h2>
                        <button class="ep-sys-btn" onclick="document.getElementById('ep-fauna-designer-modal').style.display='none'">CLOSE</button>
                    </div>
                    <div class="ep-modal-body" style="padding:20px; color:#fff;">
                        <div style="margin-bottom:15px;">
                            <label>Species Name:</label><br>
                            <input type="text" id="ep-fauna-name" placeholder="Xenosaur..." style="width:100%; background:#1e293b; border:1px solid #334155; color:#fff; padding:8px; border-radius:4px; margin-top:5px;">
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label>Behavior:</label>
                                <select id="ep-fauna-behavior" style="width:100%; background:#1e293b; color:#fff; border:1px solid #334155; padding:5px; border-radius:4px;">
                                    <option>Passive</option><option>Curious</option><option>Skittish</option><option>Aggressive</option>
                                </select>
                            </div>
                            <div>
                                <label>Diet:</label>
                                <select id="ep-fauna-diet" style="width:100%; background:#1e293b; color:#fff; border:1px solid #334155; padding:5px; border-radius:4px;">
                                    <option>Herbivore</option><option>Carnivore</option><option>Lithovore</option><option>Photovore</option>
                                </select>
                            </div>
                        </div>
                        <div style="margin-bottom:20px;">
                            <label>Genetic Traits (Max 3):</label>
                            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; margin-top:5px;">
                                <label><input type="checkbox" class="fauna-trait" value="Armored"> Armored</label>
                                <label><input type="checkbox" class="fauna-trait" value="Fast"> Fast</label>
                                <label><input type="checkbox" class="fauna-trait" value="Bioluminescent"> Glowing</label>
                                <label><input type="checkbox" class="fauna-trait" value="Venomous"> Venomous</label>
                                <label><input type="checkbox" class="fauna-trait" value="Regenerative"> Regrow</label>
                                <label><input type="checkbox" class="fauna-trait" value="Camouflage"> Hidden</label>
                            </div>
                        </div>
                        <button class="ep-sys-btn" style="width:100%; border-color:#a855f7; color:#a855f7; height:40px;" onclick="window.game.ecosystem.finalizeFaunaDesign()">INITIATE BIO-SYNTHESIS</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
    }

    finalizeFaunaDesign() {
        const name = document.getElementById('ep-fauna-name').value || "Unnamed Xeno";
        const behavior = document.getElementById('ep-fauna-behavior').value;
        const diet = document.getElementById('ep-fauna-diet').value;
        const traits = Array.from(document.querySelectorAll('.fauna-trait:checked')).map(cb => cb.value);

        const species = this.createCustomSpecies(name, traits, behavior, diet);
        document.getElementById('ep-fauna-designer-modal').style.display = 'none';
        
        if (window.game) {
            window.game.notify(`🧬 Bio-Synthesis Complete: ${name} added to database.`, "success");
            window.game.recordColonyEvent(`A new species, ${name}, was synthetically designed.`, 0.7);
        }
    }

    init() {
        this.generateFlora(5);
        this.generateFauna(5);
        this.wildlifeManaged = false; // Roadmap Item 177
        this.explorationTeams = []; // Roadmap Item 127: Autonomous exploration teams
        console.log("Alien Ecosystem Initialized:", this.species);
    }

    update(dt, game) {
        // Roadmap Item 177: AI-driven wildlife management
        if (this.wildlifeManaged && Math.random() < 0.01 * dt) {
            this.optimizeWildlife(game);
        }

        // Roadmap Item 127: Autonomous exploration processing
        this.updateExplorationTeams(dt, game);
    }

    updateExplorationTeams(dt, game) {
        // NPCs occasionally form teams to explore nearby sectors or tiles
        if (this.explorationTeams.length < 3 && Math.random() < 0.001 * dt) {
            this.formExplorationTeam(game);
        }

        for (let i = this.explorationTeams.length - 1; i >= 0; i--) {
            const team = this.explorationTeams[i];
            team.progress += 0.02 * dt;
            if (team.progress >= 1.0) {
                this.completeNPCExploration(team, game);
                this.explorationTeams.splice(i, 1);
            }
        }
    }

    formExplorationTeam(game) {
        const potentialLeaders = Object.values(game.npcSystem?.npcs || {}).filter(n => n.personality.openness > 0.7);
        if (potentialLeaders.length === 0) return;

        const leader = potentialLeaders[Math.floor(Math.random() * potentialLeaders.length)];
        const team = {
            id: `team_${Date.now()}`,
            leaderId: leader.id,
            name: `${leader.name}'s Trailblazers`,
            progress: 0,
            target: 'nearby_sector'
        };
        this.explorationTeams.push(team);
        game.notify(`🏃 EXPLORATION: ${team.name} has set out to survey the surrounding wilds.`, "info");
    }

    completeNPCExploration(team, game) {
        const rewards = ['Data', 'Minerals', 'Strange Specimen'];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        game.notify(`🗺️ SURVEY COMPLETE: ${team.name} returned with ${reward} findings!`, "success");
        if (reward === 'Data') game.resources.data += 50;
        else if (reward === 'Minerals') game.resources.minerals += 100;
        game.updateResourceUI();
    }

    optimizeWildlife(game) {
        // Management reduces aggressive encounter chances
        this.game.notify("🦁 WILDLIFE MANAGEMENT: Culling aggressive populations to protect the colony.", "info");
    }

    // Roadmap Item 171: AI-driven alien encounter behavior
    processEncounterAI(encounter, game) {
        const behavior = encounter.species.behavior;
        
        if (behavior === 'Curious') {
            if (Math.random() < 0.5) {
                game.notify(`🐾 ${encounter.species.name} is watching the colonists from a distance.`, "info");
                game.resources.data += 5;
            }
        } else if (behavior === 'Skittish') {
            game.notify(`🐾 ${encounter.species.name} fled into the brush.`, "info");
        }
    }

    generateName() {
        const p = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
        const s = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
        return p + s;
    }

    generateFlora(count) {
        for (let i = 0; i < count; i++) {
            const id = `flora_${i}`;
            const name = this.generateName();
            const type = ['Medicinal', 'Toxic', 'Bioluminescent', 'Carnivorous'][Math.floor(Math.random() * 4)];
            const effect = ['morale_boost', 'health_drain', 'energy_boost', 'research_boost'][Math.floor(Math.random() * 4)];

            this.species.flora.push({ id, name, type, effect, desc: `A native ${type.toLowerCase()} plant.` });
        }
    }

    generateFauna(count) {
        for (let i = 0; i < count; i++) {
            const id = `fauna_${i}`;
            const name = this.generateName();
            const behavior = ['Aggressive', 'Passive', 'Skittish', 'Curious'][Math.floor(Math.random() * 4)];
            const diet = ['Herbivore', 'Carnivore', 'Lithovore', 'Photovore'][Math.floor(Math.random() * 4)];

            this.species.fauna.push({ id, name, behavior, diet, desc: `A ${behavior.toLowerCase()} ${diet.toLowerCase()} creature.` });
        }
    }

    populateTile(tileId, tileType) {
        // Chance to spawn life based on tile type
        const life = { flora: null, fauna: null, scanned: false };

        let floraChance = 0.3;
        let faunaChance = 0.1;

        if (tileType === 'plains') { floraChance = 0.5; faunaChance = 0.2; }
        if (tileType === 'mountains') { floraChance = 0.1; faunaChance = 0.1; }

        if (Math.random() < floraChance && this.species.flora.length > 0) {
            life.flora = this.species.flora[Math.floor(Math.random() * this.species.flora.length)].id;
        }

        if (Math.random() < faunaChance && this.species.fauna.length > 0) {
            life.fauna = this.species.fauna[Math.floor(Math.random() * this.species.fauna.length)].id;
        }

        this.tileLife[tileId] = life;
        return life;
    }

    scanTile(tileId) {
        const life = this.tileLife[tileId];
        if (!life) return null;

        life.scanned = true;
        const results = [];

        if (life.flora) {
            const species = this.species.flora.find(s => s.id === life.flora);
            if (!this.xenodex.flora.includes(life.flora)) {
                this.xenodex.flora.push(life.flora);
                results.push({ type: 'flora', species, newDiscovery: true });
            } else {
                results.push({ type: 'flora', species, newDiscovery: false });
            }
        }

        if (life.fauna) {
            const species = this.species.fauna.find(s => s.id === life.fauna);
            if (!this.xenodex.fauna.includes(life.fauna)) {
                this.xenodex.fauna.push(life.fauna);
                results.push({ type: 'fauna', species, newDiscovery: true });
            } else {
                results.push({ type: 'fauna', species, newDiscovery: false });
            }
        }

        return results;
    }

    getDiscoveredFlora() {
        return this.species.flora.filter(s => this.xenodex.flora.includes(s.id));
    }

    getDiscoveredFauna() {
        return this.species.fauna.filter(s => this.xenodex.fauna.includes(s.id));
    }

    // --- HAZMAT / HOSTILE ENCOUNTERS ---

    checkForHostileEncounter(tileId, game) {
        const life = this.tileLife[tileId];
        if (!life || !life.fauna) return null;

        const fauna = this.species.fauna.find(s => s.id === life.fauna);
        if (!fauna || fauna.behavior !== 'Aggressive') return null;

        // 15% chance of hostile encounter when near aggressive fauna
        if (Math.random() > 0.15) return null;

        const encounter = {
            type: 'hostile',
            species: fauna,
            dangerLevel: this.calculateDangerLevel(fauna),
            outcome: null
        };

        // Determine outcome based on danger and defense
        const defense = game.military ? game.military.getDefensePower() : 0;
        const threat = encounter.dangerLevel * 10;

        if (defense >= threat) {
            encounter.outcome = 'repelled';
            game.notify(`⚔️ ${fauna.name} attacked but was repelled!`, 'success');
        } else {
            // Roadmap Item 171: Process AI behavior for non-hostile/unique outcomes
            this.processEncounterAI(encounter, game);
            
            if (Math.random() < 0.5) {
                encounter.outcome = 'injury';
                this.injureColonist(game);
                game.notify(`🩸 ${fauna.name} attacked! A colonist was injured!`, 'danger');
            } else {
                encounter.outcome = 'escaped';
                game.notify(`🏃 ${fauna.name} attacked! Colonists escaped safely.`, 'info');
            }
        }

        return encounter;
    }

    calculateDangerLevel(fauna) {
        let danger = 1;
        if (fauna.behavior === 'Aggressive') danger += 2;
        if (fauna.diet === 'Carnivore') danger += 1;
        return Math.min(danger, 5);
    }

    injureColonist(game) {
        if (!game.colonists || game.colonists.length === 0) return;

        const victim = game.colonists[Math.floor(Math.random() * game.colonists.length)];
        victim.injured = true;
        victim.morale = Math.max(0, (victim.morale || 50) - 20);

        // Injured colonists work slower
        if (!victim.traits) victim.traits = [];
        if (!victim.traits.includes('Injured')) {
            victim.traits.push('Injured');
        }
    }

    healColonist(colonist) {
        colonist.injured = false;
        const idx = colonist.traits ? colonist.traits.indexOf('Injured') : -1;
        if (idx > -1) colonist.traits.splice(idx, 1);
    }

    // Hazmat - Toxic tiles from certain flora
    checkToxicHazard(tileId, game) {
        const life = this.tileLife[tileId];
        if (!life || !life.flora) return null;

        const flora = this.species.flora.find(s => s.id === life.flora);
        if (!flora || flora.type !== 'Toxic') return null;

        // 10% chance of toxic exposure when working on toxic tile
        if (Math.random() > 0.10) return null;

        game.notify(`☠️ Toxic exposure from ${flora.name}! Morale decreased.`, 'danger');
        game.morale = Math.max(0, game.morale - 5);

        return { type: 'toxic', species: flora };
    }

    // Building for protection
    static HAZMAT_BUILDING = {
        key: 'hazmat_suit',
        name: 'Hazmat Station',
        cost: { alloys: 30, circuits: 10 },
        icon: '🧪',
        desc: 'Reduces toxic hazard damage',
        color: 0x22c55e
    };
}
