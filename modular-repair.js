/**
 * Modular Component Repair (UPGRADED)
 * Specific logic for field maintenance of sensors, engines, and life support.
 */
class ModularRepair {
    constructor() {
        this.complexityModifiers = { 'SENSORS': 1.2, 'ENGINES': 2.0, 'LIFE_SUPPORT': 1.5 };
    }

    /**
     * Attempts a repair based on engineer skill and available parts.
     */
    attemptRepair(component, engineerSkill, spareParts) {
        const baseDifficulty = 50;
        const mod = this.complexityModifiers[component.type] || 1.0;
        const roll = Math.random() * 100 * (engineerSkill / 100);

        if (roll > (baseDifficulty * mod)) {
            component.integrity = Math.min(100, component.integrity + (spareParts * 2));
            return { success: true, newIntegrity: component.integrity };
        }

        return { success: false, message: 'REPAIR_FAILED_COMPLEXITY_OVERLOAD' };
    }
}
if (typeof module !== 'undefined') module.exports = ModularRepair;