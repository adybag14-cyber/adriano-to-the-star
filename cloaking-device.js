/**
 * Cloaking Device Core (UPGRADED)
 * Metamaterial light-bending and neutrino-emission masking.
 */
class CloakingDevice {
    constructor() {
        this.isActive = false;
        this.cloakingFidelity = 0.95; // 95% invisible
        this.neutrinoLeakage = 0.05;
    }

    engage() {
        this.isActive = true;
        return { status: 'CLOAKED', visReduction: 0.99, thermalReduction: 0.85 };
    }

    /**
     * Checks if the ship is detected by advanced deep-space sensors.
     */
    checkDetection(sensorSensitivity, distance) {
        if (!this.isActive) return true;
        
        const detectThreshold = (sensorSensitivity / distance) * this.neutrinoLeakage;
        return detectThreshold > 0.5;
    }

    disengage() {
        this.isActive = false;
        return 'DECLOAKING_RE-ENTERING_VISUAL';
    }
}

if (typeof module !== 'undefined') module.exports = CloakingDevice;