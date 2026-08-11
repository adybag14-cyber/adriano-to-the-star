/**
 * Traffic Splitting for Models
 * Splits traffic between multiple model versions
 */

class TrafficSplittingForModels {
    constructor() {
        this.splits = new Map();
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
        const containers = document.querySelectorAll('[data-traffic-splitting]');
        containers.forEach(container => {
            this.setupTrafficSplitInterface(container);
        });
    }

    setupTrafficSplitInterface(container) {
        if (container.querySelector('.traffic-split-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'traffic-split-interface';
        ui.innerHTML = `
            <div class="split-controls">
                <input type="text" data-model-a placeholder="Model A">
                <input type="number" data-percent-a value="50" min="0" max="100">
                <input type="text" data-model-b placeholder="Model B">
                <input type="number" data-percent-b value="50" min="0" max="100">
                <button data-configure-split>Configure Split</button>
            </div>
            <div class="split-results" role="region"></div>
        `;
        container.appendChild(ui);

        const configBtn = ui.querySelector('[data-configure-split]');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                this.configureSplit(container);
            });
        }
    }

    configureSplit(container) {
        const ui = container.querySelector('.traffic-split-interface');
        if (!ui) return;
        
        const modelA = ui.querySelector('[data-model-a]').value;
        const percentA = parseInt(ui.querySelector('[data-percent-a]').value);
        const modelB = ui.querySelector('[data-model-b]').value;
        const percentB = parseInt(ui.querySelector('[data-percent-b]').value);
        const resultsDiv = ui.querySelector('.split-results');
        
        if (!modelA || !modelB || !resultsDiv) {
            if (!modelA || !modelB) alert('Please fill all fields');
            return;
        }

        if (percentA + percentB !== 100) {
            alert('Percentages must sum to 100');
            return;
        }

        resultsDiv.innerHTML = `
            <h3>Traffic Split Configured</h3>
            <p>Model A: ${percentA}%</p>
            <p>Model B: ${percentB}%</p>
        `;
    }
}

const trafficSplittingForModels = new TrafficSplittingForModels();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficSplittingForModels;
}

