/**
 * Enhanced XSS Protection
 * Advanced protection against Cross-Site Scripting attacks
 * 
 * Features:
 * - Input sanitization
 * - Output encoding
 * - Content Security Policy headers
 * - DOM XSS prevention
 */

class XSSProtection {
    constructor() {
        this.allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'code', 'pre'];
        this.allowedAttributes = {
            'a': ['href', 'title'],
            'img': ['src', 'alt', 'title', 'width', 'height']
        };
        this.init();
    }

    init() {
        // Sanitize user inputs
        this.sanitizeInputs();

        // Monitor dynamic content
        this.monitorDynamicContent();

        // Setup CSP
        this.setupCSP();

        console.log('🛡️ Enhanced XSS Protection initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("x_ss_pr_ot_ec_ti_on_" + eventName, 1, data);
            }
        } catch (_e) { /* Silent fail */ }
    }


    sanitizeInputs() {
        // Intercept form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    if (input.value) {
                        input.value = this.sanitize(input.value);
                    }
                });
            }
        });

        // Sanitize on input
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                const original = e.target.value;
                const sanitized = this.sanitize(original);
                if (original !== sanitized) {
                    const cursorPos = e.target.selectionStart;
                    e.target.value = sanitized;
                    e.target.setSelectionRange(cursorPos, cursorPos);
                }
            }
        });
    }

    sanitize(input) {
        if (typeof input !== 'string') {
            return input;
        }

        // Remove script tags and event handlers
        return input
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/data:text\/html/gi, '')
            .replace(/vbscript:/gi, '');
    }

    sanitizeHTML(html) {
        // Create temporary element
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Remove script tags
        const scripts = temp.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Remove event handlers
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return temp.innerHTML;
    }

    encodeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    monitorDynamicContent() {
        // Watch for innerHTML usage
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check for suspicious content
                        this.checkForXSS(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    checkForXSS(element) {
        // Check for script tags
        const scripts = element.querySelectorAll('script');
        if (scripts.length > 0) {
            console.log('⚠️ Potential XSS: Script tags detected in dynamic content');
            scripts.forEach(script => script.remove());
        }

        // Check for event handlers
        const elementsWithHandlers = element.querySelectorAll('*');
        elementsWithHandlers.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    console.log('⚠️ Potential XSS: Event handler detected', attr.name);
                    el.removeAttribute(attr.name);
                }
            });
        });
    }

    setupCSP() {
        // Add Content Security Policy meta tag
        let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!cspMeta) {
            cspMeta = document.createElement('meta');
            cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
            cspMeta.content = `
                default-src 'self';
                script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net;
                style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                font-src 'self' https://fonts.gstatic.com;
                img-src 'self' data: https:;
                connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com wss://*.livekit.cloud https://unpkg.com https://raw.githubusercontent.com;
                frame-src 'self';
                object-src 'none';
                base-uri 'self';
                form-action 'self';
            `.replace(/\s+/g, ' ').trim();
            document.head.appendChild(cspMeta);
        }
    }

    // Public API
    safeSetHTML(element, html) {
        element.innerHTML = this.sanitizeHTML(html);
    }

    safeSetText(element, text) {
        element.textContent = text;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.xssProtection = new XSSProtection();
    });
} else {
    window.xssProtection = new XSSProtection();
}

