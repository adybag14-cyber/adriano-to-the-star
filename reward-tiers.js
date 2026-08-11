/**
 * Reward Tiers
 * @class RewardTiers
 * @description Manages reward tiers with different benefits and requirements.
 */
class RewardTiers {
    constructor() {
        this.tiers = new Map();
        this.userTiers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ew_ar_dt_ie_rs_initialized');
        this.setupDefaultTiers();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ew_ar_dt_ie_rs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultTiers() {
        this.tiers.set('bronze', {
            id: 'bronze',
            name: 'Bronze',
            minPoints: 0,
            benefits: ['basic_rewards']
        });

        this.tiers.set('silver', {
            id: 'silver',
            name: 'Silver',
            minPoints: 1000,
            benefits: ['basic_rewards', 'exclusive_items']
        });

        this.tiers.set('gold', {
            id: 'gold',
            name: 'Gold',
            minPoints: 5000,
            benefits: ['basic_rewards', 'exclusive_items', 'priority_support']
        });

        this.tiers.set('platinum', {
            id: 'platinum',
            name: 'Platinum',
            minPoints: 10000,
            benefits: ['all_benefits', 'early_access', 'vip_events']
        });
    }

    /**
     * Get user tier.
     * @param {string} userId - User identifier.
     * @param {number} userPoints - User's total points.
     * @returns {object} User tier.
     */
    getUserTier(userId, userPoints) {
        const tiers = Array.from(this.tiers.values())
            .sort((a, b) => b.minPoints - a.minPoints);

        for (const tier of tiers) {
            if (userPoints >= tier.minPoints) {
                this.userTiers.set(userId, {
                    userId,
                    tierId: tier.id,
                    points: userPoints,
                    updatedAt: new Date()
                });
                return tier;
            }
        }

        return tiers[tiers.length - 1];
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.rewardTiers = new RewardTiers();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RewardTiers;
}

