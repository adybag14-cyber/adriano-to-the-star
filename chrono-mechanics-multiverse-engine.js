/**
 * ⏳ EXOPLANET PIONEER: CHRONO-MECHANICS & MULTIVERSE ENGINE (ENHANCED)
 * Part of the God-Tier Roadmap (Items 5001-6000)
 */

class ChronoMultiverseEngine {
    constructor() {
        this.timelines = new Map(); // id -> StateSnapshot[]
        this.activeTimeline = "ROOT_PRIME";
        this.causalityGraph = [];   // { fromId, toId, action }
        this.paradoxIndex = 0.0;
        
        this.timelines.set(this.activeTimeline, []);
        this.saveSnapshot("UNIVERSE_INITIALIZED");
        
        console.log("⏳ Chrono-Mechanics Engine Online. Tracking Active Timeline:", this.activeTimeline);
    }

    /**
     * Item 5001: Paradox Engine (Causality Tracking)
     */
    saveSnapshot(reason) {
        const snapshot = {
            id: `SNAP-${Date.now()}`,
            timestamp: Date.now(),
            reason,
            gameState: this._captureGlobalState(),
            paradox: this.paradoxIndex
        };
        
        this.timelines.get(this.activeTimeline).push(snapshot);
        this._updateCausalityVisualization();
        return snapshot.id;
    }

    /**
     * Item 5013: Causality Visualization
     * Prints a summary of the timeline branching.
     */
    _updateCausalityVisualization() {
        if (this.causalityGraph.length === 0) return;
        
        console.log("🕸️ [CAUSALITY MAP] ---");
        this.causalityGraph.forEach(link => {
            console.log(`  ${link.from} ➔ [${link.timestamp}] ➔ ${link.to}`);
        });
    }

    /**
     * Item 5003: Mirror Verse / Branching
     */
    createBranch(branchName) {
        const history = this.timelines.get(this.activeTimeline);
        const latestState = history[history.length - 1];
        
        this.timelines.set(branchName, [ { ...latestState, reason: "BRANCH_START", id: `SNAP-${Date.now()}` } ]);
        this.causalityGraph.push({ from: this.activeTimeline, to: branchName, timestamp: Date.now() });
        
        this.activeTimeline = branchName;
        this.paradoxIndex += 0.05; 
        
        console.log(`[MULTIVERSE] Branching timeline: ${branchName}. Paradox: ${this.paradoxIndex.toFixed(2)}`);
        this.fireEvent("TIMELINE_BRANCHED", { name: branchName, paradox: this.paradoxIndex });
    }

    /**
     * Item 5006: Closed Timelike Curves (Timeline Jumping)
     */
    jumpToTimeline(id) {
        if (!this.timelines.has(id)) return;
        
        this.activeTimeline = id;
        const history = this.timelines.get(id);
        const lastSnapshot = history[history.length - 1];
        
        this._restoreGlobalState(lastSnapshot.gameState);
        this.fireEvent("CHRONO_JUMP_COMPLETE", { timeline: id });
    }

    /**
     * Item 5010: Reality Stabilization
     */
    stabilizeReality() {
        this.paradoxIndex = Math.max(0, this.paradoxIndex - 0.1);
        console.log("[STABILITY] Paradox Index reduced:", this.paradoxIndex.toFixed(2));
    }

    // --- INTERNAL SYSTEMS ---

    _captureGlobalState() {
        return {
            p2pId: window.meshEngine?.meshId,
            resourceCount: window.game?.resources || {},
            discoveredPlanets: window.game?.planets?.length || 0,
            timestamp: Date.now()
        };
    }

    _restoreGlobalState(state) {
        if (window.game) window.game.resources = state.resourceCount;
    }

    fireEvent(type, data) {
        window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
}

export const chronoEngine = new ChronoMultiverseEngine();
window.chronoEngine = chronoEngine;
