/**
 * Security Headers Configuration
 * Configures security HTTP headers
 */

class SecurityHeadersConfig {
    constructor() {
        this.headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
        this.init();
    }
    
    init() {
        this.applyHeaders();
    }
    
    applyHeaders() {
        // Note: These headers are typically set server-side
        // This is a client-side configuration reference
        const meta = document.createElement('meta');
        meta.httpEquiv = 'X-Content-Type-Options';
        meta.content = 'nosniff';
        document.head.appendChild(meta);
        
        const frameMeta = document.createElement('meta');
        frameMeta.httpEquiv = 'X-Frame-Options';
        frameMeta.content = 'DENY';
        document.head.appendChild(frameMeta);
    }
    
    getHeaders() {
        return this.headers;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.securityHeadersConfig = new SecurityHeadersConfig(); });
} else {
    window.securityHeadersConfig = new SecurityHeadersConfig();
}
