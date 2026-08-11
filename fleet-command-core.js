/**
 * Fleet Command Core (UPGRADED)
 * The strategic brain of a multi-ship fleet. Manages sensor fusion, 
 * logistical distribution, and tactical readiness.
 */
class FleetCommandCore {
    constructor(fleetId, admiral) {
        this.fleetId = fleetId;
        this.admiral = admiral;
        this.ships = new Map();
        
        this.logistics = {
            fuelReserve: 1000000, // Liters of Helium-3
            supplyReserve: 500000, // Monthly crew tons
            ammoReserve: 100000 // Standard kinetic units
        };

        this.status = {
            readiness: 1.0, // 0.0 to 1.0
            alertLevel: 'GREEN',
            formation: 'CRUISING',
            stealthActive: false
        };

        this.tacticalMatrix = {
            sensorCoverage: 0,
            ewarPower: 0,
            combinedShieldStrength: 0
        };
    }

    /**
     * Integrates a new vessel into the fleet's data-link and logistics net.
     */
    commissionShip(ship) {
        ship.status = 'FLEET_SYNCED';
        this.ships.set(ship.id, ship);
        this.recalculateFleetStats();
    }

    recalculateFleetStats() {
        let totalShield = 0;
        let sensorPower = 0;
        
        this.ships.forEach(s => {
            totalShield += s.currentShield || 0;
            sensorPower += s.sensorRange || 0;
        });

        this.tacticalMatrix.combinedShieldStrength = totalShield;
        this.tacticalMatrix.sensorCoverage = sensorPower / Math.max(1, this.ships.size);
        
        // Morale impact on readiness
        const avgMorale = Array.from(this.ships.values()).reduce((a, b) => a + (b.morale || 100), 0) / this.ships.size;
        this.status.readiness = (avgMorale / 100) * 0.9 + (this.admiral.skill / 100) * 0.1;
    }

    /**
     * Distributes fuel and supplies across the fleet based on individual ship needs.
     */
    distributeLogistics() {
        this.ships.forEach(ship => {
            const fuelNeed = ship.fuelCapacity - ship.currentFuel;
            const actualTransfer = Math.min(this.logistics.fuelReserve, fuelNeed);
            ship.currentFuel += actualTransfer;
            this.logistics.fuelReserve -= actualTransfer;
        });
    }

    setAlertLevel(level) {
        const levels = { 'GREEN': 1.0, 'YELLOW': 1.2, 'RED': 1.5 };
        this.status.alertLevel = level;
        // Increase fuel consumption during high alert
        this.logistics.fuelReserve -= (levels[level] || 1.0) * 100;
    }
}

if (typeof module !== 'undefined') module.exports = FleetCommandCore;