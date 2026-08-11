/**
 * Achievement Sharing
 * @class AchievementSharing
 * @description Allows users to share achievements on social media.
 */
class AchievementSharing {
    constructor() {
        this.shares = new Map();
        this.init();
    }

    init() {
        this.trackEvent('achievement_sharing_initialized');
    }

    /**
     * Share achievement.
     * @param {string} userId - User identifier.
     * @param {string} achievementId - Achievement identifier.
     * @param {string} platform - Social media platform.
     */
    shareAchievement(userId, achievementId, platform) {
        const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.shares.set(shareId, {
            id: shareId,
            userId,
            achievementId,
            platform,
            sharedAt: new Date()
        });

        const shareUrl = this.generateShareUrl(achievementId, userId);
        this.trackEvent('achievement_shared', { userId, achievementId, platform });
        return shareUrl;
    }

    /**
     * Generate share URL.
     * @param {string} achievementId - Achievement identifier.
     * @param {string} userId - User identifier.
     * @returns {string} Share URL.
     */
    generateShareUrl(achievementId, userId) {
        return `https://example.com/achievements/${achievementId}?user=${userId}`;
    }

    /**
     * Get share statistics.
     * @param {string} achievementId - Achievement identifier.
     * @returns {object} Share statistics.
     */
    getShareStats(achievementId) {
        const shares = Array.from(this.shares.values())
            .filter(share => share.achievementId === achievementId);

        return {
            totalShares: shares.length,
            byPlatform: this.groupByPlatform(shares)
        };
    }

    /**
     * Group shares by platform.
     * @param {Array<object>} shares - Shares array.
     * @returns {object} Grouped shares.
     */
    groupByPlatform(shares) {
        const grouped = {};
        shares.forEach(share => {
            grouped[share.platform] = (grouped[share.platform] || 0) + 1;
        });
        return grouped;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`achievement_sharing_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'achievement_sharing', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.achievementSharing = new AchievementSharing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementSharing;
}

