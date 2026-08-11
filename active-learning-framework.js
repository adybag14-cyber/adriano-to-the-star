/**
 * Active Learning Framework
 * Implements active learning strategies for efficient model training
 */

class ActiveLearningFramework {
    constructor() {
        this.strategies = new Map();
        this.queries = new Map();
        this.models = new Map();
        this.init();
    }

    init() {
        this.registerStrategies();
        this.setupEventListeners();
        this.trackEvent('active_learning_framework_initialized');
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    /**
     * Register active learning strategies
     */
    registerStrategies() {
        this.strategies.set('uncertainty', {
            name: 'Uncertainty Sampling',
            query: (predictions) => {
                return this.uncertaintySampling(predictions);
            }
        });

        this.strategies.set('diversity', {
            name: 'Diversity Sampling',
            query: (predictions) => {
                return this.diversitySampling(predictions);
            }
        });

        this.strategies.set('query-by-committee', {
            name: 'Query by Committee',
            query: (predictions) => {
                return this.queryByCommittee(predictions);
            }
        });
    }

    /**
     * Initialize interfaces
     */
    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-active-learning]');
        containers.forEach(container => {
            this.setupActiveLearningInterface(container);
        });
    }

    /**
     * Setup active learning interface
     */
    setupActiveLearningInterface(container) {
        if (container.querySelector('.active-learning-interface')) {
            return;
        }

        const ui = document.createElement('div');
        ui.className = 'active-learning-interface';

        ui.innerHTML = `
            <div class="al-controls">
                <select class="al-strategy" data-al-strategy>
                    ${Array.from(this.strategies.entries()).map(([code, strategy]) => 
                        `<option value="${code}">${strategy.name}</option>`
                    ).join('')}
                </select>
                <input type="number" 
                       class="al-batch-size" 
                       data-al-batch-size 
                       value="10" 
                       min="1" 
                       max="100">
                <button class="al-query-btn" data-al-query>Query Samples</button>
            </div>
            <div class="al-results" role="region"></div>
        `;

        container.appendChild(ui);

        ui.querySelector('[data-al-query]').addEventListener('click', () => {
            this.querySamples(container);
        });
    }

    /**
     * Query samples using active learning
     */
    async querySamples(container) {
        const ui = container.querySelector('.active-learning-interface');
        const strategyCode = ui.querySelector('[data-al-strategy]').value;
        const batchSize = parseInt(ui.querySelector('[data-al-batch-size]').value);

        const strategy = this.strategies.get(strategyCode);
        if (!strategy) {
            return;
        }

        // Get predictions for unlabeled data
        const predictions = await this.getPredictions();

        // Query samples
        const queriedSamples = strategy.query(predictions, batchSize);

        this.trackEvent('samples_queried', { strategy: strategyCode, batchSize, queriedCount: queriedSamples.length });
        this.displayQueriedSamples(ui.querySelector('.al-results'), queriedSamples);
    }

    /**
     * Get predictions (placeholder)
     */
    async getPredictions() {
        // In production, this would get predictions from a model
        return Array.from({ length: 100 }, (_, i) => ({
            id: i,
            prediction: [0.3, 0.4, 0.3], // Example probabilities
            confidence: 0.4
        }));
    }

    /**
     * Uncertainty sampling
     */
    uncertaintySampling(predictions, batchSize = 10) {
        // Select samples with highest uncertainty (lowest confidence)
        const sorted = predictions
            .map((p, idx) => ({ ...p, idx, uncertainty: 1 - p.confidence }))
            .sort((a, b) => b.uncertainty - a.uncertainty);

        return sorted.slice(0, batchSize).map(item => ({
            id: item.id,
            uncertainty: item.uncertainty,
            reason: 'High uncertainty'
        }));
    }

    /**
     * Diversity sampling
     */
    diversitySampling(predictions, batchSize = 10) {
        // Select diverse samples (simplified)
        const selected = [];
        const step = Math.floor(predictions.length / batchSize);

        for (let i = 0; i < batchSize && i * step < predictions.length; i++) {
            selected.push({
                id: predictions[i * step].id,
                reason: 'Diversity'
            });
        }

        return selected;
    }

    /**
     * Query by committee
     */
    queryByCommittee(predictions, batchSize = 10) {
        // Select samples where committee disagrees
        const disagreement = predictions.map((p, idx) => ({
            ...p,
            idx,
            disagreement: this.calculateDisagreement(p.prediction)
        }));

        disagreement.sort((a, b) => b.disagreement - a.disagreement);

        return disagreement.slice(0, batchSize).map(item => ({
            id: item.id,
            disagreement: item.disagreement,
            reason: 'Committee disagreement'
        }));
    }

    /**
     * Calculate disagreement (entropy)
     */
    calculateDisagreement(probabilities) {
        return probabilities.reduce((sum, p) => {
            return sum - (p * Math.log2(p + 1e-10));
        }, 0);
    }

    /**
     * Display queried samples
     */
    displayQueriedSamples(container, samples) {
        container.innerHTML = `
            <h3>Queried Samples for Labeling</h3>
            <div class="samples-list">
                ${samples.map(sample => `
                    <div class="sample-item">
                        <div class="sample-id">Sample ${sample.id}</div>
                        <div class="sample-reason">${sample.reason}</div>
                        ${sample.uncertainty ? 
                            `<div class="sample-uncertainty">Uncertainty: ${sample.uncertainty.toFixed(3)}</div>` : 
                            ''}
                        ${sample.disagreement ? 
                            `<div class="sample-disagreement">Disagreement: ${sample.disagreement.toFixed(3)}</div>` : 
                            ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`active_learning_fw_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'active_learning_framework', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const activeLearningFramework = new ActiveLearningFramework();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActiveLearningFramework;
}

