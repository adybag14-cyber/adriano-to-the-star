/**
 * API Response Sorting
 * Sort API responses by fields
 */

class APIResponseSorting {
    constructor() {
        this.sortConfigs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('sorting_initialized');
    }

    createSortConfig(configId, defaultSort, allowedFields = []) {
        this.sortConfigs.set(configId, {
            id: configId,
            defaultSort,
            allowedFields,
            createdAt: new Date()
        });
        console.log(`Sort config created: ${configId}`);
    }

    sort(data, sortBy, order = 'asc', configId = null) {
        if (!Array.isArray(data)) {
            return data;
        }
        
        const config = configId ? this.sortConfigs.get(configId) : null;
        
        // Validate allowed fields if config exists
        if (config && config.allowedFields.length > 0) {
            if (!config.allowedFields.includes(sortBy)) {
                throw new Error(`Field ${sortBy} is not allowed for sorting`);
            }
        }
        
        return [...data].sort((a, b) => {
            const aValue = this.getFieldValue(a, sortBy);
            const bValue = this.getFieldValue(b, sortBy);
            
            return this.compareValues(aValue, bValue, order);
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

    compareValues(a, b, order) {
        if (a === null || a === undefined) return 1;
        if (b === null || b === undefined) return -1;
        
        if (typeof a === 'string' && typeof b === 'string') {
            return order === 'asc' 
                ? a.localeCompare(b)
                : b.localeCompare(a);
        }
        
        if (typeof a === 'number' && typeof b === 'number') {
            return order === 'asc' ? a - b : b - a;
        }
        
        if (a instanceof Date && b instanceof Date) {
            return order === 'asc' ? a - b : b - a;
        }
        
        // Convert to string for comparison
        const aStr = String(a);
        const bStr = String(b);
        return order === 'asc' 
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
    }

    parseSortQuery(queryString) {
        const params = new URLSearchParams(queryString);
        const sortParam = params.get('sort');
        
        if (!sortParam) {
            return null;
        }
        
        // Format: "field:asc" or "field:desc" or just "field" (defaults to asc)
        const parts = sortParam.split(':');
        const field = parts[0];
        const order = parts[1] || 'asc';
        
        if (order !== 'asc' && order !== 'desc') {
            throw new Error('Sort order must be "asc" or "desc"');
        }
        
        return { field, order };
    }

    sortMultiple(data, sorts) {
        if (!Array.isArray(data) || sorts.length === 0) {
            return data;
        }
        
        return [...data].sort((a, b) => {
            for (const { field, order } of sorts) {
                const aValue = this.getFieldValue(a, field);
                const bValue = this.getFieldValue(b, field);
                const comparison = this.compareValues(aValue, bValue, order);
                
                if (comparison !== 0) {
                    return comparison;
                }
            }
            return 0;
        });
    }

    getSortConfig(configId) {
        return this.sortConfigs.get(configId);
    }

    getAllSortConfigs() {
        return Array.from(this.sortConfigs.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sorting_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponseSorting = new APIResponseSorting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponseSorting;
}

