/**
 * Leaderboards Advanced
 * Advanced leaderboard system
 */

class LeaderboardsAdvanced {
    constructor() {
        this.leaderboards = new Map();
        this.scores = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Leaderboards Advanced initialized' };
    }

    createLeaderboard(name, metric) {
        const leaderboard = {
            id: Date.now().toString(),
            name,
            metric,
            createdAt: new Date()
        };
        this.leaderboards.set(leaderboard.id, leaderboard);
        return leaderboard;
    }

    updateScore(leaderboardId, userId, score) {
        if (!this.leaderboards.has(leaderboardId)) {
            throw new Error('Leaderboard not found');
        }
        const key = `${leaderboardId}-${userId}`;
        this.scores.set(key, { leaderboardId, userId, score, updatedAt: new Date() });
    }

    getTopScores(leaderboardId, limit = 10) {
        return Array.from(this.scores.values())
            .filter(s => s.leaderboardId === leaderboardId)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardsAdvanced;
}

