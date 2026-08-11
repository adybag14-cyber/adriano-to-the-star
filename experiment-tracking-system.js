/**
 * Experiment Tracking System
 * Track ML experiments
 */
(function() {
    'use strict';

    class ExperimentTrackingSystem {
        constructor() {
            this.experiments = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('experiment-tracking')) {
                const tracking = document.createElement('div');
                tracking.id = 'experiment-tracking';
                tracking.className = 'experiment-tracking';
                tracking.innerHTML = `
                    <div class="tracking-header">
                        <h2>Experiment Tracking</h2>
                        <button id="create-experiment">Create Experiment</button>
                    </div>
                    <div class="experiments-list" id="experiments-list"></div>
                `;
                document.body.appendChild(tracking);
            }
        }

        createExperiment(config) {
            const experiment = {
                id: this.generateId(),
                name: config.name,
                parameters: config.parameters || {},
                metrics: {},
                status: 'running',
                createdAt: new Date().toISOString()
            };
            this.experiments.push(experiment);
            this.renderExperiments();
            return experiment;
        }

        logMetric(experimentId, metricName, value, step = null) {
            const experiment = this.experiments.find(e => e.id === experimentId);
            if (experiment) {
                if (!experiment.metrics[metricName]) {
                    experiment.metrics[metricName] = [];
                }
                experiment.metrics[metricName].push({
                    value: value,
                    step: step,
                    timestamp: new Date().toISOString()
                });
            }
        }

        logParameter(experimentId, name, value) {
            const experiment = this.experiments.find(e => e.id === experimentId);
            if (experiment) {
                experiment.parameters[name] = value;
            }
        }

        renderExperiments() {
            const list = document.getElementById('experiments-list');
            if (!list) return;

            list.innerHTML = this.experiments.map(exp => `
                <div class="experiment-item">
                    <div class="exp-name">${exp.name}</div>
                    <div class="exp-status">${exp.status}</div>
                    <div class="exp-metrics">
                        ${Object.keys(exp.metrics).map(metric => `
                            <div>${metric}: ${exp.metrics[metric].slice(-1)[0]?.value || 'N/A'}</div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        generateId() {
            return 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.experimentTracking = new ExperimentTrackingSystem();
        });
    } else {
        window.experimentTracking = new ExperimentTrackingSystem();
    }
})();

