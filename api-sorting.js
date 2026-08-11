/**
 * API Sorting
 * API response sorting
 */

class APISorting {
    constructor() {
        this.sorters = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_sorting_initialized');
    }

    createSorter(sorterId, sorterData) {
        const sorter = {
            id: sorterId,
            ...sorterData,
            name: sorterData.name || sorterId,
            fields: sorterData.fields || [],
            createdAt: new Date()
        };
        
        this.sorters.set(sorterId, sorter);
        console.log(`API sorter created: ${sorterId}`);
        return sorter;
    }

    sort(sorterId, data, sortBy) {
        const sorter = this.sorters.get(sorterId);
        if (!sorter) {
            throw new Error('Sorter not found');
        }
        
        if (!Array.isArray(data)) {
            return data;
        }
        
        const sortFields = Array.isArray(sortBy) ? sortBy : [sortBy];
        
        return [...data].sort((a, b) => {
            for (const field of sortFields) {
                const [fieldName, direction] = field.startsWith('-') 
                    ? [field.substring(1), 'desc'] 
                    : [field, 'asc'];
                
                const aVal = a[fieldName];
                const bVal = b[fieldName];
                
                if (aVal < bVal) {
                    return direction === 'asc' ? -1 : 1;
                } else if (aVal > bVal) {
                    return direction === 'asc' ? 1 : -1;
                }
            }
            return 0;
        });
    }

    getSorter(sorterId) {
        return this.sorters.get(sorterId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_sorting_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiSorting = new APISorting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APISorting;
}

