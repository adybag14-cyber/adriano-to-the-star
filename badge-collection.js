/**
 * Badge Collection
 * @class BadgeCollection
 * @description Manages badge collection and display.
 */
class BadgeCollection {
    constructor() {
        this.badges = new Map();
        this.userBadges = new Map();
        this.init();
    }

    init() {
        this.trackEvent('badge_collection_initialized');
    }

    /**
     * Register a badge.
     * @param {string} badgeId - Badge identifier.
     * @param {object} badgeData - Badge data.
     */
    registerBadge(badgeId, badgeData) {
        this.badges.set(badgeId, {
            ...badgeData,
            id: badgeId,
            category: badgeData.category || 'general',
            rarity: badgeData.rarity || 'common',
            unlockedCount: 0,
            createdAt: new Date()
        });
        console.log(`Badge registered: ${badgeId}`);
    }

    /**
     * Unlock badge for user.
     * @param {string} userId - User identifier.
     * @param {string} badgeId - Badge identifier.
     */
    unlockBadge(userId, badgeId) {
        const badge = this.badges.get(badgeId);
        if (!badge) {
            throw new Error(`Badge not found: ${badgeId}`);
        }

        const userBadgeKey = `${userId}_${badgeId}`;
        if (!this.userBadges.has(userBadgeKey)) {
            this.userBadges.set(userBadgeKey, {
                userId,
                badgeId,
                unlockedAt: new Date()
            });

            badge.unlockedCount++;
            console.log(`Badge unlocked: ${badgeId} for user ${userId}`);
        }
    }

    /**
     * Get user badges.
     * @param {string} userId - User identifier.
     * @returns {Array<object>} User badges.
     */
    getUserBadges(userId) {
        const userBadgeKeys = Array.from(this.userBadges.keys())
            .filter(key => key.startsWith(`${userId}_`));

        return userBadgeKeys.map(key => {
            const userBadge = this.userBadges.get(key);
            const badge = this.badges.get(userBadge.badgeId);
            return {
                ...badge,
                unlockedAt: userBadge.unlockedAt
            };
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`badge_coll_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.badgeCollection = new BadgeCollection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BadgeCollection;
}

