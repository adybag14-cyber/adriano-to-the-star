/**
 * CDN Edge Caching Rules
 * Manages CDN caching strategies and rules
 */

class CDNEdgeCachingRules {
    constructor() {
        this.cacheRules = new Map();
        this.init();
    }
    
    init() {
        this.setupDefaultRules();
        this.trackEvent('cdn_edge_rules_initialized');
    }
    
    setupDefaultRules() {
        // Static assets - long cache
        this.addRule(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/i, {
            maxAge: 31536000, // 1 year
            staleWhileRevalidate: 86400, // 1 day
            cacheControl: 'public, immutable'
        });
        
        // CSS/JS - medium cache
        this.addRule(/\.(css|js)$/i, {
            maxAge: 86400, // 1 day
            staleWhileRevalidate: 3600, // 1 hour
            cacheControl: 'public, must-revalidate'
        });
        
        // Fonts - long cache
        this.addRule(/\.(woff|woff2|ttf|otf|eot)$/i, {
            maxAge: 31536000, // 1 year
            staleWhileRevalidate: 86400,
            cacheControl: 'public, immutable'
        });
        
        // HTML - short cache
        this.addRule(/\.(html|htm)$/i, {
            maxAge: 3600, // 1 hour
            staleWhileRevalidate: 300, // 5 minutes
            cacheControl: 'public, must-revalidate'
        });
        
        // API responses - no cache
        this.addRule(/\/api\//, {
            maxAge: 0,
            cacheControl: 'no-cache, no-store, must-revalidate'
        });
    }
    
    addRule(pattern, config) {
        this.cacheRules.set(pattern, {
            pattern,
            ...config
        });
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
    
    getCacheHeaders(url) {
        const rule = this.getCacheRule(url);
        
        return {
            'Cache-Control': rule.cacheControl || `public, max-age=${rule.maxAge}`,
            'CDN-Cache-Control': rule.cacheControl,
            'Vary': 'Accept-Encoding'
        };
    }
    
    async preloadResources(urls) {
        // Preload resources to CDN edge
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = this.getResourceType(url);
            document.head.appendChild(link);
        });
    }
    
    getResourceType(url) {
        if (/\.(css)$/i.test(url)) return 'style';
        if (/\.(js)$/i.test(url)) return 'script';
        if (/\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url)) return 'image';
        if (/\.(woff|woff2|ttf|otf)$/i.test(url)) return 'font';
        return 'fetch';
    }
    
    invalidateCache(urls) {
        // Invalidate CDN cache for URLs
        // This would typically call a CDN API
        console.log('Invalidating CDN cache for:', urls);
        
        if (window.cdnAPI) {
            urls.forEach(url => {
                window.cdnAPI.purge(url);
            });
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cdn_edge_rules_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.cdnEdgeCachingRules = new CDNEdgeCachingRules(); });
} else {
    window.cdnEdgeCachingRules = new CDNEdgeCachingRules();
}

