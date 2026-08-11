/**
 * Data Import Validation and Error Reporting
 * Validate imports and report errors
 */
(function() {
    'use strict';

    class DataImportValidationErrorReporting {
        constructor() {
            this.errors = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_import_validation_initialized');
        }

        setupUI() {
            if (!document.getElementById('import-validation')) {
                const validation = document.createElement('div');
                validation.id = 'import-validation';
                validation.className = 'import-validation';
                validation.innerHTML = `<h2>Import Validation</h2>`;
                document.body.appendChild(validation);
            }
        }

        validate(data, schema) {
            this.errors = [];
            data.forEach((item, index) => {
                Object.keys(schema).forEach(field => {
                    const rule = schema[field];
                    if (rule.required && !item[field]) {
                        this.errors.push({
                            row: index + 1,
                            field: field,
                            message: `${field} is required`
                        });
                    }
                    if (rule.type && typeof item[field] !== rule.type) {
                        this.errors.push({
                            row: index + 1,
                            field: field,
                            message: `${field} must be ${rule.type}`
                        });
                    }
                });
            });
            return this.errors.length === 0;
        }

        getErrorReport() {
            return {
                totalErrors: this.errors.length,
                errors: this.errors,
                byField: this.groupByField(this.errors),
                byRow: this.groupByRow(this.errors)
            };
        }

        groupByField(errors) {
            const grouped = {};
            errors.forEach(error => {
                if (!grouped[error.field]) {
                    grouped[error.field] = [];
                }
                grouped[error.field].push(error);
            });
            return grouped;
        }

        groupByRow(errors) {
            const grouped = {};
            errors.forEach(error => {
                if (!grouped[error.row]) {
                    grouped[error.row] = [];
                }
                grouped[error.row].push(error);
            });
            return grouped;
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_import_validation_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.importValidation = new DataImportValidationErrorReporting();
        });
    } else {
        window.importValidation = new DataImportValidationErrorReporting();
    }
})();

