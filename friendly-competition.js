/**
 * Friendly Competition
 * @class FriendlyCompetition
 * @description Manages friendly competitions between users.
 */
class FriendlyCompetition {
    constructor() {
        this.competitions = new Map();
        this.participants = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_ri_en_dl_yc_om_pe_ti_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_ri_en_dl_yc_om_pe_ti_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create competition.
     * @param {string} competitionId - Competition identifier.
     * @param {object} competitionData - Competition data.
     */
    createCompetition(competitionId, competitionData) {
        this.competitions.set(competitionId, {
            ...competitionData,
            id: competitionId,
            participants: [],
            metric: competitionData.metric,
            startDate: competitionData.startDate,
            endDate: competitionData.endDate,
            status: 'upcoming',
            createdAt: new Date()
        });
        console.log(`Friendly competition created: ${competitionId}`);
    }

    /**
     * Join competition.
     * @param {string} competitionId - Competition identifier.
     * @param {string} userId - User identifier.
     */
    joinCompetition(competitionId, userId) {
        const competition = this.competitions.get(competitionId);
        if (competition && !competition.participants.includes(userId)) {
            competition.participants.push(userId);
            this.participants.set(`${competitionId}_${userId}`, {
                competitionId,
                userId,
                score: 0,
                joinedAt: new Date()
            });
            console.log(`User ${userId} joined competition ${competitionId}`);
        }
    }

    /**
     * Update participant score.
     * @param {string} competitionId - Competition identifier.
     * @param {string} userId - User identifier.
     * @param {number} score - Score value.
     */
    updateScore(competitionId, userId, score) {
        const participantKey = `${competitionId}_${userId}`;
        const participant = this.participants.get(participantKey);
        if (participant) {
            participant.score = score;
            console.log(`Score updated for competition ${competitionId}: ${userId} = ${score}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.friendlyCompetition = new FriendlyCompetition();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FriendlyCompetition;
}

