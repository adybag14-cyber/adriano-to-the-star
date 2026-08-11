/**
 * CSRF Protection
 * Cross-Site Request Forgery protection for forms and API calls
 * 
 * Features:
 * - CSRF token generation
 * - Token validation
 * - Automatic token injection
 * - Token rotation
 */

class CSRFProtection {
    constructor() {
        this.token = null;
        this.tokenName = 'X-CSRF-Token';
        this.tokenHeader = 'X-CSRF-Token';
        this.init();
    }
    
    init() {
        // Generate or retrieve token
        this.getToken();
        
        // Inject tokens into forms
        this.injectTokens();
        
        // Monitor new forms
        this.observeNewForms();
        
        // Setup fetch interceptor
        this.setupFetchInterceptor();
        
        console.log('🔒 CSRF Protection initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("c_sr_fp_ro_te_ct_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    generateToken() {
        // Generate a secure random token
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    getToken() {
        // Try to get token from sessionStorage
        this.token = sessionStorage.getItem('csrf-token');
        
        if (!this.token) {
            // Generate new token
            this.token = this.generateToken();
            sessionStorage.setItem('csrf-token', this.token);
        }
        
        // Set token in meta tag for easy access
        let meta = document.querySelector('meta[name="csrf-token"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'csrf-token';
            document.head.appendChild(meta);
        }
        meta.content = this.token;
        
        return this.token;
    }
    
    injectTokens() {
        // Inject hidden input into all forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.querySelector(`input[name="${this.tokenName}"]`)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = this.tokenName;
                input.value = this.token;
                form.appendChild(input);
            }
        });
    }
    
    observeNewForms() {
        // Watch for dynamically added forms
        const observer = new MutationObserver(() => {
            this.injectTokens();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    setupFetchInterceptor() {
        // Intercept fetch requests and add CSRF token
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Only add token for same-origin requests
            const urlObj = new URL(url, window.location.origin);
            const isSameOrigin = urlObj.origin === window.location.origin;
            
            if (isSameOrigin) {
                // Add CSRF token to headers
                options.headers = options.headers || {};
                if (!(options.headers instanceof Headers)) {
                    options.headers = new Headers(options.headers);
                }
                
                // Only add for state-changing methods
                const method = (options.method || 'GET').toUpperCase();
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                    options.headers.set(this.tokenHeader, this.token);
                }
            }
            
            return originalFetch(url, options);
        };
    }
    
    validateToken(token) {
        return token === this.token;
    }
    
    rotateToken() {
        this.token = this.generateToken();
        sessionStorage.setItem('csrf-token', this.token);
        this.injectTokens();
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.csrfProtection = new CSRFProtection();
    });
} else {
    window.csrfProtection = new CSRFProtection();
}
