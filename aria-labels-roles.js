/**
 * ARIA Labels and Roles Throughout
 * Add ARIA labels and roles
 */
(function() {
    'use strict';

    class ARIALabelsRoles {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.addARIA();
            this.trackEvent('aria_labels_initialized');
        }

        setupUI() {
            if (!document.getElementById('aria-labels')) {
                const aria = document.createElement('div');
                aria.id = 'aria-labels';
                aria.className = 'aria-labels';
                aria.innerHTML = `<h2>ARIA Labels</h2>`;
                document.body.appendChild(aria);
            }
        }

        addARIA() {
            // Add roles to common elements
            document.querySelectorAll('nav').forEach(nav => {
                if (!nav.getAttribute('role')) {
                    nav.setAttribute('role', 'navigation');
                }
            });

            document.querySelectorAll('main').forEach(main => {
                if (!main.getAttribute('role')) {
                    main.setAttribute('role', 'main');
                }
            });

            document.querySelectorAll('button').forEach(button => {
                if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                    button.setAttribute('aria-label', 'Button');
                }
            });
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`aria_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ariaLabels = new ARIALabelsRoles();
        });
    } else {
        window.ariaLabels = new ARIALabelsRoles();
    }
})();

