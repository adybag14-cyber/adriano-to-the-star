/**
 * Image Recognition and Tagging
 * Recognize and tag images
 */
(function() {
    'use strict';

    class ImageRecognitionTagging {
        constructor() {
            this.recognitions = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('image-recognition')) {
                const recognition = document.createElement('div');
                recognition.id = 'image-recognition';
                recognition.className = 'image-recognition';
                recognition.innerHTML = `
                    <div class="recognition-header">
                        <h2>Image Recognition</h2>
                        <input type="file" id="image-upload" accept="image/*" multiple />
                    </div>
                    <div class="recognitions-grid" id="recognitions-grid"></div>
                `;
                document.body.appendChild(recognition);
            }

            document.getElementById('image-upload')?.addEventListener('change', (e) => {
                Array.from(e.target.files).forEach(file => {
                    this.processImage(file);
                });
            });
        }

        async processImage(file) {
            const image = await this.loadImage(file);
            const tags = await this.recognizeImage(image);
            
            const recognition = {
                id: this.generateId(),
                image: file.name,
                tags: tags,
                confidence: tags.reduce((sum, t) => sum + t.confidence, 0) / tags.length,
                processedAt: new Date().toISOString()
            };
            this.recognitions.push(recognition);
            this.renderRecognitions();
            return recognition;
        }

        async loadImage(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => resolve(img);
                };
                reader.readAsDataURL(file);
            });
        }

        async recognizeImage(image) {
            // Image recognition (would use ML model or cloud service in production)
            // Simplified: return mock tags
            return [
                { label: 'object', confidence: 0.95 },
                { label: 'scene', confidence: 0.87 },
                { label: 'person', confidence: 0.72 }
            ];
        }

        renderRecognitions() {
            const grid = document.getElementById('recognitions-grid');
            if (!grid) return;

            grid.innerHTML = this.recognitions.map(rec => `
                <div class="recognition-item">
                    <div class="rec-image-name">${rec.image}</div>
                    <div class="rec-tags">
                        ${rec.tags.map(tag => `
                            <span class="tag" style="opacity: ${tag.confidence}">
                                ${tag.label} (${(tag.confidence * 100).toFixed(0)}%)
                            </span>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        generateId() {
            return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.imageRecognition = new ImageRecognitionTagging();
        });
    } else {
        window.imageRecognition = new ImageRecognitionTagging();
    }
})();

