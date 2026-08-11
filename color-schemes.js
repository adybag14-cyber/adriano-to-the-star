/**
 * Customizable Color Schemes
 * Allow users to customize the site's color palette
 */

class ColorSchemeManager {
    constructor() {
        this.schemes = {
            default: {
                name: 'Default',
                colors: {
                    primary: '#ba944f',
                    secondary: '#d4b86a',
                    background: '#0a0a14',
                    text: '#ffffff',
                    accent: '#4cd137'
                }
            },
            cosmic: {
                name: 'Cosmic Blue',
                colors: {
                    primary: '#4a90e2',
                    secondary: '#6bb3ff',
                    background: '#0a0a14',
                    text: '#ffffff',
                    accent: '#00d4ff'
                }
            },
            nebula: {
                name: 'Nebula Purple',
                colors: {
                    primary: '#9b59b6',
                    secondary: '#bb8fce',
                    background: '#0a0a14',
                    text: '#ffffff',
                    accent: '#e74c3c'
                }
            },
            solar: {
                name: 'Solar Orange',
                colors: {
                    primary: '#f39c12',
                    secondary: '#f5b041',
                    background: '#0a0a14',
                    text: '#ffffff',
                    accent: '#e67e22'
                }
            },
            emerald: {
                name: 'Emerald Green',
                colors: {
                    primary: '#2ecc71',
                    secondary: '#58d68d',
                    background: '#0a0a14',
                    text: '#ffffff',
                    accent: '#27ae60'
                }
            },
            crimson: {
                name: 'Crimson Red',
                colors: {
                    primary: '#e74c3c',
                    secondary: '#ec7063',
                    background: '#0a0a14',
                    text: '#ffffff',
                    accent: '#c0392b'
                }
            }
        };

        this.currentScheme = 'default';
        this.customScheme = null;
        this.init();
    }

    init() {
        this.loadScheme();
        this.applyScheme(this.currentScheme);
        this.createColorPicker();
        this.trackEvent('color_mgr_initialized');
    }

    /**
     * Load saved color scheme
     */
    loadScheme() {
        const saved = localStorage.getItem('color-scheme');
        if (saved) {
            if (this.schemes[saved]) {
                this.currentScheme = saved;
            } else {
                // Try to parse as custom scheme
                try {
                    this.customScheme = JSON.parse(saved);
                    this.currentScheme = 'custom';
                } catch (e) {
                    this.currentScheme = 'default';
                }
            }
        }
    }

    /**
     * Apply color scheme
     */
    applyScheme(schemeName) {
        let colors;
        
        if (schemeName === 'custom' && this.customScheme) {
            colors = this.customScheme;
        } else if (this.schemes[schemeName]) {
            colors = this.schemes[schemeName].colors;
        } else {
            colors = this.schemes.default.colors;
        }

        const root = document.documentElement;
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-secondary', colors.secondary);
        root.style.setProperty('--color-background', colors.background);
        root.style.setProperty('--color-text', colors.text);
        root.style.setProperty('--color-accent', colors.accent);

        // Update CSS variables for all color usages
        this.updateColorVariables(colors);

        // Save preference
        if (schemeName === 'custom') {
            localStorage.setItem('color-scheme', JSON.stringify(this.customScheme));
        } else {
            localStorage.setItem('color-scheme', schemeName);
        }

        this.currentScheme = schemeName;
    }

