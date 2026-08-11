/**
 * Power Hardpoint Logic (UPGRADED)
 * Logic for weapon mounting points, rotation constraints, and energy throughput.
 */
class HardpointLogic {
    constructor(type = 'KINETIC', maxSize = 3) {
        this.type = type; // KINETIC, ENERGY, MISSILE
        this.maxSize = maxSize;
        this.isPowered = false;
        this.mountedWeapon = null;
    }

    mountWeapon(weapon) {
        if (weapon.type !== this.type) return { success: false, error: 'TYPE_MISMATCH' };
        if (weapon.size > this.maxSize) return { success: false, error: 'SIZE_OVERFLOW' };
        
        this.mountedWeapon = weapon;
        return { success: true, weapon: weapon.name };
    }

    togglePower(gridStatus) {
        this.isPowered = gridStatus === 'STABLE';
    }
}
if (typeof module !== 'undefined') module.exports = HardpointLogic;