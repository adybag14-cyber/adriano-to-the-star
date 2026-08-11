/**
 * API Observability Advanced
 * Advanced API observability system
 */

class APIObservabilityAdvanced {
    constructor() {
        this.observabilities = new Map();
        this.metrics = new Map();
        this.traces = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_observability_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_observability_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createObservability(obsId, obsData) {
        const observability = {
            id: obsId,
            ...obsData,
            name: obsData.name || obsId,
            apiId: obsData.apiId || '',
            components: obsData.components || ['metrics', 'logs', 'traces'],
            status: 'active',
            createdAt: new Date()
        };
        
        this.observabilities.set(obsId, observability);
        return observability;
    }

    async recordMetric(obsId, metricName, value) {
        const observability = this.observabilities.get(obsId);
        if (!observability) {
            throw new Error(`Observability ${obsId} not found`);
        }

        const metric = {
            id: `metric_${Date.now()}`,
            obsId,
            name: metricName,
            value,
            timestamp: new Date()
        };

        this.metrics.set(metric.id, metric);
        return metric;
    }

    async recordTrace(obsId, traceData) {
        const observability = this.observabilities.get(obsId);
        if (!observability) {
            throw new Error(`Observability ${obsId} not found`);
        }

        const trace = {
            id: `trace_${Date.now()}`,
            obsId,
            ...traceData,
            timestamp: new Date()
        };

        this.traces.set(trace.id, trace);
        return trace;
    }

    getObservability(obsId) {
        return this.observabilities.get(obsId);
    }

    getAllObservabilities() {
        return Array.from(this.observabilities.values());
    }
}

module.exports = APIObservabilityAdvanced;

