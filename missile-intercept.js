/**
 * Missile Intercept Logic (UPGRADED)
 * Probability-based math for counter-missile and PD-laser interception.
 */
class MissileIntercept {
    /**
     * Calculates the probability of a successful intercept.
     */
    getInterceptChance(missileSpeed, counterMeasureRating, distance) {
        const base = 0.9;
        const speedPenalty = (missileSpeed / 5000) * 0.3;
        const distanceBonus = (distance / 1000) * 0.05; // More time to react
        
        const finalChance = (base - speedPenalty + distanceBonus) * (counterMeasureRating / 100);
        return Math.max(0.01, Math.min(0.99, finalChance));
    }

    resolveInterception(salvoSize, interceptChance) {
        let destroyed = 0;
        for (let i = 0; i < salvoSize; i++) {
            if (Math.random() < interceptChance) destroyed++;
        }
        return { total: salvoSize, destroyed, leaked: salvoSize - destroyed };
    }
}
if (typeof module !== 'undefined') module.exports = MissileIntercept;