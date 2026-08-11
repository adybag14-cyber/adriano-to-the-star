/**
 * Ranking System v2
 * Advanced global and regional ranking system
 */

class RankingSystemV2 {
    constructor() {
        this.ranks = new Map(); // userId -> score
        this.cachedRankings = null;
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('ranking_system_v2_initialized');
        return { success: true, message: 'Ranking System v2 initialized' };
    }

    updateScore(userId, newScore) {
        this.ranks.set(userId, newScore);
        this.cachedRankings = null; // Invalidate cache
        this.trackEvent('score_updated', { userId, newScore });
    }

    getGlobalRankings(limit = 100) {
        if (this.cachedRankings) return this.cachedRankings.slice(0, limit);

        const sorted = Array.from(this.ranks.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([userId, score], index) => ({
                userId,
                score,
                rank: index + 1
            }));

        this.cachedRankings = sorted;
        return sorted.slice(0, limit);
    }

    getUserRank(userId) {
        const rankings = this.getGlobalRankings();
        return rankings.find(r => r.userId === userId) || null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ranking_v2_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'ranking_system_v2', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.RankingSystemV2 = RankingSystemV2;
    window.rankingSystemV2 = new RankingSystemV2();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RankingSystemV2;
}
