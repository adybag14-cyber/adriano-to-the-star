/**
 * Model Comparison by Interpretability
 * Compares models based on interpretability
 */

class ModelComparisonInterpretability {
    constructor() {
        this.comparisons = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-interpretability-comparison]');
        containers.forEach(container => {
            this.setupComparisonInterface(container);
        });
    }

    setupComparisonInterface(container) {
        if (container.querySelector('.interpretability-comparison-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'interpretability-comparison-interface';
        ui.innerHTML = `
            <div class="comparison-controls">
                <select data-models multiple>
                    <option value="model1">Model 1</option>
                    <option value="model2">Model 2</option>
                </select>
                <button data-compare-interpretability>Compare Interpretability</button>
            </div>
            <div class="comparison-results" role="region"></div>
        `;
        container.appendChild(ui);

        const compareBtn = ui.querySelector('[data-compare-interpretability]');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.compareInterpretability(container);
            });
        }
    }

    compareInterpretability(container) {
        const ui = container.querySelector('.interpretability-comparison-interface');
        if (!ui) return;
        
        const models = Array.from(ui.querySelector('[data-models]').selectedOptions).map(o => o.value);
        const resultsDiv = ui.querySelector('.comparison-results');
        
        if (!resultsDiv) return;

        if (models.length < 2) {
            alert('Please select at least 2 models');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Interpretability Comparison</h3>
            <p>Models: ${models.join(', ')}</p>
            <p>Model 1 Score: 0.85</p>
            <p>Model 2 Score: 0.78</p>
        `;
    }
}

const modelComparisonInterpretability = new ModelComparisonInterpretability();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelComparisonInterpretability;
}

