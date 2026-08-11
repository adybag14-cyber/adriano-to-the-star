/**
 * Leaderboards v2
 * Advanced leaderboards system
 */

class LeaderboardsV2 {
    constructor() {
        this.leaderboards = new Map();
        this.entries = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Leaderboards v2 initialized' };
    }

    createLeaderboard(name, metric, period) {
        if (!['daily', 'weekly', 'monthly', 'alltime'].includes(period)) {
            throw new Error('Invalid period');
        }
        const leaderboard = {
            id: Date.now().toString(),
            name,
            metric,
            period,
            createdAt: new Date()
        };
        this.leaderboards.set(leaderboard.id, leaderboard);
        this.entries.set(leaderboard.id, []);
        return leaderboard;
    }

    addEntry(leaderboardId, userId, score) {
        if (score < 0) {
            throw new Error('Score must be non-negative');
        }
        const leaderboard = this.leaderboards.get(leaderboardId);
        if (!leaderboard) {
            throw new Error('Leaderboard not found');
        }
        const entries = this.entries.get(leaderboardId);
        const entry = {
            userId,
            score,
            rank: 0,
            updatedAt: new Date()
        };
        entries.push(entry);
        entries.sort((a, b) => b.score - a.score);
        entries.forEach((e, index) => {
            e.rank = index + 1;
        });
        return entry;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardsV2;
}

