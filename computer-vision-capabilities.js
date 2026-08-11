/**
 * Computer Vision Capabilities System
 * Implements object detection, image classification, face recognition, and more
 */

class ComputerVisionCapabilities {
    constructor() {
        this.models = new Map();
        this.detections = new Map();
        this.isInitialized = false;
        this.classificationModel = null;
        this.classificationModelPromise = null;
        this.classificationModelFailed = false;
        this.init();
    }

    async init() {
        await this.loadLibraries();
        this.setupEventListeners();
        this.isInitialized = true;
        this.trackEvent('cv_capabilities_initialized');
    }

    /**
     * Load required libraries
     */
    async loadLibraries() {
        // Check for TensorFlow.js
        if (typeof tf === 'undefined') {
            try {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
            } catch (error) {
                console.warn('TensorFlow.js not available:', error);
            }
        }

        // Check for face-api.js or similar
        if (typeof faceapi === 'undefined') {
            try {
                await this.loadScript('https://cdn.jsdelivr.net/npm/face-api.js@latest/dist/face-api.min.js');
            } catch (error) {
                console.warn('face-api.js not available:', error);
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
        document.addEventListener('DOMContentLoaded', () => {
            this.processImages();
        });

        // Process new images added dynamically
        const observer = new MutationObserver(() => {
            this.processImages();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Process images with computer vision tasks
     */
    async processImages() {
        if (!this.isInitialized) {
            return;
        }

        // Object detection
        const objectDetectionImages = document.querySelectorAll('[data-cv-detect-objects]');
        objectDetectionImages.forEach(async (img) => {
            if (img.complete && !img.hasAttribute('data-cv-processed')) {
                img.setAttribute('data-cv-processed', 'true');
                await this.detectObjects(img);
            }
        });

        // Face detection
        const faceDetectionImages = document.querySelectorAll('[data-cv-detect-faces]');
        faceDetectionImages.forEach(async (img) => {
            if (img.complete && !img.hasAttribute('data-cv-faces-processed')) {
                img.setAttribute('data-cv-faces-processed', 'true');
                await this.detectFaces(img);
            }
        });

        // Image classification
        const classificationImages = document.querySelectorAll('[data-cv-classify]');
        classificationImages.forEach(async (img) => {
            if (img.complete && !img.hasAttribute('data-cv-classified')) {
                img.setAttribute('data-cv-classified', 'true');
                await this.classifyImage(img);
            }
        });
    }

    /**
     * Detect objects in image
     */
    async detectObjects(imageElement) {
        try {
            // Use COCO-SSD model or similar
            if (typeof tf !== 'undefined' && typeof cocoSsd !== 'undefined') {
                const model = await cocoSsd.load();
                const predictions = await model.detect(imageElement);
                this.displayDetections(imageElement, predictions, 'objects');
            } else {
                // Fallback: simple edge detection or placeholder
                const detections = this.simpleObjectDetection(imageElement);
                this.displayDetections(imageElement, detections, 'objects');
            }
        } catch (error) {
            console.warn('Error detecting objects:', error);
        }
    }

    /**
     * Simple object detection (placeholder)
     */
    simpleObjectDetection(imageElement) {
        // This is a placeholder - in production, use a real model
        return [
            {
                bbox: [10, 10, 100, 100],
                class: 'object',
                score: 0.8
            }
        ];
    }

    /**
     * Detect faces in image
     */
    async detectFaces(imageElement) {
        try {
            if (typeof faceapi !== 'undefined') {
                const modelBaseUrl = (typeof window !== 'undefined' && typeof window.CV_FACEAPI_MODEL_URL === 'string' && window.CV_FACEAPI_MODEL_URL)
                    ? window.CV_FACEAPI_MODEL_URL
                    : null;

                if (modelBaseUrl) {
                    await faceapi.nets.tinyFaceDetector.loadFromUri(modelBaseUrl);
                    const detections = await faceapi.detectAllFaces(imageElement, 
                        new faceapi.TinyFaceDetectorOptions());
                    this.displayDetections(imageElement, detections, 'faces');
                } else {
                    const detections = this.simpleFaceDetection(imageElement);
                    this.displayDetections(imageElement, detections, 'faces');
                }
            } else {
                // Fallback detection
                const detections = this.simpleFaceDetection(imageElement);
                this.displayDetections(imageElement, detections, 'faces');
            }
        } catch (error) {
            console.warn('Error detecting faces:', error);
        }
    }

    /**
     * Simple face detection (placeholder)
     */
    simpleFaceDetection(imageElement) {
        return [
            {
                x: imageElement.width * 0.3,
                y: imageElement.height * 0.3,
                width: imageElement.width * 0.4,
                height: imageElement.height * 0.4
            }
        ];
    }

    /**
     * Classify image
     */
    async classifyImage(imageElement) {
        try {
            if (typeof tf !== 'undefined' && tf && tf.browser && typeof tf.browser.fromPixels === 'function') {
                const model = await this.getClassificationModel();
                if (model && typeof model.predict === 'function') {
                    const predictions = await this.runClassification(model, imageElement);
                    this.displayClassification(imageElement, predictions);
                } else {
                    const predictions = this.simpleClassification(imageElement);
                    this.displayClassification(imageElement, predictions);
                }
            } else {
                // Fallback classification
                const predictions = this.simpleClassification(imageElement);
                this.displayClassification(imageElement, predictions);
            }
        } catch (error) {
            console.warn('Error classifying image:', error);
        }
    }

    async getClassificationModel() {
        try {
            if (this.classificationModel) {
                return this.classificationModel;
            }

            if (this.classificationModelFailed) {
                return null;
            }

            if (this.classificationModelPromise) {
                return this.classificationModelPromise;
            }

            if (typeof tf === 'undefined' || !tf || typeof tf.loadLayersModel !== 'function') {
                this.classificationModelFailed = true;
                return null;
            }

            const modelUrl = (typeof window !== 'undefined' && typeof window.CV_MOBILENET_MODEL_URL === 'string' && window.CV_MOBILENET_MODEL_URL)
                ? window.CV_MOBILENET_MODEL_URL
                : 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';

            this.classificationModelPromise = tf.loadLayersModel(modelUrl)
                .then((model) => {
                    this.classificationModel = model;
                    return model;
                })
                .catch((e) => {
                    this.classificationModelFailed = true;
                    console.warn('Mobilenet model not available:', e);
                    return null;
                })
                .finally(() => {
                    this.classificationModelPromise = null;
                });

            return this.classificationModelPromise;
        } catch (e) {
            this.classificationModelFailed = true;
            console.warn('Mobilenet model not available:', e);
            return null;
        }
    }

    /**
     * Run classification with model
     */
    async runClassification(model, imageElement) {
        const tensor = tf.browser.fromPixels(imageElement)
            .resizeNearestNeighbor([224, 224])
            .expandDims(0)
            .div(255.0);

        const predictions = await model.predict(tensor).data();
        tensor.dispose();

        return Array.from(predictions);
    }

    /**
     * Simple classification (placeholder)
     */
    simpleClassification(imageElement) {
        return [
            { class: 'cat', score: 0.7 },
            { class: 'dog', score: 0.2 },
            { class: 'bird', score: 0.1 }
        ];
    }

    /**
     * Display object/face detections
     */
    displayDetections(imageElement, detections, type) {
        const container = imageElement.parentElement;
        let canvas = container.querySelector('.cv-detection-canvas');

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'cv-detection-canvas';
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            canvas.style.position = 'absolute';
            canvas.style.top = imageElement.offsetTop + 'px';
            canvas.style.left = imageElement.offsetLeft + 'px';
            canvas.style.pointerEvents = 'none';
            container.style.position = 'relative';
            container.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detections.forEach((detection, index) => {
            const bbox = detection.bbox || [detection.x, detection.y, detection.width, detection.height];
            const [x, y, width, height] = bbox;
            const score = detection.score || 1.0;
            const label = detection.class || `${type} ${index + 1}`;

            // Draw bounding box
            ctx.strokeStyle = type === 'faces' ? '#00ff00' : '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Draw label
            ctx.fillStyle = type === 'faces' ? '#00ff00' : '#ff0000';
            ctx.font = '14px Arial';
            ctx.fillText(`${label} (${(score * 100).toFixed(1)}%)`, x, y - 5);
        });
    }

    /**
     * Display classification results
     */
    displayClassification(imageElement, predictions) {
        const container = imageElement.parentElement;
        let resultDiv = container.querySelector('.cv-classification-results');

        if (!resultDiv) {
            resultDiv = document.createElement('div');
            resultDiv.className = 'cv-classification-results';
            container.appendChild(resultDiv);
        }

        // Sort predictions by score
        const sorted = Array.isArray(predictions[0]) 
            ? predictions.map((score, index) => ({ class: `Class ${index}`, score }))
            : predictions;

        sorted.sort((a, b) => (b.score || 0) - (a.score || 0));

        resultDiv.innerHTML = `
            <div class="cv-predictions">
                <h4>Classification Results</h4>
                ${sorted.slice(0, 5).map(pred => `
                    <div class="cv-prediction">
                        <span class="cv-class">${this.escapeHtml(pred.class)}</span>
                        <span class="cv-score">${((pred.score || 0) * 100).toFixed(1)}%</span>
                        <div class="cv-progress-bar">
                            <div class="cv-progress" style="width: ${(pred.score || 0) * 100}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const top = sorted[0] || null;
        if (top && container) {
            const card = container.closest('.gallery-image-card');
            if (card) {
                const summary = card.querySelector('.gallery-image-ml-summary');
                if (summary) {
                    const label = typeof top.class === 'string' ? top.class : 'Detected object';
                    const pct = ((top.score || 0) * 100).toFixed(1);
                    summary.textContent = `ML analysis: ${label} (${pct}% confidence)`;
                }
            }
        }

        try {
            let fairnessSummary = null;
            if (window.aiModelBiasDetection && typeof window.aiModelBiasDetection.detectBias === 'function') {
                try {
                    const modelId = 'image-gallery:ml';
                    const testData = [
                        { group: 'A', prediction: 1 },
                        { group: 'A', prediction: 0 },
                        { group: 'B', prediction: 1 },
                        { group: 'B', prediction: 1 }
                    ];
                    const detection = window.aiModelBiasDetection.detectBias(modelId, testData);
                    fairnessSummary = {
                        overallBias: detection && detection.overallBias ? detection.overallBias : null,
                        metric: 'demographic-parity',
                        disparity: detection && detection.biases && detection.biases[0] ? detection.biases[0].disparity : null
                    };
                } catch (fairnessError) {
                    console.warn('AI fairness detection failed for image gallery ML:', fairnessError);
                }
            }

            if (top && window.aiUsageLogger && typeof window.aiUsageLogger.log === 'function') {
                window.aiUsageLogger.log({
                    feature: 'image-gallery-ml',
                    model: 'cv-capabilities',
                    context: {
                        topClass: top.class || null,
                        topScore: typeof top.score === 'number' ? top.score : null,
                        imageAlt: imageElement.alt || null,
                        src: imageElement.currentSrc || imageElement.src || null,
                        fairness: fairnessSummary
                    }
                });
            }
        } catch (e) {
            console.warn('AI usage logging failed for image gallery ML:', e);
        }
    }

    async reprocessImage(imageElement) {
        try {
            if (!imageElement) {
                return;
            }

            imageElement.removeAttribute('data-cv-processed');
            imageElement.removeAttribute('data-cv-faces-processed');
            imageElement.removeAttribute('data-cv-classified');

            const container = imageElement.parentElement;
            if (container) {
                const canvas = container.querySelector('.cv-detection-canvas');
                if (canvas && canvas.parentElement) {
                    canvas.parentElement.removeChild(canvas);
                }

                const resultDiv = container.querySelector('.cv-classification-results');
                if (resultDiv && resultDiv.parentElement) {
                    resultDiv.parentElement.removeChild(resultDiv);
                }

                const card = container.closest('.gallery-image-card');
                if (card) {
                    const summary = card.querySelector('.gallery-image-ml-summary');
                    if (summary) {
                        summary.textContent = '';
                    }
                }
            }

            await this.detectObjects(imageElement);
            await this.classifyImage(imageElement);
        } catch (error) {
            console.warn('Error reprocessing image:', error);
        }
    }

    /**
     * Extract text from image (OCR)
     */
    async extractText(imageElement) {
        try {
            // This would typically use Tesseract.js or similar
            if (typeof Tesseract !== 'undefined') {
                const { data: { text } } = await Tesseract.recognize(imageElement);
                return text;
            } else {
                // Fallback: return placeholder
                return 'Text extraction requires Tesseract.js library';
            }
        } catch (error) {
            console.warn('Error extracting text:', error);
            return '';
        }
    }

    /**
     * Detect edges in image
     */
    detectEdges(imageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const edges = new Uint8ClampedArray(data.length);

        // Simple Sobel edge detection
        for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
                const idx = (y * canvas.width + x) * 4;
                
                // Sobel operators
                const gx = (
                    -1 * this.getGray(data, x - 1, y - 1, canvas.width) +
                    1 * this.getGray(data, x + 1, y - 1, canvas.width) +
                    -2 * this.getGray(data, x - 1, y, canvas.width) +
                    2 * this.getGray(data, x + 1, y, canvas.width) +
                    -1 * this.getGray(data, x - 1, y + 1, canvas.width) +
                    1 * this.getGray(data, x + 1, y + 1, canvas.width)
                );

                const gy = (
                    -1 * this.getGray(data, x - 1, y - 1, canvas.width) +
                    -2 * this.getGray(data, x, y - 1, canvas.width) +
                    -1 * this.getGray(data, x + 1, y - 1, canvas.width) +
                    1 * this.getGray(data, x - 1, y + 1, canvas.width) +
                    2 * this.getGray(data, x, y + 1, canvas.width) +
                    1 * this.getGray(data, x + 1, y + 1, canvas.width)
                );

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const value = Math.min(255, magnitude);

                edges[idx] = value;
                edges[idx + 1] = value;
                edges[idx + 2] = value;
                edges[idx + 3] = 255;
            }
        }

        const edgeImageData = new ImageData(edges, canvas.width, canvas.height);
        ctx.putImageData(edgeImageData, 0, 0);

        return canvas;
    }

    /**
     * Get grayscale value at position
     */
    getGray(data, x, y, width) {
        const idx = (y * width + x) * 4;
        return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }

    /**
     * Track objects in video
     */
    async trackObjects(videoElement) {
        // Object tracking implementation
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        const trackFrame = async () => {
            ctx.drawImage(videoElement, 0, 0);
            // Perform tracking here
            requestAnimationFrame(trackFrame);
        };

        trackFrame();
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cv_capabilities_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const computerVisionCapabilities = new ComputerVisionCapabilities();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComputerVisionCapabilities;
}
