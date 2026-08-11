/**
 * Personalized Challenges Advanced
 * Advanced personalized challenge system
 */

class PersonalizedChallengesAdvanced {
    constructor() {
        this.challenges = new Map();
        this.userChallenges = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Personalized Challenges Advanced initialized' };
    }

    createPersonalizedChallenge(userId, challengeData) {
        if (!challengeData || !challengeData.title) {
            throw new Error('Challenge data is required');
        }
        const challenge = {
            id: Date.now().toString(),
            userId,
            ...challengeData,
            createdAt: new Date(),
            status: 'active'
        };
        this.challenges.set(challenge.id, challenge);
        const key = `${userId}-${challenge.id}`;
        this.userChallenges.set(key, challenge);
        return challenge;
    }

    getUserChallenges(userId) {
        return Array.from(this.userChallenges.values())
            .filter(c => c.userId === userId);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersonalizedChallengesAdvanced;
}

