/**
 * Attention Mechanism Visualization
 * Visualizes attention weights in transformer models
 */

class AttentionMechanismVisualization {
    constructor() {
        this.visualizations = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.trackEvent('attention_viz_initialized');
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterfaces();
        });
    }

    initializeInterfaces() {
        const containers = document.querySelectorAll('[data-attention-viz]');
        containers.forEach(container => {
            this.setupAttentionVizInterface(container);
        });
    }

    setupAttentionVizInterface(container) {
        if (container.querySelector('.attention-viz-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'attention-viz-interface';
        ui.innerHTML = `
            <div class="attention-controls">
                <input type="text" data-input-text placeholder="Enter text...">
                <button data-visualize-attention>Visualize Attention</button>
            </div>
            <canvas class="attention-heatmap" width="400" height="400"></canvas>
        `;
        container.appendChild(ui);

        const vizBtn = ui.querySelector('[data-visualize-attention]');
        if (vizBtn) {
            vizBtn.addEventListener('click', () => {
                this.visualizeAttention(container);
            });
        }
    }

    visualizeAttention(container) {
        const ui = container.querySelector('.attention-viz-interface');
        if (!ui) return;
        
        const input = ui.querySelector('[data-input-text]');
        const canvas = ui.querySelector('.attention-heatmap');
        
        if (!input || !canvas) return;

        const text = input.value;
        if (!text) {
            alert('Please enter text');
            return;
        }

        const ctx = canvas.getContext('2d');
        const words = text.split(' ');
        const size = words.length;
        const cellSize = canvas.width / size;

        // Draw attention heatmap
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const attention = Math.random(); // Placeholder
                const intensity = Math.floor(attention * 255);
                ctx.fillStyle = `rgb(${intensity}, ${intensity}, 255)`;
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`attention_viz_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

const attentionMechanismVisualization = new AttentionMechanismVisualization();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttentionMechanismVisualization;
}

