/**
 * Color Scheme Customizer
 * Allows users to customize UI color schemes
 * 
 * Features:
 * - Custom color picker
 * - Preset color schemes
 * - Live preview
 * - Save custom schemes
 */

class ColorSchemeCustomizer {
    constructor() {
        this.customColors = {};
        this.presets = {
            'cosmic-gold': {
                primary: '#ba944f',
                secondary: '#d4b86a',
                background: '#0a0a0a',
                text: '#ffffff',
                accent: '#ffd700'
            },
            'cosmic-blue': {
                primary: '#4a90e2',
                secondary: '#6ba3e8',
                background: '#0a0a0a',
                text: '#ffffff',
                accent: '#5dade2'
            },
            'cosmic-purple': {
                primary: '#9b59b6',
                secondary: '#bb8fce',
                background: '#0a0a0a',
                text: '#ffffff',
                accent: '#af7ac5'
            },
            'cosmic-green': {
                primary: '#2ecc71',
                secondary: '#58d68d',
                background: '#0a0a0a',
                text: '#ffffff',
                accent: '#52be80'
            }
        };
        this.init();
    }
    
    init() {
        // Load saved custom colors
        this.loadCustomColors();
        
        // Apply saved colors
        this.applyColors();
        
        // Create color picker UI
        this.createColorPicker();
        this.trackEvent('color_customizer_initialized');
    }
    
    loadCustomColors() {
        try {
            const saved = localStorage.getItem('custom-color-scheme');
            if (saved) {
                this.customColors = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load custom colors:', e);
        }
    }
    
    saveCustomColors() {
        try {
            localStorage.setItem('custom-color-scheme', JSON.stringify(this.customColors));
        } catch (e) {
            console.warn('Failed to save custom colors:', e);
        }
    }
    
    applyColors() {
        const colors = Object.keys(this.customColors).length > 0 
            ? this.customColors 
            : this.presets['cosmic-gold'];
        
        const root = document.documentElement;
        root.style.setProperty('--color-primary', colors.primary || '#ba944f');
        root.style.setProperty('--color-secondary', colors.secondary || '#d4b86a');
        root.style.setProperty('--color-background', colors.background || '#0a0a0a');
        root.style.setProperty('--color-text', colors.text || '#ffffff');
        root.style.setProperty('--color-accent', colors.accent || '#ffd700');
    }
    
    createColorPicker() {
        const picker = document.createElement('div');
        picker.id = 'color-scheme-picker';
        picker.className = 'color-scheme-picker';
        picker.style.cssText = `
            position: fixed;
            bottom: 200px;
            right: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 1.5rem;
            z-index: 9998;
            display: none;
            min-width: 300px;
            color: white;
            font-family: 'Raleway', sans-serif;
        `;
        
        picker.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="color: #ba944f; margin: 0;">🎨 Color Scheme</h3>
                <button id="close-color-picker" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div class="preset-schemes" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: rgba(255,255,255,0.9);">Presets:</label>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                    ${Object.entries(this.presets).map(([name, colors]) => `
                        <button class="preset-btn" data-preset="${name}" style="
                            background: ${colors.primary};
                            border: 2px solid ${colors.secondary};
                            color: white;
                            padding: 0.75rem;
                            border-radius: 5px;
                            cursor: pointer;
                            text-transform: capitalize;
                        ">${name.replace('-', ' ')}</button>
                    `).join('')}
                </div>
            </div>
            <div class="custom-colors">
                <label style="display: block; margin-bottom: 0.5rem; color: rgba(255,255,255,0.9);">Custom Colors:</label>
                ${['primary', 'secondary', 'accent'].map(color => `
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.25rem; text-transform: capitalize;">${color}:</label>
                        <input type="color" id="color-${color}" value="${this.customColors[color] || this.presets['cosmic-gold'][color]}" style="width: 100%; height: 40px; border: none; border-radius: 5px; cursor: pointer;">
                    </div>
                `).join('')}
            </div>
            <button id="reset-colors" style="
                width: 100%;
                padding: 0.75rem;
                background: rgba(186, 148, 79, 0.3);
                border: 1px solid rgba(186, 148, 79, 0.5);
                border-radius: 5px;
                color: white;
                cursor: pointer;
                margin-top: 1rem;
            ">Reset to Default</button>
        `;
        
        // Add event listeners
        const closeBtn = picker.querySelector('#close-color-picker');
        closeBtn.addEventListener('click', () => {
            picker.style.display = 'none';
        });
        
        // Preset buttons
        picker.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // Color inputs
        ['primary', 'secondary', 'accent'].forEach(color => {
            const input = picker.querySelector(`#color-${color}`);
            input.addEventListener('input', (e) => {
                this.customColors[color] = e.target.value;
                this.applyColors();
                this.saveCustomColors();
            });
        });
        
        // Reset button
        const resetBtn = picker.querySelector('#reset-colors');
        resetBtn.addEventListener('click', () => {
            this.customColors = {};
            this.applyColors();
            this.saveCustomColors();
            picker.querySelectorAll('input[type="color"]').forEach(input => {
                const colorName = input.id.replace('color-', '');
                input.value = this.presets['cosmic-gold'][colorName];
            });
        });
        
        document.body.appendChild(picker);
        
        // Create toggle button
        const toggle = document.createElement('button');
        toggle.id = 'color-picker-toggle';
        toggle.innerHTML = '🎨';
        toggle.setAttribute('aria-label', 'Open color scheme picker');
        toggle.style.cssText = `
            position: fixed;
            bottom: 260px;
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
        
        toggle.addEventListener('click', () => {
            const isVisible = picker.style.display !== 'none';
            picker.style.display = isVisible ? 'none' : 'block';
        });
        
        document.body.appendChild(toggle);
    }
    
    applyPreset(presetName) {
        if (this.presets[presetName]) {
            this.customColors = { ...this.presets[presetName] };
            this.applyColors();
            this.saveCustomColors();
            
            // Update color inputs
            ['primary', 'secondary', 'accent'].forEach(color => {
                const input = document.querySelector(`#color-${color}`);
                if (input) {
                    input.value = this.customColors[color];
                }
            });
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`color_customizer_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.colorSchemeCustomizer = new ColorSchemeCustomizer();
    });
} else {
    window.colorSchemeCustomizer = new ColorSchemeCustomizer();
}

