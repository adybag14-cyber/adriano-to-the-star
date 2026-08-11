/**
 * Life Support v2 (UPGRADED)
 * Thermodynamic simulation of O2/CO2 cycles, internal pressure, and power load.
 */
class LifeSupportV2 {
    constructor(pop) {
        this.population = pop;
        this.o2Level = 100; // %
        this.co2Level = 0; // %
        this.pressure = 1.0; // atm
        this.scrubberEfficiency = 0.99;
    }

    /**
     * Updates atmosphere state based on metabolism and mechanical scrubbers.
     */
    tick(deltaTime, powerStatus) {
        // Consumption: 0.01% O2 per person per tick
        const consumption = this.population * 0.0001 * deltaTime;
        this.o2Level -= consumption;
        this.co2Level += consumption;

        // Scrutbbing (requires power)
        if (powerStatus === 'ONLINE') {
            const scrubbed = consumption * this.scrubberEfficiency;
            this.co2Level -= scrubbed;
            this.o2Level += scrubbed * 0.95; // Some loss in conversion
        }

        if (this.o2Level < 15) return 'HYPOXIA_ALERT';
        if (this.co2Level > 5) return 'TOXIC_CO2_ALERT';
        return 'ATMOSPHERE_STABLE';
    }
}
if (typeof module !== 'undefined') module.exports = LifeSupportV2;