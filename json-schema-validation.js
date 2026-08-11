/**
 * JSON Schema Validation System
 * 
 * Adds comprehensive data validation schemas using JSON Schema.
 * 
 * @module JSONSchemaValidation
 * @version 1.0.0
 * @author Adriano To The Star
 */

class JSONSchemaValidation {
    constructor() {
        this.schemas = new Map();
        this.validators = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize JSON Schema validation
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('JSONSchemaValidation already initialized');
            return;
        }

        this.setupDefaultSchemas();
        
        this.isInitialized = true;
        console.log('✅ JSON Schema Validation initialized');
    }

    /**
     * Set up default schemas
     * @private
     */
    setupDefaultSchemas() {
        // User schema
        this.registerSchema('user', {
            type: 'object',
            required: ['id', 'email'],
            properties: {
                id: { type: 'string' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string', minLength: 1, maxLength: 100 },
                age: { type: 'integer', minimum: 0, maximum: 150 }
            }
        });

        // Planet claim schema
        this.registerSchema('planet-claim', {
            type: 'object',
            required: ['kepid', 'userId'],
            properties: {
                kepid: { type: ['string', 'number'] },
                userId: { type: 'string' },
                claimedAt: { type: 'string', format: 'date-time' }
            }
        });

        // Form data schema
        this.registerSchema('form-data', {
            type: 'object',
            properties: {
                name: { type: 'string', minLength: 1 },
                email: { type: 'string', format: 'email' },
                message: { type: 'string', minLength: 1, maxLength: 1000 }
            },
            required: ['name', 'email', 'message']
        });
    }

    /**
     * Register schema
     * @public
     * @param {string} name - Schema name
     * @param {Object} schema - JSON Schema object
     */
    registerSchema(name, schema) {
        this.schemas.set(name, schema);
        this.validators.set(name, this.compileSchema(schema));
    }

    /**
     * Compile schema to validator function
     * @private
     * @param {Object} schema - JSON Schema
     * @returns {Function} Validator function
     */
    compileSchema(schema) {
        return (data) => {
            return this.validate(data, schema);
        };
    }

    /**
     * Validate data against schema
     * @public
     * @param {*} data - Data to validate
     * @param {string|Object} schema - Schema name or schema object
     * @returns {Object} Validation result
     */
    validate(data, schema) {
        const schemaObj = typeof schema === 'string' 
            ? this.schemas.get(schema) 
            : schema;

        if (!schemaObj) {
            return {
                valid: false,
                errors: [{ message: 'Schema not found' }]
            };
        }

        const errors = [];
        this.validateValue(data, schemaObj, '', errors);

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate value
     * @private
     * @param {*} value - Value to validate
     * @param {Object} schema - Schema object
     * @param {string} path - Current path
     * @param {Array} errors - Errors array
     */
    validateValue(value, schema, path, errors) {
        // Check type
        if (schema.type) {
            const typeMatch = this.checkType(value, schema.type);
            if (!typeMatch) {
                errors.push({
                    path,
                    message: `Expected type ${schema.type}, got ${typeof value}`
                });
                return;
            }
        }

        // Validate based on type
        if (schema.type === 'object') {
            this.validateObject(value, schema, path, errors);
        } else if (schema.type === 'array') {
            this.validateArray(value, schema, path, errors);
        } else if (schema.type === 'string') {
            this.validateString(value, schema, path, errors);
        } else if (schema.type === 'number' || schema.type === 'integer') {
            this.validateNumber(value, schema, path, errors);
        }
    }

    /**
     * Check type
     * @private
     * @param {*} value - Value
     * @param {string|Array} expectedType - Expected type
     * @returns {boolean} True if type matches
     */
    checkType(value, expectedType) {
        if (Array.isArray(expectedType)) {
            return expectedType.some(type => this.checkType(value, type));
        }

        if (expectedType === 'integer') {
            return Number.isInteger(value);
        }

        if (expectedType === 'number') {
            return typeof value === 'number' && !isNaN(value);
        }

        return typeof value === expectedType;
    }

    /**
     * Validate object
     * @private
     * @param {Object} value - Object value
     * @param {Object} schema - Schema object
     * @param {string} path - Current path
     * @param {Array} errors - Errors array
     */
    validateObject(value, schema, path, errors) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return;
        }

        // Check required properties
        if (schema.required) {
            schema.required.forEach(prop => {
                if (!(prop in value)) {
                    errors.push({
                        path: path ? `${path}.${prop}` : prop,
                        message: `Required property '${prop}' is missing`
                    });
                }
            });
        }

        // Validate properties
        if (schema.properties) {
            Object.keys(value).forEach(key => {
                if (schema.properties[key]) {
                    this.validateValue(
                        value[key],
                        schema.properties[key],
                        path ? `${path}.${key}` : key,
                        errors
                    );
                } else if (!schema.additionalProperties) {
                    errors.push({
                        path: path ? `${path}.${key}` : key,
                        message: `Unexpected property '${key}'`
                    });
                }
            });
        }
    }

    /**
     * Validate array
     * @private
     * @param {Array} value - Array value
     * @param {Object} schema - Schema object
     * @param {string} path - Current path
     * @param {Array} errors - Errors array
     */
    validateArray(value, schema, path, errors) {
        if (!Array.isArray(value)) {
            return;
        }

        if (schema.minItems && value.length < schema.minItems) {
            errors.push({
                path,
                message: `Array must have at least ${schema.minItems} items`
            });
        }

        if (schema.maxItems && value.length > schema.maxItems) {
            errors.push({
                path,
                message: `Array must have at most ${schema.maxItems} items`
            });
        }

        if (schema.items) {
            value.forEach((item, index) => {
                this.validateValue(item, schema.items, `${path}[${index}]`, errors);
            });
        }
    }

    /**
     * Validate string
     * @private
     * @param {string} value - String value
     * @param {Object} schema - Schema object
     * @param {string} path - Current path
     * @param {Array} errors - Errors array
     */
    validateString(value, schema, path, errors) {
        if (typeof value !== 'string') {
            return;
        }

        if (schema.minLength && value.length < schema.minLength) {
            errors.push({
                path,
                message: `String must be at least ${schema.minLength} characters`
            });
        }

        if (schema.maxLength && value.length > schema.maxLength) {
            errors.push({
                path,
                message: `String must be at most ${schema.maxLength} characters`
            });
        }

        if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
                errors.push({
                    path,
                    message: `String does not match pattern ${schema.pattern}`
                });
            }
        }

        if (schema.format === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push({
                    path,
                    message: 'Invalid email format'
                });
            }
        }
    }

    /**
     * Validate number
     * @private
     * @param {number} value - Number value
     * @param {Object} schema - Schema object
     * @param {string} path - Current path
     * @param {Array} errors - Errors array
     */
    validateNumber(value, schema, path, errors) {
        if (typeof value !== 'number' || isNaN(value)) {
            return;
        }

        if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push({
                path,
                message: `Number must be at least ${schema.minimum}`
            });
        }

        if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push({
                path,
                message: `Number must be at most ${schema.maximum}`
            });
        }
    }

    /**
     * Get schema
     * @public
     * @param {string} name - Schema name
     * @returns {Object|null} Schema object
     */
    getSchema(name) {
        return this.schemas.get(name) || null;
    }
}

// Create global instance
window.JSONSchemaValidation = JSONSchemaValidation;
window.jsonSchemaValidator = new JSONSchemaValidation();
window.jsonSchemaValidator.init();

