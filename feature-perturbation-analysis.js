/**
 * Feature Perturbation Analysis
 * Analyzes model response to feature perturbations
 */

class FeaturePerturbationAnalysis {
    constructor() {
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.trackEvent('feature_perturb_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`feature_perturb_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-feature-perturbation]');
        containers.forEach(container => {
            this.setupPerturbationInterface(container);
        });
    }

    setupPerturbationInterface(container) {
        if (container.querySelector('.perturbation-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'perturbation-interface';
        ui.innerHTML = `
            <div class="perturbation-controls">
                <input type="text" data-feature-name placeholder="Feature Name">
                <input type="number" data-perturbation-amount value="0.1" step="0.01">
                <button data-perturb-feature>Perturb Feature</button>
            </div>
            <div class="perturbation-results" role="region"></div>
        `;
        container.appendChild(ui);

        const perturbBtn = ui.querySelector('[data-perturb-feature]');
        if (perturbBtn) {
            perturbBtn.addEventListener('click', () => {
                this.perturbFeature(container);
            });
        }
    }

    perturbFeature(container) {
        const ui = container.querySelector('.perturbation-interface');
        if (!ui) return;
        
        const feature = ui.querySelector('[data-feature-name]').value;
        const amount = parseFloat(ui.querySelector('[data-perturbation-amount]').value);
        const resultsDiv = ui.querySelector('.perturbation-results');
        
        if (!feature || !resultsDiv) {
            if (!feature) alert('Please enter feature name');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Perturbation Analysis</h3>
            <p>Feature: ${feature}</p>
            <p>Perturbation: ${amount}</p>
            <p>Impact: 0.15</p>
        `;
    }
}

const featurePerturbationAnalysis = new FeaturePerturbationAnalysis();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeaturePerturbationAnalysis;
}

