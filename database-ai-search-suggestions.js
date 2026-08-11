/**
 * AI-Powered Search Suggestions for Database
 * Uses Gemini API to provide intelligent search suggestions based on user input
 */

class DatabaseAISearchSuggestions {
    constructor(databaseInstance) {
        this.database = databaseInstance;
        this.suggestionsCache = new Map();
        this.apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);
        this.init();
    }

    init() {
        if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return;
        }

        this.setupSearchBox();
        this.trackEvent('db_ai_search_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_ai_search_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    setupSearchBox() {
        setTimeout(() => {
            const searchBox = document.getElementById('planet-search') || document.getElementById('search-box');
            if (!searchBox) {
                console.warn('Search box not found');
                return;
            }

            // Create suggestions container
            const wrapper = document.createElement('div');
            wrapper.className = 'ai-search-suggestions-wrapper';
            wrapper.style.cssText = 'position: relative; width: 100%;';
            
            const parent = searchBox.parentNode;
            if (parent) {
                parent.insertBefore(wrapper, searchBox);
                wrapper.appendChild(searchBox);
            }

            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'ai-search-suggestions';
            suggestionsContainer.id = 'ai-search-suggestions';
            suggestionsContainer.style.cssText = `
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 10px;
                margin-top: 0.5rem;
                max-height: 400px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            `;
            wrapper.appendChild(suggestionsContainer);

            let debounceTimer;
            let lastQuery = '';

            searchBox.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                if (query.length < 2) {
                    suggestionsContainer.style.display = 'none';
                    return;
                }

                // Debounce API calls
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (query !== lastQuery) {
                        this.getAISuggestions(query, suggestionsContainer);
                        lastQuery = query;
                    }
                }, 500);
            });

            searchBox.addEventListener('focus', () => {
                if (searchBox.value.trim().length >= 2) {
                    this.getAISuggestions(searchBox.value.trim(), suggestionsContainer);
                }
            });

            // Hide suggestions on outside click
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    suggestionsContainer.style.display = 'none';
                }
            });
        }, 1000);
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[database-ai-search] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            
            // Try AllOrigins first
            try {
                // For POST requests, AllOrigins might be tricky with contents, but we'll try simple bypass
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
            } catch (proxyError) {
                console.warn('[database-ai-search] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[database-ai-search] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    async getAISuggestions(query, container) {
        // Check cache first
        if (this.suggestionsCache.has(query)) {
            this.displaySuggestions(this.suggestionsCache.get(query), container);
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: #ba944f;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #ba944f; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="margin-left: 0.5rem;">Getting AI suggestions...</span>
            </div>
        `;
        container.style.display = 'block';

        try {
            const prompt = `Based on the exoplanet database search query "${query}", provide 5 intelligent search suggestions. 
            Consider:
            - Similar planet names or KEPIDs
            - Planet types (Gas Giant, Terrestrial, Super-Earth, etc.)
            - Discovery methods
            - Characteristics (habitable zone, size, etc.)
            
            Return only a JSON array of 5 suggestion strings, no other text.
            Example: ["Kepler-452b", "Earth-like planets", "Habitable zone exoplanets", "Kepler-22b", "Super-Earths"]`;

            const responseData = await this.fetchJSON(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 200
                        }
                    })
                }
            );

            const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Parse JSON from response
            let suggestions = [];
            try {
                // Extract JSON array from response
                const jsonMatch = text.match(/\[.*?\]/s);
                if (jsonMatch) {
                    suggestions = JSON.parse(jsonMatch[0]);
                } else {
                    // Fallback: split by lines or commas
                    suggestions = text.split('\n')
                        .map(s => s.trim().replace(/^[-•]\s*/, '').replace(/["']/g, ''))
                        .filter(s => s.length > 0)
                        .slice(0, 5);
                }
            } catch (e) {
                // Fallback suggestions
                suggestions = this.getFallbackSuggestions(query);
            }

            // Cache and display
            this.suggestionsCache.set(query, suggestions);
            this.displaySuggestions(suggestions, container);

        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            // Show fallback suggestions
            const fallback = this.getFallbackSuggestions(query);
            this.displaySuggestions(fallback, container);
        }
    }

    getFallbackSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        const suggestions = [];

        // Pattern-based suggestions
        if (lowerQuery.includes('kepler')) {
            suggestions.push('Kepler-452b', 'Kepler-22b', 'Kepler-186f', 'Kepler-442b', 'Kepler-62f');
        } else if (lowerQuery.includes('earth') || lowerQuery.includes('habitable')) {
            suggestions.push('Habitable zone planets', 'Earth-like exoplanets', 'Super-Earths', 'TRAPPIST-1e', 'Proxima Centauri b');
        } else if (lowerQuery.includes('gas') || lowerQuery.includes('giant')) {
            suggestions.push('Gas giants', 'Hot Jupiters', 'HD 209458 b', 'WASP-12b', 'Jupiter-like planets');
        } else if (lowerQuery.includes('super')) {
            suggestions.push('Super-Earths', 'Kepler-22b', 'Gliese 667 Cc', 'HD 40307 g', 'Super-Earth exoplanets');
        } else {
            // Generic suggestions based on query
            suggestions.push(
                `${query} (exact match)`,
                `Planets like ${query}`,
                `Similar to ${query}`,
                `Search: ${query}`,
                `Find ${query}`
            );
        }

        return suggestions.slice(0, 5);
    }

    displaySuggestions(suggestions, container) {
        if (!suggestions || suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        const searchBox = document.getElementById('planet-search') || document.getElementById('search-box');
        
        container.innerHTML = `
            <div style="padding: 0.5rem; border-bottom: 1px solid rgba(186, 148, 79, 0.3); color: rgba(186, 148, 79, 0.8); font-size: 0.85rem; font-weight: 600;">
                🤖 AI Suggestions
            </div>
            ${suggestions.map(suggestion => `
                <div class="ai-suggestion-item" 
                     data-suggestion="${this.escapeHtml(suggestion)}"
                     style="padding: 0.75rem 1rem; cursor: pointer; border-bottom: 1px solid rgba(186, 148, 79, 0.1); transition: all 0.2s ease;"
                     onmouseover="this.style.background='rgba(186, 148, 79, 0.2)'"
                     onmouseout="this.style.background='transparent'">
                    <span style="color: #ba944f; margin-right: 0.5rem;">💡</span>
                    <span style="color: #e0e0e0;">${this.escapeHtml(suggestion)}</span>
                </div>
            `).join('')}
        `;

        // Add click handlers
        container.querySelectorAll('.ai-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const suggestion = item.dataset.suggestion;
                if (searchBox) {
                    searchBox.value = suggestion;
                    searchBox.dispatchEvent(new Event('input', { bubbles: true }));
                    container.style.display = 'none';
                }
            });
        });

        container.style.display = 'block';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get popular searches
     */
    getPopularSearches() {
        const stored = localStorage.getItem('popular-searches');
        if (!stored) {
            return [
                'Kepler-452b',
                'Earth-like planets',
                'Habitable zone',
                'Super-Earths',
                'Gas giants'
            ];
        }
        const searches = JSON.parse(stored);
        // Sort by count and return top 5
        return searches.sort((a, b) => b.count - a.count).slice(0, 5).map(s => s.query);
    }

    /**
     * Track search query
     */
    trackSearch(query) {
        const stored = localStorage.getItem('popular-searches');
        const searches = stored ? JSON.parse(stored) : [];
        
        const existing = searches.find(s => s.query.toLowerCase() === query.toLowerCase());
        if (existing) {
            existing.count++;
        } else {
            searches.push({ query, count: 1 });
        }

        // Keep only top 20
        searches.sort((a, b) => b.count - a.count);
        if (searches.length > 20) {
            searches.pop();
        }

        localStorage.setItem('popular-searches', JSON.stringify(searches));
    }

    /**
     * Enhanced suggestions with context
     */
    async getContextualSuggestions(query, context = {}) {
        // Include context about current filters, selected planet, etc.
        const enhancedQuery = context.selectedPlanet 
            ? `${query} similar to ${context.selectedPlanet}`
            : query;

        return this.getAISuggestions(enhancedQuery, document.getElementById('ai-search-suggestions'));
    }
}

// Initialize when database is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.database) {
                window.databaseAISearchSuggestions = new DatabaseAISearchSuggestions(window.database);
            }
        }, 2000);
    });
}

