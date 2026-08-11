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
        if (this.swarmSatellites > 0 && Math.random() < 0.0001 * (this.swarmSatellites / 100)) {
            const lost = Math.ceil(this.swarmSatellites * 0.01);
            this.swarmSatellites -= lost;
            this.game.notify(`📡 Swarm Alert: ${lost} satellites lost to micro-meteoroid impacts.`, "warning");
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
        const totalCostCredits = count * this.SATELLITE_COST.credits;

        // Check affordability (Assuming game.economySystem exists or we use basic credits)
        const currentCredits = this.game.credits || 0;

        if (currentCredits >= totalCostCredits) {
            this.game.credits -= totalCostCredits;
            this.swarmSatellites += count;
            this.game.notifications.show(`Launched ${count} Dyson Satellites!`, 'success');

            // Visual update hook
            if (this.game.updateDysonSwarmVisuals) {
                this.game.updateDysonSwarmVisuals(this.swarmSatellites);
            }

            this.saveState();
            return true;
        } else {
            this.game.notifications.show(`Insufficient Credits! Need ${totalCostCredits}`, 'error');
            return false;
        }
    }

    upgradeBrain() {
        if (this.swarmSatellites < 1000) {
            this.game.notifications.show("Need 1,000 Satellites to begin Matrioshka construction.", 'warning');
            return;
        }

        const cost = 100000 * (this.matrioshkaStage + 1);
        if (this.game.credits >= cost) {
            this.game.credits -= cost;
            this.matrioshkaStage++;
            this.game.notifications.show(`Matrioshka Brain Upgraded to Stage ${this.matrioshkaStage}`, 'success');
            this.saveState();
        } else {
            this.game.notifications.show(`Need ${cost} Credits for upgrade.`, 'error');
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

    saveState() {
        const state = {
            swarmSatellites: this.swarmSatellites,
            matrioshkaStage: this.matrioshkaStage,
            stellarEngineBuilt: this.stellarEngineBuilt
        };
        localStorage.setItem('megastructure_state', JSON.stringify(state));

        // Also save to cloud if available
        if (this.game.saveSystem) {
            // this.game.saveSystem.save(); // Implicitly handled by game save usually
        }
    }

    loadState() {
        const saved = localStorage.getItem('megastructure_state');
        if (saved) {
            const state = JSON.parse(saved);
            this.swarmSatellites = state.swarmSatellites || 0;
            this.matrioshkaStage = state.matrioshkaStage || 0;
            this.stellarEngineBuilt = state.stellarEngineBuilt || false;

            // Restore visuals
            if (this.game.updateDysonSwarmVisuals) {
                // Defer slightly to ensure scene is ready
                setTimeout(() => this.game.updateDysonSwarmVisuals(this.swarmSatellites), 1000);
            }
        }
    }
}
