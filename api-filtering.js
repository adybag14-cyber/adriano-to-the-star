/**
 * API Filtering
 * API request filtering
 */

class APIFiltering {
    constructor() {
        this.filters = new Map();
        this.rules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('filtering_initialized');
    }

    createFilter(filterId, filterData) {
        const filter = {
            id: filterId,
            ...filterData,
            name: filterData.name || filterId,
            rules: filterData.rules || [],
            enabled: filterData.enabled !== false,
            createdAt: new Date()
        };
        
        this.filters.set(filterId, filter);
        this.trackEvent('filter_created', { filterId });
        return filter;
    }

    createRule(filterId, ruleId, ruleData) {
        const filter = this.filters.get(filterId);
        if (!filter) {
            throw new Error('Filter not found');
        }
        
        const rule = {
            id: ruleId,
            filterId,
            ...ruleData,
            field: ruleData.field || '',
            operator: ruleData.operator || 'equals',
            value: ruleData.value || '',
            createdAt: new Date()
        };
        
        this.rules.set(ruleId, rule);
        filter.rules.push(ruleId);
        
        return rule;
    }

    apply(filterId, data) {
        const filter = this.filters.get(filterId);
        if (!filter || !filter.enabled) {
            return data;
        }
        
        if (!Array.isArray(data)) {
            data = [data];
        }
        
        return data.filter(item => {
            return filter.rules.every(ruleId => {
                const rule = this.rules.get(ruleId);
                if (!rule) return true;
                
                return this.evaluateRule(rule, item);
            });
        });
    }

    evaluateRule(rule, item) {
        const value = item[rule.field];
        
        if (rule.operator === 'equals') {
            return value === rule.value;
        } else if (rule.operator === 'contains') {
            return value && value.includes(rule.value);
        } else if (rule.operator === 'gt') {
            return value > rule.value;
        } else if (rule.operator === 'lt') {
            return value < rule.value;
        }
        
        return true;
    }

    getFilter(filterId) {
        return this.filters.get(filterId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_filtering_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_filtering', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiFiltering = new APIFiltering();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIFiltering;
}

