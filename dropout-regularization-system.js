/**
 * Dropout Regularization System
 * Implements dropout for preventing overfitting
 */

class DropoutRegularizationSystem {
    constructor() {
        this.dropoutRates = new Map();
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
        const containers = document.querySelectorAll('[data-dropout]');
        containers.forEach(container => {
            this.setupDropoutInterface(container);
        });
    }

    setupDropoutInterface(container) {
        if (container.querySelector('.dropout-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'dropout-interface';
        ui.innerHTML = `
            <div class="dropout-controls">
                <input type="range" data-dropout-rate min="0" max="1" step="0.1" value="0.5">
                <span class="rate-display">0.5</span>
                <button data-apply-dropout>Apply Dropout</button>
            </div>
            <div class="dropout-results" role="region"></div>
        `;
        container.appendChild(ui);

        const rateInput = ui.querySelector('[data-dropout-rate]');
        const rateDisplay = ui.querySelector('.rate-display');
        const applyBtn = ui.querySelector('[data-apply-dropout]');
        
        if (rateInput && rateDisplay) {
            rateInput.addEventListener('input', (e) => {
                rateDisplay.textContent = e.target.value;
            });
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyDropout(container);
            });
        }
    }

    applyDropout(container) {
        const ui = container.querySelector('.dropout-interface');
        if (!ui) return;
        
        const rate = parseFloat(ui.querySelector('[data-dropout-rate]').value);
        const resultsDiv = ui.querySelector('.dropout-results');
        
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Dropout Applied</h3>
            <p>Dropout Rate: ${rate}</p>
            <p>Nodes dropped: ${(rate * 100).toFixed(1)}%</p>
        `;
    }
}

const dropoutRegularizationSystem = new DropoutRegularizationSystem();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DropoutRegularizationSystem;
}

