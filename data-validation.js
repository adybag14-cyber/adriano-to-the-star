/**
 * Data Validation
 * Validates data against schemas
 */

class DataValidation {
    constructor() {
        this.validators = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_validation_initialized');
    }

    addValidator(name, validatorFn) {
        this.validators.set(name, validatorFn);
    }

    validate(data, validatorName) {
        const validator = this.validators.get(validatorName);
        if (!validator) throw new Error('Validator not found');
        return validator(data);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_validation_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dataValidation = new DataValidation();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidation;
}

