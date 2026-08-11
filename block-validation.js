/**
 * Block Validation
 * Blockchain block validation system
 */

class BlockValidation {
    constructor() {
        this.validators = new Map();
        this.validations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('block_valid_initialized');
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
        console.log(`Block validator registered: ${validatorId}`);
        return validator;
    }

    async validateBlock(block, validatorId = null) {
        const validator = validatorId ? this.validators.get(validatorId) : 
                         Array.from(this.validators.values()).find(v => v.enabled);
        if (!validator) {
            throw new Error('Validator not found');
        }
        
        const validation = {
            id: `validation_${Date.now()}`,
            blockId: block.id,
            validatorId: validator.id,
            valid: true,
            errors: [],
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        validator.rules.forEach(rule => {
            const result = this.applyRule(rule, block);
            if (!result.valid) {
                validation.valid = false;
                validation.errors.push(result.error);
            }
        });
        
        if (validation.valid) {
            validation.errors = this.performStandardValidation(block);
            validation.valid = validation.errors.length === 0;
        }
        
        this.validations.set(validation.id, validation);
        
        return validation;
    }

    applyRule(rule, block) {
        if (rule.type === 'hash_check') {
            return { valid: block.hash !== undefined };
        } else if (rule.type === 'timestamp_check') {
            return { valid: block.timestamp !== undefined };
        }
        return { valid: true };
    }

    performStandardValidation(block) {
        const errors = [];
        
        if (!block.hash) {
            errors.push('Missing block hash');
        }
        
        if (!block.parentHash && block.blockNumber > 0) {
            errors.push('Missing parent hash');
        }
        
        if (!block.timestamp) {
            errors.push('Missing timestamp');
        }
        
        return errors;
    }

    getValidator(validatorId) {
        return this.validators.get(validatorId);
    }

    getValidation(validationId) {
        return this.validations.get(validationId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`block_valid_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.blockValidation = new BlockValidation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockValidation;
}


