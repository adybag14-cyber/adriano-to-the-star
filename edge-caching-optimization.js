/**
 * Edge Caching Optimization
 * Optimizes edge caching for CDN and edge servers
 */

class EdgeCachingOptimization {
    constructor() {
        this.cacheRules = new Map();
        this.init();
    }
    
    init() {
        this.setupCacheRules();
        this.optimizeEdgeHeaders();
        this.trackEvent('edge_cache_opt_initialized');
    }
    
    setupCacheRules() {
        // Define cache rules for different resource types
        this.cacheRules.set(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/i, {
            maxAge: 31536000, // 1 year
            staleWhileRevalidate: 86400,
            cacheControl: 'public, immutable'
        });
        
        this.cacheRules.set(/\.(css|js)$/i, {
            maxAge: 86400, // 1 day
            staleWhileRevalidate: 3600,
            cacheControl: 'public, must-revalidate'
        });
        
        this.cacheRules.set(/\.(woff|woff2|ttf|otf|eot)$/i, {
            maxAge: 31536000,
            staleWhileRevalidate: 86400,
            cacheControl: 'public, immutable'
        });
    }
    
    optimizeEdgeHeaders() {
        // Set optimal cache headers for edge caching
        // This would typically be done server-side, but we can suggest headers
        return {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'CDN-Cache-Control': 'public, max-age=31536000',
            'Vary': 'Accept-Encoding'
        };
    }
    
    getCacheRule(url) {
        for (const [pattern, rule] of this.cacheRules.entries()) {
            if (pattern.test(url)) {
                return rule;
            }
        }
        
        // Default rule
        return {
            maxAge: 3600,
            cacheControl: 'public, max-age=3600'
        };
    }
    
    async preloadToEdge(urls) {
        // Preload resources to edge cache
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }
    
    async purgeEdgeCache(urls) {
        // Purge edge cache for specific URLs
        // This would call CDN API
        console.log('Purging edge cache for:', urls);
        
        if (window.cdnAPI) {
            urls.forEach(url => {
                window.cdnAPI.purge(url);
            });
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_cache_opt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.edgeCachingOptimization = new EdgeCachingOptimization(); });
} else {
    window.edgeCachingOptimization = new EdgeCachingOptimization();
}

