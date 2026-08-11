/**
 * Skill-based Matching v2
 * Advanced skill-based matching system for competitive engagement
 */

class SkillBasedMatchingV2 {
    constructor() {
        this.players = new Map();
        this.matches = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('skill_matching_v2_initialized');
        return { success: true, message: 'Skill-based Matching v2 initialized' };
    }

    registerPlayer(userId, skillLevel) {
        const player = {
            userId,
            skillLevel,
            matchHistory: [],
            currentStatus: 'idle',
            registeredAt: new Date()
        };
        this.players.set(userId, player);
        this.trackEvent('player_registered', { userId, skillLevel });
        return player;
    }

    findMatch(userId) {
        const player = this.players.get(userId);
        if (!player) throw new Error('Player not found');

        player.currentStatus = 'searching';
        
        // Matchmaking logic: find player with closest skill level
        let bestMatch = null;
        let minDiff = Infinity;

        for (const [id, otherPlayer] of this.players) {
            if (id === userId || otherPlayer.currentStatus !== 'searching') continue;

            const diff = Math.abs(player.skillLevel - otherPlayer.skillLevel);
            if (diff < minDiff) {
                minDiff = diff;
                bestMatch = otherPlayer;
            }
        }

        if (bestMatch && minDiff < 10) { // Threshold for matching
            const matchId = `match_${Date.now()}`;
            const match = {
                id: matchId,
                players: [userId, bestMatch.userId],
                skillDiff: minDiff,
                status: 'active',
                createdAt: new Date()
            };

            player.currentStatus = 'in-match';
            bestMatch.currentStatus = 'in-match';
            this.matches.set(matchId, match);
            
            this.trackEvent('match_created', { matchId, skillDiff: minDiff });
            return match;
        }

        return null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`skill_matching_v2_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'skill_matching_v2', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.SkillBasedMatchingV2 = SkillBasedMatchingV2;
    window.skillBasedMatchingV2 = new SkillBasedMatchingV2();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillBasedMatchingV2;
}
