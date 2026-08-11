/**
 * NLP Analytics
 * Natural Language Processing analytics and insights
 */

class NLPAnalytics {
    constructor() {
        this.corpora = new Map();
        this.models = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('n_lp_an_al_yt_ic_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_lp_an_al_yt_ic_s_" + eventName, 1, data);
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

    analyzeSentiment(corpusId) {
        const corpus = this.corpora.get(corpusId);
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        
        const sentiments = corpus.texts.map(text => this.performSentimentAnalysis(text));
        
        const positive = sentiments.filter(s => s.sentiment === 'positive').length;
        const negative = sentiments.filter(s => s.sentiment === 'negative').length;
        const neutral = sentiments.filter(s => s.sentiment === 'neutral').length;
        
        const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
        
        const analysisId = `analysis_${Date.now()}`;
        this.analyses.set(analysisId, {
            id: analysisId,
            corpusId,
            type: 'sentiment',
            positive,
            negative,
            neutral,
            avgScore,
            sentiments,
            createdAt: new Date()
        });
        
        return this.analyses.get(analysisId);
    }

    performSentimentAnalysis(text) {
        const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'worst', 'horrible', 'disgusting'];
        
        const lowerText = text.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;
        
        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positiveCount++;
        });
        
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negativeCount++;
        });
        
        let score = 0.5;
        if (positiveCount > negativeCount) {
            score = 0.5 + (positiveCount / 20);
        } else if (negativeCount > positiveCount) {
            score = 0.5 - (negativeCount / 20);
        }
        
        let sentiment = 'neutral';
        if (score > 0.6) {
            sentiment = 'positive';
        } else if (score < 0.4) {
            sentiment = 'negative';
        }
        
        return { sentiment, score };
    }

    extractTopics(corpusId, nTopics = 5) {
        const corpus = this.corpora.get(corpusId);
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        
        const wordFrequencies = new Map();
        corpus.texts.forEach(text => {
            const words = this.tokenize(text);
            words.forEach(word => {
                wordFrequencies.set(word, (wordFrequencies.get(word) || 0) + 1);
            });
        });
        
        const sortedWords = Array.from(wordFrequencies.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, nTopics * 10);
        
        const topics = [];
        for (let i = 0; i < nTopics; i++) {
            const startIdx = i * 10;
            const endIdx = Math.min(startIdx + 10, sortedWords.length);
            topics.push({
                id: i,
                words: sortedWords.slice(startIdx, endIdx).map(([word, freq]) => ({ word, frequency: freq }))
            });
        }
        
        const analysisId = `analysis_${Date.now()}`;
        this.analyses.set(analysisId, {
            id: analysisId,
            corpusId,
            type: 'topic_extraction',
            topics,
            nTopics,
            createdAt: new Date()
        });
        
        return this.analyses.get(analysisId);
    }

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    calculateTFIDF(corpusId) {
        const corpus = this.corpora.get(corpusId);
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        
        const documentFrequencies = new Map();
        const termFrequencies = [];
        
        corpus.texts.forEach((text, docIndex) => {
            const words = this.tokenize(text);
            const tf = new Map();
            
            words.forEach(word => {
                tf.set(word, (tf.get(word) || 0) + 1);
                documentFrequencies.set(word, (documentFrequencies.get(word) || 0) + 1);
            });
            
            termFrequencies.push(tf);
        });
        
        const nDocs = corpus.texts.length;
        return termFrequencies.map(tf => {
            const tfidfVector = new Map();
            tf.forEach((freq, word) => {
                const idf = Math.log(nDocs / documentFrequencies.get(word));
                tfidfVector.set(word, freq * idf);
            });
            return tfidfVector;
        });
    }

    analyzeNamedEntities(corpusId) {
        const corpus = this.corpora.get(corpusId);
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        
        const entities = {
            persons: new Set(),
            organizations: new Set(),
            locations: new Set()
        };
        
        corpus.texts.forEach(text => {
            const words = this.tokenize(text);
            words.forEach(word => {
                if (word[0] === word[0].toUpperCase() && word.length > 3) {
                    entities.persons.add(word);
                }
            });
        });
        
        const analysisId = `analysis_${Date.now()}`;
        this.analyses.set(analysisId, {
            id: analysisId,
            corpusId,
            type: 'named_entities',
            entities: {
                persons: Array.from(entities.persons),
                organizations: Array.from(entities.organizations),
                locations: Array.from(entities.locations)
            },
            createdAt: new Date()
        });
        
        return this.analyses.get(analysisId);
    }

    getAnalysis(analysisId) {
        return this.analyses.get(analysisId);
    }

    getCorpus(corpusId) {
        return this.corpora.get(corpusId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.nlpAnalytics = new NLPAnalytics();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NLPAnalytics;
}

