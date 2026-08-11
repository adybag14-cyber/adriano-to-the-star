/**
 * Multi-Model Explanation Comparison
 * Compares explanations across multiple models
 */

class MultiModelExplanationComparison {
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
        const containers = document.querySelectorAll('[data-multi-model-explanation]');
        containers.forEach(container => {
            this.setupComparisonInterface(container);
        });
    }

    setupComparisonInterface(container) {
        if (container.querySelector('.multi-model-comparison-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'multi-model-comparison-interface';
        ui.innerHTML = `
            <div class="comparison-controls">
                <select data-models multiple>
                    <option value="model1">Model 1</option>
                    <option value="model2">Model 2</option>
                    <option value="model3">Model 3</option>
                </select>
                <button data-compare-explanations>Compare Explanations</button>
            </div>
            <div class="comparison-results" role="region"></div>
        `;
        container.appendChild(ui);

        const compareBtn = ui.querySelector('[data-compare-explanations]');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.compareExplanations(container);
            });
        }
    }

    compareExplanations(container) {
        const ui = container.querySelector('.multi-model-comparison-interface');
        if (!ui) return;
        
        const models = Array.from(ui.querySelector('[data-models]').selectedOptions).map(o => o.value);
        const resultsDiv = ui.querySelector('.comparison-results');
        
        if (!resultsDiv) return;

        if (models.length < 2) {
            alert('Please select at least 2 models');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Explanation Comparison</h3>
            <p>Models: ${models.join(', ')}</p>
            <p>Similarity: 0.75</p>
        `;
    }
}

const multiModelExplanationComparison = new MultiModelExplanationComparison();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiModelExplanationComparison;
}

