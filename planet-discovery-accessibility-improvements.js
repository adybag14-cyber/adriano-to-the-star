/**
 * Planet Discovery Accessibility Improvements
 * Enhanced accessibility features for better user experience
 */

class PlanetDiscoveryAccessibilityImprovements {
    constructor() {
        this.preferences = {
            fontSize: 'normal',
            highContrast: false,
            reduceMotion: false,
            screenReader: false
        };
        this.init();
    }

    init() {
        this.loadPreferences();
        this.applyPreferences();
        this.setupARIA();
        this.setupFocusManagement();
        this.setupScreenReaderSupport();
        console.log('♿ Accessibility improvements initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ac_ce_ss_ib_il_it_yi_mp_ro_ve_me_nt_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadPreferences() {
        try {
            const saved = localStorage.getItem('accessibility-preferences');
            if (saved) {
                this.preferences = { ...this.preferences, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading accessibility preferences:', error);
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Error saving accessibility preferences:', error);
        }
    }

    applyPreferences() {
        const root = document.documentElement;

        // Font size
        root.style.setProperty('--font-size-base', this.getFontSize());

        // High contrast
        if (this.preferences.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Reduce motion
        if (this.preferences.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }
    }

    getFontSize() {
        const sizes = {
            small: '14px',
            normal: '16px',
            large: '18px',
            xlarge: '20px'
        };
        return sizes[this.preferences.fontSize] || sizes.normal;
    }

    setFontSize(size) {
        this.preferences.fontSize = size;
        this.applyPreferences();
        this.savePreferences();
    }

    setHighContrast(enabled) {
        this.preferences.highContrast = enabled;
        this.applyPreferences();
        this.savePreferences();
    }

    setReduceMotion(enabled) {
        this.preferences.reduceMotion = enabled;
        this.applyPreferences();
        this.savePreferences();
    }

    setupARIA() {
        // Add ARIA labels to interactive elements without labels
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
            if (!btn.textContent.trim() && !btn.querySelector('img[alt]')) {
                btn.setAttribute('aria-label', 'Button');
            }
        });

        // Add ARIA labels to icons
        document.querySelectorAll('img[alt=""]').forEach(img => {
            if (img.parentElement.tagName === 'BUTTON' || img.parentElement.tagName === 'A') {
                img.setAttribute('aria-hidden', 'true');
            }
        });

        // Mark decorative images
        document.querySelectorAll('img:not([alt])').forEach(img => {
            img.setAttribute('alt', '');
            img.setAttribute('role', 'presentation');
        });
    }

    setupFocusManagement() {
        // Ensure focus is visible
        const style = document.createElement('style');
        style.textContent = `
            *:focus-visible {
                outline: 3px solid #ba944f;
                outline-offset: 2px;
            }
            
            .high-contrast *:focus-visible {
                outline: 4px solid #ffff00;
                outline-offset: 3px;
            }
        `;
        document.head.appendChild(style);

        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: #ba944f;
            color: white;
            padding: 0.5rem 1rem;
            z-index: 10000;
            text-decoration: none;
        `;
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '0';
        });
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    setupScreenReaderSupport() {
        // Add live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'sr-live-region';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(liveRegion);

        // Announce to screen readers
        this.announce = (message) => {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        };
    }

    renderAccessibilityPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="accessibility-panel" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">♿ Accessibility Settings</h3>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; display: block;">Font Size</label>
                    <select id="font-size-select" style="width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.5); color: white; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 5px;">
                        <option value="small" ${this.preferences.fontSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="normal" ${this.preferences.fontSize === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="large" ${this.preferences.fontSize === 'large' ? 'selected' : ''}>Large</option>
                        <option value="xlarge" ${this.preferences.fontSize === 'xlarge' ? 'selected' : ''}>Extra Large</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                        <input type="checkbox" id="high-contrast-toggle" ${this.preferences.highContrast ? 'checked' : ''} 
                            style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: rgba(255, 255, 255, 0.9);">High Contrast Mode</span>
                    </label>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                        <input type="checkbox" id="reduce-motion-toggle" ${this.preferences.reduceMotion ? 'checked' : ''} 
                            style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: rgba(255, 255, 255, 0.9);">Reduce Motion</span>
                    </label>
                </div>
            </div>
        `;

        document.getElementById('font-size-select')?.addEventListener('change', (e) => {
            this.setFontSize(e.target.value);
        });

        document.getElementById('high-contrast-toggle')?.addEventListener('change', (e) => {
            this.setHighContrast(e.target.checked);
        });

        document.getElementById('reduce-motion-toggle')?.addEventListener('change', (e) => {
            this.setReduceMotion(e.target.checked);
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryAccessibilityImprovements = new PlanetDiscoveryAccessibilityImprovements();
}

