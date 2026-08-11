/**
 * Language Detection
 * Detects language of text
 */

class LanguageDetection {
    constructor() {
        this.languages = {};
        this.init();
    }
    
    init() {
        this.loadLanguagePatterns();
    }
    
    loadLanguagePatterns() {
        // Language detection patterns (simplified)
        this.languages = {
            english: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'],
            spanish: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se'],
            french: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
            german: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich']
        };
    }
    
    async detect(text) {
        if (!text || text.length === 0) {
            return { language: 'unknown', confidence: 0 };
        }
        
        const lowerText = text.toLowerCase();
        const scores = {};
        
        // Score each language
        Object.keys(this.languages).forEach(lang => {
            let score = 0;
            this.languages[lang].forEach(word => {
                if (lowerText.includes(word)) {
                    score++;
                }
            });
            scores[lang] = score;
        });
        
        // Find best match
        const bestLanguage = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );
        
        const maxScore = scores[bestLanguage];
        const totalWords = text.split(/\s+/).length;
        const confidence = Math.min(1, maxScore / Math.max(1, totalWords / 10));
        
        return {
            language: bestLanguage,
            confidence,
            scores
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.languageDetection = new LanguageDetection(); });
} else {
    window.languageDetection = new LanguageDetection();
}

