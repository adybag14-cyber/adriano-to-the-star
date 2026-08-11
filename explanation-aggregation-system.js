/**
 * Explanation Aggregation System
 * Aggregates multiple explanations
 */

class ExplanationAggregationSystem {
    constructor() {
        this.aggregations = new Map();
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
        const containers = document.querySelectorAll('[data-aggregation-system]');
        containers.forEach(container => {
            this.setupAggregationInterface(container);
        });
    }

    setupAggregationInterface(container) {
        if (container.querySelector('.aggregation-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'aggregation-interface';
        ui.innerHTML = `
            <div class="aggregation-controls">
                <input type="text" data-explanation-ids placeholder="Explanation IDs (comma-separated)">
                <button data-aggregate>Aggregate</button>
            </div>
            <div class="aggregation-results" role="region"></div>
        `;
        container.appendChild(ui);

        const aggregateBtn = ui.querySelector('[data-aggregate]');
        if (aggregateBtn) {
            aggregateBtn.addEventListener('click', () => {
                this.aggregate(container);
            });
        }
    }

    aggregate(container) {
        const ui = container.querySelector('.aggregation-interface');
        if (!ui) return;
        
        const ids = ui.querySelector('[data-explanation-ids]').value;
        const resultsDiv = ui.querySelector('.aggregation-results');
        
        if (!ids || !resultsDiv) {
            if (!ids) alert('Please enter explanation IDs');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Aggregated</h3>
            <p>Explanations: ${ids}</p>
        `;
    }
}

const explanationAggregationSystem = new ExplanationAggregationSystem();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationAggregationSystem;
}

