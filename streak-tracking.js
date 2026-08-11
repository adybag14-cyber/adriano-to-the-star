/**
 * Streak Tracking
 * Tracks user streaks
 */

class StreakTracking {
    constructor() {
        this.streaks = new Map();
        this.init();
    }
    
    init() {
        this.setupStreaks();
    }
    
    setupStreaks() {
        // Setup streak tracking
    }
    
    async updateStreak(userId, activity) {
        const key = `${userId}_${activity}`;
        const streak = this.streaks.get(key) || { count: 0, lastDate: null };
        
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        if (streak.lastDate === today) {
            // Already updated today
            return streak;
        } else if (streak.lastDate === yesterday) {
            // Continue streak
            streak.count++;
        } else {
            // Reset streak
            streak.count = 1;
        }
        
        streak.lastDate = today;
        this.streaks.set(key, streak);
        return streak;
    }
    
    async getStreak(userId, activity) {
        const key = `${userId}_${activity}`;
        return this.streaks.get(key) || { count: 0, lastDate: null };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.streakTracking = new StreakTracking(); });
} else {
    window.streakTracking = new StreakTracking();
}
