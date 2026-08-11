/**
 * Theme Toggle System
 * Dark/Light theme switcher with persistence
 */

(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (window.__themeToggleJsLoaded) {
        return;
    }

    window.__themeToggleJsLoaded = true;

class ThemeToggle {
    constructor() {
        this.currentTheme = 'dark'; // Default to dark
        this.themes = {
            dark: {
                name: 'Dark',
                icon: '🌙',
                class: 'theme-dark',
                description: 'Classic dark theme with gold accents'
            },
            light: {
                name: 'Light',
                icon: '☀️',
                class: 'theme-light',
                description: 'Bright light theme for daytime viewing'
            },
            cosmic: {
                name: 'Cosmic',
                icon: '✨',
                class: 'theme-cosmic',
                description: 'Deep space theme with purple and blue'
            },
            solar: {
                name: 'Solar',
                icon: '☀️',
                class: 'theme-solar',
                description: 'Warm orange and yellow theme'
            }
        };

        this.init();
    }

    init() {
        // Load saved theme preference
        this.loadTheme();

        // Apply theme immediately
        this.applyTheme(this.currentTheme);

        // Create toggle button
        this.createToggleButton();

        // Listen for system theme changes
        this.watchSystemTheme();
    }

    /**
     * Load theme from localStorage or system preference
     */
    loadTheme() {
        const saved = localStorage.getItem('theme-preference');
        if (saved && this.themes[saved]) {
            this.currentTheme = saved;
        } else {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                this.currentTheme = 'light';
            } else {
                this.currentTheme = 'dark';
            }
        }
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        if (!this.themes[theme]) return;

        const root = document.documentElement;
        const body = document.body;

        // Remove all theme classes
        Object.values(this.themes).forEach(t => {
            root.classList.remove(t.class);
            body.classList.remove(t.class);
        });

        // Add current theme class
        root.classList.add(this.themes[theme].class);
        body.classList.add(this.themes[theme].class);

        // Set data attribute for CSS
        root.setAttribute('data-theme', theme);

        // Save preference
        localStorage.setItem('theme-preference', theme);
        this.currentTheme = theme;

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    /**
     * Toggle between dark and light themes (quick toggle)
     */
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.updateToggleButton();
        this.updateThemeSelector();
    }

    /**
     * Update theme selector menu
     */
    updateThemeSelector() {
        const selector = document.getElementById('theme-selector-menu');
        if (!selector) return;

        selector.querySelectorAll('.theme-option').forEach(option => {
            const theme = option.dataset.theme;
            if (theme === this.currentTheme) {
                option.classList.add('active');
                if (!option.querySelector('.checkmark')) {
                    const checkmark = document.createElement('span');
                    checkmark.className = 'checkmark';
                    checkmark.textContent = '✓';
                    option.appendChild(checkmark);
                }
            } else {
                option.classList.remove('active');
                const checkmark = option.querySelector('.checkmark');
                if (checkmark) checkmark.remove();
            }
        });
    }

    /**
     * Create toggle button with theme selector
     */
    createToggleButton() {
        // Check if button already exists
        if (document.getElementById('theme-toggle-btn')) return;

        const container = document.createElement('div');
        container.id = 'theme-toggle-container';
        container.className = 'theme-toggle-container';

        const button = document.createElement('button');
        button.id = 'theme-toggle-btn';
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('title', 'Change theme');
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');

        this.updateToggleButton(button);

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showThemeSelector();
            const expanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', (!expanded).toString());
        });

        // Click outside to close selector
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                this.hideThemeSelector();
                button.setAttribute('aria-expanded', 'false');
            }
        });

        container.appendChild(button);
        document.body.appendChild(container);
    }

    /**
     * Show theme selector menu
     */
    showThemeSelector() {
        let selector = document.getElementById('theme-selector-menu');
        if (selector) {
            const isVisible = selector.style.display !== 'none';
            selector.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                const activeBtn = selector.querySelector('.theme-option.active');
                if (activeBtn) activeBtn.focus();
            }
            return;
        }

        selector = document.createElement('div');
        selector.id = 'theme-selector-menu';
        selector.className = 'theme-selector-menu';
        selector.setAttribute('role', 'menu');
        selector.setAttribute('aria-label', 'Theme Selection');

        selector.innerHTML = `
            <div class="theme-selector-header">
                <h3>Choose Theme</h3>
            </div>
            <div class="theme-options" role="group">
                ${Object.entries(this.themes).map(([key, theme]) => `
                    <button class="theme-option ${this.currentTheme === key ? 'active' : ''}" 
                            data-theme="${key}"
                            role="menuitemradio"
                            aria-checked="${this.currentTheme === key ? 'true' : 'false'}"
                            title="${theme.description}">
                        <span class="theme-icon">${theme.icon}</span>
                        <span class="theme-name">${theme.name}</span>
                        ${this.currentTheme === key ? '<span class="checkmark">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
        `;

        // Add event listeners
        const options = selector.querySelectorAll('.theme-option');
        options.forEach((option, index) => {
            // Click handler
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.setTheme(theme);
                this.hideThemeSelector();
                // Return focus to toggle button
                const toggle = document.getElementById('theme-toggle-btn');
                if (toggle) toggle.focus();
            });

            // Keyboard navigation
            option.addEventListener('keydown', (e) => {
                let targetIndex = index;
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    targetIndex = (index + 1) % options.length;
                    options[targetIndex].focus();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    targetIndex = (index - 1 + options.length) % options.length;
                    options[targetIndex].focus();
                } else if (e.key === 'Escape') {
                    this.hideThemeSelector();
                    const toggle = document.getElementById('theme-toggle-btn');
                    if (toggle) toggle.focus();
                }
            });
        });

        const container = document.getElementById('theme-toggle-container');
        if (container) {
            container.appendChild(selector);
            // Focus active option immediately
            const active = selector.querySelector('.theme-option.active');
            if (active) active.focus();
        }
    }

    /**
     * Hide theme selector menu
     */
    hideThemeSelector() {
        const selector = document.getElementById('theme-selector-menu');
        if (selector) {
            selector.style.display = 'none';
        }
    }

    /**
     * Update toggle button appearance
     */
    updateToggleButton(button = null) {
        const btn = button || document.getElementById('theme-toggle-btn');
        if (!btn) return;

        const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        const theme = this.themes[this.currentTheme];
        const nextThemeInfo = this.themes[nextTheme];

        btn.innerHTML = theme.icon;
        btn.setAttribute('title', `Switch to ${nextThemeInfo.name.toLowerCase()} theme`);
        btn.setAttribute('aria-label', `Current theme: ${theme.name}. Click to switch to ${nextThemeInfo.name}`);
    }

    /**
     * Watch for system theme changes
     */
    watchSystemTheme() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

        // Only auto-switch if user hasn't set a preference
        const hasUserPreference = localStorage.getItem('theme-preference');

        const handleChange = (e) => {
            if (!hasUserPreference) {
                this.applyTheme(e.matches ? 'light' : 'dark');
                this.updateToggleButton();
            }
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
        }
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Set specific theme
     */
    setTheme(theme) {
        if (this.themes[theme]) {
            this.applyTheme(theme);
            this.updateToggleButton();
        }
    }
}

// Initialize theme toggle
let themeToggleInstance = null;

function initThemeToggle() {
    if (!themeToggleInstance) {
        themeToggleInstance = new ThemeToggle();
    }
    return themeToggleInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
    initThemeToggle();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
}

// Make available globally
window.ThemeToggle = ThemeToggle;
window.themeToggle = () => themeToggleInstance;

})();

