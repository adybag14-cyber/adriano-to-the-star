/**
 * Thermal Signature Monitor (UPGRADED)
 * Real-time tracking of reactor and thruster heat for detection math.
 */
class ThermalSignature {
    constructor() {
        this.currentHeat = 300; // Kelvin
    }

    updateHeat(enginePower, weaponActive) {
        this.currentHeat += enginePower * 0.1;
        if (weaponActive) this.currentHeat += 50;
        
        // Passive cooling
        this.currentHeat = Math.max(300, this.currentHeat - 5);
        return this.currentHeat;
    }

    getVisibilityRating(ambientTemp) {
        return this.currentHeat / ambientTemp;
    }
}
if (typeof module !== 'undefined') module.exports = ThermalSignature;