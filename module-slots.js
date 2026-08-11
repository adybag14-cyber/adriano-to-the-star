/**
 * Module Slot Manager (UPGRADED)
 * Strategic logic for Starship Hardpoints, sizing constraints, and power-draw validation.
 */
class ModuleSlots {
    constructor(hullClass) {
        this.slots = hullClass === 'CAPITAL' ? 12 : 4;
        this.mountedModules = new Map();
        this.totalPowerDraw = 0;
    }

    installModule(moduleId, specs) {
        if (this.mountedModules.size >= this.slots) throw new Error('NO_AVAILABLE_SLOTS');
        if (specs.size > 2 && this.slots < 8) throw new Error('SLOT_SIZE_MISMATCH');

        this.mountedModules.set(moduleId, specs);
        this.calculatePowerLoad();
        return { success: true, currentLoad: this.totalPowerDraw };
    }

    calculatePowerLoad() {
        this.totalPowerDraw = Array.from(this.mountedModules.values())
            .reduce((acc, mod) => acc + (mod.powerReq || 0), 0);
    }
}
if (typeof module !== 'undefined') module.exports = ModuleSlots;