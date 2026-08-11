/**
 * Edge Data Filtering
 * Data filtering for edge devices
 */

class EdgeDataFiltering {
    constructor() {
        this.filters = new Map();
        this.rules = new Map();
        this.results = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_data_filter_initialized');
    }

    async createFilter(filterId, filterData) {
        const filter = {
            id: filterId,
            ...filterData,
            name: filterData.name || filterId,
            rules: filterData.rules || [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.filters.set(filterId, filter);
        return filter;
    }

    async filter(dataId, data, filterId) {
        const filter = this.filters.get(filterId);
        if (!filter) {
            throw new Error(`Filter ${filterId} not found`);
        }

        const result = {
            id: `result_${Date.now()}`,
            dataId,
            filterId,
            original: data,
            filtered: this.applyFilter(data, filter),
            status: 'completed',
            createdAt: new Date()
        };

        this.results.set(result.id, result);
        return result;
    }

    applyFilter(data, filter) {
        return data.filter(item => {
            return filter.rules.every(rule => {
                if (rule.operator === 'equals') {
                    return item[rule.field] === rule.value;
                } else if (rule.operator === 'greater_than') {
                    return item[rule.field] > rule.value;
                }
                return true;
            });
        });
    }

    getFilter(filterId) {
        return this.filters.get(filterId);
    }

    getAllFilters() {
        return Array.from(this.filters.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_data_filter_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = EdgeDataFiltering;

