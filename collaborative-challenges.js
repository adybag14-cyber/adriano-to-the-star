/**
 * Collaborative Challenges
 * @class CollaborativeChallenges
 * @description Manages challenges that require team collaboration.
 */
class CollaborativeChallenges {
    constructor() {
        this.challenges = new Map();
        this.participants = new Map();
        this.init();
    }

    init() {
        this.trackEvent('collab_chall_initialized');
    }

    /**
     * Create a collaborative challenge.
     * @param {string} challengeId - Challenge identifier.
     * @param {object} challengeData - Challenge data.
     */
    createChallenge(challengeId, challengeData) {
        this.challenges.set(challengeId, {
            ...challengeData,
            id: challengeId,
            type: 'collaborative',
            participants: [],
            progress: 0,
            target: challengeData.target || 100,
            createdAt: new Date()
        });
        console.log(`Collaborative challenge created: ${challengeId}`);
    }

    /**
     * Join challenge.
     * @param {string} challengeId - Challenge identifier.
     * @param {string} userId - User identifier.
     */
    joinChallenge(challengeId, userId) {
        const challenge = this.challenges.get(challengeId);
        if (challenge && !challenge.participants.includes(userId)) {
            challenge.participants.push(userId);
            console.log(`User ${userId} joined challenge ${challengeId}`);
        }
    }

    /**
     * Contribute to challenge.
     * @param {string} challengeId - Challenge identifier.
     * @param {string} userId - User identifier.
     * @param {number} contribution - Contribution value.
     */
    contribute(challengeId, userId, contribution) {
        const challenge = this.challenges.get(challengeId);
        if (challenge && challenge.participants.includes(userId)) {
            challenge.progress += contribution;
            console.log(`Contribution made to challenge ${challengeId}: ${contribution}`);
            
            if (challenge.progress >= challenge.target) {
                this.completeChallenge(challengeId);
            }
        }
    }

    /**
     * Complete challenge.
     * @param {string} challengeId - Challenge identifier.
     */
    completeChallenge(challengeId) {
        const challenge = this.challenges.get(challengeId);
        if (challenge) {
            challenge.status = 'completed';
            challenge.completedAt = new Date();
            console.log(`Challenge completed: ${challengeId}`);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`collab_chall_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.collaborativeChallenges = new CollaborativeChallenges();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborativeChallenges;
}

