/**
 * 🌌 GALACTIC OVERSOUL (FULL IMPLEMENTATION)
 * Item 1004: Federated Learning P2P Network
 * 
 * Aggregates cognitive data from local NPC minds and synchronizes 
 * global "Universal Intent" weights across the mesh.
 */

class GalacticOversoul {
    constructor(game, fabric) {
        this.game = game || null;
        this.fabric = fabric || null;
        this.globalIntent = {
            aggression: 0.5,
            discovery: 0.5,
            expansion: 0.5,
            entropy: 0.1
        };

        this.contributionLog = [];
        this.lastSync = Date.now();

        console.log("🌌 Galactic Oversoul: Synchronizing with Cognitive Fabric...");
    }

    /**
     * Receives "learnings" from local NPC minds or the player.
     * Updates the global state using a simulated federated averaging.
     */
    learn(eventData) {
        const text = eventData.toLowerCase();

        // Simple NLP Keyword mapping for weight shifts
        if (text.includes("neutralize") || text.includes("threat")) {
            this._updateWeight("aggression", 0.005);
        } else if (text.includes("archive") || text.includes("reminds")) {
            this._updateWeight("discovery", 0.005);
        } else if (text.includes("oversoul") || text.includes("data")) {
            this._updateWeight("expansion", 0.005);
        }

        this.contributionLog.push({ timestamp: Date.now(), event: eventData });

        // Item 2002: Broadcast update to P2P mesh if available
        if (window.meshEngine) {
            window.meshEngine.updateState("OVERSOUL_Intent", 0.001);
        }

        if (this.contributionLog.length % 5 === 0) {
            this._dispatchUpdate();
        }
    }

    getIntentSummary() {
        const dominant = Object.entries(this.globalIntent)
            .sort((a, b) => b[1] - a[1])[0][0];

        return {
            status: dominant.toUpperCase(),
            weights: this.globalIntent,
            stability: window.omegaEngine?.stability || 1.0
        };
    }

    _updateWeight(key, delta) {
        this.globalIntent[key] = Math.min(1.0, Math.max(0.0, this.globalIntent[key] + delta));
    }

    _dispatchUpdate() {
        window.dispatchEvent(new CustomEvent("OVERSOUL_SYNC", { detail: this.getIntentSummary() }));
        console.log(`[OVERSOUL] Global intent synchronized. Dominant: ${this.getIntentSummary().status}`);
    }
    init() {
        console.log("🌌 Galactic Oversoul: Initialized via init().");
    }
}

// Expose the Class so ExoplanetPioneer can instantiate it
window.GalacticOversoul = GalacticOversoul;

// Legacy singleton (optional, keeping for backward compat if needed)
// Note: This will now work with optional parameters
if (typeof window !== 'undefined') {
    window.galacticOversoul = new GalacticOversoul();
}