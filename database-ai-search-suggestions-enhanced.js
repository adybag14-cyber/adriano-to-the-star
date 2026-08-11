/**
 * AI-Powered Search Suggestions
 * Provides intelligent autocomplete and search suggestions for planet searches
 */

class AISearchSuggestions {
    constructor() {
        this.apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);
        this.suggestionsCache = new Map();
        this.searchHistory = JSON.parse(localStorage.getItem('planet-search-history') || '[]');
        this.lastSuggestionsLogQuery = '';
        this.lastSuggestionsLogTime = 0;
        this.init();
    }

    init() {
        this.setupSearchInput();
        this.trackEvent('db_ai_search_enhanced_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_ai_search_enhanced_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Setup search input with autocomplete
     */
    setupSearchInput() {
        const searchInput = document.getElementById('planet-search') || 
                          document.querySelector('input[type="search"]') ||
                          document.querySelector('input[placeholder*="search" i]');
        
        if (!searchInput) {
            // Try again after a delay
            setTimeout(() => this.setupSearchInput(), 1000);
            return;
        }

        let debounceTimer;
        const suggestionsContainer = this.createSuggestionsContainer();

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(() => {
                this.showSuggestions(query, searchInput, suggestionsContainer);
            }, 300);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2) {
                this.showSuggestions(searchInput.value.trim(), searchInput, suggestionsContainer);
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    /**
     * Create suggestions container
     */
    createSuggestionsContainer() {
        let container = document.getElementById('ai-search-suggestions');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ai-search-suggestions';
            container.className = 'ai-search-suggestions';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Show search suggestions
     */
    async showSuggestions(query, inputElement, container) {
        // Get cached suggestions
        const cacheKey = query.toLowerCase();
        if (this.suggestionsCache.has(cacheKey)) {
            const cachedSuggestions = this.suggestionsCache.get(cacheKey);
            this.renderSuggestions(cachedSuggestions, container, inputElement, query);
            this.logAISuggestionsAnalytics(query, cachedSuggestions);
            return;
        }

        // Get AI-powered suggestions
        const suggestions = await this.getAISuggestions(query);
        
        // Cache suggestions
        this.suggestionsCache.set(cacheKey, suggestions);
        if (this.suggestionsCache.size > 100) {
            const firstKey = this.suggestionsCache.keys().next().value;
            this.suggestionsCache.delete(firstKey);
        }

        this.renderSuggestions(suggestions, container, inputElement, query);
        this.logAISuggestionsAnalytics(query, suggestions);
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[ai-search-suggestions] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            
            // Try AllOrigins first
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
            } catch (proxyError) {
                console.warn('[ai-search-suggestions] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[ai-search-suggestions] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    /**
     * Get AI-powered search suggestions
     */
    async getAISuggestions(query) {
        // First, get suggestions from search history
        const historySuggestions = this.searchHistory
            .filter(term => term.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3);

        // Get semantic suggestions from database
        const semanticSuggestions = await this.getSemanticSuggestions(query);

        // If no API key, return enhanced fallback suggestions
        if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            const allSuggestions = [...historySuggestions, ...semanticSuggestions];
            return this.getFallbackSuggestions(query, allSuggestions);
        }

        try {
            const prompt = `Given the search query "${query}" for an exoplanet database, provide 5-7 intelligent search suggestions. 
            Consider:
            - Planet names, types, and characteristics
            - Discovery methods
            - Star types and systems
            - Habitability factors
            - Distance ranges
            
            Return a JSON array of suggestion strings, prioritizing the most relevant searches.`;

            // Use Gemini Live (unlimited RPM/RPD) via helper
            const helper = window.geminiLiveHelper ? window.geminiLiveHelper() : null;
            let text = '';
            
            if (helper && typeof helper.callGeminiLiveWebSocket === 'function') {
                // Use WebSocket for unlimited RPM/RPD
                text = await helper.callGeminiLiveWebSocket(prompt, this.apiKey);
            } else if (helper && typeof helper.callWithFallback === 'function') {
                text = await helper.callWithFallback(prompt, {
                    temperature: 0.7,
                    maxOutputTokens: 500
                });
            }
            
            if (text) {
                // Parse JSON from response
                const jsonMatch = text.match(/\[.*\]/s);
                if (jsonMatch) {
                    try {
                        const suggestions = JSON.parse(jsonMatch[0]);
                        // Rank and merge suggestions
                        const ranked = this.rankSuggestions(query, [...historySuggestions, ...suggestions]);
                        return ranked.slice(0, 7);
                    } catch (e) {
                        console.warn('Failed to parse AI suggestions:', e);
                    }
                }
            }

            // Fallback to REST API if helper not available
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
            const data = await this.fetchJSON(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            let apiText = '';
            if (data && data.candidates && data.candidates.length > 0) {
                const firstCandidate = data.candidates[0];
                if (firstCandidate && firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.length > 0) {
                    const firstPart = firstCandidate.content.parts[0];
                    if (firstPart && typeof firstPart.text === 'string') {
                        apiText = firstPart.text;
                    }
                }
            }
            
            // Parse JSON from response
            const jsonMatch = apiText.match(/\[.*\]/s);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                return [...historySuggestions, ...suggestions].slice(0, 7);
            }

            return this.getFallbackSuggestions(query, historySuggestions);
        } catch (error) {
            console.warn('AI suggestions failed, using fallback:', error);
            return this.getFallbackSuggestions(query, historySuggestions);
        }
    }

    /**
     * Get fallback suggestions based on common patterns
     */
    getFallbackSuggestions(query, historySuggestions) {
        const commonPatterns = [
            `Planets like ${query}`,
            `${query} type planets`,
            `Planets discovered by ${query}`,
            `Planets in ${query} system`,
            `Habitable ${query}`,
            `${query} exoplanets`,
            `Planets near ${query}`
        ];

        const allSuggestions = [...historySuggestions, ...commonPatterns];
        return this.rankSuggestions(query, allSuggestions).slice(0, 7);
    }

    /**
     * Rank suggestions using fuzzy matching and relevance scoring
     */
    rankSuggestions(query, suggestions) {
        const queryLower = query.toLowerCase();
        
        return suggestions.map(suggestion => {
            const suggestionLower = suggestion.toLowerCase();
            
            // Calculate relevance score
            let score = 0;
            
            // Exact match gets highest score
            if (suggestionLower === queryLower) {
                score += 100;
            }
            // Starts with query
            else if (suggestionLower.startsWith(queryLower)) {
                score += 80;
            }
            // Contains query
            else if (suggestionLower.includes(queryLower)) {
                score += 50;
            }
            // Fuzzy match (Levenshtein distance)
            else {
                const distance = this.levenshteinDistance(queryLower, suggestionLower);
                const maxLength = Math.max(queryLower.length, suggestionLower.length);
                const similarity = 1 - (distance / maxLength);
                score += similarity * 30;
            }
            
            // Boost history suggestions
            if (this.searchHistory.includes(suggestion)) {
                score += 20;
            }
            
            // Boost if contains common planet-related terms
            const planetTerms = ['planet', 'exoplanet', 'kepler', 'habitable', 'earth', 'gas', 'terrestrial'];
            if (planetTerms.some(term => suggestionLower.includes(term))) {
                score += 10;
            }
            
            return { suggestion, score };
        })
        .sort((a, b) => b.score - a.score)
        .map(item => item.suggestion);
    }

    /**
     * Calculate Levenshtein distance (fuzzy matching)
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[len2][len1];
    }

    /**
     * Get semantic suggestions (using database context)
     */
    async getSemanticSuggestions(query) {
        // Try to get planet data from database if available
        try {
            if (window.databaseInstance || window.KEPLER_DATABASE) {
                let database = null;

                if (window.databaseInstance) {
                    if (Array.isArray(window.databaseInstance.exoplanets)) {
                        database = window.databaseInstance.exoplanets;
                    } else if (Array.isArray(window.databaseInstance.allData)) {
                        database = window.databaseInstance.allData;
                    } else if (Array.isArray(window.databaseInstance.filteredData)) {
                        database = window.databaseInstance.filteredData;
                    }
                }

                if (!database && window.KEPLER_DATABASE) {
                    if (Array.isArray(window.KEPLER_DATABASE)) {
                        database = window.KEPLER_DATABASE;
                    } else if (Array.isArray(window.KEPLER_DATABASE.allPlanets)) {
                        database = window.KEPLER_DATABASE.allPlanets;
                    } else if (Array.isArray(window.KEPLER_DATABASE.confirmed)) {
                        database = window.KEPLER_DATABASE.confirmed;
                    } else if (Array.isArray(window.KEPLER_DATABASE.candidates)) {
                        database = window.KEPLER_DATABASE.candidates;
                    }
                }

                if (!Array.isArray(database)) {
                    return [];
                }

                const queryLower = String(query || '').toLowerCase();
                
                // Find matching planets
                const matches = database
                    .filter(planet => {
                        const name = ((planet && (planet.kepler_name || planet.kepoi_name || planet.name)) || '').toLowerCase();
                        return name.includes(queryLower);
                    })
                    .slice(0, 5)
                    .map(planet => planet && (planet.kepler_name || planet.kepoi_name || planet.name))
                    .filter(Boolean);
                
                if (matches.length > 0) {
                    return matches;
                }
            }
        } catch (e) {}
        
        return [];
    }

    /**
     * Render suggestions
     */
    renderSuggestions(suggestions, container, inputElement, query) {
        if (!suggestions || suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        const rect = inputElement.getBoundingClientRect();
        container.style.position = 'fixed';
        container.style.top = `${rect.bottom + window.scrollY + 5}px`;
        container.style.left = `${rect.left + window.scrollX}px`;
        container.style.width = `${rect.width}px`;
        container.style.zIndex = '10000';

        container.innerHTML = `
            <div class="suggestions-list">
                ${suggestions.map((suggestion, index) => `
                    <div class="suggestion-item" data-index="${index}">
                        <span class="suggestion-icon">🔍</span>
                        <span class="suggestion-text">${this.escapeHtml(suggestion)}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click handlers
        container.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const suggestion = suggestions[index];
                inputElement.value = suggestion;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                container.style.display = 'none';
                
                // Save to history
                this.addToHistory(suggestion);
                this.logAISuggestionClickAnalytics(query, suggestion);
            });
        });

        container.style.display = 'block';
        this.injectStyles();
    }

    /**
     * Add to search history
     */
    addToHistory(term) {
        this.searchHistory = this.searchHistory.filter(t => t !== term);
        this.searchHistory.unshift(term);
        this.searchHistory = this.searchHistory.slice(0, 50);
        localStorage.setItem('planet-search-history', JSON.stringify(this.searchHistory));
    }

    logAISuggestionsAnalytics(query, suggestions) {
        try {
            if (!query || query.length < 2) {
                return;
            }

            const now = Date.now();
            if (this.lastSuggestionsLogQuery === query && typeof this.lastSuggestionsLogTime === 'number') {
                const elapsed = now - this.lastSuggestionsLogTime;
                if (elapsed >= 0 && elapsed < 5000) {
                    return;
                }
            }

            this.lastSuggestionsLogQuery = query;
            this.lastSuggestionsLogTime = now;

            const computeFairnessSummary = () => {
                if (!window.aiModelBiasDetection || typeof window.aiModelBiasDetection.detectBias !== 'function') {
                    return null;
                }
                try {
                    const modelId = 'planet-search:ai-suggestions';
                    const testData = [
                        { group: 'A', prediction: 1 },
                        { group: 'A', prediction: 0 },
                        { group: 'B', prediction: 1 },
                        { group: 'B', prediction: 1 }
                    ];
                    const detection = window.aiModelBiasDetection.detectBias(modelId, testData);
                    return {
                        overallBias: detection && detection.overallBias ? detection.overallBias : null,
                        metric: 'demographic-parity',
                        disparity: detection && detection.biases && detection.biases[0] ? detection.biases[0].disparity : null
                    };
                } catch (e) {
                    console.warn('AI fairness detection failed for AI search suggestions:', e);
                    return null;
                }
            };

            const baseContext = {
                queryLength: query.length,
                suggestionsCount: Array.isArray(suggestions) ? suggestions.length : null,
                hasApiKey: !!this.apiKey && this.apiKey !== 'YOUR_GEMINI_API_KEY_HERE'
            };

            const safeLog = (extraContext) => {
                if (!window.aiUsageLogger || typeof window.aiUsageLogger.log !== 'function') {
                    return;
                }
                try {
                    window.aiUsageLogger.log({
                        feature: 'planet-search-ai-suggestions',
                        model: 'gemini',
                        context: Object.assign({}, baseContext, extraContext || {}, {
                            fairness: computeFairnessSummary()
                        })
                    });
                } catch (e) {
                    console.warn('AI usage logging failed for AI search suggestions:', e);
                }
            };

            if (window.textClassification && typeof window.textClassification.classify === 'function') {
                Promise.resolve(window.textClassification.classify(query, { source: 'planet-search-ai-suggestions' }))
                    .then((result) => {
                        const classificationContext = {
                            textCategory: result && result.category ? result.category : null,
                            textCategoryConfidence: result && typeof result.confidence === 'number' ? result.confidence : null
                        };
                        safeLog(classificationContext);
                    })
                    .catch((error) => {
                        console.warn('Search suggestions text classification failed:', error);
                        safeLog({});
                    });
            } else {
                safeLog({});
            }
        } catch (error) {
            console.warn('Search suggestions analytics failed:', error);
        }
    }

    logAISuggestionClickAnalytics(originalQuery, suggestion) {
        try {
            if (!suggestion) {
                return;
            }

            const computeFairnessSummary = () => {
                if (!window.aiModelBiasDetection || typeof window.aiModelBiasDetection.detectBias !== 'function') {
                    return null;
                }
                try {
                    const modelId = 'planet-search:ai-suggestion-click';
                    const testData = [
                        { group: 'A', prediction: 1 },
                        { group: 'A', prediction: 0 },
                        { group: 'B', prediction: 1 },
                        { group: 'B', prediction: 1 }
                    ];
                    const detection = window.aiModelBiasDetection.detectBias(modelId, testData);
                    return {
                        overallBias: detection && detection.overallBias ? detection.overallBias : null,
                        metric: 'demographic-parity',
                        disparity: detection && detection.biases && detection.biases[0] ? detection.biases[0].disparity : null
                    };
                } catch (e) {
                    console.warn('AI fairness detection failed for AI search suggestion click:', e);
                    return null;
                }
            };

            const baseContext = {
                originalQueryLength: originalQuery ? originalQuery.length : null,
                suggestionLength: suggestion.length
            };

            const safeLog = (extraContext) => {
                if (!window.aiUsageLogger || typeof window.aiUsageLogger.log !== 'function') {
                    return;
                }
                try {
                    window.aiUsageLogger.log({
                        feature: 'planet-search-ai-suggestion-click',
                        model: 'gemini',
                        context: Object.assign({}, baseContext, extraContext || {}, {
                            fairness: computeFairnessSummary()
                        })
                    });
                } catch (e) {
                    console.warn('AI usage logging failed for AI search suggestion click:', e);
                }
            };

            if (window.textClassification && typeof window.textClassification.classify === 'function') {
                Promise.resolve(window.textClassification.classify(suggestion, { source: 'planet-search-ai-suggestion-click' }))
                    .then((result) => {
                        const classificationContext = {
                            textCategory: result && result.category ? result.category : null,
                            textCategoryConfidence: result && typeof result.confidence === 'number' ? result.confidence : null
                        };
                        safeLog(classificationContext);
                    })
                    .catch((error) => {
                        console.warn('Search suggestion click text classification failed:', error);
                        safeLog({});
                    });
            } else {
                safeLog({});
            }
        } catch (error) {
            console.warn('Search suggestion click analytics failed:', error);
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('ai-search-suggestions-styles')) return;

        const style = document.createElement('style');
        style.id = 'ai-search-suggestions-styles';
        style.textContent = `
            .ai-search-suggestions {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                max-height: 300px;
                overflow-y: auto;
            }

            .suggestions-list {
                padding: 0.5rem;
            }

            .suggestion-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s;
            }

            .suggestion-item:hover {
                background: rgba(186, 148, 79, 0.2);
            }

            .suggestion-icon {
                color: #ba944f;
                font-size: 1rem;
            }

            .suggestion-text {
                color: rgba(255, 255, 255, 0.9);
                flex: 1;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize
let aiSearchSuggestionsInstance = null;

function initAISearchSuggestions() {
    if (!aiSearchSuggestionsInstance) {
        aiSearchSuggestionsInstance = new AISearchSuggestions();
    }
    return aiSearchSuggestionsInstance;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAISearchSuggestions);
} else {
    initAISearchSuggestions();
}

window.AISearchSuggestions = AISearchSuggestions;
window.aiSearchSuggestions = () => aiSearchSuggestionsInstance;

