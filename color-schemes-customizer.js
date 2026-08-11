/**
 * Customizable Color Schemes System
 * Allows users to customize color schemes with presets and custom colors
 * 
 * Features:
 * - Multiple preset color schemes
 * - Custom color picker
 * - Real-time preview
 * - Scheme persistence
 * - Export/import schemes
 */

class ColorSchemesCustomizer {
    constructor() {
        this.schemes = {
            cosmic: {
                name: 'Cosmic',
                primary: '#ba944f',
                secondary: '#ffd700',
                background: '#000000',
                text: '#ffffff',
                accent: '#4a90e2'
            },
            nebula: {
                name: 'Nebula',
                primary: '#9b59b6',
                secondary: '#e74c3c',
                background: '#1a1a2e',
                text: '#eeeeee',
                accent: '#3498db'
            },
            aurora: {
                name: 'Aurora',
                primary: '#00d4ff',
                secondary: '#00ff88',
                background: '#0a0e27',
                text: '#ffffff',
                accent: '#ff6b9d'
            },
            solar: {
                name: 'Solar',
                primary: '#ff6b35',
                secondary: '#f7931e',
                background: '#1a1a1a',
                text: '#ffffff',
                accent: '#ffd23f'
            },
            lunar: {
                name: 'Lunar',
                primary: '#c0c0c0',
                secondary: '#ffffff',
                background: '#2c2c2c',
                text: '#e0e0e0',
                accent: '#4a90e2'
            }
        };
        this.currentScheme = 'cosmic';
        this.customScheme = null;
        this.init();
    }
    
    init() {
        this.loadScheme();
        this.createUI();
        this.applyScheme(this.currentScheme);
        this.trackEvent('color_schemes_initialized');
    }
    
