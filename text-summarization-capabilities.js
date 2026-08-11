/**
 * Text Summarization Capabilities
 * Summarize text documents
 */
(function() {
    'use strict';

    class TextSummarizationCapabilities {
        constructor() {
            this.summaries = [];
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('text-summarization')) {
                const summarization = document.createElement('div');
                summarization.id = 'text-summarization';
                summarization.className = 'text-summarization';
                summarization.innerHTML = `
                    <div class="summarization-header">
                        <h2>Text Summarization</h2>
                        <textarea id="text-to-summarize" placeholder="Enter text to summarize..."></textarea>
                        <input type="number" id="summary-length" value="3" min="1" max="10" />
                        <button id="summarize-btn">Summarize</button>
                    </div>
                    <div class="summaries-list" id="summaries-list"></div>
                `;
                document.body.appendChild(summarization);
            }

            document.getElementById('summarize-btn')?.addEventListener('click', () => {
                this.summarize();
            });
        }

        summarize() {
            const text = document.getElementById('text-to-summarize').value;
            const numSentences = parseInt(document.getElementById('summary-length').value) || 3;
            
            if (!text.trim()) return;

            const summary = this.extractSummary(text, numSentences);
            const result = {
                id: this.generateId(),
                original: text,
                summary: summary,
                compressionRatio: summary.length / text.length,
                createdAt: new Date().toISOString()
            };
            this.summaries.push(result);
            this.renderSummaries();
        }

        extractSummary(text, numSentences) {
            // Extractive summarization (simplified)
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const scoredSentences = sentences.map((sentence, index) => ({
                sentence: sentence.trim(),
                score: this.scoreSentence(sentence, text),
                index: index
            }));

            const topSentences = scoredSentences
                .sort((a, b) => b.score - a.score)
                .slice(0, numSentences)
                .sort((a, b) => a.index - b.index)
                .map(s => s.sentence);

            return topSentences.join('. ') + '.';
        }

        scoreSentence(sentence, fullText) {
            // Score sentence based on word frequency and position
            const words = sentence.toLowerCase().split(/\s+/);
            const wordFreq = {};
            fullText.toLowerCase().split(/\s+/).forEach(word => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            });

            return words.reduce((sum, word) => {
                return sum + (wordFreq[word] || 0);
            }, 0) / words.length;
        }

        renderSummaries() {
            const list = document.getElementById('summaries-list');
            if (!list) return;

            list.innerHTML = this.summaries.slice(-5).map(summary => `
                <div class="summary-item">
                    <div class="summary-text">${summary.summary}</div>
                    <div class="summary-stats">
                        Compression: ${(summary.compressionRatio * 100).toFixed(1)}%
                    </div>
                </div>
            `).join('');
        }

        generateId() {
            return 'summary_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.textSummarization = new TextSummarizationCapabilities();
        });
    } else {
        window.textSummarization = new TextSummarizationCapabilities();
    }
})();

