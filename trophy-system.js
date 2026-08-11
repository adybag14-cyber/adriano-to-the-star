/**
 * Trophy System
 * @class TrophySystem
 * @description Manages trophy collection and achievements.
 */
class TrophySystem {
    constructor() {
        this.trophies = new Map();
        this.userTrophies = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_ro_ph_ys_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_ro_ph_ys_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Register a trophy.
     * @param {string} trophyId - Trophy identifier.
     * @param {object} trophyData - Trophy data.
     */
    registerTrophy(trophyId, trophyData) {
        this.trophies.set(trophyId, {
            ...trophyData,
            id: trophyId,
            rarity: trophyData.rarity || 'common',
            points: trophyData.points || 0,
            unlockedCount: 0,
            createdAt: new Date()
        });
        console.log(`Trophy registered: ${trophyId}`);
    }

    /**
     * Award trophy to user.
     * @param {string} userId - User identifier.
     * @param {string} trophyId - Trophy identifier.
     */
    awardTrophy(userId, trophyId) {
        const trophy = this.trophies.get(trophyId);
        if (!trophy) {
            throw new Error(`Trophy not found: ${trophyId}`);
        }

        const userTrophyKey = `${userId}_${trophyId}`;
        if (!this.userTrophies.has(userTrophyKey)) {
            this.userTrophies.set(userTrophyKey, {
                userId,
                trophyId,
                awardedAt: new Date()
            });

            trophy.unlockedCount++;
            console.log(`Trophy awarded: ${trophyId} to user ${userId}`);
        }
    }

    /**
     * Get user trophies.
     * @param {string} userId - User identifier.
     * @returns {Array<object>} User trophies.
     */
    getUserTrophies(userId) {
        const userTrophyKeys = Array.from(this.userTrophies.keys())
            .filter(key => key.startsWith(`${userId}_`));

        return userTrophyKeys.map(key => {
            const userTrophy = this.userTrophies.get(key);
            const trophy = this.trophies.get(userTrophy.trophyId);
            return {
                ...trophy,
                awardedAt: userTrophy.awardedAt
            };
        });
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.trophySystem = new TrophySystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrophySystem;
}

