/**
 * API Request Sanitization
 * Sanitize and clean API request data
 */

class APIRequestSanitization {
    constructor() {
        this.sanitizers = new Map();
        this.init();
    }

    init() {
        this.setupDefaultSanitizers();
        this.trackEvent('sanitization_initialized');
    }

    setupDefaultSanitizers() {
        this.sanitizers.set('trim', {
            name: 'Trim Whitespace',
            sanitize: (value) => typeof value === 'string' ? value.trim() : value
        });
        
        this.sanitizers.set('lowercase', {
            name: 'Lowercase',
            sanitize: (value) => typeof value === 'string' ? value.toLowerCase() : value
        });
        
        this.sanitizers.set('uppercase', {
            name: 'Uppercase',
            sanitize: (value) => typeof value === 'string' ? value.toUpperCase() : value
        });
        
        this.sanitizers.set('remove-html', {
            name: 'Remove HTML',
            sanitize: (value) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value
        });
        
        this.sanitizers.set('remove-special-chars', {
            name: 'Remove Special Characters',
            sanitize: (value) => typeof value === 'string' ? value.replace(/[^a-zA-Z0-9\s]/g, '') : value
        });
    }

    registerSanitizer(sanitizerId, name, sanitizeFn) {
        this.sanitizers.set(sanitizerId, {
            id: sanitizerId,
            name,
            sanitize: sanitizeFn
        });
        console.log(`Sanitizer registered: ${sanitizerId}`);
    }

    sanitize(data, rules) {
        if (Array.isArray(data)) {
            return data.map(item => this.sanitize(item, rules));
        }
        
        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const key in data) {
                const fieldRules = rules[key] || rules['*'] || [];
                sanitized[key] = this.sanitizeField(data[key], fieldRules);
            }
            return sanitized;
        }
        
        return data;
    }

    sanitizeField(value, sanitizerIds) {
        if (!Array.isArray(sanitizerIds)) {
            sanitizerIds = [sanitizerIds];
        }
        
        let sanitized = value;
        for (const sanitizerId of sanitizerIds) {
            const sanitizer = this.sanitizers.get(sanitizerId);
            if (sanitizer) {
                sanitized = sanitizer.sanitize(sanitized);
            }
        }
        
        return sanitized;
    }

    sanitizeString(str, sanitizerIds) {
        return this.sanitizeField(str, sanitizerIds);
    }

    sanitizeObject(obj, rules) {
        return this.sanitize(obj, rules);
    }

    getSanitizer(sanitizerId) {
        return this.sanitizers.get(sanitizerId);
    }

    getAllSanitizers() {
        return Array.from(this.sanitizers.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sanitization_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestSanitization = new APIRequestSanitization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestSanitization;
}

