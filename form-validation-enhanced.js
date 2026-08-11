/**
 * Enhanced Form Validation System
 * Comprehensive form validation with real-time feedback
 * 
 * Features:
 * - Real-time validation
 * - Custom validation rules
 * - Multiple validation types (email, phone, URL, etc.)
 * - Visual feedback (error messages, icons)
 * - Accessibility support
 * - Custom error messages
 */

class FormValidationEnhanced {
    constructor() {
        this.validators = new Map();
        this.init();
    }

    init() {
        this.setupDefaultValidators();
        this.initializeDataValidation();
        console.log('✅ Enhanced Form Validation initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_or_mv_al_id_at_io_ne_nh_an_ce_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultValidators() {
        // Email validation
        this.addValidator('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        }, 'Please enter a valid email address');

        // Phone validation
        this.addValidator('phone', (value) => {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
        }, 'Please enter a valid phone number');

        // URL validation
        this.addValidator('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }, 'Please enter a valid URL');

        // Required validation
        this.addValidator('required', (value) => {
            return value !== null && value !== undefined && String(value).trim() !== '';
        }, 'This field is required');

        // Min length
        this.addValidator('minLength', (value, min) => {
            return String(value).length >= min;
        }, (min) => `Minimum length is ${min} characters`);

        // Max length
        this.addValidator('maxLength', (value, max) => {
            return String(value).length <= max;
        }, (max) => `Maximum length is ${max} characters`);

        // Pattern (regex)
        this.addValidator('pattern', (value, pattern) => {
            const regex = new RegExp(pattern);
            return regex.test(value);
        }, 'Please match the required pattern');

        // Number range
        this.addValidator('min', (value, min) => {
            return Number(value) >= min;
        }, (min) => `Minimum value is ${min}`);

        this.addValidator('max', (value, max) => {
            return Number(value) <= max;
        }, (max) => `Maximum value is ${max}`);

        // Password strength
        this.addValidator('passwordStrength', (value) => {
            const hasMinLength = value.length >= 8;
            const hasUpperCase = /[A-Z]/.test(value);
            const hasLowerCase = /[a-z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            
            return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial;
        }, 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    addValidator(name, validatorFn, errorMessage) {
        this.validators.set(name, { validatorFn, errorMessage });
    }

    initializeDataValidation() {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('form[data-validate]').forEach(form => {
                this.attachToForm(form);
            });
        });
    }

    /**
     * Attach validation to a form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} options - Options
     */
    attachToForm(form, options = {}) {
        const validateOn = options.validateOn || 'blur'; // blur, input, submit
        const showErrors = options.showErrors !== false;

        form.addEventListener('submit', (e) => {
            if (!this.validateForm(form)) {
                e.preventDefault();
                if (showErrors) {
                    this.showFormErrors(form);
                }
                return false;
            }
        });

        form.querySelectorAll('input, textarea, select').forEach(field => {
            if (validateOn === 'input') {
                field.addEventListener('input', () => this.validateField(field, showErrors));
            } else if (validateOn === 'blur') {
                field.addEventListener('blur', () => this.validateField(field, showErrors));
            }
        });
    }

    /**
     * Validate a single field
     * @param {HTMLElement} field - Input field
     * @param {boolean} showErrors - Show error messages
     */
    validateField(field, showErrors = true) {
        const rules = this.getFieldRules(field);
        const value = field.value;
        let isValid = true;
        let errorMessage = '';

        for (const rule of rules) {
            const validator = this.validators.get(rule.name);
            if (!validator) continue;

            const ruleValue = rule.value !== undefined ? rule.value : null;
            const result = validator.validatorFn(value, ruleValue);

            if (!result) {
                isValid = false;
                errorMessage = typeof validator.errorMessage === 'function' 
                    ? validator.errorMessage(ruleValue)
                    : validator.errorMessage || rule.message || 'Invalid value';
                break;
            }
        }

        this.setFieldValidity(field, isValid, errorMessage, showErrors);
        return isValid;
    }

    /**
     * Validate entire form
     * @param {HTMLFormElement} form - Form element
     */
    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('input, textarea, select');

        fields.forEach(field => {
            if (!this.validateField(field, false)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getFieldRules(field) {
        const rules = [];
        
        // Check data attributes
        if (field.hasAttribute('data-validate')) {
            const validateAttr = field.getAttribute('data-validate');
            validateAttr.split(',').forEach(ruleStr => {
                const [name, value] = ruleStr.split(':');
                rules.push({ name: name.trim(), value: value ? value.trim() : undefined });
            });
        }

        // Check HTML5 validation attributes
        if (field.required) {
            rules.push({ name: 'required' });
        }
        if (field.type === 'email') {
            rules.push({ name: 'email' });
        }
        if (field.type === 'url') {
            rules.push({ name: 'url' });
        }
        if (field.minLength) {
            rules.push({ name: 'minLength', value: field.minLength });
        }
        if (field.maxLength) {
            rules.push({ name: 'maxLength', value: field.maxLength });
        }
        if (field.min) {
            rules.push({ name: 'min', value: field.min });
        }
        if (field.max) {
            rules.push({ name: 'max', value: field.max });
        }
        if (field.pattern) {
            rules.push({ name: 'pattern', value: field.pattern });
        }

        return rules;
    }

    setFieldValidity(field, isValid, errorMessage, showErrors) {
        // Remove existing error
        this.removeFieldError(field);

        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            field.setAttribute('aria-invalid', 'false');
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            field.setAttribute('aria-invalid', 'true');
            
            if (showErrors && errorMessage) {
                this.showFieldError(field, errorMessage);
            }
        }
    }

    showFieldError(field, message) {
        const errorId = `error-${field.id || Date.now()}`;
        field.setAttribute('aria-describedby', errorId);

        const errorEl = document.createElement('div');
        errorEl.id = errorId;
        errorEl.className = 'field-error';
        errorEl.setAttribute('role', 'alert');
        errorEl.textContent = message;
        errorEl.style.cssText = `
            color: #ef4444;
            font-size: 0.85rem;
            margin-top: 0.25rem;
            font-family: 'Raleway', sans-serif;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;

        // Insert after field
        field.parentNode.insertBefore(errorEl, field.nextSibling);
    }

    removeFieldError(field) {
        const errorId = field.getAttribute('aria-describedby');
        if (errorId) {
            const errorEl = document.getElementById(errorId);
            if (errorEl) {
                errorEl.remove();
            }
            field.removeAttribute('aria-describedby');
        }
    }

    showFormErrors(form) {
        const invalidFields = form.querySelectorAll('.invalid');
        if (invalidFields.length > 0) {
            invalidFields[0].focus();
            invalidFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.formValidation = new FormValidationEnhanced();
}
