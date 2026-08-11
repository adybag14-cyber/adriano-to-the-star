/**
 * NASA API Real-Time Updates Integration
 * Integrates with NASA APIs for real-time space data
 * 
 * Features:
 * - Exoplanet Archive API
 * - Astronomy Picture of the Day
 * - Near Earth Objects
 * - Real-time updates
 */

class NASAAPIIntegration {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://api.nasa.gov';
        this.cache = new Map();
        this.apiCacheNamespace = null;
        this.init();
    }
    
    init() {
        this.loadAPIKey();
        try {
            if (window.apiCache && typeof window.apiCache.namespace === 'function') {
                this.apiCacheNamespace = window.apiCache.namespace('nasa');
            }
        } catch (e) {
            console.warn('NASA API cache namespace setup failed:', e);
        }
        this.setupPolling();
        console.log('🚀 NASA API Integration initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_as_aa_pi_in_te_gr_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadAPIKey() {
        // Provide your NASA API key via window.NASA_API_KEY.
        // Keeping this opt-in avoids noisy console errors when the DEMO_KEY is rate-limited.
        try {
            if (typeof window !== 'undefined' && typeof window.NASA_API_KEY === 'string' && window.NASA_API_KEY) {
                this.apiKey = window.NASA_API_KEY;
            } else {
                this.apiKey = null;
            }
        } catch (e) {
            this.apiKey = null;
        }
    }
    
    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[nasa-api-integration] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[nasa-api-integration] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[nasa-api-integration] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    async fetchExoplanets() {
        try {
            const url = `${this.baseUrl}/planetary/exoplanet?api_key=${this.apiKey}`;
            return await this.fetchJSON(url);
        } catch (e) {
            console.error('Failed to fetch exoplanets:', e);
            return null;
        }
    }
    
    async fetchAPOD() {
        try {
            if (!this.apiKey) {
                return null;
            }

            const cacheKey = 'apod-' + new Date().toDateString();
            const url = `${this.baseUrl}/planetary/apod?api_key=${this.apiKey}`;

            if (this.apiCacheNamespace && typeof this.apiCacheNamespace.cachedFetch === 'function') {
                const response = await this.apiCacheNamespace.cachedFetch(url, {}, {
                    ttl: 24 * 60 * 60 * 1000,
                    tags: ['apod', cacheKey]
                });
                return await response.json();
            }

            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const data = await this.fetchJSON(url);
            if (data) {
                this.cache.set(cacheKey, data);
            }
            return data;
        } catch (e) {
            return null;
        }
    }
    
    async fetchNearEarthObjects(startDate, endDate) {
        try {
            const url = `${this.baseUrl}/neo/rest/v1/feed`;
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
                api_key: this.apiKey
            });
            
            return await this.fetchJSON(`${url}?${params}`);
        } catch (e) {
            console.error('Failed to fetch NEOs:', e);
            return null;
        }
    }
    
    setupPolling() {
        if (!this.apiKey) {
            return;
        }

        // Poll for updates every hour
        setInterval(async () => {
            const apod = await this.fetchAPOD();
            if (apod) {
                this.displayAPOD(apod);
            }
        }, 3600000);
        
        // Initial fetch
        this.fetchAPOD().then(apod => {
            if (apod) this.displayAPOD(apod);
        });
    }
    
    displayAPOD(apod) {
        if (!apod || typeof apod !== 'object') {
            return;
        }

        const url = typeof apod.url === 'string' ? apod.url : null;
        const title = typeof apod.title === 'string' ? apod.title : 'NASA APOD';
        const explanation = typeof apod.explanation === 'string' ? apod.explanation : '';

        if (!url) {
            return;
        }

        // Create or update APOD widget
        let widget = document.getElementById('nasa-apod-widget');
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'nasa-apod-widget';
            widget.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                width: 300px;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 15px;
                z-index: 9999;
                color: white;
            `;
            document.body.appendChild(widget);
        }
        
        widget.innerHTML = `
            <h3 style="color: #ba944f; margin: 0 0 10px 0;">NASA APOD</h3>
            <img src="${url}" style="width: 100%; border-radius: 6px; margin-bottom: 10px;" alt="${title}">
            <h4 style="margin: 0 0 5px 0;">${title}</h4>
            <p style="font-size: 0.9rem; margin: 0;">${explanation ? (explanation.substring(0, 100) + '...') : ''}</p>
        `;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.nasaAPIIntegration = new NASAAPIIntegration();
    });
} else {
    window.nasaAPIIntegration = new NASAAPIIntegration();
}
