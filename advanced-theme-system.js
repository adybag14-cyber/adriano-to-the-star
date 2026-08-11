/**
 * Advanced Dark Mode with Multiple Themes
 * Supports midnight, space, nebula themes and more
 */

class AdvancedThemeSystem {
    constructor() {
        this.themes = {
            midnight: { name: 'Midnight', colors: { primary: '#1a1a2e', secondary: '#16213e', accent: '#0f3460', text: '#eaeaea', highlight: '#533483' }},
            space: { name: 'Space', colors: { primary: '#000000', secondary: '#1a1a2e', accent: '#16213e', text: '#ffffff', highlight: '#ba944f' }},
            nebula: { name: 'Nebula', colors: { primary: '#0f0c29', secondary: '#302b63', accent: '#24243e', text: '#ffffff', highlight: '#9b59b6' }},
            cosmic: { name: 'Cosmic', colors: { primary: '#000000', secondary: '#1a1a2e', accent: '#16213e', text: '#ffffff', highlight: '#ba944f' }},
            aurora: { name: 'Aurora', colors: { primary: '#0a0e27', secondary: '#1a1a2e', accent: '#16213e', text: '#ffffff', highlight: '#00d4ff' }}
        };
        this.currentTheme = 'space';
        this.init();
    }
    
    init() {
        this.loadTheme();
        this.createThemeSelector();
        this.applyTheme(this.currentTheme);
        this.trackEvent('theme_system_initialized');
    }
    
    loadTheme() {
        try {
            const saved = localStorage.getItem('advanced-theme');
            if (saved && this.themes[saved]) this.currentTheme = saved;
        } catch (e) {}
    }
    
    saveTheme() {
        try {
            localStorage.setItem('advanced-theme', this.currentTheme);
        } catch (e) {}
    }
    
    createThemeSelector() {
        const btn = document.createElement('button');
        btn.innerHTML = '🌙 Themes';
        btn.style.cssText = 'position:fixed;bottom:80px;right:20px;padding:12px 20px;background:rgba(186,148,79,0.9);border:2px solid rgba(186,148,79,1);color:white;border-radius:8px;cursor:pointer;z-index:9999;';
        btn.addEventListener('click', () => this.showThemePanel());
        document.body.appendChild(btn);
    }
    
    showThemePanel() {
        const existing = document.getElementById('theme-panel');
        if (existing) { existing.remove(); return; }
        
        const panel = document.createElement('div');
        panel.id = 'theme-panel';
        panel.style.cssText = 'position:fixed;bottom:140px;right:20px;width:300px;background:rgba(0,0,0,0.95);border:2px solid rgba(186,148,79,0.8);border-radius:12px;padding:20px;z-index:10000;';
        
        panel.innerHTML = '<h3 style="color:#ba944f;margin:0 0 15px 0;">Select Theme</h3><div id="theme-list"></div>';
        
        Object.keys(this.themes).forEach(key => {
            const theme = this.themes[key];
            const item = document.createElement('div');
            item.style.cssText = `padding:12px;margin-bottom:8px;background:${this.currentTheme===key?'rgba(186,148,79,0.3)':'rgba(255,255,255,0.05)'};border:2px solid ${this.currentTheme===key?'#ba944f':'rgba(255,255,255,0.2)'};border-radius:8px;cursor:pointer;color:white;display:flex;align-items:center;gap:10px;`;
            const preview = document.createElement('div');
            preview.style.cssText = `width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,${theme.colors.primary},${theme.colors.accent});border:2px solid ${theme.colors.highlight};`;
            item.appendChild(preview);
            item.appendChild(document.createTextNode(theme.name));
            item.addEventListener('click', () => { this.setTheme(key); panel.remove(); });
            panel.querySelector('#theme-list').appendChild(item);
        });
        
        document.body.appendChild(panel);
    }
    
    setTheme(themeName) {
        if (!this.themes[themeName]) return;
        this.currentTheme = themeName;
        this.applyTheme(themeName);
        this.saveTheme();
        this.trackEvent('theme_changed', { theme: themeName });
    }
    
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        Object.entries(theme.colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--theme-${key}`, value);
        });
        document.body.setAttribute('data-theme', themeName);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`theme_system_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_theme_system', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.advancedThemeSystem = new AdvancedThemeSystem(); });
} else {
    window.advancedThemeSystem = new AdvancedThemeSystem();
}


