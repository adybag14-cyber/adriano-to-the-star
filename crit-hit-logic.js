/**
 * Critical Hit Logic
 * Determines damage multipliers and component failure during combat
 */
class CritHitLogic {
    calculateCrit(attacker, defender) {
        const roll = Math.random();
        if (roll > 0.95) return { multiplier: 2.5, component: 'REACTOR', status: 'CRITICAL' };
        if (roll > 0.85) return { multiplier: 1.5, component: 'SENSORS', status: 'DAMAGED' };
        return { multiplier: 1.0, component: null, status: 'NORMAL' };
    }
}
if (typeof module !== 'undefined') module.exports = CritHitLogic;
