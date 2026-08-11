/**
 * Planet Discovery Dark Mode Enhancements
 * Enhanced dark mode with better contrast and readability
 */

class PlanetDiscoveryDarkModeEnhancements {
    constructor() {
        this.isDarkMode = false;
        this.preferences = {
            contrast: 'normal',
            brightness: 'normal',
            colorScheme: 'auto'
        };
        this.init();
    }

    init() {
        this.detectSystemPreference();
        this.loadUserPreferences();
        this.applyDarkMode();
        this.setupListeners();
        console.log('🌙 Dark mode enhancements initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_da_rk_mo_de_en_ha_nc_em_en_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    detectSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.isDarkMode = true;
        }
    }

    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('dark-mode-preferences');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.isDarkMode = prefs.enabled !== undefined ? prefs.enabled : this.isDarkMode;
                this.preferences = { ...this.preferences, ...prefs };
            }
        } catch (error) {
            console.error('Error loading dark mode preferences:', error);
        }
    }

    saveUserPreferences() {
        try {
            localStorage.setItem('dark-mode-preferences', JSON.stringify({
                enabled: this.isDarkMode,
                ...this.preferences
            }));
        } catch (error) {
            console.error('Error saving dark mode preferences:', error);
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.applyDarkMode();
        this.saveUserPreferences();
    }

    applyDarkMode() {
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark-mode');
            document.documentElement.setAttribute('data-theme', 'dark');
            this.applyDarkModeStyles();
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-theme', 'light');
            this.removeDarkModeStyles();
        }
    }

    applyDarkModeStyles() {
        const styleId = 'dark-mode-enhancements';
        let style = document.getElementById(styleId);
        
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        const contrast = this.preferences.contrast === 'high' ? '1.2' : '1';
        const brightness = this.preferences.brightness === 'high' ? '1.1' : '1';

        style.textContent = `
            .dark-mode {
                --bg-primary: #0a0a0f;
                --bg-secondary: #1a1a2e;
                --bg-tertiary: #16213e;
                --text-primary: #e0e0e0;
                --text-secondary: #b0b0b0;
                --accent-color: #ba944f;
                --border-color: rgba(186, 148, 79, 0.3);
                filter: contrast(${contrast}) brightness(${brightness});
            }
            
            .dark-mode body {
                background: var(--bg-primary);
                color: var(--text-primary);
            }
            
            .dark-mode .card, .dark-mode section {
                background: var(--bg-secondary);
                border-color: var(--border-color);
            }
            
            .dark-mode a {
                color: var(--accent-color);
            }
            
            .dark-mode button {
                background: var(--bg-tertiary);
                color: var(--text-primary);
                border-color: var(--border-color);
            }
            
            .dark-mode input, .dark-mode textarea, .dark-mode select {
                background: var(--bg-tertiary);
                color: var(--text-primary);
                border-color: var(--border-color);
            }
            
            .dark-mode ::selection {
                background: rgba(186, 148, 79, 0.3);
                color: var(--text-primary);
            }
        `;
    }

    removeDarkModeStyles() {
        const style = document.getElementById('dark-mode-enhancements');
        if (style) {
            style.remove();
        }
    }

    setContrast(level) {
        this.preferences.contrast = level;
        this.applyDarkMode();
        this.saveUserPreferences();
    }

    setBrightness(level) {
        this.preferences.brightness = level;
        this.applyDarkMode();
        this.saveUserPreferences();
    }

    setupListeners() {
        // Listen for system preference changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.preferences.colorScheme === 'auto') {
                    this.isDarkMode = e.matches;
                    this.applyDarkMode();
                }
            });
        }
    }

    renderDarkModeControls(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="dark-mode-controls" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">🌙 Dark Mode Settings</h3>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                        <input type="checkbox" id="dark-mode-toggle" ${this.isDarkMode ? 'checked' : ''} 
                            style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: rgba(255, 255, 255, 0.9);">Enable Dark Mode</span>
                    </label>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; display: block;">Contrast Level</label>
                    <select id="contrast-select" style="width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.5); color: white; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 5px;">
                        <option value="normal" ${this.preferences.contrast === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="high" ${this.preferences.contrast === 'high' ? 'selected' : ''}>High</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem; display: block;">Brightness Level</label>
                    <select id="brightness-select" style="width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.5); color: white; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 5px;">
                        <option value="normal" ${this.preferences.brightness === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="high" ${this.preferences.brightness === 'high' ? 'selected' : ''}>High</option>
                    </select>
                </div>
            </div>
        `;

        document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
            this.isDarkMode = e.target.checked;
            this.applyDarkMode();
            this.saveUserPreferences();
        });

        document.getElementById('contrast-select')?.addEventListener('change', (e) => {
            this.setContrast(e.target.value);
        });

        document.getElementById('brightness-select')?.addEventListener('change', (e) => {
            this.setBrightness(e.target.value);
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryDarkModeEnhancements = new PlanetDiscoveryDarkModeEnhancements();
}

