/**
 * Data Validation (Enhanced)
 * Enhanced data validation system
 */

class DataValidationEnhanced {
    constructor() {
        this.validators = new Map();
        this.schemas = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_validation_enhanced_initialized');
    }

    registerSchema(schemaId, schema) {
        this.schemas.set(schemaId, schema);
    }

    validate(data, schemaId) {
        const schema = this.schemas.get(schemaId);
        if (!schema) {
            return { valid: false, errors: ['Schema not found'] };
        }

        return this.validateAgainstSchema(data, schema);
    }

    validateAgainstSchema(data, schema) {
        const errors = [];

        // Required fields
        if (schema.required) {
            schema.required.forEach(field => {
                if (!(field in data) || data[field] === null || data[field] === undefined) {
                    errors.push(`Required field missing: ${field}`);
                }
            });
        }

        // Type validation
        if (schema.properties) {
            Object.entries(schema.properties).forEach(([field, spec]) => {
                if (field in data) {
                    const value = data[field];
                    
                    // Type check
                    if (spec.type && typeof value !== spec.type) {
                        errors.push(`Field ${field} should be ${spec.type}, got ${typeof value}`);
                    }

                    // Enum check
                    if (spec.enum && !spec.enum.includes(value)) {
                        errors.push(`Field ${field} must be one of: ${spec.enum.join(', ')}`);
                    }

                    // Range check
                    if (spec.min !== undefined && value < spec.min) {
                        errors.push(`Field ${field} must be >= ${spec.min}`);
                    }
                    if (spec.max !== undefined && value > spec.max) {
                        errors.push(`Field ${field} must be <= ${spec.max}`);
                    }

                    // Pattern check
                    if (spec.pattern && !new RegExp(spec.pattern).test(value)) {
                        errors.push(`Field ${field} does not match pattern: ${spec.pattern}`);
                    }
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    validateBatch(dataArray, schemaId) {
        return dataArray.map((data, index) => ({
            index,
            data,
            validation: this.validate(data, schemaId)
        }));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_validation_enhanced_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const dataValidationEnhanced = new DataValidationEnhanced();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidationEnhanced;
}


