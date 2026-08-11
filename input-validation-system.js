/**
 * Comprehensive Input Validation System
 * 
 * Provides comprehensive input validation for all user inputs with real-time feedback.
 * 
 * @module InputValidationSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class InputValidationSystem {
    constructor() {
        this.validators = new Map();
        this.validationRules = new Map();
        this.errorMessages = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the validation system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('InputValidationSystem already initialized');
            return;
        }

        this.setupDefaultValidators();
        this.setupDefaultRules();
        this.setupDefaultErrorMessages();
        
        this.isInitialized = true;
        console.log('✅ Input Validation System initialized');
    }

    /**
     * Set up default validators
     * @private
     */
    setupDefaultValidators() {
        // Email validator
        this.validators.set('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        });

        // URL validator
        this.validators.set('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });

        // Number validator
        this.validators.set('number', (value) => {
            return !isNaN(value) && !isNaN(parseFloat(value));
        });

        // Integer validator
        this.validators.set('integer', (value) => {
            return Number.isInteger(Number(value));
        });

        // Positive number validator
        this.validators.set('positive', (value) => {
            const num = Number(value);
            return !isNaN(num) && num > 0;
        });

        // Non-negative number validator
        this.validators.set('nonNegative', (value) => {
            const num = Number(value);
            return !isNaN(num) && num >= 0;
        });

        // String length validator
        this.validators.set('length', (value, min, max) => {
            const len = String(value).length;
            if (min !== undefined && len < min) return false;
            if (max !== undefined && len > max) return false;
            return true;
        });

        // Required validator
        this.validators.set('required', (value) => {
            return value !== null && value !== undefined && String(value).trim() !== '';
        });

        // Pattern validator
        this.validators.set('pattern', (value, pattern) => {
            const regex = new RegExp(pattern);
            return regex.test(value);
        });

        // Phone validator
        this.validators.set('phone', (value) => {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
        });

        // Password strength validator
        this.validators.set('password', (value) => {
            // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
            const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            return strongRegex.test(value);
        });

        // XSS prevention validator
        this.validators.set('noXSS', (value) => {
            const xssPattern = /<script|javascript:|onerror=|onload=/i;
            return !xssPattern.test(value);
        });

        // SQL injection prevention validator
        this.validators.set('noSQLInjection', (value) => {
            const sqlPattern = /('|(\\')|(;)|(\\)|(\%27)|(\%3B)|(\%3D)|(\%2F)|(\%2A)|(\%2D)|(\%5C)|(\%2B)|(\%7C))/i;
            return !sqlPattern.test(value);
        });
    }

    /**
     * Set up default validation rules
     * @private
     */
    setupDefaultRules() {
        // Email rule
        this.validationRules.set('email', {
            validators: ['required', 'email'],
            errorMessage: 'Please enter a valid email address'
        });

        // Password rule
        this.validationRules.set('password', {
            validators: ['required', 'length:8:128', 'password'],
            errorMessage: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
        });

        // URL rule
        this.validationRules.set('url', {
            validators: ['required', 'url'],
            errorMessage: 'Please enter a valid URL'
        });

        // Number rule
        this.validationRules.set('number', {
            validators: ['required', 'number'],
            errorMessage: 'Please enter a valid number'
        });

        // Positive number rule
        this.validationRules.set('positiveNumber', {
            validators: ['required', 'positive'],
            errorMessage: 'Please enter a positive number'
        });
    }

    /**
     * Set up default error messages
     * @private
     */
    setupDefaultErrorMessages() {
        this.errorMessages.set('required', 'This field is required');
        this.errorMessages.set('email', 'Please enter a valid email address');
        this.errorMessages.set('url', 'Please enter a valid URL');
        this.errorMessages.set('number', 'Please enter a valid number');
        this.errorMessages.set('positive', 'Please enter a positive number');
        this.errorMessages.set('nonNegative', 'Please enter a non-negative number');
        this.errorMessages.set('length', 'Length must be between {min} and {max} characters');
        this.errorMessages.set('pattern', 'Value does not match required pattern');
        this.errorMessages.set('phone', 'Please enter a valid phone number');
        this.errorMessages.set('password', 'Password does not meet strength requirements');
        this.errorMessages.set('noXSS', 'Invalid characters detected');
        this.errorMessages.set('noSQLInjection', 'Invalid characters detected');
    }

    /**
     * Validate a value against rules
     * @public
     * @param {*} value - Value to validate
     * @param {string|Array} rules - Validation rule name or array of rules
     * @returns {Object} Validation result
     */
    validate(value, rules) {
        const result = {
            isValid: true,
            errors: [],
            errorMessage: null
        };

        if (!rules) {
            return result;
        }

        // Handle rule name string
        if (typeof rules === 'string') {
            const rule = this.validationRules.get(rules);
            if (rule) {
                return this.validate(value, rule.validators);
            }
        }

        // Handle array of validators
        if (Array.isArray(rules)) {
            for (const rule of rules) {
                const validationResult = this.validateSingle(value, rule);
                if (!validationResult.isValid) {
                    result.isValid = false;
                    result.errors.push(validationResult.error);
                    result.errorMessage = validationResult.error;
                }
            }
        }

        return result;
    }

    /**
     * Validate against a single rule
     * @private
     * @param {*} value - Value to validate
     * @param {string} rule - Rule string (e.g., 'required', 'length:5:10')
     * @returns {Object} Validation result
     */
    validateSingle(value, rule) {
        const [validatorName, ...params] = rule.split(':');
        const validator = this.validators.get(validatorName);

        if (!validator) {
            console.warn(`Validator '${validatorName}' not found`);
            return { isValid: true, error: null };
        }

        const isValid = validator(value, ...params);
        const error = isValid ? null : this.getErrorMessage(validatorName, params);

        return { isValid, error };
    }

    /**
     * Get error message for validator
     * @private
     * @param {string} validatorName - Validator name
     * @param {Array} params - Validator parameters
     * @returns {string} Error message
     */
    getErrorMessage(validatorName, params = []) {
        let message = this.errorMessages.get(validatorName) || 'Validation failed';
        
        // Replace placeholders
        if (params.length >= 2 && message.includes('{min}')) {
            message = message.replace('{min}', params[0]);
        }
        if (params.length >= 2 && message.includes('{max}')) {
            message = message.replace('{max}', params[1]);
        }
        
        return message;
    }

    /**
     * Register custom validator
     * @public
     * @param {string} name - Validator name
     * @param {Function} validator - Validator function
     * @param {string} errorMessage - Error message
     */
    registerValidator(name, validator, errorMessage = null) {
        this.validators.set(name, validator);
        if (errorMessage) {
            this.errorMessages.set(name, errorMessage);
        }
    }

    /**
     * Register custom validation rule
     * @public
     * @param {string} name - Rule name
     * @param {Object} rule - Rule configuration
     */
    registerRule(name, rule) {
        this.validationRules.set(name, rule);
    }

    /**
     * Validate form
     * @public
     * @param {HTMLFormElement} form - Form element
     * @param {Object} rules - Validation rules object
     * @returns {Object} Validation result
     */
    validateForm(form, rules) {
        const result = {
            isValid: true,
            errors: {},
            errorMessage: null
        };

        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;

            const fieldValue = field.value;
            const validation = this.validate(fieldValue, fieldRules);

            if (!validation.isValid) {
                result.isValid = false;
                result.errors[fieldName] = validation.errors;
                this.showFieldError(field, validation.errorMessage);
            } else {
                this.clearFieldError(field);
            }
        }

        return result;
    }

    /**
     * Show field error
     * @private
     * @param {HTMLElement} field - Field element
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        field.classList.add('validation-error');
        
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.validation-error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `;
        
        field.parentElement.appendChild(errorElement);
    }

    /**
     * Clear field error
     * @private
     * @param {HTMLElement} field - Field element
     */
    clearFieldError(field) {
        field.classList.remove('validation-error');
        const errorElement = field.parentElement.querySelector('.validation-error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Set up real-time validation for input
     * @public
     * @param {HTMLElement} input - Input element
     * @param {string|Array} rules - Validation rules
     */
    setupRealTimeValidation(input, rules) {
        input.addEventListener('blur', () => {
            const validation = this.validate(input.value, rules);
            if (!validation.isValid) {
                this.showFieldError(input, validation.errorMessage);
            } else {
                this.clearFieldError(input);
            }
        });

        input.addEventListener('input', () => {
            if (input.classList.contains('validation-error')) {
                const validation = this.validate(input.value, rules);
                if (validation.isValid) {
                    this.clearFieldError(input);
                }
            }
        });
    }
}

// Create global instance
window.InputValidationSystem = InputValidationSystem;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.inputValidator = new InputValidationSystem();
        window.inputValidator.init();
    });
} else {
    window.inputValidator = new InputValidationSystem();
    window.inputValidator.init();
}

