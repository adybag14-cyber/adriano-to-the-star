/**
 * Security Enhancements
 * Enhanced XSS protection, CSRF protection, and security headers
 */

class SecurityEnhancements {
    constructor() {
        this.csrfToken = this.generateCSRFToken();
        this.init();
    }

    init() {
        this.setupXSSProtection();
        this.setupCSRFProtection();
        this.setupSecurityHeaders();
        this.setupInputSanitization();
        this.trackEvent('sec_enhancements_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sec_enhancements_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Generate CSRF token
     */
    generateCSRFToken() {
        let token = sessionStorage.getItem('csrf-token');
        if (!token) {
            token = this.randomString(32);
            sessionStorage.setItem('csrf-token', token);
        }
        return token;
    }

    /**
     * Generate random string
     */
    randomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Setup XSS protection
     */
    setupXSSProtection() {
        // Enhanced HTML escaping
        this.escapeHTML = (str) => {
            if (typeof str !== 'string') return str;
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '/': '&#x2F;'
            };
            return str.replace(/[&<>"'/]/g, (m) => map[m]);
        };

        // Sanitize HTML (remove dangerous tags and attributes)
        this.sanitizeHTML = (html) => {
            if (typeof html !== 'string') return '';
            
            // Remove script tags and event handlers
            html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            html = html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
            html = html.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
            
            // Remove javascript: and data: URLs
            html = html.replace(/javascript:/gi, '');
            html = html.replace(/data:text\/html/gi, '');
            
            return html;
        };

        // Override innerHTML setters for XSS protection
        this.protectInnerHTML();
    }

    /**
     * Protect innerHTML setters
     */
    protectInnerHTML() {
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        const self = this;

        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                if (typeof value === 'string') {
                    // Sanitize before setting
                    const sanitized = self.sanitizeHTML ? self.sanitizeHTML(value) : value;
                    originalInnerHTML.set.call(this, sanitized);
                } else {
                    originalInnerHTML.set.call(this, value);
                }
            },
            get: originalInnerHTML.get,
            configurable: true
        });
    }

    /**
     * Setup CSRF protection
     */
    setupCSRFProtection() {
        // Add CSRF token to all forms
        document.addEventListener('DOMContentLoaded', () => {
            this.addCSRFTokensToForms();
        });

        // Watch for dynamically added forms
        const observer = new MutationObserver(() => {
            this.addCSRFTokensToForms();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Intercept fetch requests to add CSRF token
        this.interceptFetch();
    }

    /**
     * Add CSRF tokens to forms
     */
    addCSRFTokensToForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.querySelector('input[name="csrf-token"]')) {
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = 'csrf-token';
                tokenInput.value = this.csrfToken;
                form.appendChild(tokenInput);
            }
        });
    }

    /**
     * Intercept fetch requests
     */
    interceptFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Add CSRF token to POST/PUT/DELETE requests
            if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
                if (!options.headers) {
                    options.headers = {};
                }
                
                if (typeof options.headers === 'object' && !(options.headers instanceof Headers)) {
                    options.headers['X-CSRF-Token'] = this.csrfToken;
                } else if (options.headers instanceof Headers) {
                    options.headers.set('X-CSRF-Token', this.csrfToken);
                }
            }

            return originalFetch(url, options);
        };
    }

    /**
     * Setup security headers (meta tags)
     */
    setupSecurityHeaders() {
        // Content Security Policy (CSP) - basic
        let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!cspMeta) {
            cspMeta = document.createElement('meta');
            cspMeta.httpEquiv = 'Content-Security-Policy';
            cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.puter.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.puter.com https://*.supabase.co;";
            document.head.appendChild(cspMeta);
        }

        // X-Frame-Options
        let frameMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
        if (!frameMeta) {
            frameMeta = document.createElement('meta');
            frameMeta.httpEquiv = 'X-Frame-Options';
            frameMeta.content = 'SAMEORIGIN';
            document.head.appendChild(frameMeta);
        }

        // X-Content-Type-Options
        let contentTypeMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
        if (!contentTypeMeta) {
            contentTypeMeta = document.createElement('meta');
            contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
            contentTypeMeta.content = 'nosniff';
            document.head.appendChild(contentTypeMeta);
        }
    }

    /**
     * Setup input sanitization
     */
    setupInputSanitization() {
        // Sanitize all text inputs on blur
        document.addEventListener('blur', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                const value = e.target.value;
                if (value && typeof value === 'string') {
                    // Remove potential XSS patterns
                    const sanitized = value
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/javascript:/gi, '')
                        .replace(/on\w+\s*=/gi, '');
                    
                    if (sanitized !== value) {
                        e.target.value = sanitized;
                    }
                }
            }
        }, true);
    }

    /**
     * Validate CSRF token
     */
    validateCSRFToken(token) {
        return token === this.csrfToken;
    }

    /**
     * Get CSRF token
     */
    getCSRFToken() {
        return this.csrfToken;
    }
}

// Initialize security enhancements
let securityEnhancementsInstance = null;

function initSecurityEnhancements() {
    if (!securityEnhancementsInstance) {
        securityEnhancementsInstance = new SecurityEnhancements();
    }
    return securityEnhancementsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurityEnhancements);
} else {
    initSecurityEnhancements();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityEnhancements;
}

// Make available globally
window.SecurityEnhancements = SecurityEnhancements;
window.securityEnhancements = () => securityEnhancementsInstance;

