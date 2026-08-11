/**
 * Early Stopping Mechanism
 * Implements early stopping to prevent overfitting during training
 */

class EarlyStoppingMechanism {
    constructor() {
        this.patience = 10;
        this.minDelta = 0.001;
        this.monitor = 'val_loss';
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
        const containers = document.querySelectorAll('[data-early-stopping]');
        containers.forEach(container => {
            this.setupEarlyStoppingInterface(container);
        });
    }

    setupEarlyStoppingInterface(container) {
        if (container.querySelector('.early-stopping-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'early-stopping-interface';
        ui.innerHTML = `
            <div class="es-controls">
                <input type="number" data-patience value="10" min="1" max="50">
                <input type="number" data-min-delta value="0.001" step="0.0001">
                <select data-monitor>
                    <option value="val_loss">Validation Loss</option>
                    <option value="val_accuracy">Validation Accuracy</option>
                </select>
                <button data-configure-es>Configure Early Stopping</button>
            </div>
            <div class="es-results" role="region"></div>
        `;
        container.appendChild(ui);

        const configBtn = ui.querySelector('[data-configure-es]');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                this.configureEarlyStopping(container);
            });
        }
    }

    configureEarlyStopping(container) {
        const ui = container.querySelector('.early-stopping-interface');
        if (!ui) return;
        
        const patience = parseInt(ui.querySelector('[data-patience]').value);
        const minDelta = parseFloat(ui.querySelector('[data-min-delta]').value);
        const monitor = ui.querySelector('[data-monitor]').value;
        const resultsDiv = ui.querySelector('.es-results');
        
        if (!resultsDiv) return;

        this.patience = patience;
        this.minDelta = minDelta;
        this.monitor = monitor;

        resultsDiv.innerHTML = `
            <h3>Early Stopping Configured</h3>
            <p>Patience: ${patience} epochs</p>
            <p>Min Delta: ${minDelta}</p>
            <p>Monitor: ${monitor}</p>
        `;
    }

    shouldStop(currentMetric, bestMetric, epoch) {
        if (this.monitor.includes('loss')) {
            return currentMetric > bestMetric - this.minDelta;
        } else {
            return currentMetric < bestMetric + this.minDelta;
        }
    }
}

const earlyStoppingMechanism = new EarlyStoppingMechanism();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EarlyStoppingMechanism;
}

