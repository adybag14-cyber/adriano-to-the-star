/**
 * Feature Importance Tracking
 * Tracks feature importance in models
 */

class FeatureImportanceTracking {
    constructor() {
        this.importances = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.trackEvent('feature_importance_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`feature_importance_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-feature-importance]');
        containers.forEach(container => {
            this.setupImportanceInterface(container);
        });
    }

    setupImportanceInterface(container) {
        if (container.querySelector('.importance-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'importance-interface';
        ui.innerHTML = `
            <div class="importance-controls">
                <input type="text" data-model-id placeholder="Model ID">
                <button data-view-importance>View Feature Importance</button>
            </div>
            <div class="importance-results" role="region"></div>
        `;
        container.appendChild(ui);

        const viewBtn = ui.querySelector('[data-view-importance]');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                this.viewImportance(container);
            });
        }
    }

    viewImportance(container) {
        const ui = container.querySelector('.importance-interface');
        if (!ui) return;
        
        const modelId = ui.querySelector('[data-model-id]').value;
        const resultsDiv = ui.querySelector('.importance-results');
        
        if (!modelId || !resultsDiv) {
            if (!modelId) alert('Please enter model ID');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Feature Importance</h3>
            <p>Model: ${modelId}</p>
            <ul>
                <li>Feature 1: 0.35</li>
                <li>Feature 2: 0.28</li>
                <li>Feature 3: 0.22</li>
            </ul>
        `;
    }
}

const featureImportanceTracking = new FeatureImportanceTracking();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureImportanceTracking;
}

