/**
 * Limited-time Rewards v2
 * Advanced system for rewards available only for a specific duration
 */

class LimitedTimeRewardsV2 {
    constructor() {
        this.rewards = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('limited_rewards_v2_initialized');
        return { success: true, message: 'Limited-time Rewards v2 initialized' };
    }

    addReward(id, name, durationMinutes) {
        const reward = {
            id,
            name,
            expiry: new Date(Date.now() + durationMinutes * 60000),
            claimedBy: []
        };
        this.rewards.set(id, reward);
        this.trackEvent('limited_reward_added', { id, durationMinutes });
        return reward;
    }

    claimReward(id, userId) {
        const reward = this.rewards.get(id);
        if (!reward) throw new Error('Reward not found');
        if (new Date() > reward.expiry) throw new Error('Reward expired');

        if (!reward.claimedBy.includes(userId)) {
            reward.claimedBy.push(userId);
            this.trackEvent('limited_reward_claimed', { id, userId });
            return true;
        }
        return false;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`limited_rewards_v2_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'limited_time_rewards_v2', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.LimitedTimeRewardsV2 = LimitedTimeRewardsV2;
    window.limitedTimeRewardsV2 = new LimitedTimeRewardsV2();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LimitedTimeRewardsV2;
}
