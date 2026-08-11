/**
 * RecursiveSimulation.js
 * "Game Within A Game" - Runs a simplified cellular automata or clicker in a localized canvas.
 * Generates bonus resources for the main reality.
 */

class RecursiveSimulation {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.gridSize = 20;
        this.cells = [];
        this.cols = 0;
        this.rows = 0;
        this.simulationSpeed = 100; // ms
        this.lastSimTime = 0;
    }

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = container.clientWidth;
        this.canvas.height = 200; // Fixed height for panel
        this.canvas.style.background = '#000';
        this.canvas.style.border = '1px solid #0f0';
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        // Setup Grid
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);
        this.initGrid();

        this.isRunning = true;
    }

    initGrid() {
        this.cells = [];
        for (let x = 0; x < this.cols; x++) {
            this.cells[x] = [];
            for (let y = 0; y < this.rows; y++) {
                this.cells[x][y] = Math.random() > 0.8 ? 1 : 0; // Sparse random
            }
        }
    }

    update(dt) {
        if (!this.isRunning || !this.ctx) return;

        const now = Date.now();
        if (now - this.lastSimTime > this.simulationSpeed) {
            this.stepSimulation();
            this.draw();
            this.lastSimTime = now;
        }
    }

    stepSimulation() {
        // Simple Game of Life logic
        const nextGen = [];
        let activeCells = 0;

        for (let x = 0; x < this.cols; x++) {
            nextGen[x] = [];
            for (let y = 0; y < this.rows; y++) {
                const neighbors = this.countNeighbors(x, y);
                const state = this.cells[x][y];

                if (state === 1 && (neighbors < 2 || neighbors > 3)) nextGen[x][y] = 0;
                else if (state === 0 && neighbors === 3) nextGen[x][y] = 1;
                else nextGen[x][y] = state;

                if (nextGen[x][y] === 1) activeCells++;
            }
        }
        this.cells = nextGen;

        // Bonus resource for main game based on "active computation"
        if (activeCells > 0 && Math.random() > 0.9) {
            this.game.resources.energy = (this.game.resources.energy || 0) + 1;
            // Silent increment to avoid spam
        }
    }

    countNeighbors(x, y) {
        let sum = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                const col = (x + i + this.cols) % this.cols;
                const row = (y + j + this.rows) % this.rows;
                sum += this.cells[col][row];
            }
        }
        sum -= this.cells[x][y];
        return sum;
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Trails
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#0f0';
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                if (this.cells[x][y] === 1) {
                    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
                }
            }
        }
    }
}

window.RecursiveSimulation = RecursiveSimulation;
