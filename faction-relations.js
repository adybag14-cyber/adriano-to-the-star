/**
 * Faction Relationship Matrix
 * Tracks and simulates relations between all major galactic powers
 */
class FactionRelations {
    constructor() {
        this.matrix = new Map();
    }
    setRelation(f1, f2, value) {
        const key = [f1, f2].sort().join(':');
        this.matrix.set(key, Math.max(-100, Math.min(100, value)));
    }
    getRelation(f1, f2) {
        return this.matrix.get([f1, f2].sort().join(':')) || 0;
    }
}
if (typeof module !== 'undefined') module.exports = FactionRelations;
