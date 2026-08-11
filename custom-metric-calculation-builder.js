/**
 * Custom Metric Calculation Builder
 * Build custom metric calculations
 */
(function () {
    'use strict';

    class CustomMetricCalculationBuilder {
        constructor() {
            this.metrics = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('metric_calc_builder_initialized');
        }

        setupUI() {
            if (!document.getElementById('metric-builder')) {
                const builder = document.createElement('div');
                builder.id = 'metric-builder';
                builder.className = 'metric-builder';
                builder.innerHTML = `<h2>Metric Builder</h2>`;
                document.body.appendChild(builder);
            }
        }

        createMetric(config) {
            const metric = {
                id: this.generateId(),
                name: config.name,
                formula: config.formula,
                fields: config.fields
            };
            this.metrics.push(metric);
            return metric;
        }

        calculateMetric(metricId, data) {
            // SECURITY: Only allow admins to execute dynamic formulas
            if (!this.isAdmin()) {
                console.warn("Security: Unauthorized attempt to calculate metric.");
                return null;
            }

            const metric = this.metrics.find(m => m.id === metricId);
            if (!metric) return null;

            try {
                // eslint-disable-next-line no-new-func
                const func = new Function(...metric.fields, `return ${metric.formula}`);
                return func(...metric.fields.map(f => data[f]));
            } catch (error) {
                console.error('Metric calculation error:', error);
                return null;
            }
        }

        /**
         * Check if user is an admin
         * @returns {boolean}
         */
        isAdmin() {
            // Check Supabase session or global object
            if (window.supabase && window.supabase.auth && window.supabase.auth.user()) {
                const user = window.supabase.auth.user();
                // Assuming 'role' is stored in user metadata or a separate profile object available globally
                // This is a placeholder check - harden based on actual auth implementation
                return user.user_metadata?.role === 'admin' || window.currentUser?.role === 'admin';
            }
            return window.currentUser?.role === 'admin';
        }

        generateId() {
            return 'metric_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`metric_calc_builder_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.metricBuilder = new CustomMetricCalculationBuilder();
        });
    } else {
        window.metricBuilder = new CustomMetricCalculationBuilder();
    }
})();

