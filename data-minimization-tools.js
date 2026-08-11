/**
 * Data Minimization Tools
 * Minimize data collection
 */
(function() {
    'use strict';

    class DataMinimizationTools {
        constructor() {
            this.rules = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_minimization_initialized');
        }

        setupUI() {
            if (!document.getElementById('data-minimization')) {
                const minimization = document.createElement('div');
                minimization.id = 'data-minimization';
                minimization.className = 'data-minimization';
                minimization.innerHTML = `<h2>Data Minimization</h2>`;
                document.body.appendChild(minimization);
            }
        }

        addRule(rule) {
            this.rules.push({
                id: this.generateId(),
                field: rule.field,
                required: rule.required || false,
                purpose: rule.purpose
            });
        }

        validateCollection(fields, purpose) {
            const relevantRules = this.rules.filter(r => r.purpose === purpose);
            const violations = [];

            fields.forEach(field => {
                const rule = relevantRules.find(r => r.field === field);
                if (!rule) {
                    violations.push({
                        field: field,
                        reason: 'Field not required for this purpose'
                    });
                }
            });

            return {
                valid: violations.length === 0,
                violations: violations
            };
        }

        minimizeData(data, purpose) {
            const relevantRules = this.rules.filter(r => r.purpose === purpose);
            const minimized = {};

            relevantRules.forEach(rule => {
                if (data[rule.field] !== undefined) {
                    minimized[rule.field] = data[rule.field];
                }
            });

            return minimized;
        }

        generateId() {
            return 'min_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_minimization_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataMinimization = new DataMinimizationTools();
        });
    } else {
        window.dataMinimization = new DataMinimizationTools();
    }
})();

