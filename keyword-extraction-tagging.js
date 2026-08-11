/**
 * Keyword Extraction and Tagging System
 * Automatically extracts keywords from text content and generates relevant tags
 */

class KeywordExtractionSystem {
    constructor() {
        this.minKeywordLength = 3;
        this.maxKeywords = 10;
        this.stopWords = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
            'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if',
            'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her',
            'would', 'make', 'like', 'into', 'him', 'has', 'two', 'more', 'very',
            'after', 'words', 'long', 'than', 'first', 'been', 'call', 'who',
            'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get', 'come',
            'made', 'may', 'part'
        ]);
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Auto-extract keywords on content change
        document.addEventListener('input', (e) => {
            if (e.target.hasAttribute('data-keyword-extraction')) {
                this.extractKeywordsFromElement(e.target);
            }
        });

        // Manual keyword extraction trigger
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-extract-keywords]')) {
                const targetId = e.target.getAttribute('data-extract-keywords');
                const targetElement = document.getElementById(targetId) || 
                                    document.querySelector(`[data-keyword-extraction="${targetId}"]`);
                if (targetElement) {
                    this.extractKeywordsFromElement(targetElement);
                }
            }
        });
    }

    /**
     * Extract keywords from text content
     * @param {string} text - Text to extract keywords from
     * @param {Object} options - Extraction options
     * @returns {Array} Array of keyword objects with score
     */
    extractKeywords(text, options = {}) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const {
            minLength = this.minKeywordLength,
            maxKeywords = this.maxKeywords,
            useStemming = true,
            usePhrases = true,
            minScore = 0.1
        } = options;

        // Clean and normalize text
        const cleanedText = this.cleanText(text);
        
        // Extract single words
        const wordFrequencies = this.calculateWordFrequencies(cleanedText, minLength);
        
        // Extract phrases if enabled
        let phraseFrequencies = {};
        if (usePhrases) {
            phraseFrequencies = this.extractPhrases(cleanedText, minLength);
        }

        // Combine and score keywords
        const allKeywords = this.combineAndScore(wordFrequencies, phraseFrequencies, useStemming);
        
        // Filter by minimum score and sort
        return allKeywords
            .filter(kw => kw.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxKeywords);
    }

    /**
     * Clean text for keyword extraction
     */
    cleanText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Calculate word frequencies
     */
    calculateWordFrequencies(text, minLength) {
        const words = text.split(/\s+/);
        const frequencies = {};
        const totalWords = words.length;

        words.forEach(word => {
            if (word.length >= minLength && !this.stopWords.has(word)) {
                frequencies[word] = (frequencies[word] || 0) + 1;
            }
        });

        // Convert to scores (TF - Term Frequency)
        const scores = {};
        Object.keys(frequencies).forEach(word => {
            scores[word] = frequencies[word] / totalWords;
        });

        return scores;
    }

    /**
     * Extract phrases (bigrams and trigrams)
     */
    extractPhrases(text, minLength) {
        const words = text.split(/\s+/).filter(w => w.length >= minLength && !this.stopWords.has(w));
        const phrases = {};
        const totalPhrases = words.length - 1;

        // Extract bigrams
        for (let i = 0; i < words.length - 1; i++) {
            const phrase = `${words[i]} ${words[i + 1]}`;
            phrases[phrase] = (phrases[phrase] || 0) + 1;
        }

        // Extract trigrams
        for (let i = 0; i < words.length - 2; i++) {
            const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
            phrases[phrase] = (phrases[phrase] || 0) + 1;
        }

        // Convert to scores
        const scores = {};
        const total = Object.values(phrases).reduce((sum, count) => sum + count, 0);
        Object.keys(phrases).forEach(phrase => {
            scores[phrase] = phrases[phrase] / total;
        });

        return scores;
    }

    /**
     * Combine word and phrase frequencies and calculate final scores
     */
    combineAndScore(wordFreq, phraseFreq, useStemming) {
        const keywords = [];

        // Add words
        Object.keys(wordFreq).forEach(word => {
            let key = word;
            if (useStemming) {
                key = this.stemWord(word);
            }
            keywords.push({
                keyword: word,
                stemmed: key,
                score: wordFreq[word],
                type: 'word'
            });
        });

        // Add phrases (with higher weight)
        Object.keys(phraseFreq).forEach(phrase => {
            keywords.push({
                keyword: phrase,
                stemmed: phrase,
                score: phraseFreq[phrase] * 1.5, // Phrases get higher weight
                type: 'phrase'
            });
        });

        // Merge duplicates (same stemmed form)
        const merged = {};
        keywords.forEach(kw => {
            const key = kw.stemmed;
            if (!merged[key] || merged[key].score < kw.score) {
                merged[key] = kw;
            }
        });

        return Object.values(merged);
    }

    /**
     * Simple word stemming (Porter-like)
     */
    stemWord(word) {
        // Simple stemming - remove common suffixes
        if (word.length <= 3) return word;
        
        const suffixes = [
            ['ing', ''],
            ['ed', ''],
            ['ly', ''],
            ['er', ''],
            ['est', ''],
            ['tion', ''],
            ['sion', ''],
            ['ness', ''],
            ['ment', ''],
            ['able', ''],
            ['ible', ''],
            ['ful', ''],
            ['less', ''],
            ['s', '']
        ];

        for (const [suffix, replacement] of suffixes) {
            if (word.endsWith(suffix) && word.length > suffix.length + 2) {
                return word.slice(0, -suffix.length) + replacement;
            }
        }

        return word;
    }

    /**
     * Extract keywords from a DOM element
     */
    extractKeywordsFromElement(element) {
        const text = element.textContent || element.value || '';
        const options = {
            minLength: parseInt(element.getAttribute('data-keyword-min-length')) || this.minKeywordLength,
            maxKeywords: parseInt(element.getAttribute('data-keyword-max')) || this.maxKeywords,
            usePhrases: element.getAttribute('data-keyword-phrases') !== 'false'
        };

        const keywords = this.extractKeywords(text, options);
        this.displayKeywords(element, keywords);
        this.triggerKeywordEvent(element, keywords);
        
        return keywords;
    }

    /**
     * Display extracted keywords
     */
    displayKeywords(element, keywords) {
        const containerId = element.getAttribute('data-keyword-container') || 
                          element.id + '-keywords';
        let container = document.getElementById(containerId);

        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'keyword-container';
            container.setAttribute('role', 'region');
            container.setAttribute('aria-label', 'Extracted keywords');
            if (element.parentNode) {
                element.parentNode.insertBefore(container, element.nextSibling);
            } else {
                element.appendChild(container);
            }
        }

        container.innerHTML = '';
        
        if (keywords.length === 0) {
            container.innerHTML = '<p class="no-keywords">No keywords extracted</p>';
            return;
        }

        const keywordsList = document.createElement('div');
        keywordsList.className = 'keywords-list';
        keywordsList.setAttribute('role', 'list');

        keywords.forEach((kw, index) => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag';
            tag.setAttribute('role', 'listitem');
            tag.setAttribute('data-keyword', kw.keyword);
            tag.setAttribute('data-score', kw.score.toFixed(3));
            tag.textContent = kw.keyword;
            tag.title = `Score: ${kw.score.toFixed(3)}`;
            
            // Add click handler for tag selection
            tag.addEventListener('click', () => {
                this.selectKeyword(kw.keyword);
            });

            keywordsList.appendChild(tag);
        });

        container.appendChild(keywordsList);
    }

    /**
     * Trigger custom event for keyword extraction
     */
    triggerKeywordEvent(element, keywords) {
        const event = new CustomEvent('keywordsExtracted', {
            detail: {
                element,
                keywords,
                timestamp: Date.now()
            },
            bubbles: true
        });
        element.dispatchEvent(event);
    }

    /**
     * Select a keyword (for filtering/search)
     */
    selectKeyword(keyword) {
        const event = new CustomEvent('keywordSelected', {
            detail: { keyword },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Generate tags from keywords
     */
    generateTags(keywords, maxTags = 5) {
        return keywords
            .slice(0, maxTags)
            .map(kw => ({
                name: kw.keyword,
                score: kw.score,
                type: kw.type
            }));
    }

    /**
     * Batch extract keywords from multiple elements
     */
    batchExtract(selectors) {
        const elements = document.querySelectorAll(selectors);
        const results = [];

        elements.forEach(element => {
            const keywords = this.extractKeywordsFromElement(element);
            results.push({
                element,
                keywords
            });
        });

        return results;
    }
}

// Auto-initialize
const keywordExtractionSystem = new KeywordExtractionSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeywordExtractionSystem;
}
