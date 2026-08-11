/**
 * API Response Standardization
 * Standardize API response formats across endpoints
 */

class APIResponseStandardization {
    constructor() {
        this.standards = new Map();
        this.init();
    }

    init() {
        this.trackEvent('standardization_initialized');
    }

    createStandard(standardId, format) {
        const standard = {
            id: standardId,
            format,
            rules: {
                statusCode: format.statusCode || true,
                timestamp: format.timestamp !== false,
                version: format.version || null,
                pagination: format.pagination || false
            },
            createdAt: new Date()
        };
        
        this.standards.set(standardId, standard);
        console.log(`Standard created: ${standardId}`);
        return standard;
    }

    standardizeResponse(response, standardId = 'default', options = {}) {
        const standard = this.standards.get(standardId) || this.getDefaultStandard();
        
        const standardized = {
            ...response
        };
        
        if (standard.rules.statusCode) {
            standardized.statusCode = response.statusCode || 200;
        }
        
        if (standard.rules.timestamp) {
            standardized.timestamp = new Date().toISOString();
        }
        
        if (standard.rules.version) {
            standardized.version = standard.rules.version;
        }
        
        if (standard.rules.pagination && options.pagination) {
            standardized.pagination = options.pagination;
        }
        
        return standardized;
    }

    getDefaultStandard() {
        return {
            id: 'default',
            format: {},
            rules: {
                statusCode: true,
                timestamp: true,
                version: null,
                pagination: false
            }
        };
    }

    validateResponse(response, standardId = 'default') {
        const standard = this.standards.get(standardId) || this.getDefaultStandard();
        const errors = [];
        
        if (standard.rules.statusCode && !response.statusCode) {
            errors.push('Missing statusCode');
        }
        
        if (standard.rules.timestamp && !response.timestamp) {
            errors.push('Missing timestamp');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    getStandard(standardId) {
        return this.standards.get(standardId);
    }

    getAllStandards() {
        return Array.from(this.standards.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`standardization_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiResponseStandardization = new APIResponseStandardization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIResponseStandardization;
}

