/**
 * High Contrast Mode Support
 * Support high contrast mode
 */
(function() {
    'use strict';

    class HighContrastMode {
        constructor() {
            this.enabled = false;
            this.init();
        }

        init() {
            this.setupUI();
            this.detectSystemPreference();
        }

        setupUI() {
            if (!document.getElementById('high-contrast')) {
                const contrast = document.createElement('div');
                contrast.id = 'high-contrast';
                contrast.className = 'high-contrast';
                contrast.innerHTML = `
                    <button id="toggle-contrast">Toggle High Contrast</button>
                `;
                document.body.appendChild(contrast);
            }

            document.getElementById('toggle-contrast')?.addEventListener('click', () => {
                this.toggle();
            });
        }

        detectSystemPreference() {
            if (window.matchMedia('(prefers-contrast: high)').matches) {
                this.enable();
            }
        }

        toggle() {
            this.enabled = !this.enabled;
            if (this.enabled) {
                this.enable();
            } else {
                this.disable();
            }
        }

        enable() {
            document.body.classList.add('high-contrast-mode');
            this.enabled = true;
        }

        disable() {
            document.body.classList.remove('high-contrast-mode');
            this.enabled = false;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.highContrast = new HighContrastMode();
        });
    } else {
        window.highContrast = new HighContrastMode();
    }
})();

