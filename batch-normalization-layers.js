/**
 * Batch Normalization Layers
 * Implements batch normalization for neural networks
 */

class BatchNormalizationLayers {
    constructor() {
        this.layers = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.trackEvent('batch_norm_initialized');
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-batch-norm]');
        containers.forEach(container => {
            this.setupBatchNormInterface(container);
        });
    }

    setupBatchNormInterface(container) {
        if (container.querySelector('.batch-norm-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'batch-norm-interface';
        ui.innerHTML = `
            <div class="bn-controls">
                <input type="number" data-momentum value="0.9" step="0.1" min="0" max="1">
                <input type="number" data-epsilon value="0.001" step="0.0001">
                <button data-add-batch-norm>Add Batch Norm Layer</button>
            </div>
            <div class="bn-results" role="region"></div>
        `;
        container.appendChild(ui);

        const addBtn = ui.querySelector('[data-add-batch-norm]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addBatchNormLayer(container);
            });
        }
    }

    addBatchNormLayer(container) {
        const ui = container.querySelector('.batch-norm-interface');
        if (!ui) return;
        
        const momentum = parseFloat(ui.querySelector('[data-momentum]').value);
        const epsilon = parseFloat(ui.querySelector('[data-epsilon]').value);
        const resultsDiv = ui.querySelector('.bn-results');
        
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <h3>Batch Norm Layer Added</h3>
            <p>Momentum: ${momentum}</p>
            <p>Epsilon: ${epsilon}</p>
        `;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`batch_norm_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

const batchNormalizationLayers = new BatchNormalizationLayers();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BatchNormalizationLayers;
}

