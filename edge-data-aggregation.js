/**
 * Edge Data Aggregation
 * Data aggregation for edge devices
 */

class EdgeDataAggregation {
    constructor() {
        this.aggregations = new Map();
        this.operations = new Map();
        this.results = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_data_agg_initialized');
    }

    async aggregate(aggregationId, aggregationData) {
        const aggregation = {
            id: aggregationId,
            ...aggregationData,
            data: aggregationData.data || [],
            operation: aggregationData.operation || 'sum',
            result: this.performAggregation(aggregationData),
            status: 'completed',
            createdAt: new Date()
        };

        this.aggregations.set(aggregationId, aggregation);
        return aggregation;
    }

    performAggregation(aggregationData) {
        const data = aggregationData.data || [];
        const operation = aggregationData.operation || 'sum';

        if (operation === 'sum') {
            return data.reduce((sum, val) => sum + (val || 0), 0);
        } else if (operation === 'average') {
            return data.length > 0 ? data.reduce((sum, val) => sum + (val || 0), 0) / data.length : 0;
        } else if (operation === 'max') {
            return Math.max(...data.map(val => val || 0));
        } else if (operation === 'min') {
            return Math.min(...data.map(val => val || 0));
        }
        return 0;
    }

    getAggregation(aggregationId) {
        return this.aggregations.get(aggregationId);
    }

    getAllAggregations() {
        return Array.from(this.aggregations.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_data_agg_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = EdgeDataAggregation;

