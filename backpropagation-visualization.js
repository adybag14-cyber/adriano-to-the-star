/**
 * Backpropagation Visualization
 * Visualizes backpropagation algorithm in neural networks
 */

class BackpropagationVisualization {
    constructor() {
        this.visualizations = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.trackEvent('backprop_viz_initialized');
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-backprop-viz]');
        containers.forEach(container => {
            this.setupBackpropVizInterface(container);
        });
    }

    setupBackpropVizInterface(container) {
        if (container.querySelector('.backprop-viz-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'backprop-viz-interface';
        ui.innerHTML = `
            <div class="backprop-controls">
                <button data-start-backprop>Start Backpropagation</button>
                <button data-step-backprop>Step Forward</button>
            </div>
            <canvas class="backprop-canvas" width="600" height="400"></canvas>
            <div class="backprop-info" role="region"></div>
        `;
        container.appendChild(ui);

        const startBtn = ui.querySelector('[data-start-backprop]');
        const stepBtn = ui.querySelector('[data-step-backprop]');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startBackpropagation(container);
            });
        }
        
        if (stepBtn) {
            stepBtn.addEventListener('click', () => {
                this.stepBackpropagation(container);
            });
        }
    }

    startBackpropagation(container) {
        const canvas = container.querySelector('.backprop-canvas');
        const infoDiv = container.querySelector('.backprop-info');
        
        if (!canvas || !infoDiv) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw network structure
        ctx.strokeStyle = '#4ade80';
        ctx.beginPath();
        ctx.moveTo(100, 200);
        ctx.lineTo(300, 200);
        ctx.stroke();
        
        infoDiv.innerHTML = '<p>Backpropagation started</p>';
    }

    stepBackpropagation(container) {
        const infoDiv = container.querySelector('.backprop-info');
        if (!infoDiv) return;
        infoDiv.innerHTML = '<p>Processing gradient step...</p>';
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`backprop_viz_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

const backpropagationVisualization = new BackpropagationVisualization();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackpropagationVisualization;
}

