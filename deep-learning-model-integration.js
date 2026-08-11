/**
 * Deep Learning Model Integration System
 * Integrates deep learning models for various AI tasks (TensorFlow.js, ONNX.js)
 */

class DeepLearningModelIntegration {
    constructor() {
        this.models = new Map();
        this.modelCache = new Map();
        this.isInitialized = false;
        this.tf = null; // TensorFlow.js instance
        this.onnx = null; // ONNX.js instance
        this.init();
    }

    async init() {
        await this.loadLibraries();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    /**
     * Load TensorFlow.js and ONNX.js libraries
     */
    async loadLibraries() {
        // Check if TensorFlow.js is available
        if (typeof tf !== 'undefined') {
            this.tf = tf;
        } else {
            // Try to load TensorFlow.js dynamically
            try {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
                this.tf = window.tf;
            } catch (error) {
                console.warn('TensorFlow.js not available:', error);
            }
        }

        // Check if ONNX.js is available
        if (typeof ort !== 'undefined') {
            this.onnx = ort;
        } else {
            try {
                await this.loadScript('https://cdn.jsdelivr.net/npm/onnxruntime-web@latest/dist/ort.min.js');
                this.onnx = window.ort;
            } catch (error) {
                console.warn('ONNX.js not available:', error);
            }
        }
    }

    /**
     * Load script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        // Auto-process elements with data attributes
        document.addEventListener('DOMContentLoaded', () => {
            this.processElements();
        });

        // Process new elements added dynamically
        const observer = new MutationObserver(() => {
            this.processElements();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Load a TensorFlow.js model
     */
    async loadTensorFlowModel(modelUrl, modelName) {
        if (!this.tf) {
            throw new Error('TensorFlow.js is not loaded');
        }

        if (this.models.has(modelName)) {
            return this.models.get(modelName);
        }

        try {
            const model = await this.tf.loadLayersModel(modelUrl);
            this.models.set(modelName, {
                type: 'tensorflow',
                model,
                name: modelName
            });
            return this.models.get(modelName);
        } catch (error) {
            console.error(`Error loading TensorFlow model ${modelName}:`, error);
            throw error;
        }
    }

    /**
     * Load an ONNX model
     */
    async loadONNXModel(modelUrl, modelName) {
        if (!this.onnx) {
            throw new Error('ONNX.js is not loaded');
        }

        if (this.models.has(modelName)) {
            return this.models.get(modelName);
        }

        try {
            const session = await this.onnx.InferenceSession.create(modelUrl);
            this.models.set(modelName, {
                type: 'onnx',
                session,
                name: modelName
            });
            return this.models.get(modelName);
        } catch (error) {
            console.error(`Error loading ONNX model ${modelName}:`, error);
            throw error;
        }
    }

    /**
     * Run inference with TensorFlow model
     */
    async runTensorFlowInference(modelName, inputData) {
        const modelInfo = this.models.get(modelName);
        if (!modelInfo || modelInfo.type !== 'tensorflow') {
            throw new Error(`TensorFlow model ${modelName} not found`);
        }

        const inputTensor = this.tf.tensor(inputData);
        const predictions = await modelInfo.model.predict(inputTensor).data();
        inputTensor.dispose();
        
        return Array.from(predictions);
    }

    /**
     * Run inference with ONNX model
     */
    async runONNXInference(modelName, inputData, inputName = 'input') {
        const modelInfo = this.models.get(modelName);
        if (!modelInfo || modelInfo.type !== 'onnx') {
            throw new Error(`ONNX model ${modelName} not found`);
        }

        const inputTensor = new this.onnx.Tensor('float32', new Float32Array(inputData.flat()), inputData[0].length > 1 ? inputData.map(a => a.length) : [inputData.length]);
        
        const feeds = {};
        feeds[inputName] = inputTensor;
        
        const results = await modelInfo.session.run(feeds);
        const output = results[Object.keys(results)[0]];
        
        return Array.from(output.data);
    }

    /**
     * Preprocess image for model input
     */
    preprocessImage(imageElement, targetSize = [224, 224]) {
        if (!this.tf) {
            throw new Error('TensorFlow.js is required for image preprocessing');
        }

        return this.tf.browser.fromPixels(imageElement)
            .resizeNearestNeighbor(targetSize)
            .toFloat()
            .div(255.0)
            .expandDims();
    }

    /**
     * Run image classification
     */
    async classifyImage(imageElement, modelName, classNames = []) {
        try {
            const preprocessed = this.preprocessImage(imageElement);
            const predictions = await this.runTensorFlowInference(modelName, preprocessed);
            
            return predictions.map((score, index) => ({
                className: classNames[index] || `Class ${index}`,
                score,
                index
            }))
            .sort((a, b) => b.score - a.score);
        } catch (error) {
            console.error('Error classifying image:', error);
            throw error;
        }
    }

    /**
     * Run text classification
     */
    async classifyText(text, modelName, tokenizer = null) {
        // Simple tokenization if no tokenizer provided
        const tokens = tokenizer ? tokenizer(text) : this.simpleTokenize(text);
        const inputData = this.padSequence(tokens, 128); // Pad to fixed length

        try {
            return await this.runTensorFlowInference(modelName, [inputData]);
        } catch (error) {
            console.error('Error classifying text:', error);
            throw error;
        }
    }

    /**
     * Simple tokenization
     */
    simpleTokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0)
            .slice(0, 128);
    }

    /**
     * Pad sequence to fixed length
     */
    padSequence(sequence, maxLength, padValue = 0) {
        const padded = [...sequence];
        while (padded.length < maxLength) {
            padded.push(padValue);
        }
        return padded.slice(0, maxLength);
    }

    /**
     * Run sentiment analysis
     */
    async analyzeSentiment(text, modelName = 'sentiment') {
        const predictions = await this.classifyText(text, modelName);
        return {
            positive: predictions[0] || 0,
            negative: predictions[1] || 0,
            neutral: predictions[2] || 0,
            predicted: predictions[0] > 0.5 ? 'positive' : predictions[1] > 0.5 ? 'negative' : 'neutral'
        };
    }

    /**
     * Process elements with data attributes
     */
    async processElements() {
        if (!this.isInitialized) {
            return;
        }

        // Process images
        const images = document.querySelectorAll('[data-dl-classify-image]');
        images.forEach(async (img) => {
            if (img.complete && !img.hasAttribute('data-dl-processed')) {
                img.setAttribute('data-dl-processed', 'true');
                const modelName = img.getAttribute('data-dl-model') || 'image-classifier';
                await this.processImageElement(img, modelName);
            }
        });

        // Process text
        const textElements = document.querySelectorAll('[data-dl-classify-text]');
        textElements.forEach(async (element) => {
            if (!element.hasAttribute('data-dl-processed')) {
                element.setAttribute('data-dl-processed', 'true');
                const modelName = element.getAttribute('data-dl-model') || 'text-classifier';
                await this.processTextElement(element, modelName);
            }
        });
    }

    /**
     * Process image element
     */
    async processImageElement(img, modelName) {
        try {
            const results = await this.classifyImage(img, modelName);
            this.displayResults(img, results, 'image');
        } catch (error) {
            console.error('Error processing image:', error);
        }
    }

    /**
     * Process text element
     */
    async processTextElement(element, modelName) {
        try {
            const text = element.textContent || element.value;
            const results = await this.analyzeSentiment(text, modelName);
            this.displayResults(element, results, 'text');
        } catch (error) {
            console.error('Error processing text:', error);
        }
    }

    /**
     * Display model results
     */
    displayResults(element, results, type) {
        const container = element.parentElement;
        if (!container) {
            console.error('Element has no parent container');
            return;
        }
        let resultDiv = container.querySelector('.dl-results');

        if (!resultDiv) {
            resultDiv = document.createElement('div');
            resultDiv.className = 'dl-results';
            container.appendChild(resultDiv);
        }

        if (type === 'image') {
            resultDiv.innerHTML = `
                <div class="dl-predictions">
                    ${results.slice(0, 3).map(r => `
                        <div class="dl-prediction">
                            <span class="dl-class">${this.escapeHtml(r.className)}</span>
                            <span class="dl-score">${(r.score * 100).toFixed(1)}%</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (type === 'text') {
            resultDiv.innerHTML = `
                <div class="dl-sentiment">
                    <span class="sentiment-label ${results.predicted}">${results.predicted}</span>
                    <div class="sentiment-scores">
                        <span>Positive: ${(results.positive * 100).toFixed(1)}%</span>
                        <span>Negative: ${(results.negative * 100).toFixed(1)}%</span>
                        <span>Neutral: ${(results.neutral * 100).toFixed(1)}%</span>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Train a simple model (for demonstration)
     */
    async trainSimpleModel(trainingData, modelConfig = {}) {
        if (!this.tf) {
            throw new Error('TensorFlow.js is required for training');
        }

        const {
            epochs = 10,
            batchSize = 32,
            learningRate = 0.01
        } = modelConfig;

        // Create a simple sequential model
        const model = this.tf.sequential({
            layers: [
                this.tf.layers.dense({ inputShape: [trainingData.inputShape], units: 64, activation: 'relu' }),
                this.tf.layers.dense({ units: 32, activation: 'relu' }),
                this.tf.layers.dense({ units: trainingData.outputShape, activation: 'softmax' })
            ]
        });

        model.compile({
            optimizer: this.tf.train.adam(learningRate),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        const xs = this.tf.tensor2d(trainingData.x);
        const ys = this.tf.tensor2d(trainingData.y);

        await model.fit(xs, ys, {
            epochs,
            batchSize,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                }
            }
        });

        xs.dispose();
        ys.dispose();

        return model;
    }

    /**
     * Save model
     */
    async saveModel(modelName, saveUrl) {
        const modelInfo = this.models.get(modelName);
        if (!modelInfo || modelInfo.type !== 'tensorflow') {
            throw new Error(`Model ${modelName} not found or not a TensorFlow model`);
        }

        await modelInfo.model.save(saveUrl);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize
const deepLearningModelIntegration = new DeepLearningModelIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeepLearningModelIntegration;
}
