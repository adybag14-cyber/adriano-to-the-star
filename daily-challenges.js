/**
 * Daily Challenges
 * @class DailyChallenges
 * @description Manages daily challenges with completion tracking and rewards.
 */
class DailyChallenges {
    constructor() {
        this.challenges = new Map();
        this.userProgress = new Map();
        this.init();
    }

    init() {
        this.generateDailyChallenges();
        this.trackEvent('daily_challenges_initialized');
    }

    /**
     * Generate daily challenges.
     */
    generateDailyChallenges() {
        const today = new Date().toDateString();
        const challenges = [
            { id: 'daily_1', name: 'Complete 3 lessons', target: 3, reward: 50 },
            { id: 'daily_2', name: 'Answer 5 questions', target: 5, reward: 30 },
            { id: 'daily_3', name: 'Watch 2 videos', target: 2, reward: 40 }
        ];

        challenges.forEach(challenge => {
            this.challenges.set(challenge.id, {
                ...challenge,
                date: today,
                type: 'daily'
            });
        });
    }

    /**
     * Track challenge progress.
     * @param {string} userId - User identifier.
     * @param {string} challengeId - Challenge identifier.
     * @param {number} progress - Progress value.
     */
    trackProgress(userId, challengeId, progress) {
        const progressKey = `${userId}_${challengeId}`;
        const userProgress = this.userProgress.get(progressKey) || {
            userId,
            challengeId,
            current: 0,
            completed: false
        };

        userProgress.current = progress;
        const challenge = this.challenges.get(challengeId);
        
        if (challenge && userProgress.current >= challenge.target && !userProgress.completed) {
            userProgress.completed = true;
            userProgress.completedAt = new Date();
            console.log(`Challenge ${challengeId} completed by user ${userId}`);
        }

        this.userProgress.set(progressKey, userProgress);
    }

    /**
     * Get user challenges.
     * @param {string} userId - User identifier.
     * @returns {Array<object>} User challenges with progress.
     */
    getUserChallenges(userId) {
        return Array.from(this.challenges.values()).map(challenge => {
            const progressKey = `${userId}_${challenge.id}`;
            const progress = this.userProgress.get(progressKey) || {
                current: 0,
                completed: false
            };

            return {
                ...challenge,
                progress: progress.current,
                target: challenge.target,
                completed: progress.completed
            };
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`daily_challenges_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dailyChallenges = new DailyChallenges();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyChallenges;
}
