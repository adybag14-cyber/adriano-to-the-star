/**
 * Security Headers Configuration UI
 * Configure security headers
 */
(function() {
    'use strict';

    class SecurityHeadersConfigUI {
        constructor() {
            this.headers = {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000'
            };
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('sec_headers_ui_initialized');
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`sec_headers_ui_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }

        setupUI() {
            if (!document.getElementById('security-headers')) {
                const headers = document.createElement('div');
                headers.id = 'security-headers';
                headers.className = 'security-headers';
                headers.innerHTML = `<h2>Security Headers</h2>`;
                document.body.appendChild(headers);
            }
        }

        getHeaders() {
            return this.headers;
        }

        updateHeader(name, value) {
            this.headers[name] = value;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.securityHeaders = new SecurityHeadersConfigUI();
        });
    } else {
        window.securityHeaders = new SecurityHeadersConfigUI();
    }
})();

