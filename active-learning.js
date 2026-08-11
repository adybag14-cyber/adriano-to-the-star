/**
 * Active Learning
 * Active learning for efficient data labeling
 */

class ActiveLearning {
    constructor() {
        this.learners = new Map();
        this.queries = new Map();
        this.selections = new Map();
        this.init();
    }

    init() {
        this.trackEvent('active_learning_initialized');
    }

    async createLearner(learnerId, learnerData) {
        const learner = {
            id: learnerId,
            ...learnerData,
            name: learnerData.name || learnerId,
            strategy: learnerData.strategy || 'uncertainty',
            status: 'active',
            createdAt: new Date()
        };

        this.learners.set(learnerId, learner);
        this.trackEvent('learner_created', { learnerId, strategy: learner.strategy });
        return learner;
    }

    async query(learnerId, pool) {
        const learner = this.learners.get(learnerId);
        if (!learner) {
            throw new Error(`Learner ${learnerId} not found`);
        }

        const query = {
            id: `query_${Date.now()}`,
            learnerId,
            pool,
            selected: this.selectSamples(learner, pool),
            status: 'completed',
            createdAt: new Date()
        };

        this.queries.set(query.id, query);
        this.trackEvent('query_executed', { learnerId, queryId: query.id, selectedCount: query.selected.length });
        return query;
    }

    selectSamples(learner, pool) {
        const numSamples = Math.min(10, pool.length);
        return pool.slice(0, numSamples);
    }

    getLearner(learnerId) {
        return this.learners.get(learnerId);
    }

    getAllLearners() {
        return Array.from(this.learners.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`active_learning_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'active_learning', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = ActiveLearning;

