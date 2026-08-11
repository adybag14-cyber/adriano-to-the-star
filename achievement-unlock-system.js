/**
 * Achievement Unlock System
 * @class AchievementUnlockSystem
 * @description Manages achievements with unlock conditions and notifications.
 */
class AchievementUnlockSystem {
    constructor() {
        this.achievements = new Map();
        this.userAchievements = new Map();
        this.init();
    }

    init() {
        this.trackEvent('achievement_system_initialized');
    }

    /**
     * Register an achievement.
     * @param {string} achievementId - Achievement identifier.
     * @param {object} achievementData - Achievement data.
     */
    registerAchievement(achievementId, achievementData) {
        this.achievements.set(achievementId, {
            ...achievementData,
            id: achievementId,
            unlockedCount: 0,
            createdAt: new Date()
        });
        this.trackEvent('achievement_registered', { achievementId, name: achievementData.name, points: achievementData.points });
    }

    /**
     * Check and unlock achievements.
     * @param {string} userId - User identifier.
     * @param {string} eventType - Event type.
     * @param {object} eventData - Event data.
     */
    checkAchievements(userId, eventType, eventData) {
        const userAchievements = this.userAchievements.get(userId) || new Set();
        
        for (const achievement of this.achievements.values()) {
            if (userAchievements.has(achievement.id)) continue;

            if (this.checkUnlockCondition(achievement, eventType, eventData)) {
                this.unlockAchievement(userId, achievement.id);
            }
        }
    }

    /**
     * Check unlock condition.
     * @param {object} achievement - Achievement object.
     * @param {string} eventType - Event type.
     * @param {object} eventData - Event data.
     * @returns {boolean} Whether condition is met.
     */
    checkUnlockCondition(achievement, eventType, eventData) {
        // Placeholder for condition checking logic
        if (achievement.condition && achievement.condition.type === eventType) {
            return achievement.condition.check(eventData);
        }
        return false;
    }

    /**
     * Unlock an achievement.
     * @param {string} userId - User identifier.
     * @param {string} achievementId - Achievement identifier.
     */
    unlockAchievement(userId, achievementId) {
        const userAchievements = this.userAchievements.get(userId) || new Set();
        userAchievements.add(achievementId);
        this.userAchievements.set(userId, userAchievements);

        const achievement = this.achievements.get(achievementId);
        achievement.unlockedCount++;

        this.trackEvent('achievement_unlocked', { userId, achievementId, achievementName: achievement.name });
        
        // Trigger notification
        this.notifyAchievementUnlock(userId, achievement);
    }

    /**
     * Notify achievement unlock.
     * @param {string} userId - User identifier.
     * @param {object} achievement - Achievement object.
     */
    notifyAchievementUnlock(userId, achievement) {
        this.trackEvent('unlock_notification_sent', { userId, achievementId: achievement.id });
    }

    /**
     * Get user achievements.
     * @param {string} userId - User identifier.
     * @returns {Array<object>} User achievements.
     */
    getUserAchievements(userId) {
        const userAchievements = this.userAchievements.get(userId) || new Set();
        return Array.from(userAchievements).map(id => this.achievements.get(id));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`achievement_unlock_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'achievement_unlock_system', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.achievementUnlockSystem = new AchievementUnlockSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementUnlockSystem;
}
