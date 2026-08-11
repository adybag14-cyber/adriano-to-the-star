/**
 * Content Security Policy (CSP) Configuration
 * Provides enhanced XSS protection through CSP headers
 */

class CSPConfig {
    constructor() {
        this.policies = {
            'default-src': ["'self'"],
            'script-src': [
                "'self'",
                "'unsafe-inline'", // Needed for inline scripts
                "'unsafe-eval'", // Needed for some libraries
                'https://fonts.googleapis.com',
                'https://cdn.jsdelivr.net',
                'https://js.puter.com',
                'https://www.googletagmanager.com',
                'https://www.google-analytics.com',
                'https://cdnjs.cloudflare.com'
            ],
            'style-src': [
                "'self'",
                "'unsafe-inline'", // Needed for inline styles
                'https://fonts.googleapis.com',
                'https://cdn.jsdelivr.net',
                'https://cdnjs.cloudflare.com'
            ],
            'font-src': [
                "'self'",
                'https://fonts.gstatic.com',
                'https://fonts.googleapis.com',
                'https://cdn.jsdelivr.net',
                'data:'
            ],
            'img-src': [
                "'self'",
                'data:',
                'blob:',
                'https:',
                'http:'
            ],
            'connect-src': [
                "'self'",
                'https://api.openai.com',
                'https://generativelanguage.googleapis.com',
                'https://*.supabase.co',
                'https://*.googleapis.com',
                'https://*.cloudfunctions.net',
                'wss://*.supabase.co',
                'ws://localhost:*',
                'https://*.gitlab.io'
            ],
            'media-src': [
                "'self'",
                'data:',
                'blob:',
                'https:'
            ],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
            'upgrade-insecure-requests': []
        };
        
        this.init();
    }

    init() {
        // Apply CSP via meta tag
        this.applyCSPMetaTag();
        
        // Log CSP initialization
        console.log('🛡️ Content Security Policy configured');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("c_sp_co_nf_ig_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Generate CSP header string
     */
    generateCSPString() {
        const directives = [];
        
        for (const [directive, sources] of Object.entries(this.policies)) {
            if (sources.length > 0) {
                directives.push(`${directive} ${sources.join(' ')}`);
            } else if (directive === 'upgrade-insecure-requests') {
                directives.push(directive);
            }
        }
        
        return directives.join('; ');
    }

    /**
     * Apply CSP via meta tag (for static sites)
     */
    applyCSPMetaTag() {
        // Remove existing CSP meta tag if any
        const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (existing) {
            existing.remove();
        }

        // Create new CSP meta tag
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = this.generateCSPString();
        
        // Insert at the beginning of head
        const head = document.head || document.getElementsByTagName('head')[0];
        if (head.firstChild) {
            head.insertBefore(meta, head.firstChild);
        } else {
            head.appendChild(meta);
        }
    }

    /**
     * Add source to policy
     */
    addSource(directive, source) {
        if (this.policies[directive]) {
            if (!this.policies[directive].includes(source)) {
                this.policies[directive].push(source);
                this.applyCSPMetaTag();
            }
        }
    }

    /**
     * Remove source from policy
     */
    removeSource(directive, source) {
        if (this.policies[directive]) {
            const index = this.policies[directive].indexOf(source);
            if (index > -1) {
                this.policies[directive].splice(index, 1);
                this.applyCSPMetaTag();
            }
        }
    }

    /**
     * Get CSP report-only string (for testing)
     */
    generateCSPReportOnlyString() {
        return this.generateCSPString() + '; report-uri /csp-report';
    }
}

// Initialize CSP on page load
if (typeof window !== 'undefined') {
    // Apply CSP immediately for early protection
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.cspConfig) {
                window.cspConfig = new CSPConfig();
            }
        });
    } else {
        if (!window.cspConfig) {
            window.cspConfig = new CSPConfig();
        }
    }
}

