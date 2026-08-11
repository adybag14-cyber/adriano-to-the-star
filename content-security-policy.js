/**
 * Content Security Policy (CSP)
 * CSP configuration and enforcement
 */

class ContentSecurityPolicy {
    constructor() {
        this.policy = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'connect-src': ["'self'", 'https://*.supabase.co'],
            'font-src': ["'self'", 'https://fonts.gstatic.com'],
            'frame-src': ["'none'"]
        };
        this.init();
    }
    
    init() {
        this.applyCSP();
        this.trackEvent('csp_initialized');
    }
    
    applyCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = this.buildPolicyString();
        document.head.appendChild(meta);
    }
    
    buildPolicyString() {
        return Object.entries(this.policy)
            .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
            .join('; ');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`csp_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.contentSecurityPolicy = new ContentSecurityPolicy(); });
} else {
    window.contentSecurityPolicy = new ContentSecurityPolicy();
}


