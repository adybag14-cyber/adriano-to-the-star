/**
 * Text Mining
 * Text mining and information extraction from unstructured text
 */

class TextMining {
    constructor() {
        this.corpora = new Map();
        this.extractions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_ex_tm_in_in_g_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_ex_tm_in_in_g_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addCorpus(corpusId, texts) {
        const corpus = {
            id: corpusId,
            texts: Array.isArray(texts) ? texts : [],
            size: Array.isArray(texts) ? texts.length : 0,
            createdAt: new Date()
        };
        
        this.corpora.set(corpusId, corpus);
        console.log(`Corpus added: ${corpusId}`);
        return corpus;
    }

    extractKeywords(corpusId, nKeywords = 10) {
        const corpus = this.corpora.get(corpusId);
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        
        const wordFrequencies = new Map();
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        
        corpus.texts.forEach(text => {
            const words = this.tokenize(text);
            words.forEach(word => {
                if (!stopWords.has(word) && word.length > 2) {
                    wordFrequencies.set(word, (wordFrequencies.get(word) || 0) + 1);
                }
            });
        });
        
        const keywords = Array.from(wordFrequencies.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, nKeywords)
            .map(([word, frequency]) => ({ word, frequency }));
        
        const extractionId = `extraction_${Date.now()}`;
        this.extractions.set(extractionId, {
            id: extractionId,
            corpusId,
            type: 'keywords',
            keywords,
            createdAt: new Date()
        });
        
        return keywords;
    }

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    extractEntities(corpusId) {
        const corpus = this.corpora.get(corpusId);
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        
        const entities = {
            persons: new Set(),
            organizations: new Set(),
            locations: new Set(),
            dates: new Set(),
            money: new Set()
        };
        
        corpus.texts.forEach(text => {
            const words = this.tokenize(text);
            const sentences = text.split(/[.!?]+/);
            
            sentences.forEach(sentence => {
                const words = sentence.split(/\s+/);
                words.forEach((word, index) => {
                    if (word[0] === word[0].toUpperCase() && word.length > 2) {
                        if (index === 0 || words[index - 1].match(/[.!?]$/)) {
                            entities.persons.add(word);
                        }
                    }
                });
                
                const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}/g;
                const dates = sentence.match(datePattern);
                if (dates) {
                    dates.forEach(date => entities.dates.add(date));
                }
                
                const moneyPattern = /\$[\d,]+(\.\d{2})?/g;
                const money = sentence.match(moneyPattern);
                if (money) {
                    money.forEach(m => entities.money.add(m));
                }
            });
        });
        
        const extractionId = `extraction_${Date.now()}`;
        this.extractions.set(extractionId, {
            id: extractionId,
            corpusId,
            type: 'entities',
            entities: {
                persons: Array.from(entities.persons),
                organizations: Array.from(entities.organizations),
                locations: Array.from(entities.locations),
                dates: Array.from(entities.dates),
                money: Array.from(entities.money)
            },
            createdAt: new Date()
        });
        
        return this.extractions.get(extractionId);
    }

    extractPhrases(corpusId, minFrequency = 2) {
        const corpus = this.corpora.get(corpusId);
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        
        const phraseFrequencies = new Map();
        
        corpus.texts.forEach(text => {
            const words = this.tokenize(text);
            for (let i = 0; i < words.length - 1; i++) {
                const bigram = `${words[i]} ${words[i + 1]}`;
                phraseFrequencies.set(bigram, (phraseFrequencies.get(bigram) || 0) + 1);
            }
            
            for (let i = 0; i < words.length - 2; i++) {
                const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
                phraseFrequencies.set(trigram, (phraseFrequencies.get(trigram) || 0) + 1);
            }
        });
        
        const phrases = Array.from(phraseFrequencies.entries())
            .filter(([phrase, freq]) => freq >= minFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(([phrase, frequency]) => ({ phrase, frequency }));
        
        const extractionId = `extraction_${Date.now()}`;
        this.extractions.set(extractionId, {
            id: extractionId,
            corpusId,
            type: 'phrases',
            phrases,
            createdAt: new Date()
        });
        
        return phrases;
    }

    calculateTermFrequency(corpusId) {
        const corpus = this.corpora.get(corpusId);
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        
        const termFrequencies = [];
        
        corpus.texts.forEach((text, docIndex) => {
            const words = this.tokenize(text);
            const tf = new Map();
            
            words.forEach(word => {
                tf.set(word, (tf.get(word) || 0) + 1);
            });
            
            termFrequencies.push({
                documentIndex: docIndex,
                frequencies: Object.fromEntries(tf)
            });
        });
        
        return termFrequencies;
    }

    getExtraction(extractionId) {
        return this.extractions.get(extractionId);
    }

    getCorpus(corpusId) {
        return this.corpora.get(corpusId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.textMining = new TextMining();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextMining;
}

