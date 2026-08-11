/**
 * Armor Angling Bonus (UPGRADED)
 * Vector-based calculation of effective armor thickness based on impact angle.
 */
class ArmorAngling {
    constructor(baseThickness = 500) {
        this.thickness = baseThickness; // mm
    }

    /**
     * Calculates the effective protection against a kinetic projectile.
     */
    calculateEffectiveThickness(impactVector, armorNormal) {
        // Effective = Thickness / cos(theta)
        const dotProduct = impactVector.x * armorNormal.x + impactVector.y * armorNormal.y;
        const angle = Math.acos(dotProduct);
        
        const effective = this.thickness / Math.max(0.1, Math.cos(angle));
        const ricochetChance = angle > (Math.PI / 3) ? 0.4 : 0.05;

        return {
            effectiveThickness: effective,
            ricochet: Math.random() < ricochetChance,
            angleDegrees: (angle * 180) / Math.PI
        };
    }
}
if (typeof module !== 'undefined') module.exports = ArmorAngling;