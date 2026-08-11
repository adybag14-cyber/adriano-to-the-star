/**
 * Star-Chart Projection Hub (UPGRADED)
 * Data-rich visualization logic for the ship's primary navigation table.
 */
class StarChartHub {
    constructor() {
        this.mapScale = 'SYSTEM'; // SYSTEM, SECTOR, GALACTIC
        this.discoveredSystems = [];
    }

    /**
     * Updates the holographic map with new sensor data.
     */
    processSensorFeed(data) {
        const newSystems = data.filter(s => !this.discoveredSystems.includes(s.id));
        this.discoveredSystems.push(...newSystems);
        return { totalVisible: this.discoveredSystems.length, detail: 'HI-RES_GRAV_MAPPING' };
    }

    calculateJumpPath(targetId) {
        // Logic for finding multi-hop jump routes
        return { hops: 3, totalDistance: 15.4, dangerRating: 'MODERATE' };
    }
}
if (typeof module !== 'undefined') module.exports = StarChartHub;