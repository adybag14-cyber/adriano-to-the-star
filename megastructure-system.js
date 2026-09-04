/**
 * MegastructureSystem
 * 
 * Manages the construction and effects of stellar-scale engineering projects:
 * 1. Dyson Swarm: Thousands of satellites for massive power.
 * 2. Matrioshka Brain: Nested shells for computational dominance.
 * 3. Stellar Engine: Propulsion for the entire solar system.
 */
console.log('🏗️ MegastructureSystem script execution started');
window.MegastructureSystem = class MegastructureSystem {
    constructor(game) {
        this.game = game;

        // State
        this.swarmSatellites = 0;
        this.maxSwarmSatellites = 10000;

        this.matrioshkaStage = 0; // 0 = None, 1 = Ignition, 2 = Simulation, 3 = Transcended
        this.stellarEngineBuilt = false;

        // Roadmap Item 602: Ringworlds
        this.ringworldStage = 0; // 0 = None, 1 = Foundation, 2 = Habitats, 3 = Completed
        this.ringworldPopBonus = 0;
        this.ringworldHabitabilityBonus = 0;

        this.energyOutput = 0; // MW
        this.computationOutput = 0; // FLOPS (Abstracted)

        this.resources = {
            energy: 0,
            computation: 0
        };

        // Constants
        this.SATELLITE_COST = {
            materials: 100, // Refined materials (abstracted as generic credits/materials for now if inventory not strict)
            credits: 500
        };

        this.SATELLITE_OUTPUT = 10; // MW per satellite

        console.log("MegastructureSystem initialized");
    }

    init() {
        // Load from save if exists
        this.loadState();

        // Start update loop
        // We hook into game loop via explicit call or interval if needed, 
        // but typically the main game loop calls .update()
    }

    update(deltaTime) {
        // Calculate outputs
        this.energyOutput = this.swarmSatellites * this.SATELLITE_OUTPUT;

        // Roadmap Item 601: Dyson Swarm Efficiency & Decay
        // ... (existing swarm logic)
        let efficiency = 1.0;
        if (this.swarmSatellites > 5000) {
            efficiency = 1.0 - ((this.swarmSatellites - 5000) / 10000);
        }
        this.energyOutput *= Math.max(0.5, efficiency);

        // Rare chance of satellite decay/loss (Roadmap Item 662)
        if (deltaTime > 0 && this.swarmSatellites > 0 && Math.random() < 0.0001 * (this.swarmSatellites / 100) * deltaTime) {
            const lost = Math.ceil(this.swarmSatellites * 0.01);
            this.swarmSatellites -= lost;
            this.game.notify(`📡 Swarm Alert: ${lost} satellites lost to micro-meteoroid impacts.`, "warning");
        }
        if (this.game.dysonSwarmMesh && this.game.suns?.[0]?.mesh) {
            this.game.dysonSwarmMesh.position.copy(this.game.suns[0].mesh.position);
            this.game.dysonSwarmMesh.count = Math.min(this.swarmSatellites, this.maxSwarmSatellites);
        }

        // Roadmap Item 602: Ringworld Construction Effects
        if (this.ringworldStage > 0) {
            this.ringworldPopBonus = this.ringworldStage * 50;
            this.ringworldHabitabilityBonus = this.ringworldStage * 5;
        }

        if (this.matrioshkaStage > 0) {
            // Matrioshka brain consumes energy to produce computation
            const consumption = this.energyOutput * 0.5; // 50% of energy goes to compute
            this.computationOutput = consumption * 100 * this.matrioshkaStage;
        } else {
            this.computationOutput = 0;
        }

        // Accumulate resources (if we track stock) or just provide rate
        // For gameplay, usually we care about the Rate for powering things.

        // Dispatch events/updates to UI if changed
        if (Math.random() < 0.05) { // Throttle UI updates
            this.updateDashboard();
        }
    }

    launchSatellites(count) {
        count = Math.max(0, Math.min(this.maxSwarmSatellites-this.swarmSatellites, Math.floor(Number(count)||0)));
        if (!count) { this.game.notify('The swarm is at capacity.', 'info');return false; }
        const totalCostCredits = count * this.SATELLITE_COST.credits;
        const currentCredits = Number(this.game.resources?.credits)||0;

        if (currentCredits >= totalCostCredits) {
            const previous=this.serialize();
            this.game.resources.credits -= totalCostCredits;
            this.swarmSatellites += count;
            if (!this.saveState()) { this.game.resources.credits=currentCredits;this.restore(previous);return false; }
            this.restore(this.serialize());
            this.game.notify(`Deployed ${count} Dyson satellite${count===1?'':'s'}.`, 'success');
            return true;
        } else {
            this.game.notify(`Satellite deployment requires ${totalCostCredits} credits.`, 'warning');
            return false;
        }
    }

    upgradeBrain() {
        if (this.swarmSatellites < 1000) {
            this.game.notify('Deploy 1,000 satellites before constructing a compute shell.', 'warning');
            return false;
        }
        if(this.matrioshkaStage>=3){this.game.notify('All three compute shells are complete.','info');return false;}

        const cost = 100000 * (this.matrioshkaStage + 1);
        const credits=Number(this.game.resources?.credits)||0;
        if (credits >= cost) {
            const previous=this.serialize();
            this.game.resources.credits -= cost;
            this.matrioshkaStage++;
            if(!this.saveState()){this.game.resources.credits=credits;this.restore(previous);return false;}
            this.restore(this.serialize());
            this.game.notify(`Compute shell stage ${this.matrioshkaStage} constructed.`, 'success');
            return true;
        } else {
            this.game.notify(`Compute shell construction requires ${cost.toLocaleString()} credits.`, 'warning');
            return false;
        }
    }

    buildStellarEngine() {
        // ... (existing stellar engine logic)
    }

    // Roadmap Item 602: Ringworld Construction
    upgradeRingworld() {
        if (this.ringworldStage >= 3) {
            this.game.notify("Ringworld is already completed!", "info");
            return;
        }

        const costs = [
            { alloys: 1000, circuits: 200, energy: 500 }, // Foundation
            { alloys: 5000, circuits: 1000, energy: 2000 }, // Habitats
            { alloys: 20000, circuits: 5000, energy: 10000 } // Completion
        ];

        const cost = costs[this.ringworldStage];
        for (const res in cost) {
            if ((this.game.resources[res] || 0) < cost[res]) {
                this.game.notify(`Insufficient ${res} for Ringworld stage ${this.ringworldStage + 1}.`, "danger");
                return;
            }
        }

        for (const res in cost) this.game.resources[res] -= cost[res];
        this.ringworldStage++;
        this.game.notify(`🏗️ Ringworld Stage ${this.ringworldStage} Completed!`, "success");
        this.game.recordColonyEvent(`Megastructure update: Ringworld reach stage ${this.ringworldStage}.`, 0.9);
        this.saveState();
    }

    updateDashboard() {
        const el = document.getElementById('megastructure-stats');
        if (el) {
            el.innerHTML = `
                <div>Swarm Satellites: ${this.swarmSatellites.toLocaleString()}</div>
                <div>Energy Output: ${this.energyOutput.toLocaleString()} MW</div>
                <div>Brain Stage: ${this.matrioshkaStage}</div>
                <div>Compute: ${this.computationOutput.toLocaleString()} FLOPS</div>
            `;
        }
    }

    serialize() {
        return {
            swarmSatellites: this.swarmSatellites,
            matrioshkaStage: this.matrioshkaStage,
            stellarEngineBuilt: this.stellarEngineBuilt,
            ringworldStage: this.ringworldStage
        };
    }

    restore(state) {
        if(!state||typeof state!=='object')return false;
        this.swarmSatellites=Math.max(0,Math.min(this.maxSwarmSatellites,Math.floor(Number(state.swarmSatellites)||0)));
        this.matrioshkaStage=Math.max(0,Math.min(3,Math.floor(Number(state.matrioshkaStage)||0)));
        this.stellarEngineBuilt=state.stellarEngineBuilt===true;
        this.ringworldStage=Math.max(0,Math.min(3,Math.floor(Number(state.ringworldStage)||0)));
        this.update(0);
        this.game.updateDysonSwarmVisuals?.(this.swarmSatellites);
        if(this.game.dysonSwarmMesh&&this.game.suns?.[0]?.mesh)this.game.dysonSwarmMesh.position.copy(this.game.suns[0].mesh.position);
        this.game.updateResourceUI?.();
        return true;
    }

    saveState() {
        // The main save atomically includes resource debits and megastructure state.
        if(typeof this.game.saveGame==='function')return this.game.saveGame({silent:true})===true;
        try {localStorage.setItem('megastructure_state',JSON.stringify(this.serialize()));return true;}
        catch {this.game.notify('Engineering progress could not be saved.','warning');return false;}
    }

    loadState() {
        try {const saved=localStorage.getItem('megastructure_state');if(saved)this.restore(JSON.parse(saved));}
        catch {this.game.notify('Legacy engineering state could not be read. The main colony save remains available.','warning');}
    }
}
