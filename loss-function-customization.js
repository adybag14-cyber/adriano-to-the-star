/**
 * Loss Function Customization System
 * Allows customization of loss functions for training
 */

class LossFunctionCustomization {
    constructor() {
        this.lossFunctions = new Map();
        this.init();
    }

    init() {
        this.registerLossFunctions();
        this.setupEventListeners();
    }

    registerLossFunctions() {
        this.lossFunctions.set('mse', { name: 'Mean Squared Error' });
        this.lossFunctions.set('crossentropy', { name: 'Cross Entropy' });
        this.lossFunctions.set('huber', { name: 'Huber Loss' });
        this.lossFunctions.set('focal', { name: 'Focal Loss' });
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-loss-function]');
        containers.forEach(container => {
            this.setupLossFunctionInterface(container);
        });
    }

    setupLossFunctionInterface(container) {
        if (container.querySelector('.loss-function-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'loss-function-interface';
        ui.innerHTML = `
            <div class="loss-controls">
                <select data-loss-type>
                    ${Array.from(this.lossFunctions.entries()).map(([code, loss]) => 
                        `<option value="${code}">${loss.name}</option>`
                    ).join('')}
                </select>
                <button data-configure-loss>Configure Loss Function</button>
            </div>
            <div class="loss-results" role="region"></div>
        `;
        container.appendChild(ui);

        const configBtn = ui.querySelector('[data-configure-loss]');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                this.configureLossFunction(container);
            });
        }
    }

    configureLossFunction(container) {
        const ui = container.querySelector('.loss-function-interface');
        if (!ui) return;
        
        const type = ui.querySelector('[data-loss-type]').value;
        const resultsDiv = ui.querySelector('.loss-results');
        
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Loss Function Configured</h3>
            <p>Type: ${this.lossFunctions.get(type).name}</p>
        `;
    }
}

const lossFunctionCustomization = new LossFunctionCustomization();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LossFunctionCustomization;
}

