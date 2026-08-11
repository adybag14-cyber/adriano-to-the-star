/**
 * Cohort Analysis Tools
 * Analyze user cohorts
 */
(function() {
    'use strict';

    class CohortAnalysisTools {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('cohort_tools_initialized');
        }

        setupUI() {
            if (!document.getElementById('cohort-analysis')) {
                const analysis = document.createElement('div');
                analysis.id = 'cohort-analysis';
                analysis.className = 'cohort-analysis';
                analysis.innerHTML = `<h2>Cohort Analysis</h2>`;
                document.body.appendChild(analysis);
            }
        }

        analyzeCohorts(data, cohortField, metricField) {
            const cohorts = {};
            data.forEach(item => {
                const cohort = item[cohortField];
                if (!cohorts[cohort]) {
                    cohorts[cohort] = [];
                }
                cohorts[cohort].push(item[metricField]);
            });
            
            const analysis = {};
            Object.keys(cohorts).forEach(cohort => {
                analysis[cohort] = {
                    count: cohorts[cohort].length,
                    average: cohorts[cohort].reduce((a, b) => a + b, 0) / cohorts[cohort].length,
                    total: cohorts[cohort].reduce((a, b) => a + b, 0)
                };
            });
            return analysis;
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`cohort_tools_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cohortAnalysis = new CohortAnalysisTools();
        });
    } else {
        window.cohortAnalysis = new CohortAnalysisTools();
    }
})();

