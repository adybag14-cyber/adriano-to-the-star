/**
 * XSS and CSRF Protection Enhancements
 * Enhance XSS and CSRF protection
 */
(function () {
    'use strict';

    class XSSCSRFProtection {
        constructor() {
            this.csrfToken = null;
            this.init();
        }

        init() {
            this.setupUI();
            this.generateCSRFToken();
            this.sanitizeInputs();
        }

        setupUI() {
            const PROT_ID = 'xss-csrf-protection';
            if (!document.getElementById(PROT_ID)) {
                const protection = document.createElement('div');
                protection.id = PROT_ID;
                protection.className = PROT_ID;
                protection.innerHTML = `<h2>XSS/CSRF Protection</h2>`;
                document.body.appendChild(protection);
            }
        }

        generateCSRFToken() {
            this.csrfToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('csrfToken', this.csrfToken);
        }

        sanitizeInputs() {
            document.addEventListener('input', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    e.target.value = this.sanitize(e.target.value);
                }
            });
        }

        sanitize(input) {
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        }

        addCSRFTokenToRequest(options) {
            if (!options.headers) {
                options.headers = {};
            }
            options.headers['X-CSRF-Token'] = this.csrfToken;
            return options;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.xssCsrfProtection = new XSSCSRFProtection();
        });
    } else {
        window.xssCsrfProtection = new XSSCSRFProtection();
    }
})();

