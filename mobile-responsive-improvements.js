/**
 * Mobile Responsive Design Improvements
 * Improve mobile responsiveness
 */
(function() {
    'use strict';

    class MobileResponsiveImprovements {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.improveResponsiveness();
        }

        setupUI() {
            if (!document.getElementById('mobile-responsive')) {
                const responsive = document.createElement('div');
                responsive.id = 'mobile-responsive';
                responsive.className = 'mobile-responsive';
                responsive.innerHTML = `<h2>Mobile Responsive</h2>`;
                document.body.appendChild(responsive);
            }
        }

        improveResponsiveness() {
            // Add touch-friendly tap targets
            document.querySelectorAll('button, a').forEach(element => {
                if (element.offsetHeight < 44 || element.offsetWidth < 44) {
                    element.style.minHeight = '44px';
                    element.style.minWidth = '44px';
                }
            });

            // Improve form inputs on mobile
            document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(input => {
                if (!input.getAttribute('autocomplete')) {
                    input.setAttribute('autocomplete', 'on');
                }
            });

            // Add viewport meta if missing
            if (!document.querySelector('meta[name="viewport"]')) {
                const viewport = document.createElement('meta');
                viewport.name = 'viewport';
                viewport.content = 'width=device-width, initial-scale=1.0';
                document.head.appendChild(viewport);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.mobileResponsive = new MobileResponsiveImprovements();
        });
    } else {
        window.mobileResponsive = new MobileResponsiveImprovements();
    }
})();

