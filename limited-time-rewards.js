/**
 * Limited Time Rewards
 * @class LimitedTimeRewards
 * @description Manages limited-time rewards with expiration dates.
 */
class LimitedTimeRewards {
    constructor() {
        this.rewards = new Map();
        this.claims = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_im_it_ed_ti_me_re_wa_rd_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_im_it_ed_ti_me_re_wa_rd_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create limited-time reward.
     * @param {string} rewardId - Reward identifier.
     * @param {object} rewardData - Reward data.
     */
    createReward(rewardId, rewardData) {
        this.rewards.set(rewardId, {
            ...rewardData,
            id: rewardId,
            expiresAt: rewardData.expiresAt,
            maxClaims: rewardData.maxClaims || null,
            claimCount: 0,
            createdAt: new Date()
        });
        console.log(`Limited-time reward created: ${rewardId}`);
    }

    /**
     * Claim reward.
     * @param {string} rewardId - Reward identifier.
     * @param {string} userId - User identifier.
     */
    claimReward(rewardId, userId) {
        const reward = this.rewards.get(rewardId);
        if (!reward) {
            throw new Error(`Reward not found: ${rewardId}`);
        }

        if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
            throw new Error('Reward has expired');
        }

        if (reward.maxClaims && reward.claimCount >= reward.maxClaims) {
            throw new Error('Reward claim limit reached');
        }

        const claimKey = `${rewardId}_${userId}`;
        if (this.claims.has(claimKey)) {
            throw new Error('Reward already claimed');
        }

        this.claims.set(claimKey, {
            rewardId,
            userId,
            claimedAt: new Date()
        });

        reward.claimCount++;
        console.log(`Reward claimed: ${rewardId} by user ${userId}`);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.limitedTimeRewards = new LimitedTimeRewards();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LimitedTimeRewards;
}

