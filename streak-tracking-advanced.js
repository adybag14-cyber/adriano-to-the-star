/**
 * Streak Tracking Advanced
 * Advanced streak tracking system
 */

class StreakTrackingAdvanced {
    constructor() {
        this.streaks = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Streak Tracking Advanced initialized' };
    }

    recordActivity(userId, activityType) {
        const key = `${userId}-${activityType}`;
        const today = new Date().toDateString();
        const streak = this.streaks.get(key) || {
            userId,
            activityType,
            currentStreak: 0,
            longestStreak: 0,
            lastActivity: null
        };
        
        if (streak.lastActivity !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (streak.lastActivity === yesterday.toDateString()) {
                streak.currentStreak++;
            } else {
                streak.currentStreak = 1;
            }
            if (streak.currentStreak > streak.longestStreak) {
                streak.longestStreak = streak.currentStreak;
            }
            streak.lastActivity = today;
        }
        
        this.streaks.set(key, streak);
        return streak;
    }

    getStreak(userId, activityType) {
        const key = `${userId}-${activityType}`;
        return this.streaks.get(key) || { currentStreak: 0, longestStreak: 0 };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreakTrackingAdvanced;
}

