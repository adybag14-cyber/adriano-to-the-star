/**
 * Gradient Clipping Mechanism
 * Implements gradient clipping to prevent exploding gradients
 */

class GradientClippingMechanism {
    constructor() {
        this.clipValue = 1.0;
        this.clipNorm = 1.0;
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
        const containers = document.querySelectorAll('[data-gradient-clipping]');
        containers.forEach(container => {
            this.setupClippingInterface(container);
        });
    }

    setupClippingInterface(container) {
        if (container.querySelector('.gradient-clipping-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'gradient-clipping-interface';
        ui.innerHTML = `
            <div class="clip-controls">
                <select data-clip-type>
                    <option value="value">Clip by Value</option>
                    <option value="norm">Clip by Norm</option>
                </select>
                <input type="number" data-clip-threshold value="1.0" step="0.1">
                <button data-configure-clipping>Configure Clipping</button>
            </div>
            <div class="clip-results" role="region"></div>
        `;
        container.appendChild(ui);

        const configBtn = ui.querySelector('[data-configure-clipping]');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                this.configureClipping(container);
            });
        }
    }

    configureClipping(container) {
        const ui = container.querySelector('.gradient-clipping-interface');
        if (!ui) return;
        
        const type = ui.querySelector('[data-clip-type]').value;
        const threshold = parseFloat(ui.querySelector('[data-clip-threshold]').value);
        const resultsDiv = ui.querySelector('.clip-results');
        
        if (!resultsDiv) return;

        if (type === 'value') {
            this.clipValue = threshold;
        } else {
            this.clipNorm = threshold;
        }

        resultsDiv.innerHTML = `
            <h3>Gradient Clipping Configured</h3>
            <p>Type: ${type}</p>
            <p>Threshold: ${threshold}</p>
        `;
    }

    clipGradients(gradients) {
        if (this.clipValue > 0) {
            return gradients.map(g => Math.max(-this.clipValue, Math.min(this.clipValue, g)));
        }
        return gradients;
    }
}

const gradientClippingMechanism = new GradientClippingMechanism();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GradientClippingMechanism;
}

