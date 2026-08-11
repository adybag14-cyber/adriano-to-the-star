/**
 * Beta Testing Rewards v2
 * Advanced beta testing rewards system
 */

class BetaTestingRewardsV2 {
    constructor() {
        this.programs = new Map();
        this.testers = new Map();
        this.rewards = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('beta_v2_initialized');
        return { success: true, message: 'Beta Testing Rewards v2 initialized' };
    }

    createProgram(name, reward, requirements) {
        if (!Array.isArray(requirements)) {
            throw new Error('Requirements must be an array');
        }
        const program = {
            id: Date.now().toString(),
            name,
            reward,
            requirements,
            createdAt: new Date(),
            active: true
        };
        this.programs.set(program.id, program);
        return program;
    }

    enrollTester(userId, programId) {
        const program = this.programs.get(programId);
        if (!program || !program.active) {
            throw new Error('Program not found or inactive');
        }
        const key = `${userId}-${programId}`;
        const tester = {
            userId,
            programId,
            enrolledAt: new Date(),
            status: 'active'
        };
        this.testers.set(key, tester);
        return tester;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`beta_v2_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BetaTestingRewardsV2;
}

