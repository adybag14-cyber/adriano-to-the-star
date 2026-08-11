/**
 * Advanced Starship Engineering & Propulsion Engine (ASEPE)
 * 
 * A massive, high-fidelity simulation core for FTL travel and engineering.
 * Consolidates Warp Field Stabilization, Dark Matter Engines, Quantum Comms, 
 * Flux Capacitors, Zero-Point Taps, and Vacuum Energy Monitors into a 
 * single unified physics architecture.
 */

class StarshipEngineeringEngine {
    constructor() {
        // --- MASTER PHYSICS STATE ---
        this.reactor = {
            outputMW: 5000,
            coreTemp: 293, // Kelvin
            magneticContainment: 1.0, // 0.0 to 1.0
            fuelLevel: 100, // % Helium-3
            isOverheating: false
        };

        this.propulsion = {
            warpStability: 1.0,
            currentC: 0.0, // Multiples of Light Speed
            bubbleResonance: 440.0, // Hz
            darkMatterConfinement: 1.0
        };

        this.communications = {
            quantumLinkActive: false,
            entanglementFidelity: 1.0,
            subSpaceLatency: 50 // ms
        };

        this.experimental = {
            zeroPointFlow: 0.0,
            vacuumEnergyStability: 1.0,
            fluxCapacitance: 0.0
        };

        this.logs = [];
    }

    // =========================================================================
    // 1. REACTOR DYNAMICS & HEAT MANAGEMENT
    // =========================================================================

    updateThermalState(deltaTime, powerDraw) {
        // Thermodynamic heating: Q = P * t
        const heating = (powerDraw * deltaTime * 0.05);
        this.reactor.coreTemp += heating;

        // Passive Cooling: radiative cooling proportional to T^4 (simplified)
        const cooling = Math.pow(this.reactor.coreTemp / 1000, 2) * deltaTime;
        this.reactor.coreTemp = Math.max(293, this.reactor.coreTemp - cooling);

        if (this.reactor.coreTemp > 5000) {
            this.reactor.isOverheating = true;
            this.reactor.magneticContainment -= 0.01 * deltaTime;
        } else {
            this.reactor.isOverheating = false;
        }

        if (this.reactor.magneticContainment <= 0) {
            this.triggerMeltdown();
        }
    }

    triggerMeltdown() {
        this.recordLog('CRITICAL_REACTOR_FAILURE', 'Magnetic containment failed. Meltdown imminent.');
        // Logic for ship destruction or emergency venting
    }

    // =========================================================================
    // 2. FTL TRAVEL: WARP & DARK MATTER
    // =========================================================================

    /**
     * Calculates the stability of the Alcubierre bubble during transit.
     */
    maintainWarpField(turbulence) {
        const resonanceError = Math.abs(this.propulsion.bubbleResonance - 440.0);
        const stabilityLoss = (resonanceError * 0.1) + (turbulence * 0.5);
        
        this.propulsion.warpStability -= stabilityLoss;
        
        if (this.propulsion.warpStability < 0.4) {
            return { status: 'EMERGENCY_DROP', reason: 'FIELD_COLLAPSE' };
        }
        return { status: 'STABLE', integrity: this.propulsion.warpStability };
    }

    /**
     * Engages the experimental Dark Matter Drive.
     */
    engageDarkMatterDrive(throttle) {
        const risk = throttle * (1 - this.propulsion.darkMatterConfinement);
        if (Math.random() < risk) {
            this.propulsion.darkMatterConfinement -= 0.1;
            return { success: false, error: 'GRAVITATIONAL_LEAKAGE' };
        }
        
        this.propulsion.currentC = throttle * 100; // 100x light speed
        return { success: true, velocity: this.propulsion.currentC };
    }

    // =========================================================================
    // 3. ZERO-POINT ENERGY & VACUUM FLUCTUATIONS
    // =========================================================================

    tapZeroPointEnergy(intensity) {
        const threshold = 0.95;
        if (this.experimental.vacuumEnergyStability < threshold) {
            return { success: false, error: 'VACUUM_SHOCK_DETECTION' };
        }

        const energyGain = intensity * 10000; // Huge power boost
        this.experimental.zeroPointFlow = intensity;
        this.experimental.vacuumEnergyStability -= (intensity * 0.05);
        
        return { success: true, powerMW: energyGain };
    }

    // =========================================================================
    // 4. QUANTUM COMMUNICATIONS
    // =========================================================================

    syncQuantumRelay(targetId) {
        const decoherenceRate = 0.01;
        this.communications.entanglementFidelity -= decoherenceRate;
        
        if (this.communications.entanglementFidelity < 0.1) {
            this.communications.quantumLinkActive = false;
            return { status: 'LINK_LOST', reason: 'DECOHERENCE' };
        }

        this.communications.quantumLinkActive = true;
        return { status: 'LOCKED', fidelity: this.communications.entanglementFidelity };
    }

    // =========================================================================
    // 5. DIAGNOSTICS & LOGGING
    // =========================================================================

    recordLog(type, message) {
        this.logs.push({ t: Date.now(), type, message });
        if (this.logs.length > 100) this.logs.shift();
    }

    getEngineeringReport() {
        return {
            reactor: this.reactor,
            propulsion: this.propulsion,
            experimental: this.experimental
        };
    }
}

// Global Export
if (typeof window !== 'undefined') {
    window.StarshipEngineeringEngine = StarshipEngineeringEngine;
    window.engineeringEngine = new StarshipEngineeringEngine();
}

if (typeof module !== 'undefined') module.exports = StarshipEngineeringEngine;
