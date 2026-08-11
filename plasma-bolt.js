/**
 * Plasma Bolt Cohesion (UPGRADED)
 * Models the thermal decay and magnetic stability of high-energy thermal rounds.
 */
class PlasmaBolt {
    constructor() {
        this.initialTemp = 15000; // Kelvin
        this.magneticCohesion = 1.0;
    }

    /**
     * Calculates the bolt state after traveling a distance.
     */
    getStateAtDistance(distance) {
        // Cohesion decays exponentially with distance
        const decayConstant = 0.0001;
        const currentCohesion = this.magneticCohesion * Math.exp(-decayConstant * distance);
        
        const thermalLoss = (1 - currentCohesion) * this.initialTemp;
        const currentTemp = this.initialTemp - thermalLoss;

        return {
            temp: currentTemp,
            cohesion: currentCohesion,
            isStable: currentCohesion > 0.3,
            impactDamage: currentTemp * currentCohesion
        };
    }
}
if (typeof module !== 'undefined') module.exports = PlasmaBolt;