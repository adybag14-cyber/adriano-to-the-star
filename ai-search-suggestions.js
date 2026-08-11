/**
 * AI-Powered Search Suggestions
 * Intelligent search suggestions using AI
 * 
 * Features:
 * - Context-aware suggestions
 * - Natural language queries
 * - Autocomplete
 * - Query expansion
 * - Search history learning
 */

class AISearchSuggestions {
    constructor() {
        this.suggestions = [];
        this.searchHistory = [];
        this.queryPatterns = new Map();
        this.init();
    }
    
    init() {
        this.loadHistory();
        this.setupSearchInputs();
        this.trackEvent('search_suggestions_initialized');
    }
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('search-history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load search history:', e);
        }
    }
    
    setupSearchInputs() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('input[type="search"], input[placeholder*="search" i], #search-input').forEach(input => {
                if (!input.hasAttribute('data-ai-search')) {
                    input.setAttribute('data-ai-search', 'true');
                    this.enhanceSearchInput(input);
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Process existing inputs
        document.querySelectorAll('input[type="search"], input[placeholder*="search" i]').forEach(input => {
            this.enhanceSearchInput(input);
        });
    }
    
    enhanceSearchInput(input) {
        const suggestionsContainer = null;
        
        input.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length < 2) {
                if (suggestionsContainer) suggestionsContainer.remove();
                return;
            }
            
            this.generateSuggestions(query).then(suggestions => {
                this.showSuggestions(input, suggestions);
            });
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (suggestionsContainer) {
                    suggestionsContainer.remove();
                }
            }, 200);
        });
    }
    
    async generateSuggestions(query) {
        // Analyze query intent
        const intent = this.analyzeIntent(query);
        
        // Generate suggestions based on intent
        const suggestions = [];
        
        // Add history-based suggestions
        const historyMatches = this.searchHistory
            .filter(h => h.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3);
        suggestions.push(...historyMatches);
        
        // Add pattern-based suggestions
        if (intent.type === 'planet') {
            suggestions.push(
                `planets like ${intent.terms.join(' ')}`,
                `find ${intent.terms.join(' ')} planets`,
                `${intent.terms.join(' ')} exoplanets`
            );
        }
        
        // Add common queries
        const commonQueries = [
            'habitable planets',
            'gas giants',
            'terrestrial planets',
            'nearby exoplanets',
            'kepler planets'
        ];
        
        commonQueries.forEach(cq => {
            if (cq.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(cq.toLowerCase())) {
                suggestions.push(cq);
            }
        });
        
        return [...new Set(suggestions)].slice(0, 5);
    }
    
    analyzeIntent(query) {
        const lowerQuery = query.toLowerCase();
        const planetKeywords = ['planet', 'exoplanet', 'kepler', 'habitable', 'earth-like'];
        const typeKeywords = ['gas', 'giant', 'terrestrial', 'rocky', 'ocean'];
        const sizeKeywords = ['large', 'small', 'big', 'tiny'];
        
        const terms = query.split(/\s+/);
        const type = planetKeywords.some(kw => lowerQuery.includes(kw)) ? 'planet' : 'general';
        
        return {
            type,
            terms,
            hasPlanetKeywords: planetKeywords.some(kw => lowerQuery.includes(kw)),
            hasTypeKeywords: typeKeywords.some(kw => lowerQuery.includes(kw)),
            hasSizeKeywords: sizeKeywords.some(kw => lowerQuery.includes(kw))
        };
    }
    
    showSuggestions(input, suggestions) {
        // Remove existing suggestions
        const existing = document.getElementById('ai-search-suggestions');
        if (existing) existing.remove();
        
        if (suggestions.length === 0) return;
        
        const container = document.createElement('div');
        container.id = 'ai-search-suggestions';
        container.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid rgba(186, 148, 79, 0.5);
            border-radius: 6px;
            margin-top: 5px;
            z-index: 10000;
            max-height: 300px;
            overflow-y: auto;
        `;
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                color: white;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            `;
            item.textContent = suggestion;
            item.addEventListener('click', () => {
                input.value = suggestion;
                input.dispatchEvent(new Event('input'));
                container.remove();
                this.saveToHistory(suggestion);
                this.trackEvent('suggestion_selected', { suggestion });
            });
            container.appendChild(item);
        });
        
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(container);
    }
    
    saveToHistory(query) {
        this.searchHistory.unshift(query);
        this.searchHistory = this.searchHistory.slice(0, 50); // Keep last 50
        
        try {
            localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.warn('Failed to save search history:', e);
        }
    }
}

AISearchSuggestions.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`search_suggestions_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'ai_search_suggestions', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiSearchSuggestions = new AISearchSuggestions();
    });
} else {
    window.aiSearchSuggestions = new AISearchSuggestions();
}
