/**
 * Starship Customization Engine (UPGRADED)
 * High-fidelity logic for managing ship hulls, specialized skins, and aesthetic offsets.
 */
class ShipCustomize {
    constructor() {
        this.activeModifications = new Map();
        this.hullPatterns = ['VOID_STALKER', 'SOLAR_FLARE', 'NEBULA_MIST'];
    }

    applyCustomization(shipId, pattern, colorHex) {
        const mod = {
            pattern: this.hullPatterns.includes(pattern) ? pattern : 'DEFAULT',
            primaryColor: colorHex,
            lastUpdated: Date.now()
        };
        this.activeModifications.set(shipId, mod);
        return { success: true, shipId, visualHash: `V-MOD-${pattern}-${colorHex}` };
    }

    getShipAppearance(shipId) {
        return this.activeModifications.get(shipId) || { pattern: 'DEFAULT', primaryColor: '#777777' };
    }
}
if (typeof module !== 'undefined') module.exports = ShipCustomize;