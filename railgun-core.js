/**
 * Railgun Core Logic (UPGRADED)
 * High-fidelity kinetic energy weapon simulation with capacitor and heat management.
 */
class RailgunCore {
    constructor() {
        this.capacitorCharge = 0; // %
        this.barrelHeat = 0;
        this.lorentzEfficiency = 0.92;
    }

    charge(power) {
        this.capacitorCharge = Math.min(100, this.capacitorCharge + (power * 0.1));
    }

    /**
     * Fires a high-mass slug.
     */
    fire(slugMass) {
        if (this.capacitorCharge < 100) return { success: false, error: 'CAPACITOR_LOW' };
        if (this.barrelHeat > 85) return { success: false, error: 'THERMAL_OVERLOAD' };

        this.capacitorCharge = 0;
        this.barrelHeat += 15;
        
        // E = 0.5 * m * v^2 -> Solving for v based on energy release
        const energyJoules = 10000000 * this.lorentzEfficiency;
        const velocity = Math.sqrt((2 * energyJoules) / slugMass);

        return {
            success: true,
            muzzleVelocity: velocity,
            impactJoules: energyJoules
        };
    }
}
if (typeof module !== 'undefined') module.exports = RailgunCore;