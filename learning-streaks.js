/**
 * Learning Streaks
 * @class LearningStreaks
 * @description Tracks learning streaks for motivation.
 */
class LearningStreaks {
    constructor() {
        this.streaks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_ea_rn_in_gs_tr_ea_ks_initialized');
        this.loadStreaks();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ea_rn_in_gs_tr_ea_ks_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Record learning activity.
     * @param {string} userId - User identifier.
     * @param {string} activityType - Activity type.
     */
    recordActivity(userId, activityType) {
        const streakKey = `${userId}_learning`;
        const streak = this.streaks.get(streakKey) || {
            userId,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null
        };

        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (streak.lastActivityDate === today) {
            return; // Already recorded today
        }

        if (streak.lastActivityDate === yesterday || streak.lastActivityDate === null) {
            streak.currentStreak++;
        } else {
            streak.currentStreak = 1;
        }

        streak.lastActivityDate = today;
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

        this.streaks.set(streakKey, streak);
        this.saveStreaks();
        console.log(`Learning streak updated for user ${userId}: ${streak.currentStreak} days`);
    }

    /**
     * Get user streak.
     * @param {string} userId - User identifier.
     * @returns {object} Streak data.
     */
    getUserStreak(userId) {
        const streakKey = `${userId}_learning`;
        return this.streaks.get(streakKey) || {
            userId,
            currentStreak: 0,
            longestStreak: 0
        };
    }

    saveStreaks() {
        try {
            localStorage.setItem('learningStreaks', JSON.stringify(
                Object.fromEntries(this.streaks)
            ));
        } catch (error) {
            console.error('Failed to save streaks:', error);
        }
    }

    loadStreaks() {
        try {
            const stored = localStorage.getItem('learningStreaks');
            if (stored) {
                this.streaks = new Map(Object.entries(JSON.parse(stored)));
            }
        } catch (error) {
            console.error('Failed to load streaks:', error);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.learningStreaks = new LearningStreaks();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningStreaks;
}

