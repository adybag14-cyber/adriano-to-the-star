/**
 * API Schema Validation
 * Validate API requests and responses against schemas
 */

class APISchemaValidation {
    constructor() {
        this.schemas = new Map();
        this.validators = new Map();
        this.init();
    }

    init() {
        this.trackEvent('schema_validation_initialized');
    }

    registerSchema(schemaId, schema) {
        this.schemas.set(schemaId, {
            id: schemaId,
            schema,
            createdAt: new Date()
        });
        console.log(`Schema registered: ${schemaId}`);
    }

    createValidator(validatorId, schemaId) {
        const schema = this.schemas.get(schemaId);
        if (!schema) {
            throw new Error('Schema does not exist');
        }
        
        this.validators.set(validatorId, {
            id: validatorId,
            schemaId,
            schema: schema.schema,
            createdAt: new Date()
        });
        console.log(`Validator created: ${validatorId}`);
    }

    validate(data, validatorId) {
        const validator = this.validators.get(validatorId);
        if (!validator) {
            throw new Error('Validator does not exist');
        }
        
        const errors = [];
        this.validateAgainstSchema(data, validator.schema, '', errors);
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    validateAgainstSchema(data, schema, path, errors) {
        if (schema.type === 'object') {
            this.validateObject(data, schema, path, errors);
        } else if (schema.type === 'array') {
            this.validateArray(data, schema, path, errors);
        } else {
            this.validatePrimitive(data, schema, path, errors);
        }
    }

    validateObject(data, schema, path, errors) {
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            errors.push({ path, message: 'Expected object' });
            return;
        }
        
        if (schema.required) {
            schema.required.forEach(field => {
                if (!(field in data)) {
                    errors.push({ path: `${path}.${field}`, message: 'Required field missing' });
                }
            });
        }
        
        if (schema.properties) {
            for (const field in schema.properties) {
                if (field in data) {
                    this.validateAgainstSchema(
                        data[field],
                        schema.properties[field],
                        path ? `${path}.${field}` : field,
                        errors
                    );
                }
            }
        }
    }

    validateArray(data, schema, path, errors) {
        if (!Array.isArray(data)) {
            errors.push({ path, message: 'Expected array' });
            return;
        }
        
        if (schema.items) {
            data.forEach((item, index) => {
                this.validateAgainstSchema(
                    item,
                    schema.items,
                    `${path}[${index}]`,
                    errors
                );
            });
        }
    }

    validatePrimitive(data, schema, path, errors) {
        const type = schema.type;
        
        switch (type) {
            case 'string':
                if (typeof data !== 'string') {
                    errors.push({ path, message: 'Expected string' });
                }
                break;
            case 'number':
                if (typeof data !== 'number' || isNaN(data)) {
                    errors.push({ path, message: 'Expected number' });
                }
                break;
            case 'integer':
                if (!Number.isInteger(data)) {
                    errors.push({ path, message: 'Expected integer' });
                }
                break;
            case 'boolean':
                if (typeof data !== 'boolean') {
                    errors.push({ path, message: 'Expected boolean' });
                }
                break;
        }
        
        // Validate format
        if (schema.format && type === 'string') {
            if (!this.validateFormat(data, schema.format)) {
                errors.push({ path, message: `Invalid format: ${schema.format}` });
            }
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

    getSchema(schemaId) {
        return this.schemas.get(schemaId);
    }

    getValidator(validatorId) {
        return this.validators.get(validatorId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`schema_validation_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiSchemaValidation = new APISchemaValidation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APISchemaValidation;
}

