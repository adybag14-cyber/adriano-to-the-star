/**
 * Beta Testing Rewards
 * Rewards for beta testing
 */

class BetaTestingRewards {
    constructor() {
        this.testers = new Map();
        this.init();
    }
    
    init() {
        this.setupRewards();
        this.trackEvent('beta_rewards_initialized');
    }
    
    setupRewards() {
        // Setup beta testing rewards
    }
    
    async enrollTester(userId, featureId) {
        const tester = {
            userId,
            featureId,
            enrolledAt: Date.now(),
            feedback: []
        };
        this.testers.set(`${userId}_${featureId}`, tester);
        
        // Award enrollment reward
        if (window.gamificationSystem) {
            await window.gamificationSystem.awardPoints(userId, 50, 'beta_tester');
        }
        
        return tester;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`beta_rewards_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.betaTestingRewards = new BetaTestingRewards(); });
} else {
    window.betaTestingRewards = new BetaTestingRewards();
}

