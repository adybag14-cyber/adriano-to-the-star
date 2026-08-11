/**
 * A/B Testing Framework for Data Features
 * A/B test data features
 */
(function() {
    'use strict';

    class ABTestingDataFeatures {
        constructor() {
            this.experiments = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('ab-testing')) {
                const testing = document.createElement('div');
                testing.id = 'ab-testing';
                testing.className = 'ab-testing';
                testing.innerHTML = `<h2>A/B Testing</h2>`;
                document.body.appendChild(testing);
            }
        }

        createExperiment(config) {
            const experiment = {
                id: this.generateId(),
                name: config.name,
                variants: config.variants || ['A', 'B'],
                trafficSplit: config.trafficSplit || [50, 50],
                metrics: config.metrics || [],
                status: 'running',
                createdAt: new Date().toISOString()
            };
            this.experiments.push(experiment);
            return experiment;
        }

        assignVariant(experimentId, userId) {
            const experiment = this.experiments.find(e => e.id === experimentId);
            if (!experiment) return null;

            const hash = this.hash(userId + experimentId);
            const variantIndex = hash % experiment.variants.length;
            return experiment.variants[variantIndex];
        }

        hash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash);
        }

        trackEvent(experimentId, variant, event) {
            const experiment = this.experiments.find(e => e.id === experimentId);
            if (experiment) {
                if (!experiment.results) {
                    experiment.results = {};
                }
                if (!experiment.results[variant]) {
                    experiment.results[variant] = { events: [], conversions: 0 };
                }
                experiment.results[variant].events.push({
                    ...event,
                    timestamp: new Date().toISOString()
                });
            }
        }

        getResults(experimentId) {
            const experiment = this.experiments.find(e => e.id === experimentId);
            if (!experiment || !experiment.results) return null;

            const results = {};
            Object.keys(experiment.results).forEach(variant => {
                const data = experiment.results[variant];
                results[variant] = {
                    events: data.events.length,
                    conversions: data.conversions,
                    conversionRate: data.events.length > 0 ? 
                        (data.conversions / data.events.length) * 100 : 0
                };
            });
            return results;
        }

        generateId() {
            return 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.abTesting = new ABTestingDataFeatures();
        });
    } else {
        window.abTesting = new ABTestingDataFeatures();
    }
})();

