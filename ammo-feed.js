/**
 * Ammunition Feed System (UPGRADED)
 * Mechanical simulation of ammo belts, autoloader cycles, and jam probabilities.
 */
class AmmoFeed {
    constructor(caliber = 50) {
        this.magazineSize = 100;
        this.currentAmmo = 100;
        this.isJamming = false;
        this.jamChance = caliber > 100 ? 0.05 : 0.01;
    }

    cycleRound() {
        if (this.currentAmmo <= 0) return 'OUT_OF_AMMO';
        if (Math.random() < this.jamChance) {
            this.isJamming = true;
            return 'FEED_JAMMED';
        }
        this.currentAmmo--;
        return 'ROUND_CHAMBERED';
    }

    clearJam() {
        this.isJamming = false;
        return 'JAM_CLEARED';
    }
}
if (typeof module !== 'undefined') module.exports = AmmoFeed;