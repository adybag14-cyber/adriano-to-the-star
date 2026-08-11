/**
 * Starship Tier Progression (UPGRADED)
 * Logic for ship-class evolution and structural hull upgrades.
 */
class ShipTierLogic {
    constructor() {
        this.tierRequirements = {
            2: { scrap: 1000, tech: 50 },
            3: { scrap: 5000, tech: 200 }
        };
    }

    checkEligibility(currentTier, resources) {
        const req = this.tierRequirements[currentTier + 1];
        if (!req) return false;
        return resources.scrap >= req.scrap && resources.tech >= req.tech;
    }
}
if (typeof module !== 'undefined') module.exports = ShipTierLogic;