/**
 * A/B Testing for Gamification v2
 * Advanced A/B testing framework specifically for gamification elements
 */

class ABTestingGamificationV2 {
    constructor() {
        this.experiments = new Map();
        this.userAssignments = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('ab_testing_gamification_v2_initialized');
        return { success: true, message: 'A/B Testing for Gamification v2 initialized' };
    }

    createExperiment(id, variants) {
        const experiment = {
            id,
            variants, // Array of variant names e.g. ['A', 'B']
            status: 'active',
            createdAt: new Date()
        };
        this.experiments.set(id, experiment);
        this.trackEvent('experiment_created', { id, variants: variants.join(',') });
        return experiment;
    }

    assignUser(experimentId, userId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) throw new Error('Experiment not found');

        if (this.userAssignments.has(`${experimentId}_${userId}`)) {
            return this.userAssignments.get(`${experimentId}_${userId}`);
        }

        const variant = experiment.variants[Math.floor(Math.random() * experiment.variants.length)];
        this.userAssignments.set(`${experimentId}_${userId}`, variant);
        this.trackEvent('user_assigned', { experimentId, userId, variant });
        return variant;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ab_gamification_v2_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'ab_testing_gamification_v2', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.ABTestingGamificationV2 = ABTestingGamificationV2;
    window.abTestingGamificationV2 = new ABTestingGamificationV2();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ABTestingGamificationV2;
}
