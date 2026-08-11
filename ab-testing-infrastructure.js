/**
 * A/B Testing Infrastructure
 * @class ABTestingInfrastructure
 * @description Provides infrastructure for A/B testing and experimentation.
 */
class ABTestingInfrastructure {
    constructor() {
        this.experiments = new Map();
        this.variants = new Map();
        this.results = new Map();
        this.init();
    }

    init() {
        this.trackEvent('ab_infrastructure_initialized');
    }

    /**
     * Create experiment.
     * @param {string} experimentId - Experiment identifier.
     * @param {object} experimentData - Experiment data.
     */
    createExperiment(experimentId, experimentData) {
        this.experiments.set(experimentId, {
            ...experimentData,
            id: experimentId,
            name: experimentData.name,
            variants: experimentData.variants || [],
            status: 'draft',
            startDate: experimentData.startDate,
            endDate: experimentData.endDate,
            createdAt: new Date()
        });
        this.trackEvent('experiment_created', { experimentId, name: experimentData.name });
    }

    /**
     * Assign user to variant.
     * @param {string} experimentId - Experiment identifier.
     * @param {string} userId - User identifier.
     * @returns {string} Variant identifier.
     */
    assignVariant(experimentId, userId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment not found: ${experimentId}`);
        }

        // Consistent assignment based on user ID
        const userHash = this.hashUserId(userId);
        const variantIndex = userHash % experiment.variants.length;
        const variant = experiment.variants[variantIndex];

        return variant.id;
    }

    /**
     * Hash user ID.
     * @param {string} userId - User identifier.
     * @returns {number} Hash value.
     */
    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Track conversion.
     * @param {string} experimentId - Experiment identifier.
     * @param {string} variantId - Variant identifier.
     * @param {string} userId - User identifier.
     */
    trackConversion(experimentId, variantId, userId) {
        const resultKey = `${experimentId}_${variantId}`;
        if (!this.results.has(resultKey)) {
            this.results.set(resultKey, {
                experimentId,
                variantId,
                conversions: 0,
                participants: 0
            });
        }

        const result = this.results.get(resultKey);
        result.conversions++;
        this.trackEvent('conversion_tracked', { experimentId, variantId });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ab_infrastructure_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'ab_testing_infrastructure', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.abTestingInfrastructure = new ABTestingInfrastructure();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ABTestingInfrastructure;
}

