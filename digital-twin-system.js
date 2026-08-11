/**
 * DigitalTwinSystem.js
 * "Mind Upload" - An Autopilot system that mimics player behavior to manage the colony.
 * It uses simple heuristics to gather resources and build structures.
 */

class DigitalTwinSystem {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.efficiency = 0.5; // Starts low, improves over time
        this.actionTimer = 0;
        this.actionInterval = 2000; // Decisions every 2 seconds
    }

    toggle() {
        this.isActive = !this.isActive;
        this.game.notify(`Digital Twin: ${this.isActive ? "ONLINE" : "OFFLINE"}`, "info");
        return this.isActive;
    }

    update(dt) {
        if (!this.isActive) return;

        this.actionTimer += dt * 1000;
        if (this.actionTimer >= this.actionInterval) {
            this.performAction();
            this.actionTimer = 0;
        }
    }

    performAction() {
        // Simple Heuristic AI
        // 1. Check Resources
        const metal = this.game.resources.metal || 0;
        const energy = this.game.resources.energy || 0;

        // 2. Prioritize Energy if low
        if (energy < 20) {
            this.game.clickMine('energy');
            if (this.game.historian) this.game.historian.logEvent("Twin gathered Energy.");
            return;
        }

        // 3. Gather Metal otherwise
        if (metal < 100) {
            this.game.clickMine('metal');
            return;
        }

        // 4. Try to build Solar Collector if affordable
        const solarCost = 50; // Hardcoded for simplicity, usually from game config
        if (metal >= solarCost) {
            // Mocking a build function - assuming game has a method or we direct call resource deduction
            // Ideally we'd call game.structures.build('solar'), but for now:
            if (this.game.resources.metal >= 50) {
                this.game.resources.metal -= 50;
                this.game.resources.energy += 1; // Simplified benefit
                // Update specific structure count if possible, else just generic "Auto-Build"
                this.game.notify("Digital Twin constructed Solar Array.", "success");
                if (this.game.historian) this.game.historian.logEvent("Twin built Solar Array.");
            }
        }
    }
}

window.DigitalTwinSystem = DigitalTwinSystem;
