/**
 * Activation Function Library
 * Library of activation functions for neural networks
 */

class ActivationFunctionLibrary {
    constructor() {
        this.activations = new Map();
        this.init();
    }

    init() {
        this.registerActivations();
        this.setupEventListeners();
        this.trackEvent('activation_library_initialized');
    }

    registerActivations() {
        this.activations.set('relu', { name: 'ReLU' });
        this.activations.set('sigmoid', { name: 'Sigmoid' });
        this.activations.set('tanh', { name: 'Tanh' });
        this.activations.set('softmax', { name: 'Softmax' });
        this.activations.set('leaky-relu', { name: 'Leaky ReLU' });
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-activation-library]');
        containers.forEach(container => {
            this.setupActivationInterface(container);
        });
    }

    setupActivationInterface(container) {
        if (container.querySelector('.activation-library-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'activation-library-interface';
        ui.innerHTML = `
            <div class="activation-controls">
                <select data-activation>
                    ${Array.from(this.activations.entries()).map(([code, act]) => 
                        `<option value="${code}">${act.name}</option>`
                    ).join('')}
                </select>
                <canvas class="activation-plot" width="400" height="300"></canvas>
                <button data-plot-activation>Plot Function</button>
            </div>
        `;
        container.appendChild(ui);

        const plotBtn = ui.querySelector('[data-plot-activation]');
        if (plotBtn) {
            plotBtn.addEventListener('click', () => {
                this.plotActivation(container);
            });
        }
    }

    plotActivation(container) {
        const ui = container.querySelector('.activation-library-interface');
        if (!ui) return;
        
        const activation = ui.querySelector('[data-activation]').value;
        this.trackEvent('activation_plotted', { activation });
        const canvas = ui.querySelector('.activation-plot');
        
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw axes
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        
        // Draw activation function
        ctx.strokeStyle = '#4ade80';
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
            const normalizedX = (x - canvas.width / 2) / 50;
            let y;
            if (activation === 'relu') {
                y = Math.max(0, normalizedX);
            } else if (activation === 'sigmoid') {
                y = 1 / (1 + Math.exp(-normalizedX));
            } else {
                y = Math.tanh(normalizedX);
            }
            const pixelY = canvas.height / 2 - y * 100;
            if (x === 0) {
                ctx.moveTo(x, pixelY);
            } else {
                ctx.lineTo(x, pixelY);
            }
        }
        ctx.stroke();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`activation_lib_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'activation_function_library', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

const activationFunctionLibrary = new ActivationFunctionLibrary();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivationFunctionLibrary;
}

