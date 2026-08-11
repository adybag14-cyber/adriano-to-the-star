/**
 * Optimizer Selection Interface
 * Provides interface for selecting and configuring optimizers
 */

class OptimizerSelectionInterface {
    constructor() {
        this.optimizers = new Map();
        this.init();
    }

    init() {
        this.registerOptimizers();
        this.setupEventListeners();
    }

    registerOptimizers() {
        this.optimizers.set('sgd', { name: 'SGD' });
        this.optimizers.set('adam', { name: 'Adam' });
        this.optimizers.set('rmsprop', { name: 'RMSprop' });
        this.optimizers.set('adagrad', { name: 'Adagrad' });
        this.optimizers.set('adamw', { name: 'AdamW' });
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-optimizer-selection]');
        containers.forEach(container => {
            this.setupOptimizerInterface(container);
        });
    }

    setupOptimizerInterface(container) {
        if (container.querySelector('.optimizer-selection-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'optimizer-selection-interface';
        ui.innerHTML = `
            <div class="opt-controls">
                <select data-optimizer>
                    ${Array.from(this.optimizers.entries()).map(([code, opt]) => 
                        `<option value="${code}">${opt.name}</option>`
                    ).join('')}
                </select>
                <input type="number" data-learning-rate value="0.001" step="0.0001">
                <button data-select-optimizer>Select Optimizer</button>
            </div>
            <div class="opt-results" role="region"></div>
        `;
        container.appendChild(ui);

        const selectBtn = ui.querySelector('[data-select-optimizer]');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => {
                this.selectOptimizer(container);
            });
        }
    }

    selectOptimizer(container) {
        const ui = container.querySelector('.optimizer-selection-interface');
        if (!ui) return;
        
        const optimizer = ui.querySelector('[data-optimizer]').value;
        const lr = parseFloat(ui.querySelector('[data-learning-rate]').value);
        const resultsDiv = ui.querySelector('.opt-results');
        
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Optimizer Selected</h3>
            <p>Optimizer: ${this.optimizers.get(optimizer).name}</p>
            <p>Learning Rate: ${lr}</p>
        `;
    }
}

const optimizerSelectionInterface = new OptimizerSelectionInterface();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizerSelectionInterface;
}

