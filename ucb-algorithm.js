/**
 * UCB Algorithm
 * Upper Confidence Bound algorithm
 */

class UCBAlgorithm {
    constructor() {
        this.bandits = new Map();
        this.counts = new Map();
        this.values = new Map();
        this.init();
    }

    init() {
        this.trackEvent('u_cb_al_go_ri_th_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("u_cb_al_go_ri_th_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createBandit(banditId, banditData) {
        const bandit = {
            id: banditId,
            ...banditData,
            name: banditData.name || banditId,
            numArms: banditData.numArms || 10,
            c: banditData.c || 2.0,
            status: 'active',
            createdAt: new Date()
        };

        this.bandits.set(banditId, bandit);
        this.counts.set(banditId, Array.from({length: bandit.numArms}, () => 0));
        this.values.set(banditId, Array.from({length: bandit.numArms}, () => 0));
        return bandit;
    }

    async selectArm(banditId, totalPulls) {
        const bandit = this.bandits.get(banditId);
        if (!bandit) {
            throw new Error(`Bandit ${banditId} not found`);
        }

        const counts = this.counts.get(banditId);
        const values = this.values.get(banditId);

        const ucbValues = values.map((value, arm) => {
            if (counts[arm] === 0) return Infinity;
            return value + bandit.c * Math.sqrt(Math.log(totalPulls) / counts[arm]);
        });

        return ucbValues.indexOf(Math.max(...ucbValues));
    }

    async update(banditId, arm, reward) {
        const bandit = this.bandits.get(banditId);
        if (!bandit) {
            throw new Error(`Bandit ${banditId} not found`);
        }

        const counts = this.counts.get(banditId);
        const values = this.values.get(banditId);

        counts[arm] += 1;
        values[arm] = values[arm] + (reward - values[arm]) / counts[arm];

        return {
            banditId,
            updated: true,
            timestamp: new Date()
        };
    }

    getBandit(banditId) {
        return this.bandits.get(banditId);
    }

    getAllBandits() {
        return Array.from(this.bandits.values());
    }
}

module.exports = UCBAlgorithm;

