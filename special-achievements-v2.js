/**
 * Special Achievements v2
 * Advanced system for rare and special achievements
 */

class SpecialAchievementsV2 {
    constructor() {
        this.specialAchievements = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('special_achievements_v2_initialized');
        return { success: true, message: 'Special Achievements v2 initialized' };
    }

    defineSpecialAchievement(id, criteria, rarity) {
        const achievement = {
            id,
            criteria,
            rarity, // 'legendary', 'mythic', 'unique'
            unlockedBy: [],
            definedAt: new Date()
        };
        this.specialAchievements.set(id, achievement);
        this.trackEvent('special_achievement_defined', { id, rarity });
        return achievement;
    }

    unlockAchievement(id, userId) {
        const achievement = this.specialAchievements.get(id);
        if (!achievement) throw new Error('Achievement not found');

        if (!achievement.unlockedBy.includes(userId)) {
            achievement.unlockedBy.push(userId);
            this.trackEvent('special_achievement_unlocked', { id, userId, rarity: achievement.rarity });
            return true;
        }
        return false;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`special_achievements_v2_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'special_achievements_v2', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.SpecialAchievementsV2 = SpecialAchievementsV2;
    window.specialAchievementsV2 = new SpecialAchievementsV2();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpecialAchievementsV2;
}
