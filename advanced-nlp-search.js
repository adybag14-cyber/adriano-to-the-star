/**
 * Advanced NLP for Search
 * Advanced natural language processing for search functionality
 */

class AdvancedNLPSearch {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupNLPSearch();
        this.trackEvent('nlp_search_initialized');
    }
    
    setupNLPSearch() {
        // Setup NLP-powered search
        document.querySelectorAll('input[type="search"]').forEach(input => {
            input.addEventListener('input', (e) => {
                this.processNLPSearch(e.target.value);
            });
        });
    }
    
    async processNLPSearch(query) {
        const parsed = this.parseQuery(query);
        const results = await this.executeNLPSearch(parsed);
        this.trackEvent('nlp_search_executed', { intent: parsed.intent, entityCount: parsed.entities.length });
        return results;
    }
    
    parseQuery(query) {
        // Parse natural language query
        const intents = {
            find: /(find|search|show|get|list|display)/i,
            filter: /(with|that|having|containing|including)/i,
            compare: /(compare|difference|vs|versus)/i,
            sort: /(sort|order|arrange|organize)/i
        };
        
        return {
            intent: this.detectIntent(query, intents),
            entities: this.extractEntities(query),
            filters: this.extractFilters(query),
            sort: this.extractSort(query)
        };
    }
    
    detectIntent(query, intents) {
        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(query)) {
                return intent;
            }
        }
        return 'search';
    }
    
    extractEntities(query) {
        // Extract entities from query
        const entities = [];
        const entityPatterns = {
            planet: /\b(planet|planets|world|worlds)\b/gi,
            star: /\b(star|stars|sun|suns)\b/gi,
            galaxy: /\b(galaxy|galaxies)\b/gi
        };
        
        Object.keys(entityPatterns).forEach(type => {
            if (entityPatterns[type].test(query)) {
                entities.push(type);
            }
        });
        
        return entities;
    }
    
    extractFilters(query) {
        // Extract filters from query
        const filters = {};
        
        // Size filters
        const sizeMatch = query.match(/(large|small|big|tiny|huge|massive)/i);
        if (sizeMatch) {
            filters.size = sizeMatch[0].toLowerCase();
        }
        
        // Temperature filters
        const tempMatch = query.match(/(hot|cold|warm|cool|frozen|burning)/i);
        if (tempMatch) {
            filters.temperature = tempMatch[0].toLowerCase();
        }
        
        return filters;
    }
    
    extractSort(query) {
        // Extract sort preferences
        const sort = {};
        
        if (/(newest|recent|latest)/i.test(query)) {
            sort.field = 'created_at';
            sort.order = 'desc';
        } else if (/(oldest|old|earliest)/i.test(query)) {
            sort.field = 'created_at';
            sort.order = 'asc';
        }
        
        return sort;
    }
    
    async executeNLPSearch(parsed) {
        // Execute search based on parsed query
        return [];
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`nlp_search_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_nlp_search', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.advancedNLPSearch = new AdvancedNLPSearch(); });
} else {
    window.advancedNLPSearch = new AdvancedNLPSearch();
}

