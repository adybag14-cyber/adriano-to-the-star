/**
 * Cost-Aware Scaling
 * Cost-aware scaling system
 */

class CostAwareScaling {
    constructor() {
        this.scalers = new Map();
        this.costs = new Map();
        this.decisions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cost_aware_scaling_initialized');
    }

    async createScaler(scalerId, scalerData) {
        const scaler = {
            id: scalerId,
            ...scalerData,
            name: scalerData.name || scalerId,
            costThreshold: scalerData.costThreshold || 1000,
            status: 'active',
            createdAt: new Date()
        };
        
        this.scalers.set(scalerId, scaler);
        return scaler;
    }

    async scale(scalerId, currentLoad, currentCost) {
        const scaler = this.scalers.get(scalerId);
        if (!scaler) {
            throw new Error(`Scaler ${scalerId} not found`);
        }

        const decision = {
            id: `dec_${Date.now()}`,
            scalerId,
            currentLoad,
            currentCost,
            action: this.computeAction(scaler, currentLoad, currentCost),
            estimatedCost: this.estimateCost(scaler, currentLoad),
            timestamp: new Date()
        };

        this.decisions.set(decision.id, decision);
        return decision;
    }

    computeAction(scaler, load, cost) {
        if (cost > scaler.costThreshold && load < 50) {
            return 'scale_down';
        } else if (load > 80) {
            return 'scale_up';
        }
        return 'maintain';
    }

    estimateCost(scaler, load) {
        return load * 0.1;
    }

    getScaler(scalerId) {
        return this.scalers.get(scalerId);
    }

    getAllScalers() {
        return Array.from(this.scalers.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cost_aware_scaling_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = CostAwareScaling;

