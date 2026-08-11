/**
 * Natural Language Query Processing
 * Processes natural language queries into structured searches
 */

class NaturalLanguageQueryProcessing {
    constructor() {
        this.intentPatterns = {
            search: /(find|search|show|get|list|display)/i,
            filter: /(with|that|having|containing|including)/i,
            sort: /(sort|order|arrange|organize)/i,
            compare: /(compare|difference|vs|versus)/i
        };
        this.init();
    }
    
    init() {
        this.setupQueryInput();
    }
    
    setupQueryInput() {
        // Add natural language input to search forms
        document.querySelectorAll('input[type="search"], input[data-search]').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.processQuery(input.value);
                }
            });
        });
    }
    
    async processQuery(query) {
        const parsed = this.parseQuery(query);
        return await this.executeParsedQuery(parsed);
    }
    
    parseQuery(query) {
        return {
            intent: this.detectIntent(query),
            entities: this.extractEntities(query),
            filters: this.extractFilters(query),
            sort: this.extractSort(query),
            limit: this.extractLimit(query)
        };
    }
    
    detectIntent(query) {
        if (this.intentPatterns.search.test(query)) return 'search';
        if (this.intentPatterns.compare.test(query)) return 'compare';
        if (this.intentPatterns.sort.test(query)) return 'sort';
        return 'search';
    }
    
    extractEntities(query) {
        // Extract entities (planets, stars, etc.)
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
        
        // Distance filters
        const distMatch = query.match(/(near|far|close|distant|nearby)/i);
        if (distMatch) {
            filters.distance = distMatch[0].toLowerCase();
        }
        
        return filters;
    }
    
    extractSort(query) {
        const sort = {};
        
        if (/(newest|recent|latest)/i.test(query)) {
            sort.field = 'created_at';
            sort.order = 'desc';
        } else if (/(oldest|old|earliest)/i.test(query)) {
            sort.field = 'created_at';
            sort.order = 'asc';
        } else if (/(largest|biggest)/i.test(query)) {
            sort.field = 'size';
            sort.order = 'desc';
        } else if (/(smallest|tiny)/i.test(query)) {
            sort.field = 'size';
            sort.order = 'asc';
        }
        
        return sort;
    }
    
    extractLimit(query) {
        const limitMatch = query.match(/(\d+)\s*(results?|items?|planets?)/i);
        return limitMatch ? parseInt(limitMatch[1]) : 10;
    }
    
    async executeParsedQuery(parsed) {
        let query = window.supabase?.from('planets').select('*');
        
        if (!query) {
            return [];
        }
        
        // Apply filters
        Object.keys(parsed.filters).forEach(key => {
            const value = parsed.filters[key];
            if (key === 'size') {
                // Map size words to ranges
                const sizeRanges = {
                    tiny: [0, 1000],
                    small: [1000, 5000],
                    large: [5000, 20000],
                    huge: [20000, Infinity]
                };
                if (sizeRanges[value]) {
                    query = query.gte('size', sizeRanges[value][0])
                                 .lt('size', sizeRanges[value][1] === Infinity ? 999999 : sizeRanges[value][1]);
                }
            }
        });
        
        // Apply sort
        if (parsed.sort.field) {
            query = query.order(parsed.sort.field, { ascending: parsed.sort.order === 'asc' });
        }
        
        // Apply limit
        query = query.limit(parsed.limit || 10);
        
        const { data } = await query;
        return data || [];
    }
    
    async suggestCompletions(partialQuery) {
        // Suggest query completions
        const suggestions = [];
        
        if (partialQuery.length < 2) return suggestions;
        
        // Common query patterns
        const patterns = [
            'find planets',
            'show large planets',
            'list hot stars',
            'compare planets',
            'sort by size'
        ];
        
        patterns.forEach(pattern => {
            if (pattern.toLowerCase().startsWith(partialQuery.toLowerCase())) {
                suggestions.push(pattern);
            }
        });
        
        return suggestions.slice(0, 5);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.naturalLanguageQueryProcessing = new NaturalLanguageQueryProcessing(); });
} else {
    window.naturalLanguageQueryProcessing = new NaturalLanguageQueryProcessing();
}

