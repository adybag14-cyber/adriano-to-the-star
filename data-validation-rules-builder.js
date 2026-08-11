/**
 * Data Validation Rules Builder
 * Create and manage data validation rules
 */
(function() {
    'use strict';

    class DataValidationRulesBuilder {
        constructor() {
            this.rules = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_validation_rules_builder_initialized');
        }

        setupUI() {
            if (!document.getElementById('validation-rules-builder')) {
                const builder = document.createElement('div');
                builder.id = 'validation-rules-builder';
                builder.className = 'validation-rules-builder';
                builder.innerHTML = `
                    <div class="builder-header">
                        <h2>Validation Rules</h2>
                        <button class="create-rule-btn" id="create-rule-btn">Create Rule</button>
                    </div>
                    <div class="rules-list" id="rules-list"></div>
                `;
                document.body.appendChild(builder);
            }
        }

        createRule(config) {
            const rule = {
                id: this.generateId(),
                field: config.field,
                type: config.type, // required, min, max, pattern, custom
                value: config.value,
                message: config.message,
                enabled: config.enabled !== false
            };
            this.rules.push(rule);
            this.saveRules();
            return rule;
        }

        validate(data) {
            const errors = [];
            this.rules.forEach(rule => {
                if (!rule.enabled) return;
                const error = this.validateRule(rule, data);
                if (error) errors.push(error);
            });
            return errors;
        }

        validateRule(rule, data) {
            const value = data[rule.field];
            switch (rule.type) {
                case 'required':
                    if (!value || value === '') {
                        return { field: rule.field, message: rule.message || 'Field is required' };
                    }
                    break;
                case 'min':
                    if (value && Number(value) < Number(rule.value)) {
                        return { field: rule.field, message: rule.message || `Value must be at least ${rule.value}` };
                    }
                    break;
                case 'max':
                    if (value && Number(value) > Number(rule.value)) {
                        return { field: rule.field, message: rule.message || `Value must be at most ${rule.value}` };
                    }
                    break;
                case 'pattern':
                    if (value && !new RegExp(rule.value).test(value)) {
                        return { field: rule.field, message: rule.message || 'Invalid format' };
                    }
                    break;
            }
            return null;
        }

        generateId() {
            return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveRules() {
            localStorage.setItem('validationRules', JSON.stringify(this.rules));
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_validation_rules_builder_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.validationRules = new DataValidationRulesBuilder();
        });
    } else {
        window.validationRules = new DataValidationRulesBuilder();
    }
})();


