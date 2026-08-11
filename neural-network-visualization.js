/**
 * Neural Network Visualization System
 * Visualizes neural network architectures, training progress, and activations
 */

class NeuralNetworkVisualization {
    constructor() {
        this.networks = new Map();
        this.visualizations = new Map();
        this.canvas = null;
        this.ctx = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createCanvas();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeVisualizations();
        });

        // Listen for network updates
        document.addEventListener('neuralNetworkUpdate', (e) => {
            this.updateVisualization(e.detail.networkId, e.detail.data);
        });
    }

    /**
     * Create canvas for rendering
     */
    createCanvas() {
        const container = document.getElementById('neural-network-canvas-container');
        if (!container) {
            return;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'neural-network-canvas';
        this.canvas.width = container.offsetWidth || 800;
        this.canvas.height = container.offsetHeight || 600;
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Initialize all visualizations
     */
    initializeVisualizations() {
        const elements = document.querySelectorAll('[data-neural-network]');
        elements.forEach(element => {
            const networkId = element.getAttribute('data-neural-network');
            const networkData = this.parseNetworkData(element);
            this.registerNetwork(networkId, networkData);
            this.renderNetwork(networkId, element);
        });
    }

    /**
     * Parse network data from element attributes
     */
    parseNetworkData(element) {
        const layersJson = element.getAttribute('data-network-layers');
        const weightsJson = element.getAttribute('data-network-weights');
        const activationsJson = element.getAttribute('data-network-activations');

        return {
            layers: layersJson ? JSON.parse(layersJson) : this.getDefaultLayers(),
            weights: weightsJson ? JSON.parse(weightsJson) : null,
            activations: activationsJson ? JSON.parse(activationsJson) : null,
            config: {
                inputSize: parseInt(element.getAttribute('data-input-size')) || 784,
                outputSize: parseInt(element.getAttribute('data-output-size')) || 10,
                layerSpacing: parseInt(element.getAttribute('data-layer-spacing')) || 150,
                nodeSpacing: parseInt(element.getAttribute('data-node-spacing')) || 30
            }
        };
    }

    /**
     * Get default network layers
     */
    getDefaultLayers() {
        return [
            { type: 'input', size: 784, activation: null },
            { type: 'dense', size: 128, activation: 'relu' },
            { type: 'dense', size: 64, activation: 'relu' },
            { type: 'output', size: 10, activation: 'softmax' }
        ];
    }

    /**
     * Register a neural network
     */
    registerNetwork(networkId, networkData) {
        this.networks.set(networkId, {
            id: networkId,
            ...networkData,
            positions: this.calculateNodePositions(networkData)
        });
    }

    /**
     * Calculate node positions for visualization
     */
    calculateNodePositions(networkData) {
        const { layers, config } = networkData;
        const positions = [];
        const startX = 100;
        const canvasHeight = this.canvas ? this.canvas.height : 600;

        layers.forEach((layer, layerIndex) => {
            const x = startX + (layerIndex * config.layerSpacing);
            const layerNodes = [];
            const nodeCount = layer.size;
            const totalHeight = (nodeCount - 1) * config.nodeSpacing;
            const startY = (canvasHeight - totalHeight) / 2;

            for (let i = 0; i < nodeCount; i++) {
                layerNodes.push({
                    x,
                    y: startY + (i * config.nodeSpacing),
                    layer: layerIndex,
                    index: i,
                    activation: layer.activation,
                    type: layer.type
                });
            }

            positions.push(layerNodes);
        });

        return positions;
    }

    /**
     * Render neural network
     */
    renderNetwork(networkId, container = null) {
        const network = this.networks.get(networkId);
        if (!network) {
            console.error(`Network ${networkId} not found`);
            return;
        }

        const canvas = container ? this.createNetworkCanvas(container) : this.canvas;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        this.drawConnections(ctx, network);

        // Draw nodes
        this.drawNodes(ctx, network);

        // Draw labels
        this.drawLabels(ctx, network);

        // Store visualization
        this.visualizations.set(networkId, { canvas, network });
    }

    /**
     * Create canvas for specific network
     */
    createNetworkCanvas(container) {
        let canvas = container.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = container.offsetWidth || 800;
            canvas.height = container.offsetHeight || 600;
            canvas.className = 'neural-network-canvas';
            container.appendChild(canvas);
        }
        return canvas;
    }

    /**
     * Draw connections between layers
     */
    drawConnections(ctx, network) {
        const { positions, weights } = network;

        for (let layerIndex = 0; layerIndex < positions.length - 1; layerIndex++) {
            const currentLayer = positions[layerIndex];
            const nextLayer = positions[layerIndex + 1];

            currentLayer.forEach((node, nodeIndex) => {
                nextLayer.forEach((nextNode, nextNodeIndex) => {
                    const weight = weights && weights[layerIndex] && weights[layerIndex][nodeIndex] && weights[layerIndex][nodeIndex][nextNodeIndex]
                        ? weights[layerIndex][nodeIndex][nextNodeIndex]
                        : Math.random() * 0.5 - 0.25; // Random weight if not provided

                    // Color based on weight
                    const opacity = Math.abs(weight);
                    const color = weight > 0 ? `rgba(0, 200, 0, ${opacity})` : `rgba(200, 0, 0, ${opacity})`;

                    ctx.strokeStyle = color;
                    ctx.lineWidth = Math.abs(weight) * 2;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(nextNode.x, nextNode.y);
                    ctx.stroke();
                });
            });
        }
    }

    /**
     * Draw nodes
     */
    drawNodes(ctx, network) {
        const { positions, activations } = network;

        positions.forEach((layer, layerIndex) => {
            layer.forEach((node, nodeIndex) => {
                const activation = activations && activations[layerIndex] && activations[layerIndex][nodeIndex]
                    ? activations[layerIndex][nodeIndex]
                    : 0;

                // Node color based on activation
                const intensity = Math.min(255, Math.abs(activation) * 255);
                const color = activation > 0 
                    ? `rgb(${intensity}, ${intensity}, 255)`
                    : `rgb(255, ${intensity}, ${intensity})`;

                // Draw node circle
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
                ctx.fill();

                // Draw border
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw activation value
                if (Math.abs(activation) > 0.01) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(activation.toFixed(2), node.x, node.y + 3);
                }
            });
        });
    }

    /**
     * Draw layer labels
     */
    drawLabels(ctx, network) {
        const { positions, layers } = network;

        positions.forEach((layer, layerIndex) => {
            if (layer.length === 0) return;

            const firstNode = layer[0];
            const label = layers[layerIndex].type === 'input' ? 'Input' :
                         layers[layerIndex].type === 'output' ? 'Output' :
                         `Layer ${layerIndex}`;

            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, firstNode.x, firstNode.y - 30);

            // Draw activation function label
            if (layers[layerIndex].activation) {
                ctx.fillStyle = '#666';
                ctx.font = '12px Arial';
                ctx.fillText(layers[layerIndex].activation, firstNode.x, firstNode.y - 15);
            }
        });
    }

    /**
     * Update visualization with new data
     */
    updateVisualization(networkId, data) {
        const network = this.networks.get(networkId);
        if (!network) {
            return;
        }

        if (data.weights) {
            network.weights = data.weights;
        }

        if (data.activations) {
            network.activations = data.activations;
        }

        if (data.layers) {
            network.layers = data.layers;
            network.positions = this.calculateNodePositions(network);
        }

        const visualization = this.visualizations.get(networkId);
        if (visualization) {
            this.renderNetwork(networkId);
        }
    }

    /**
     * Animate training progress
     */
    animateTraining(networkId, trainingData, duration = 1000) {
        const network = this.networks.get(networkId);
        if (!network) {
            return;
        }

        const steps = trainingData.length;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const animate = () => {
            if (currentStep >= steps) {
                return;
            }

            const step = trainingData[currentStep];
            this.updateVisualization(networkId, {
                weights: step.weights,
                activations: step.activations
            });

            currentStep++;
            setTimeout(animate, stepDuration);
        };

        animate();
    }

    /**
     * Visualize gradient flow
     */
    visualizeGradients(networkId, gradients) {
        const network = this.networks.get(networkId);
        if (!network) {
            return;
        }

        const canvas = this.visualizations.get(networkId)?.canvas || this.canvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { positions } = network;

        // Draw gradient arrows
        for (let layerIndex = 0; layerIndex < positions.length - 1; layerIndex++) {
            const currentLayer = positions[layerIndex];
            const nextLayer = positions[layerIndex + 1];

            if (!gradients[layerIndex]) continue;

            currentLayer.forEach((node, nodeIndex) => {
                nextLayer.forEach((nextNode, nextNodeIndex) => {
                    const gradient = gradients[layerIndex][nodeIndex]?.[nextNodeIndex];
                    if (!gradient || Math.abs(gradient) < 0.01) return;

                    // Draw gradient arrow
                    const dx = nextNode.x - node.x;
                    const dy = nextNode.y - node.y;
                    const angle = Math.atan2(dy, dx);
                    const arrowLength = 20;
                    const arrowAngle = Math.PI / 6;

                    ctx.strokeStyle = gradient > 0 ? 'green' : 'red';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(
                        node.x + Math.cos(angle) * arrowLength,
                        node.y + Math.sin(angle) * arrowLength
                    );
                    ctx.stroke();

                    // Arrowhead
                    ctx.beginPath();
                    ctx.moveTo(
                        node.x + Math.cos(angle) * arrowLength,
                        node.y + Math.sin(angle) * arrowLength
                    );
                    ctx.lineTo(
                        node.x + Math.cos(angle) * arrowLength - Math.cos(angle - arrowAngle) * 10,
                        node.y + Math.sin(angle) * arrowLength - Math.sin(angle - arrowAngle) * 10
                    );
                    ctx.moveTo(
                        node.x + Math.cos(angle) * arrowLength,
                        node.y + Math.sin(angle) * arrowLength
                    );
                    ctx.lineTo(
                        node.x + Math.cos(angle) * arrowLength - Math.cos(angle + arrowAngle) * 10,
                        node.y + Math.sin(angle) * arrowLength - Math.sin(angle + arrowAngle) * 10
                    );
                    ctx.stroke();
                });
            });
        }
    }

    /**
     * Export visualization as image
     */
    exportAsImage(networkId, filename = 'neural-network.png') {
        const visualization = this.visualizations.get(networkId);
        if (!visualization) {
            return;
        }

        const canvas = visualization.canvas;
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
    }
}

// Auto-initialize
const neuralNetworkVisualization = new NeuralNetworkVisualization();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeuralNetworkVisualization;
}
