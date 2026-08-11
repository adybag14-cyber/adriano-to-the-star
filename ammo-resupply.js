/**
 * Ammo Resupply Shuttle (UPGRADED)
 * Coordinates the mid-combat transfer of kinetic slugs, missiles, and power cells.
 */
class AmmoResupply {
    constructor(capacity = 5000) {
        this.capacity = capacity;
        this.currentLoad = 0;
        this.status = 'READY'; // READY, DOCKED, IN_TRANSIT, TRANSFERRING
        this.transferRate = 100; // units per second
    }

    /**
     * Loads specific ammo types for a resupply run.
     */
    loadAmmo(manifest) {
        const total = Object.values(manifest).reduce((a, b) => a + b, 0);
        if (total > this.capacity) throw new Error('EXCEEDS_CAPACITY');
        this.manifest = manifest;
        this.currentLoad = total;
        this.status = 'IN_TRANSIT';
    }

    /**
     * Resolves the physical transfer to a target ship.
     */
    async transferToShip(ship) {
        this.status = 'TRANSFERRING';
        const duration = (this.currentLoad / this.transferRate) * 1000;
        
        return new Promise(resolve => {
            setTimeout(() => {
                ship.refillAmmo(this.manifest);
                this.currentLoad = 0;
                this.status = 'READY';
                resolve({ success: true, refilled: this.manifest });
            }, duration);
        });
    }
}
if (typeof module !== 'undefined') module.exports = AmmoResupply;