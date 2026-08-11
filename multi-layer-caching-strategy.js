/**
 * Multi-Layer Caching Strategy
 * Implements multiple layers of caching for optimal performance
 */

class MultiLayerCachingStrategy {
    constructor() {
        this.layers = {
            browser: {},
            memory: new Map(),
            serviceWorker: null,
            cdn: null
        };
        this.init();
    }
    
    init() {
        this.setupBrowserCache();
        this.setupMemoryCache();
        this.setupServiceWorkerCache();
    }
    
    setupBrowserCache() {
        // Browser-level caching using Cache API
        if ('caches' in window) {
            this.layers.browser = caches;
        }
    }
    
    setupMemoryCache() {
        // In-memory cache for frequently accessed data
        this.layers.memory = new Map();
    }
    
    setupServiceWorkerCache() {
        // Service Worker cache layer
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                this.layers.serviceWorker = registration;
            });
        }
    }
    
    async get(key, layer = 'auto') {
        // Get from cache with layer priority
        if (layer === 'auto') {
            // Try memory first, then browser, then service worker
            if (this.layers.memory.has(key)) {
                return this.layers.memory.get(key);
            }
            
            if (this.layers.browser) {
                const cache = await this.layers.browser.open('app-cache');
                const cached = await cache.match(key);
                if (cached) {
                    const data = await cached.json();
                    // Store in memory for faster access
                    this.layers.memory.set(key, data);
                    return data;
                }
            }
        }
        
        return null;
    }
    
    async set(key, value, options = {}) {
        const { ttl = 3600, layer = 'all' } = options;
        
        // Store in memory
        if (layer === 'all' || layer === 'memory') {
            this.layers.memory.set(key, {
                value,
                expires: Date.now() + (ttl * 1000)
            });
        }
        
        // Store in browser cache
        if ((layer === 'all' || layer === 'browser') && this.layers.browser) {
            const cache = await this.layers.browser.open('app-cache');
            await cache.put(key, new Response(JSON.stringify(value), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': `max-age=${ttl}`
                }
            }));
        }
    }
    
    async invalidate(key, layer = 'all') {
        // Invalidate cache across layers
        if (layer === 'all' || layer === 'memory') {
            this.layers.memory.delete(key);
        }
        
        if ((layer === 'all' || layer === 'browser') && this.layers.browser) {
            const cache = await this.layers.browser.open('app-cache');
            await cache.delete(key);
        }
    }
    
    clear(layer = 'all') {
        if (layer === 'all' || layer === 'memory') {
            this.layers.memory.clear();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.multiLayerCachingStrategy = new MultiLayerCachingStrategy(); });
} else {
    window.multiLayerCachingStrategy = new MultiLayerCachingStrategy();
}

