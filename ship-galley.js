/**
 * Starship Galley Logic (UPGRADED)
 * Nutritional simulation and luxury meal impact on crew morale.
 */
class ShipGalley {
    constructor() {
        this.stores = { protein: 5000, carbs: 10000, luxury: 100 };
    }

    serveMeal(isLuxury) {
        if (isLuxury && this.stores.luxury > 0) {
            this.stores.luxury--;
            return { moraleBonus: 5, nutrition: 1.2 };
        }
        this.stores.protein -= 1;
        this.stores.carbs -= 2;
        return { moraleBonus: 0, nutrition: 1.0 };
    }
}
if (typeof module !== 'undefined') module.exports = ShipGalley;