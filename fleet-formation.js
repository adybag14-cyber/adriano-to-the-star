/**
 * Fleet Formation Optimizer (UPGRADED)
 * Geometric pathfinding for maximizing point-defense overlap and sensor synergy.
 */
class FleetFormation {
    constructor() {
        this.activeFormation = 'NONE';
    }

    /**
     * Calculates 3D coordinates for all fleet members.
     */
    calculateOffsets(type, count, spacing = 500) {
        const offsets = [];
        
        for (let i = 0; i < count; i++) {
            if (type === 'WEDGE') {
                offsets.push({ x: i * spacing, y: i * (spacing / 2), z: 0 });
                offsets.push({ x: i * spacing, y: -i * (spacing / 2), z: 0 });
                i++; // Symmetrical
            } else if (type === 'SPHERE') {
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                offsets.push({
                    x: spacing * Math.cos(theta) * Math.sin(phi),
                    y: spacing * Math.sin(theta) * Math.sin(phi),
                    z: spacing * Math.cos(phi)
                });
            }
        }
        return offsets;
    }

    getDefensiveBonus(type) {
        return type === 'SPHERE' ? 1.5 : 1.0;
    }
}

if (typeof module !== 'undefined') module.exports = FleetFormation;