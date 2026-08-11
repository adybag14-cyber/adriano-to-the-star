/**
 * Optical Character Recognition (OCR)
 * Extract text from images
 */
(function() {
    'use strict';

    class OpticalCharacterRecognition {
        constructor() {
            this.recognitions = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('ocr-system')) {
                const ocr = document.createElement('div');
                ocr.id = 'ocr-system';
                ocr.className = 'ocr-system';
                ocr.innerHTML = `
                    <div class="ocr-header">
                        <h2>OCR System</h2>
                        <input type="file" id="ocr-upload" accept="image/*" />
                    </div>
                    <div class="ocr-results" id="ocr-results"></div>
                `;
                document.body.appendChild(ocr);
            }

            document.getElementById('ocr-upload')?.addEventListener('change', (e) => {
                this.processImage(e.target.files[0]);
            });
        }

        async processImage(file) {
            const image = await this.loadImage(file);
            const text = await this.recognizeText(image);
            
            const result = {
                id: this.generateId(),
                image: file.name,
                text: text,
                confidence: 0.95,
                processedAt: new Date().toISOString()
            };
            this.recognitions.push(result);
            this.renderResults();
            return result;
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

        async recognizeText(image) {
            // OCR recognition (would use Tesseract.js or cloud service in production)
            if (window.Tesseract) {
                const { data: { text } } = await window.Tesseract.recognize(image);
                return text;
            }
            return 'OCR library not available. Install Tesseract.js for text recognition.';
        }

        renderResults() {
            const results = document.getElementById('ocr-results');
            if (!results) return;

            results.innerHTML = this.recognitions.map(rec => `
                <div class="ocr-result">
                    <div class="ocr-image">${rec.image}</div>
                    <div class="ocr-text">${rec.text}</div>
                    <div class="ocr-confidence">Confidence: ${(rec.confidence * 100).toFixed(1)}%</div>
                </div>
            `).join('');
        }

        generateId() {
            return 'ocr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ocr = new OpticalCharacterRecognition();
        });
    } else {
        window.ocr = new OpticalCharacterRecognition();
    }
})();

