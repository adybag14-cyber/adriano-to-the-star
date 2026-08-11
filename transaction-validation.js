/**
 * Transaction Validation
 * Blockchain transaction validation system
 */

class TransactionValidation {
    constructor() {
        this.validators = new Map();
        this.validations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_ra_ns_ac_ti_on_va_li_da_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_ra_ns_ac_ti_on_va_li_da_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerValidator(validatorId, validatorData) {
        const validator = {
            id: validatorId,
            ...validatorData,
            name: validatorData.name || validatorId,
            rules: validatorData.rules || [],
            enabled: validatorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.validators.set(validatorId, validator);
        console.log(`Transaction validator registered: ${validatorId}`);
        return validator;
    }

    async validateTransaction(transaction, validatorId = null) {
        const validator = validatorId ? this.validators.get(validatorId) : 
                         Array.from(this.validators.values()).find(v => v.enabled);
        if (!validator) {
            throw new Error('Validator not found');
        }
        
        const validation = {
            id: `validation_${Date.now()}`,
            transactionId: transaction.id,
            validatorId: validator.id,
            valid: true,
            errors: [],
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        validator.rules.forEach(rule => {
            const result = this.applyRule(rule, transaction);
            if (!result.valid) {
                validation.valid = false;
                validation.errors.push(result.error);
            }
        });
        
        if (validation.valid) {
            validation.errors = this.performStandardValidation(transaction);
            validation.valid = validation.errors.length === 0;
        }
        
        this.validations.set(validation.id, validation);
        
        return validation;
    }

    applyRule(rule, transaction) {
        if (rule.type === 'balance_check') {
            return { valid: transaction.value >= 0 };
        } else if (rule.type === 'address_check') {
            return { valid: transaction.from && transaction.to };
        } else if (rule.type === 'gas_check') {
            return { valid: transaction.gas > 0 };
        }
        return { valid: true };
    }

    performStandardValidation(transaction) {
        const errors = [];
        
        if (!transaction.from) {
            errors.push('Missing sender address');
        }
        
        if (!transaction.to) {
            errors.push('Missing recipient address');
        }
        
        if (transaction.value < 0) {
            errors.push('Invalid transaction value');
        }
        
        if (!transaction.gas || transaction.gas <= 0) {
            errors.push('Invalid gas amount');
        }
        
        return errors;
    }

    getValidator(validatorId) {
        return this.validators.get(validatorId);
    }

    getValidation(validationId) {
        return this.validations.get(validationId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.transactionValidation = new TransactionValidation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionValidation;
}


