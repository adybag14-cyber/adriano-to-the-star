/**
 * Salvage Beam Controller (UPGRADED)
 * Gravitational and magnetic logic for harvesting materials from wreck debris.
 */
class SalvageBeam {
    constructor() {
        this.beamStability = 1.0;
        this.maxTonnage = 500;
    }

    /**
     * Extracts specific components from a starship wreck.
     */
    extractMaterial(wreck, type) {
        const yieldMod = this.beamStability * (Math.random() * 0.2 + 0.8);
        const amount = (wreck.components[type] || 0) * yieldMod;
        
        this.beamStability -= 0.05; // Friction/vibration loss
        return { type, amount, loss: (1 - yieldMod) * 100 };
    }

    stabilize() {
        this.beamStability = Math.min(1.0, this.beamStability + 0.1);
    }
}
if (typeof module !== 'undefined') module.exports = SalvageBeam;