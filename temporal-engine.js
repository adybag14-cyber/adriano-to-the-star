/**
 * TemporalEngine.js
 * Manages time travel, history rewinding, and timeline branching.
 */

class TemporalEngine {
    constructor(game) {
        this.game = game;
        this.history = []; // Array of snapshots
        this.timelines = ['timeline_prime']; // List of active timelines
        this.currentTimeline = 'timeline_prime';
        this.snapshotInterval = 60; // Frames between snapshots (approx 1 sec at 60fps)
        this.frameCount = 0;
        this.maxHistory = 1000; // Limit memory usage
        this.isFastForwarding = false;
        this.timeScale = 1.0;
        this.isRewinding = false;
    }

    /**
     * Called every frame to manage time flow
     */
    update(dt) {
        if (this.isRewinding) {
            this.rewindStep();
            return; // Skip normal game update
        }

        if (this.isFastForwarding) {
            // Apply entropy manipulation (speed up game loop)
            // Implementation handled in main loop via tick rate, 
            // but we track duration here.
        }

        // Record History
        this.frameCount++;
        if (this.frameCount >= this.snapshotInterval) {
            this.recordSnapshot();
            this.frameCount = 0;
        }
    }

    /**
     * Creates a lightweight snapshot of the current game state
     */
    recordSnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            day: this.game.day,
            timeOfDay: this.game.timeOfDay,
            resources: { ...this.game.resources }, // Shallow copy resource objects
            colonistCount: this.game.colonists.length,
            // In a full implementation, we'd deep copy critical entities
            // For now, we track key metrics for "rewind" visual effect
            timeline: this.currentTimeline
        };

        this.history.push(snapshot);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Jumps back in time to a specific point (simplification: just restores state)
     */
    jumpToPast(stepsBack) {
        if (this.history.length < stepsBack) return false;

        // Branch Creation
        this.createBranch();

        const targetIndex = this.history.length - stepsBack;
        const targetState = this.history[targetIndex];

        // Restore State
        this.restoreState(targetState);

        // Truncate future history (since we branched/rewrote it)
        this.history = this.history.slice(0, targetIndex + 1);

        this.game.notify("Timeline Divergence Detected. Welcome to the past.", "warning");
        return true;
    }

    createBranch() {
        const newTimelineId = `timeline_${Date.now()}`;
        this.timelines.push(newTimelineId);
        this.currentTimeline = newTimelineId;
        console.log(`Branched to new timeline: ${newTimelineId}`);
    }

    restoreState(snapshot) {
        this.game.day = snapshot.day;
        this.game.timeOfDay = snapshot.timeOfDay;
        this.game.resources = { ...snapshot.resources };
        // Note: Colonists and structures would need complex distinct restoration logic
        console.log("Restored State to Day", snapshot.day);
    }

    toggleFastForward() {
        this.isFastForwarding = !this.isFastForwarding;
        return this.isFastForwarding;
    }
}

window.TemporalEngine = TemporalEngine;
