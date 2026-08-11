/**
 * Model Comparison Dashboard
 * Dashboard for comparing multiple ML models
 */

class ModelComparisonDashboard {
    constructor() {
        this.models = new Map();
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
        const containers = document.querySelectorAll('[data-model-comparison]');
        containers.forEach(container => {
            this.setupComparisonInterface(container);
        });
    }

    setupComparisonInterface(container) {
        if (container.querySelector('.model-comparison-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'model-comparison-interface';
        ui.innerHTML = `
            <div class="comparison-controls">
                <select data-models multiple>
                    <option value="model1">Model 1</option>
                    <option value="model2">Model 2</option>
                    <option value="model3">Model 3</option>
                </select>
                <button data-compare-models>Compare Models</button>
            </div>
            <div class="comparison-results" role="region"></div>
        `;
        container.appendChild(ui);

        const compareBtn = ui.querySelector('[data-compare-models]');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.compareModels(container);
            });
        }
    }

    compareModels(container) {
        const ui = container.querySelector('.model-comparison-interface');
        if (!ui) return;
        
        const modelsSelect = ui.querySelector('[data-models]');
        const resultsDiv = ui.querySelector('.comparison-results');
        
        if (!modelsSelect || !resultsDiv) return;

        const selected = Array.from(modelsSelect.selectedOptions).map(o => o.value);
        if (selected.length < 2) {
            alert('Please select at least 2 models');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Model Comparison</h3>
            <table>
                <tr><th>Model</th><th>Accuracy</th><th>F1 Score</th></tr>
                ${selected.map(m => `<tr><td>${m}</td><td>0.${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}</td><td>0.${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}</td></tr>`).join('')}
            </table>
        `;
    }
}

const modelComparisonDashboard = new ModelComparisonDashboard();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelComparisonDashboard;
}