    /**
     * Update CSS color variables
     */
    updateColorVariables(colors) {
        const style = document.createElement('style');
        style.id = 'color-scheme-style';
        
        style.textContent = `
            :root {
                --color-primary: ${colors.primary};
                --color-secondary: ${colors.secondary};
                --color-background: ${colors.background};
                --color-text: ${colors.text};
                --color-accent: ${colors.accent};
            }
            
            .page-hero,
            .content-container,
            .cta-button,
            .outline-btn {
                --primary-color: ${colors.primary};
                --secondary-color: ${colors.secondary};
            }
            
            .cta-button {
                background: ${colors.primary};
                border-color: ${colors.primary};
            }
            
            .cta-button:hover {
                background: ${colors.secondary};
                border-color: ${colors.secondary};
            }
            
            .outline-btn {
                border-color: ${colors.primary};
                color: ${colors.primary};
            }
            
            .outline-btn:hover {
                background: ${colors.primary};
                color: #ffffff;
            }
            
            a {
                color: ${colors.primary};
            }
            
            a:hover {
                color: ${colors.secondary};
            }
            
            h1, h2, h3, h4, h5, h6 {
                color: ${colors.primary};
            }
            
            .theme-toggle-btn,
            .accessibility-toggle {
                background: rgba(${this.hexToRgb(colors.primary)}, 0.2);
                border-color: rgba(${this.hexToRgb(colors.primary)}, 0.4);
                color: ${colors.primary};
            }
            
            .theme-toggle-btn:hover,
            .accessibility-toggle:hover {
                background: rgba(${this.hexToRgb(colors.primary)}, 0.3);
                border-color: rgba(${this.hexToRgb(colors.primary)}, 0.6);
            }
        `;

        const existing = document.getElementById('color-scheme-style');
        if (existing) existing.remove();
        document.head.appendChild(style);
    }

    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '186, 148, 79';
    }

    /**
     * Create color picker UI
     */
    createColorPicker() {
        if (document.getElementById('color-scheme-picker')) return;

        const picker = document.createElement('div');
        picker.id = 'color-scheme-picker';
        picker.className = 'color-scheme-picker';
        picker.innerHTML = `
            <button id="color-scheme-toggle" class="color-scheme-toggle" aria-label="Color scheme picker">
                🎨
            </button>
            <div id="color-scheme-menu" class="color-scheme-menu" style="display: none;">
                <div class="scheme-menu-header">
                    <h4>Color Schemes</h4>
                    <button class="close-scheme-menu" aria-label="Close">&times;</button>
                </div>
                <div class="scheme-presets">
                    ${Object.entries(this.schemes).map(([key, scheme]) => `
                        <button class="scheme-preset ${key === this.currentScheme ? 'active' : ''}" 
                                data-scheme="${key}"
                                onclick="colorSchemeManager.applyScheme('${key}')">
                            <div class="scheme-preview">
                                <span class="scheme-color" style="background: ${scheme.colors.primary}"></span>
                                <span class="scheme-color" style="background: ${scheme.colors.secondary}"></span>
                                <span class="scheme-color" style="background: ${scheme.colors.accent}"></span>
                            </div>
                            <span class="scheme-name">${scheme.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="custom-color-section">
                    <h5>Custom Colors</h5>
                    <div class="color-inputs">
                        <label>
                            Primary
                            <input type="color" id="custom-primary" value="${this.schemes.default.colors.primary}">
                        </label>
                        <label>
                            Secondary
                            <input type="color" id="custom-secondary" value="${this.schemes.default.colors.secondary}">
                        </label>
                        <label>
                            Accent
                            <input type="color" id="custom-accent" value="${this.schemes.default.colors.accent}">
                        </label>
                    </div>
                    <button class="apply-custom-btn" onclick="colorSchemeManager.applyCustomScheme()">
                        Apply Custom
                    </button>
                </div>
            </div>
        `;

        // Style the picker
        const style = document.createElement('style');
        style.textContent = `
            .color-scheme-toggle {
                position: fixed;
                bottom: 260px;
                right: 20px;
                z-index: 9997;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(186, 148, 79, 0.2);
                border: 2px solid rgba(186, 148, 79, 0.4);
                color: #ba944f;
                font-size: 1.5rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .color-scheme-toggle:hover {
                background: rgba(186, 148, 79, 0.3);
                border-color: rgba(186, 148, 79, 0.6);
                transform: scale(1.1);
            }
            
            .color-scheme-menu {
                position: fixed;
                bottom: 320px;
                right: 20px;
                z-index: 9998;
                background: linear-gradient(135deg, rgba(8, 10, 25, 0.95), rgba(18, 22, 40, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.4);
                border-radius: 12px;
                padding: 1.5rem;
                max-width: 300px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
            }
            
            .scheme-menu-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(186, 148, 79, 0.2);
            }
            
            .scheme-menu-header h4 {
                margin: 0;
                color: #ba944f;
                font-family: 'Raleway', sans-serif;
            }
            
            .close-scheme-menu {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
            }
            
            .scheme-presets {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
                margin-bottom: 1.5rem;
            }
            
            .scheme-preset {
                padding: 1rem;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid rgba(186, 148, 79, 0.2);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }
            
            .scheme-preset:hover {
                border-color: rgba(186, 148, 79, 0.4);
                transform: translateY(-2px);
            }
            
            .scheme-preset.active {
                border-color: rgba(186, 148, 79, 0.6);
                background: rgba(186, 148, 79, 0.1);
            }
            
            .scheme-preview {
                display: flex;
                gap: 0.25rem;
            }
            
            .scheme-color {
                width: 20px;
                height: 20px;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .scheme-name {
                font-size: 0.85rem;
                color: rgba(255, 255, 255, 0.9);
                font-family: 'Raleway', sans-serif;
            }
            
            .custom-color-section {
                border-top: 1px solid rgba(186, 148, 79, 0.2);
                padding-top: 1rem;
            }
            
            .custom-color-section h5 {
                margin: 0 0 1rem 0;
                color: #ba944f;
                font-family: 'Raleway', sans-serif;
                font-size: 1rem;
            }
            
            .color-inputs {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            
            .color-inputs label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: rgba(255, 255, 255, 0.9);
                font-family: 'Raleway', sans-serif;
                font-size: 0.9rem;
            }
            
            .color-inputs input[type="color"] {
                width: 50px;
                height: 30px;
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 4px;
                cursor: pointer;
            }
            
            .apply-custom-btn {
                width: 100%;
                padding: 0.75rem;
                background: rgba(186, 148, 79, 0.2);
                border: 2px solid rgba(186, 148, 79, 0.4);
                border-radius: 8px;
                color: #ba944f;
                font-family: 'Raleway', sans-serif;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .apply-custom-btn:hover {
                background: rgba(186, 148, 79, 0.3);
                border-color: rgba(186, 148, 79, 0.6);
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(picker);

        // Toggle menu
        document.getElementById('color-scheme-toggle').addEventListener('click', () => {
            const menu = document.getElementById('color-scheme-menu');
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });

        document.querySelector('.close-scheme-menu').addEventListener('click', () => {
            document.getElementById('color-scheme-menu').style.display = 'none';
        });

        // Update active state when scheme changes
        this.updateActiveScheme();
    }

    /**
     * Apply custom color scheme
     */
    applyCustomScheme() {
        const primary = document.getElementById('custom-primary').value;
        const secondary = document.getElementById('custom-secondary').value;
        const accent = document.getElementById('custom-accent').value;

        this.customScheme = {
            primary,
            secondary,
            background: '#0a0a14',
            text: '#ffffff',
            accent
        };

        this.applyScheme('custom');
        this.updateActiveScheme();
        
        document.getElementById('color-scheme-menu').style.display = 'none';
    }

    /**
     * Update active scheme indicator
     */
    updateActiveScheme() {
        document.querySelectorAll('.scheme-preset').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.scheme === this.currentScheme) {
                btn.classList.add('active');
            }
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`color_mgr_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize color scheme manager
let colorSchemeManagerInstance = null;

function initColorSchemeManager() {
    if (!colorSchemeManagerInstance) {
        colorSchemeManagerInstance = new ColorSchemeManager();
    }
    return colorSchemeManagerInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initColorSchemeManager);
} else {
    initColorSchemeManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorSchemeManager;
}

// Make available globally
window.ColorSchemeManager = ColorSchemeManager;
window.colorSchemeManager = () => colorSchemeManagerInstance;

