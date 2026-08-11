/**
 * Text Classification
 * Classifies text into categories
 */

class TextClassification {
    constructor() {
        this.categories = {};
        this.init();
    }
    
    init() {
        this.loadCategories();
    }
    
    loadCategories() {
        // Define text categories
        this.categories = {
            question: ['what', 'how', 'why', 'when', 'where', 'who', '?'],
            request: ['please', 'can you', 'could you', 'would you'],
            complaint: ['problem', 'issue', 'error', 'broken', 'not working'],
            praise: ['great', 'excellent', 'amazing', 'love', 'fantastic'],
            technical: ['api', 'code', 'bug', 'feature', 'implementation']
        };
    }
    
    async classify(text, meta = {}) {
        if (!text || text.length === 0) {
            return { category: 'unknown', confidence: 0 };
        }
        
        const lowerText = text.toLowerCase();
        const scores = {};
        
        // Score each category
        Object.keys(this.categories).forEach(category => {
            let score = 0;
            this.categories[category].forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    score++;
                }
            });
            scores[category] = score;
        });
        
        // Find best match
        const bestCategory = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        const maxScore = scores[bestCategory];
        const totalKeywords = Object.values(this.categories[bestCategory]).length;
        const confidence = maxScore / (totalKeywords || 1);
        
        const result = {
            category: bestCategory,
            confidence: Math.min(1, confidence),
            scores
        };
        
        try {
            if (typeof window !== 'undefined' && typeof window.textClassificationGovernanceHook === 'function') {
                window.textClassificationGovernanceHook(result, meta || {});
            }
        } catch (e) {
        }
        
        return result;
    }
}

window.textClassificationGovernanceHook = window.textClassificationGovernanceHook || function(result, meta) {
    try {
        if (!result || !result.category) {
            return;
        }
        const category = result.category;
        const source = meta && meta.source ? meta.source : 'unknown';
        const sensitivity = (category === 'complaint' || category === 'technical') ? 'medium' : 'low';
        result.governance = {
            sensitivity,
            source
        };
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            window.performanceMonitoring.recordMetric('text_classification_category_' + category, 1, {
                source: source,
                sensitivity: sensitivity,
                confidence: result.confidence
            });
        }
        if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track('Text Classification Governance Event', {
                category: category,
                sensitivity: sensitivity,
                source: source,
                confidence: result.confidence
            });
        }
    } catch (e) {
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.textClassification = new TextClassification(); });
} else {
    window.textClassification = new TextClassification();
}

