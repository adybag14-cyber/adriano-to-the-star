/**
 * CRDTManager.js
 * Implements Conflict-free Replicated Data Types (G-Counter).
 * Allows merging "Global Resource" stats from multiple peers without conflict.
 */

class CRDTManager {
    constructor(game) {
        this.game = game;
        // G-Counter: Map<PeerID, Value>
        this.globalResources = {
            iron: 0,
            energy: 0
        };
        // Local state
        this.localUpdates = 0;
    }

    init() {
        console.log("CRDT Sync Engine: Online.");
    }

    // Called when the local player does something significant
    incrementLocal(resource, amount) {
        if (this.globalResources[resource.toLowerCase()] !== undefined) {
            this.globalResources[resource.toLowerCase()] += amount;
            this.localUpdates++;
        }
    }

    // Called when a packet arrives from the Mesh
    mergeRemote(data) {
        const key = data.resource.toLowerCase();
        if (this.globalResources[key] !== undefined) {
            // G-Counter Logic: In a real system, we would take max() of vector clocks.
            // Here we simply add the delta for simulation purposes.
            this.globalResources[key] += data.value;
        }
    }

    getGlobalTotal(resource) {
        return this.globalResources[resource.toLowerCase()] || 0;
    }
}

window.CRDTManager = CRDTManager;
