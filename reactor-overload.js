/**
 * Starship Reactor Overload (UPGRADED)
 * Thermodynamic simulation of engine failure and containment breaches.
 */
class ReactorOverload {
    constructor() {
        this.coreTemp = 5000; // Kelvin
        this.pressure = 1.0; // atm
        this.magneticContainment = 1.0;
        this.isMeltingDown = false;
    }

    /**
     * Progresses the meltdown state.
     */
    tickMeltdown() {
        this.coreTemp += 200;
        this.pressure += 0.5;
        this.magneticContainment -= 0.05;

        const stability = this.magneticContainment * (1 / this.pressure);
        
        if (stability < 0.1) {
            return { status: 'CRITICAL_FAILURE', explosionYield: this.coreTemp * 1000 };
        }

        return { status: 'DETERIORATING', coreTemp: this.coreTemp, stability };
    }

    ventPlasma() {
        this.coreTemp -= 1000;
        this.pressure = 0.5;
        return 'PRESSURE_STABILIZED_TEMPORARILY';
    }
}

if (typeof module !== 'undefined') module.exports = ReactorOverload;