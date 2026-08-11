/**
 * Browser Caching Rules
 * Manages browser-level caching rules and strategies
 */

class BrowserCachingRules {
    constructor() {
        this.rules = new Map();
        this.init();
    }
    
    init() {
        this.setupRules();
        this.applyRules();
        this.trackEvent('cache_rules_initialized');
    }
    
    setupRules() {
        // Static assets - long cache
        this.rules.set(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/i, {
            maxAge: 31536000, // 1 year
            cacheControl: 'public, immutable'
        });
        
        // CSS/JS - versioned cache
        this.rules.set(/\.(css|js)$/i, {
            maxAge: 86400, // 1 day
            cacheControl: 'public, must-revalidate'
        });
        
        // Fonts - long cache
        this.rules.set(/\.(woff|woff2|ttf|otf|eot)$/i, {
            maxAge: 31536000,
            cacheControl: 'public, immutable'
        });
        
        // HTML - short cache
        this.rules.set(/\.(html|htm)$/i, {
            maxAge: 3600, // 1 hour
            cacheControl: 'public, must-revalidate'
        });
    }
    
    applyRules() {
        // Apply caching rules to resources
        // This is typically done server-side, but we can set meta tags
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Cache-Control';
        meta.content = 'public, max-age=3600';
        document.head.appendChild(meta);
    }
    
    getCacheHeaders(url) {
        const rule = this.getRule(url);
        return {
            'Cache-Control': rule.cacheControl,
            'Expires': new Date(Date.now() + rule.maxAge * 1000).toUTCString()
        };
    }
    
    getRule(url) {
        for (const [pattern, rule] of this.rules.entries()) {
            if (pattern.test(url)) {
                return rule;
            }
        }
        
        return {
            maxAge: 3600,
            cacheControl: 'public, max-age=3600'
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cache_rules_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.browserCachingRules = new BrowserCachingRules(); });
} else {
    window.browserCachingRules = new BrowserCachingRules();
}