    loadScheme() {
        try {
            const saved = localStorage.getItem('color-scheme');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.name && parsed.name.startsWith('custom-')) {
                    this.customScheme = parsed;
                    this.currentScheme = parsed.name;
                } else if (this.schemes[saved]) {
                    this.currentScheme = saved;
                }
            }
        } catch (e) {
            console.warn('Failed to load color scheme:', e);
        }
    }
    
    saveScheme() {
        try {
            const scheme = this.getCurrentSchemeData();
            localStorage.setItem('color-scheme', JSON.stringify(scheme));
            window.dispatchEvent(new CustomEvent('color-scheme-changed', {
                detail: { scheme: this.currentScheme, data: scheme }
            }));
        } catch (e) {
            console.warn('Failed to save color scheme:', e);
        }
    }
    
    createUI() {
        // Create color scheme selector button
        const button = document.createElement('button');
        button.id = 'color-scheme-toggle';
        button.className = 'color-scheme-toggle';
        button.setAttribute('aria-label', 'Color scheme settings');
        button.innerHTML = '🎨';
        button.style.cssText = `
            position: fixed;
            bottom: 200px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        
        button.addEventListener('click', () => this.showPanel());
        document.body.appendChild(button);
    }
    
    showPanel() {
        // Remove existing panel if any
        const existing = document.getElementById('color-scheme-panel');
        if (existing) {
            existing.remove();
            return;
        }
        
        const panel = document.createElement('div');
        panel.id = 'color-scheme-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 260px;
            right: 20px;
            width: 320px;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.8);
            border-radius: 12px;
            padding: 20px;
            z-index: 10000;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `;
        
        panel.innerHTML = `
            <h3 style="color: #ba944f; margin: 0 0 15px 0; font-size: 1.2rem;">Color Schemes</h3>
            <div id="scheme-presets" style="margin-bottom: 20px;"></div>
            <button id="custom-color-btn" style="
                width: 100%;
                padding: 10px;
                background: rgba(186, 148, 79, 0.3);
                border: 1px solid rgba(186, 148, 79, 0.8);
                color: #ba944f;
                border-radius: 6px;
                cursor: pointer;
                margin-bottom: 15px;
            ">Custom Colors</button>
            <button id="close-scheme-panel" style="
                width: 100%;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 6px;
                cursor: pointer;
            ">Close</button>
        `;
        
        // Add preset buttons
        const presets = panel.querySelector('#scheme-presets');
        Object.keys(this.schemes).forEach(key => {
            const scheme = this.schemes[key];
            const btn = document.createElement('button');
            btn.textContent = scheme.name;
            btn.style.cssText = `
                width: 100%;
                padding: 10px;
                margin-bottom: 8px;
                background: ${this.currentScheme === key ? 'rgba(186, 148, 79, 0.5)' : 'rgba(255, 255, 255, 0.05)'};
                border: 2px solid ${this.currentScheme === key ? '#ba944f' : 'rgba(255, 255, 255, 0.2)'};
                color: white;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            // Add color preview
            const preview = document.createElement('div');
            preview.style.cssText = `
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: ${scheme.primary};
                border: 2px solid ${scheme.secondary};
            `;
            btn.prepend(preview);
            
            btn.addEventListener('click', () => {
                this.setScheme(key);
                this.showPanel(); // Refresh panel
            });
            presets.appendChild(btn);
        });
        
        // Custom color button
        panel.querySelector('#custom-color-btn').addEventListener('click', () => {
            this.showCustomColorPicker();
        });
        
        // Close button
        panel.querySelector('#close-scheme-panel').addEventListener('click', () => {
            panel.remove();
        });
        
        document.body.appendChild(panel);
    }
    
    showCustomColorPicker() {
        const picker = document.createElement('div');
        picker.id = 'custom-color-picker';
        picker.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            background: rgba(0, 0, 0, 0.98);
            border: 2px solid rgba(186, 148, 79, 0.8);
            border-radius: 12px;
            padding: 25px;
            z-index: 10001;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
        `;
        
        const current = this.getCurrentSchemeData();
        picker.innerHTML = `
            <h3 style="color: #ba944f; margin: 0 0 20px 0;">Custom Color Scheme</h3>
            <div style="display: grid; gap: 15px;">
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Primary Color</label>
                    <input type="color" id="custom-primary" value="${current.primary}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Secondary Color</label>
                    <input type="color" id="custom-secondary" value="${current.secondary}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Background</label>
                    <input type="color" id="custom-background" value="${current.background}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Text Color</label>
                    <input type="color" id="custom-text" value="${current.text}" style="width: 100%; height: 40px;">
                </div>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">Accent Color</label>
                    <input type="color" id="custom-accent" value="${current.accent}" style="width: 100%; height: 40px;">
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="apply-custom" style="
                    flex: 1;
                    padding: 10px;
                    background: rgba(186, 148, 79, 0.5);
                    border: 1px solid #ba944f;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Apply</button>
                <button id="cancel-custom" style="
                    flex: 1;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;
        
        // Apply custom colors
        picker.querySelector('#apply-custom').addEventListener('click', () => {
            const custom = {
                name: 'custom-' + Date.now(),
                primary: picker.querySelector('#custom-primary').value,
                secondary: picker.querySelector('#custom-secondary').value,
                background: picker.querySelector('#custom-background').value,
                text: picker.querySelector('#custom-text').value,
                accent: picker.querySelector('#custom-accent').value
            };
            this.customScheme = custom;
            this.currentScheme = custom.name;
            this.applyScheme(custom.name);
            this.saveScheme();
            picker.remove();
            const panel = document.getElementById('color-scheme-panel');
            if (panel) panel.remove();
        });
        
        // Cancel
        picker.querySelector('#cancel-custom').addEventListener('click', () => {
            picker.remove();
        });
        
        document.body.appendChild(picker);
    }
    
    setScheme(schemeName) {
        this.currentScheme = schemeName;
        this.applyScheme(schemeName);
        this.saveScheme();
    }
    
    applyScheme(schemeName) {
        const scheme = this.getSchemeData(schemeName);
        if (!scheme) return;
        
        // Apply CSS variables
        document.documentElement.style.setProperty('--color-primary', scheme.primary);
        document.documentElement.style.setProperty('--color-secondary', scheme.secondary);
        document.documentElement.style.setProperty('--color-background', scheme.background);
        document.documentElement.style.setProperty('--color-text', scheme.text);
        document.documentElement.style.setProperty('--color-accent', scheme.accent);
        
        // Apply to body
        document.body.style.setProperty('--primary-color', scheme.primary);
        document.body.style.setProperty('--secondary-color', scheme.secondary);
        document.body.style.setProperty('--bg-color', scheme.background);
        document.body.style.setProperty('--text-color', scheme.text);
        document.body.style.setProperty('--accent-color', scheme.accent);
        
        // Update theme toggle button if exists
        const toggle = document.getElementById('theme-toggle-enhanced');
        if (toggle) {
            toggle.style.background = `rgba(${this.hexToRgb(scheme.primary)}, 0.9)`;
            toggle.style.borderColor = scheme.primary;
        }
    }
    
    getSchemeData(schemeName) {
        if (schemeName.startsWith('custom-') && this.customScheme) {
            return this.customScheme;
        }
        return this.schemes[schemeName] || this.schemes.cosmic;
    }
    
    getCurrentSchemeData() {
        return this.getSchemeData(this.currentScheme);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '186, 148, 79';
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`color_schemes_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.colorSchemesCustomizer = new ColorSchemesCustomizer();
    });
} else {
    window.colorSchemesCustomizer = new ColorSchemesCustomizer();
}

