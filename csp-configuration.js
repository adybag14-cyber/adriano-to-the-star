/**
 * Content Security Policy (CSP) Configuration
 * Configure CSP headers
 */
(function() {
    'use strict';

    class CSPConfiguration {
        constructor() {
            this.policy = {
                'default-src': ["'self'"],
                'script-src': ["'self'", "'unsafe-inline'"],
                'style-src': ["'self'", "'unsafe-inline'"],
                'img-src': ["'self'", 'data:', 'https:'],
                'connect-src': ["'self'"]
            };
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('csp-config')) {
                const config = document.createElement('div');
                config.id = 'csp-config';
                config.className = 'csp-config';
                config.innerHTML = `<h2>CSP Configuration</h2>`;
                document.body.appendChild(config);
            }
        }

        getCSPHeader() {
            return Object.entries(this.policy)
                .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
                .join('; ');
        }

        updatePolicy(directive, sources) {
            this.policy[directive] = sources;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cspConfig = new CSPConfiguration();
        });
    } else {
        window.cspConfig = new CSPConfiguration();
    }
})();

