/**
 * Enhanced Theme Toggle
 * Improved dark/light theme switching with persistence and transitions
 * 
 * Features:
 * - Smooth theme transitions
 * - System preference detection
 * - Theme persistence
 * - Multiple theme options
 */

class ThemeToggleEnhanced {
    constructor() {
        this.currentTheme = 'dark';
        this.themes = ['dark', 'light', 'auto'];
        this.init();
    }
    
    init() {
        // Load saved theme
        this.loadTheme();
        
        // Detect system preference
        this.detectSystemPreference();
        
        // Create toggle button if it doesn't exist
        this.createToggleButton();
        
        // Apply theme
        this.applyTheme(this.currentTheme);
        
        // Watch for system preference changes
        this.watchSystemPreference();
        
        console.log('🎨 Enhanced Theme Toggle initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_he_me_to_gg_le_en_ha_nc_ed_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadTheme() {
        try {
            // Try localStorage first
            let saved = localStorage.getItem('theme-preference');
            
            // Fallback to sessionStorage
            if (!saved) {
                saved = sessionStorage.getItem('theme-preference');
            }
            
            if (saved && this.themes.includes(saved)) {
                this.currentTheme = saved;
            } else {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.currentTheme = prefersDark ? 'dark' : 'light';
                // Save default preference
                this.saveTheme();
            }
            
            // Listen for cross-tab theme changes
            window.addEventListener('storage', (e) => {
                if (e.key === 'theme-preference' && e.newValue && this.themes.includes(e.newValue)) {
                    this.currentTheme = e.newValue;
                    this.applyTheme(this.currentTheme);
                }
            });
        } catch (e) {
            console.warn('Failed to load theme preference:', e);
        }
    }
    
    saveTheme() {
        try {
            localStorage.setItem('theme-preference', this.currentTheme);
            // Also save to sessionStorage for cross-tab sync
            sessionStorage.setItem('theme-preference', this.currentTheme);
            // Dispatch custom event for other components
            window.dispatchEvent(new CustomEvent('theme-changed', {
                detail: { theme: this.currentTheme, effectiveTheme: this.getEffectiveTheme() }
            }));
        } catch (e) {
            console.warn('Failed to save theme preference:', e);
        }
    }
    
    detectSystemPreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }
    
    watchSystemPreference() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        });
    }
    
    createToggleButton() {
        // Check if toggle already exists
        if (document.getElementById('theme-toggle-enhanced')) {
            return;
        }
        
        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle-enhanced';
        toggle.className = 'theme-toggle-button';
        toggle.setAttribute('aria-label', 'Toggle theme');
        toggle.setAttribute('title', 'Toggle theme');
        toggle.innerHTML = this.getThemeIcon();
        
        toggle.style.cssText = `
            position: fixed;
            bottom: 140px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        
        toggle.addEventListener('click', () => this.toggle());
        toggle.addEventListener('mouseenter', () => {
            toggle.style.transform = 'scale(1.1)';
        });
        toggle.addEventListener('mouseleave', () => {
            toggle.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(toggle);
    }
    
    getThemeIcon() {
        const effectiveTheme = this.currentTheme === 'auto' 
            ? this.detectSystemPreference() 
            : this.currentTheme;
        return effectiveTheme === 'dark' ? '🌙' : '☀️';
    }
    
    toggle() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex]);
    }
    
    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }
        
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme();
        
        // Update button icon
        const toggle = document.getElementById('theme-toggle-enhanced');
        if (toggle) {
            toggle.innerHTML = this.getThemeIcon();
        }
    }
    
    applyTheme(theme) {
        const effectiveTheme = theme === 'auto' 
            ? this.detectSystemPreference() 
            : theme;
        
        // Remove all theme classes
        document.body.classList.remove('dark-theme', 'light-theme', 'auto-theme');
        
        // Add current theme class
        document.body.classList.add(`${effectiveTheme}-theme`);
        if (theme !== effectiveTheme) {
            document.body.classList.add(`${theme}-theme`); // Keep original for reference
        }
        
        // Set CSS variable
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Add transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        // Announce change
        if (window.accessibilityEnhancements) {
            window.accessibilityEnhancements.announce(`Theme changed to ${effectiveTheme}`);
        }
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    getEffectiveTheme() {
        return this.currentTheme === 'auto' 
            ? this.detectSystemPreference() 
            : this.currentTheme;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeToggleEnhanced = new ThemeToggleEnhanced();
    });
} else {
    window.themeToggleEnhanced = new ThemeToggleEnhanced();
}

