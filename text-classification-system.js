/**
 * Text Classification System
 * Classify text into categories
 */
(function() {
    'use strict';

    class TextClassificationSystem {
        constructor() {
            this.classifier = null;
            this.categories = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.setupClassifier();
        }

        setupUI() {
            if (!document.getElementById('text-classification')) {
                const classification = document.createElement('div');
                classification.id = 'text-classification';
                classification.className = 'text-classification';
                classification.innerHTML = `
                    <div class="classification-header">
                        <h2>Text Classification</h2>
                        <textarea id="text-to-classify" placeholder="Enter text to classify..."></textarea>
                        <button id="classify-btn">Classify</button>
                    </div>
                    <div class="classification-results" id="classification-results"></div>
                `;
                document.body.appendChild(classification);
            }

            document.getElementById('classify-btn')?.addEventListener('click', () => {
                this.classify();
            });
        }

        setupClassifier() {
            this.categories = [
                { name: 'positive', keywords: ['good', 'great', 'excellent', 'amazing'] },
                { name: 'negative', keywords: ['bad', 'terrible', 'awful', 'hate'] },
                { name: 'question', keywords: ['what', 'how', 'why', 'when', 'where', '?'] },
                { name: 'request', keywords: ['please', 'can you', 'could you', 'would you'] }
            ];
        }

        classify() {
            const text = document.getElementById('text-to-classify').value;
            if (!text.trim()) return;

            const classification = this.classifyText(text);
            this.renderResult(text, classification);
        }

        classifyText(text) {
            const lowerText = text.toLowerCase();
            const scores = {};

            this.categories.forEach(category => {
                let score = 0;
                category.keywords.forEach(keyword => {
                    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
                    score += matches;
                });
                scores[category.name] = score;
            });

            const maxScore = Math.max(...Object.values(scores));
            const topCategory = Object.keys(scores).find(key => scores[key] === maxScore);

            return {
                category: topCategory || 'unknown',
                confidence: maxScore > 0 ? Math.min(maxScore / 5, 1) : 0,
                scores: scores
            };
        }

        renderResult(text, classification) {
            const results = document.getElementById('classification-results');
            if (!results) return;

            const resultEl = document.createElement('div');
            resultEl.className = 'classification-result';
            resultEl.innerHTML = `
                <div class="result-text">${text.substring(0, 100)}...</div>
                <div class="result-category">Category: ${classification.category}</div>
                <div class="result-confidence">Confidence: ${(classification.confidence * 100).toFixed(1)}%</div>
                <div class="result-scores">
                    ${Object.entries(classification.scores).map(([cat, score]) => `
                        <span class="score-item">${cat}: ${score}</span>
                    `).join('')}
                </div>
            `;
            results.insertBefore(resultEl, results.firstChild);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.textClassification = new TextClassificationSystem();
        });
    } else {
        window.textClassification = new TextClassificationSystem();
    }
})();

