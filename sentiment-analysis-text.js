/**
 * Sentiment Analysis for Text Data
 * Analyze sentiment of text
 */
(function() {
    'use strict';

    class SentimentAnalysisText {
        constructor() {
            this.analyses = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('sentiment-analysis')) {
                const analysis = document.createElement('div');
                analysis.id = 'sentiment-analysis';
                analysis.className = 'sentiment-analysis';
                analysis.innerHTML = `
                    <div class="analysis-header">
                        <h2>Sentiment Analysis</h2>
                        <textarea id="sentiment-text" placeholder="Enter text to analyze..."></textarea>
                        <button id="analyze-sentiment">Analyze</button>
                    </div>
                    <div class="sentiment-results" id="sentiment-results"></div>
                `;
                document.body.appendChild(analysis);
            }

            document.getElementById('analyze-sentiment')?.addEventListener('click', () => {
                this.analyze();
            });
        }

        analyze() {
            const text = document.getElementById('sentiment-text').value;
            if (!text.trim()) return;

            const sentiment = this.calculateSentiment(text);
            const analysis = {
                id: this.generateId(),
                text: text,
                sentiment: sentiment,
                analyzedAt: new Date().toISOString()
            };
            this.analyses.push(analysis);
            this.renderResults();
        }

        calculateSentiment(text) {
            const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'happy', 'pleased'];
            const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'disappointed', 'frustrated'];
            
            const lowerText = text.toLowerCase();
            let positiveScore = 0;
            let negativeScore = 0;

            positiveWords.forEach(word => {
                const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
                positiveScore += matches;
            });

            negativeWords.forEach(word => {
                const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
                negativeScore += matches;
            });

            const totalScore = positiveScore - negativeScore;
            let sentiment = 'neutral';
            let score = 0;

            if (totalScore > 0) {
                sentiment = 'positive';
                score = Math.min(totalScore / 10, 1);
            } else if (totalScore < 0) {
                sentiment = 'negative';
                score = Math.max(totalScore / 10, -1);
            }

            return {
                label: sentiment,
                score: score,
                confidence: Math.abs(score)
            };
        }

        renderResults() {
            const results = document.getElementById('sentiment-results');
            if (!results) return;

            results.innerHTML = this.analyses.slice(-5).map(analysis => `
                <div class="sentiment-item ${analysis.sentiment.label}">
                    <div class="sentiment-text-preview">${analysis.text.substring(0, 100)}...</div>
                    <div class="sentiment-label">${analysis.sentiment.label}</div>
                    <div class="sentiment-score">Score: ${analysis.sentiment.score.toFixed(2)}</div>
                </div>
            `).join('');
        }

        generateId() {
            return 'sentiment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.sentimentAnalysis = new SentimentAnalysisText();
        });
    } else {
        window.sentimentAnalysis = new SentimentAnalysisText();
    }
})();

