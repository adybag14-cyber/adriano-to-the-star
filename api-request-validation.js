/**
 * API Request Validation
 * Request validation and sanitization
 */

class APIRequestValidation {
    constructor() {
        this.validators = new Map();
        this.schemas = new Map();
        this.init();
    }

    init() {
        this.trackEvent('validation_initialized');
    }

    createSchema(schemaId, schema) {
        this.schemas.set(schemaId, {
            id: schemaId,
            schema,
            createdAt: new Date()
        });
        console.log(`Validation schema created: ${schemaId}`);
    }

    createValidator(validatorId, schemaId, rules) {
        this.validators.set(validatorId, {
            id: validatorId,
            schemaId,
            rules,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Validator created: ${validatorId}`);
    }

    validate(requestId, data, schemaId) {
        const schema = this.schemas.get(schemaId);
        if (!schema) {
            throw new Error('Schema does not exist');
        }
        
        const errors = [];
        const validated = {};
        
        // Validate required fields
        if (schema.schema.required) {
            schema.schema.required.forEach(field => {
                if (!data[field]) {
                    errors.push({
                        field,
                        message: `${field} is required`
                    });
                }
            });
        }
        
        // Validate field types
        if (schema.schema.properties) {
            for (const field in schema.schema.properties) {
                const property = schema.schema.properties[field];
                const value = data[field];
                
                if (value !== undefined) {
                    // Type validation
                    if (property.type && !this.validateType(value, property.type)) {
                        errors.push({
                            field,
                            message: `${field} must be of type ${property.type}`
                        });
                    }
                    
                    // Format validation
                    if (property.format && !this.validateFormat(value, property.format)) {
                        errors.push({
                            field,
                            message: `${field} must match format ${property.format}`
                        });
                    }
                    
                    // Sanitize value
                    validated[field] = this.sanitize(value, property);
                }
            }
        }
        
        if (errors.length > 0) {
            return {
                valid: false,
                errors,
                data: null
            };
        }
        
        return {
            valid: true,
            errors: [],
            data: validated
        };
    }

    validateType(value, type) {
        switch (type) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'integer':
                return Number.isInteger(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            default:
                return true;
        }
    }

    validateFormat(value, format) {
        switch (format) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'uri':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            case 'date':
                return !isNaN(Date.parse(value));
            default:
                return true;
        }
    }

    sanitize(value, property) {
        if (typeof value === 'string') {
            // Trim whitespace
            value = value.trim();
            
            // Remove HTML tags if not allowed
            if (property.noHtml) {
                value = value.replace(/<[^>]*>/g, '');
            }
        }
        
        return value;
    }

    getSchema(schemaId) {
        return this.schemas.get(schemaId);
    }

    getValidator(validatorId) {
        return this.validators.get(validatorId);
    }

    getAllSchemas() {
        return Array.from(this.schemas.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`validation_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestValidation = new APIRequestValidation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestValidation;
}

