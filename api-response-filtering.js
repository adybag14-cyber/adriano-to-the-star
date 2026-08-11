/**
 * API Response Filtering
 * Filter API responses based on criteria
 */

class APIResponseFiltering {
    constructor() {
        this.filters = new Map();
        this.init();
    }

    init() {
        this.trackEvent('resp_filtering_initialized');
    }

    createFilter(filterId, field, operator, value) {
        this.filters.set(filterId, {
            id: filterId,
            field,
            operator,
            value,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Filter created: ${filterId}`);
    }

    applyFilters(data, filters) {
        if (!Array.isArray(data)) {
            return data;
        }
        
        let filtered = [...data];
        
        for (const filter of filters) {
            filtered = this.applyFilter(filtered, filter);
        }
        
        return filtered;
    }

    applyFilter(data, filter) {
        const { field, operator, value } = filter;
        
        return data.filter(item => {
            const fieldValue = this.getFieldValue(item, field);
            return this.evaluateFilter(fieldValue, operator, value);
        });
    }

    getFieldValue(item, field) {
        if (field.includes('.')) {
            const parts = field.split('.');
            let value = item;
            for (const part of parts) {
                value = value?.[part];
            }
            return value;
        }
        return item[field];
    }

    evaluateFilter(fieldValue, operator, filterValue) {
        switch (operator) {
            case 'equals':
                return fieldValue === filterValue;
            case 'not_equals':
                return fieldValue !== filterValue;
            case 'greater_than':
                return fieldValue > filterValue;
            case 'less_than':
                return fieldValue < filterValue;
            case 'greater_than_or_equal':
                return fieldValue >= filterValue;
            case 'less_than_or_equal':
                return fieldValue <= filterValue;
            case 'contains':
                return String(fieldValue).includes(String(filterValue));
            case 'starts_with':
                return String(fieldValue).startsWith(String(filterValue));
            case 'ends_with':
                return String(fieldValue).endsWith(String(filterValue));
            case 'in':
                return Array.isArray(filterValue) && filterValue.includes(fieldValue);
            case 'not_in':
                return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
            case 'is_null':
                return fieldValue === null || fieldValue === undefined;
            case 'is_not_null':
                return fieldValue !== null && fieldValue !== undefined;
            default:
                return true;
        }
    }

    parseFilterQuery(queryString) {
        const filters = [];
        const params = new URLSearchParams(queryString);
        
        for (const [key, value] of params.entries()) {
            if (key.startsWith('filter[')) {
                const match = key.match(/filter\[(\w+)\]\[(\w+)\]/);
                if (match) {
                    const [, field, operator] = match;
                    filters.push({
                        field,
                        operator,
                        value: this.parseFilterValue(value)
                    });
                }
            }
        }
        
        return filters;
    }

    parseFilterValue(value) {
        // Try to parse as number
        if (!isNaN(value) && value !== '') {
            return Number(value);
        }
        
        // Try to parse as boolean
        if (value === 'true' || value === 'false') {
            return value === 'true';
        }
        
        // Return as string
        return value;
    }

    getFilter(filterId) {
        return this.filters.get(filterId);
    }

    getAllFilters() {
        return Array.from(this.filters.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`resp_filtering_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponseFiltering = new APIResponseFiltering();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponseFiltering;
}

