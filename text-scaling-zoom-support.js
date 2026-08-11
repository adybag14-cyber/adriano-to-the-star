/**
 * Text Scaling and Zoom Support
 * Support text scaling and zoom
 */
(function() {
    'use strict';

    class TextScalingZoomSupport {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.setupZoomSupport();
        }

        setupUI() {
            if (!document.getElementById('text-scaling')) {
                const scaling = document.createElement('div');
                scaling.id = 'text-scaling';
                scaling.className = 'text-scaling';
                scaling.innerHTML = `
                    <button id="increase-text">A+</button>
                    <button id="decrease-text">A-</button>
                    <button id="reset-text">Reset</button>
                `;
                document.body.appendChild(scaling);
            }

            document.getElementById('increase-text')?.addEventListener('click', () => {
                this.increaseTextSize();
            });

            document.getElementById('decrease-text')?.addEventListener('click', () => {
                this.decreaseTextSize();
            });

            document.getElementById('reset-text')?.addEventListener('click', () => {
                this.resetTextSize();
            });
        }

        setupZoomSupport() {
            // Ensure viewport meta tag allows zoom
            let viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
            }
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
        }

        increaseTextSize() {
            const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
            document.body.style.fontSize = (currentSize * 1.1) + 'px';
        }

        decreaseTextSize() {
            const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
            document.body.style.fontSize = (currentSize * 0.9) + 'px';
        }

        resetTextSize() {
            document.body.style.fontSize = '';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.textScaling = new TextScalingZoomSupport();
        });
    } else {
        window.textScaling = new TextScalingZoomSupport();
    }
})();

