/**
 * Streak Tracking v2
 * Advanced streak tracking system
 */

class StreakTrackingV2 {
    constructor() {
        this.streaks = new Map();
        this.records = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Streak Tracking v2 initialized' };
    }

    getUserStreak(userId, type) {
        const key = `${userId}-${type}`;
        const streak = this.streaks.get(key);
        return streak ? streak.count : 0;
    }

    recordActivity(userId, type) {
        const key = `${userId}-${type}`;
        const today = new Date().toDateString();
        const lastRecord = this.records
            .filter(r => r.userId === userId && r.type === type)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        const streak = this.streaks.get(key) || { userId, type, count: 0, lastDate: null };
        const lastDate = lastRecord ? new Date(lastRecord.timestamp).toDateString() : null;
        
        if (lastDate === today) {
            return { userId, type, count: streak.count, message: 'Already recorded today' };
        }
        
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        if (lastDate === yesterday) {
            streak.count += 1;
        } else {
            streak.count = 1;
        }
        
        streak.lastDate = today;
        this.streaks.set(key, streak);
        
        const record = {
            userId,
            type,
            timestamp: new Date()
        };
        this.records.push(record);
        return { userId, type, count: streak.count, record };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreakTrackingV2;
}

