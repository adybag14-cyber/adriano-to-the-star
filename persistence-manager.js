/**
 * Advanced Persistence Manager
 * Tracks permanent world modifications (wreckage, craters, structures).
 */

class PersistenceManager {
    constructor() {
        this.persistenceKey = 'starisdons_universe_state';
        this.worldState = this.loadState();
    }

    loadState() {
        const saved = localStorage.getItem(this.persistenceKey);
        return saved ? JSON.parse(saved) : { wreckage_sites: [], craters: [], user_bases: [] };
    }

    saveState() {
        localStorage.setItem(this.persistenceKey, JSON.stringify(this.worldState));
    }

    addWreckage(x, y, shipType) {
        const wreckage = {
            id: `wreck-${Date.now()}`,
            x, y,
            type: shipType,
            timestamp: new Date().toISOString()
        };
        this.worldState.wreckage_sites.push(wreckage);
        this.saveState();
        console.log(`💾 Persisted Wreckage: ${shipType} at [${x}, ${y}]`);
    }

    addCrater(x, y, size) {
        const crater = {
            x, y, size, timestamp: Date.now()
        };
        this.worldState.craters.push(crater);
        this.saveState();
        console.log(`💾 Persisted Crater: Size ${size} at [${x}, ${y}]`);
    }

    clearPersistence() {
        this.worldState = { wreckage_sites: [], craters: [], user_bases: [] };
        this.saveState();
        console.log("🧹 Universe persistence reset.");
    }
}

if (typeof window !== 'undefined') {
    window.PersistenceManager = PersistenceManager;
    window.persistenceManager = new PersistenceManager();
}
