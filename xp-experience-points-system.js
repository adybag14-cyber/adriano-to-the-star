/**
 * XP (Experience Points) System
 * @class XPExperiencePointsSystem
 * @description Manages experience points with earning and spending.
 */
class XPExperiencePointsSystem {
    constructor() {
        this.userXP = new Map();
        this.transactions = [];
        this.init();
    }

    init() {
        console.log('XP (Experience Points) System initialized.');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("x_pe_xp_er_ie_nc_ep_oi_nt_ss_ys_te_m_" + eventName, 1, data);
            }
        } catch (_e) { /* Silent fail */ }
    }


    /**
     * Award XP to user.
     * @param {string} userId - User identifier.
     * @param {number} xp - XP amount.
     * @param {string} reason - Reason for awarding XP.
     */
    awardXP(userId, xp, reason) {
        const userXPData = this.userXP.get(userId) || {
            userId,
            totalXP: 0,
            lifetimeXP: 0
        };

        userXPData.totalXP += xp;
        userXPData.lifetimeXP += xp;

        this.userXP.set(userId, userXPData);

        this.transactions.push({
            userId,
            xp,
            type: 'earned',
            reason,
            timestamp: new Date()
        });

        console.log(`Awarded ${xp} XP to user ${userId}: ${reason}`);
    }

    /**
     * Spend XP.
     * @param {string} userId - User identifier.
     * @param {number} xp - XP amount to spend.
     * @param {string} reason - Reason for spending.
     */
    spendXP(userId, xp, reason) {
        const userXPData = this.userXP.get(userId);
        if (!userXPData || userXPData.totalXP < xp) {
            throw new Error('Insufficient XP');
        }

        userXPData.totalXP -= xp;
        this.userXP.set(userId, userXPData);

        this.transactions.push({
            userId,
            xp: -xp,
            type: 'spent',
            reason,
            timestamp: new Date()
        });

        console.log(`Spent ${xp} XP from user ${userId}: ${reason}`);
    }

    /**
     * Get user XP.
     * @param {string} userId - User identifier.
     * @returns {object} User XP data.
     */
    getUserXP(userId) {
        return this.userXP.get(userId) || {
            userId,
            totalXP: 0,
            lifetimeXP: 0
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.xpExperiencePointsSystem = new XPExperiencePointsSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XPExperiencePointsSystem;
}

