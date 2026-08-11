/**
 * Training Progress Visualization
 * Visualizes training metrics in real-time
 */

class TrainingProgressVisualization {
    constructor() {
        this.charts = new Map();
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
        const containers = document.querySelectorAll('[data-training-progress]');
        containers.forEach(container => {
            this.setupProgressInterface(container);
        });
    }

    setupProgressInterface(container) {
        if (container.querySelector('.progress-viz-interface')) return;

        const ui = document.createElement('div');
        ui.className = 'progress-viz-interface';
        ui.innerHTML = `
            <div class="progress-controls">
                <button data-start-training>Start Training</button>
                <button data-stop-training>Stop Training</button>
            </div>
            <canvas class="progress-chart" width="600" height="400"></canvas>
            <div class="progress-metrics" role="region"></div>
        `;
        container.appendChild(ui);

        const startBtn = ui.querySelector('[data-start-training]');
        const stopBtn = ui.querySelector('[data-stop-training]');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTraining(container);
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopTraining(container);
            });
        }
    }

    startTraining(container) {
        const canvas = container.querySelector('.progress-chart');
        const metricsDiv = container.querySelector('.progress-metrics');
        
        if (!canvas || !metricsDiv) return;

        const ctx = canvas.getContext('2d');
        let epoch = 0;

        const interval = setInterval(() => {
            epoch++;
            const loss = Math.max(0.1, 1 - epoch * 0.02);
            const accuracy = Math.min(0.99, epoch * 0.01);

            // Draw chart
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            ctx.lineTo(epoch * 10, canvas.height - loss * canvas.height);
            ctx.stroke();

            metricsDiv.innerHTML = `
                <p>Epoch: ${epoch}</p>
                <p>Loss: ${loss.toFixed(4)}</p>
                <p>Accuracy: ${(accuracy * 100).toFixed(2)}%</p>
            `;

            if (epoch >= 50) {
                clearInterval(interval);
            }
        }, 500);

        this.trainingInterval = interval;
    }

    stopTraining(container) {
        if (this.trainingInterval) {
            clearInterval(this.trainingInterval);
            this.trainingInterval = null;
        }
    }
}

const trainingProgressVisualization = new TrainingProgressVisualization();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainingProgressVisualization;
}

