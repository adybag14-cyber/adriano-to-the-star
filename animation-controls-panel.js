/**
 * Advanced Animation Controls Panel
 * Allows users to control animation settings, speeds, and preferences
 * 
 * Features:
 * - Enable/disable animations
 * - Adjust animation speeds
 * - Control specific animation types
 * - Reduce motion preferences
 * - Animation presets
 */

class AnimationControlsPanel {
    constructor() {
        this.settings = {
            enabled: true,
            speed: 1.0,
            reduceMotion: false,
            scrollAnimations: true,
            hoverAnimations: true,
            entranceAnimations: true,
            parallax: true,
            transitions: true
        };
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.createUI();
        this.applySettings();
        this.trackEvent('controls_panel_initialized');
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('animation-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
            
            // Check for prefers-reduced-motion
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                this.settings.reduceMotion = true;
                this.settings.speed = 0.5;
            }
        } catch (e) {
            console.warn('Failed to load animation settings:', e);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('animation-settings', JSON.stringify(this.settings));
            window.dispatchEvent(new CustomEvent('animation-settings-changed', {
                detail: this.settings
            }));
        } catch (e) {
            console.warn('Failed to save animation settings:', e);
        }
    }
    
    createUI() {
        const button = document.createElement('button');
        button.id = 'animation-controls-toggle';
        button.className = 'animation-controls-toggle';
        button.setAttribute('aria-label', 'Animation controls');
        button.innerHTML = '🎬';
        button.style.cssText = `
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
            z-index: 9997;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        
        button.addEventListener('click', () => this.showPanel());
        document.body.appendChild(button);
    }
    
    showPanel() {
        const existing = document.getElementById('animation-controls-panel');
        if (existing) {
            existing.remove();
            return;
        }
        
        const panel = document.createElement('div');
        panel.id = 'animation-controls-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 320px;
            right: 20px;
            width: 320px;
            max-height: 500px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.8);
            border-radius: 12px;
            padding: 20px;
            z-index: 10000;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `;
        
        panel.innerHTML = `
            <h3 style="color: #ba944f; margin: 0 0 15px 0; font-size: 1.2rem;">Animation Controls</h3>
            <div style="display: grid; gap: 15px;">
                <label style="display: flex; align-items: center; justify-content: space-between; color: white;">
                    <span>Enable Animations</span>
                    <input type="checkbox" id="anim-enabled" ${this.settings.enabled ? 'checked' : ''} style="width: 20px; height: 20px;">
                </label>
                <div>
                    <label style="color: white; display: block; margin-bottom: 5px;">
                        Animation Speed: <span id="speed-value">${this.settings.speed}x</span>
                    </label>
                    <input type="range" id="anim-speed" min="0" max="2" step="0.1" value="${this.settings.speed}" 
                           style="width: 100%;">
                </div>
                <label style="display: flex; align-items: center; justify-content: space-between; color: white;">
                    <span>Reduce Motion</span>
                    <input type="checkbox" id="reduce-motion" ${this.settings.reduceMotion ? 'checked' : ''} style="width: 20px; height: 20px;">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; color: white;">
                    <span>Scroll Animations</span>
                    <input type="checkbox" id="scroll-anim" ${this.settings.scrollAnimations ? 'checked' : ''} style="width: 20px; height: 20px;">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; color: white;">
                    <span>Hover Animations</span>
                    <input type="checkbox" id="hover-anim" ${this.settings.hoverAnimations ? 'checked' : ''} style="width: 20px; height: 20px;">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; color: white;">
                    <span>Entrance Animations</span>
                    <input type="checkbox" id="entrance-anim" ${this.settings.entranceAnimations ? 'checked' : ''} style="width: 20px; height: 20px;">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; color: white;">
                    <span>Parallax Effects</span>
                    <input type="checkbox" id="parallax" ${this.settings.parallax ? 'checked' : ''} style="width: 20px; height: 20px;">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; color: white;">
                    <span>Transitions</span>
                    <input type="checkbox" id="transitions" ${this.settings.transitions ? 'checked' : ''} style="width: 20px; height: 20px;">
                </label>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="reset-anim" style="
                    flex: 1;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Reset</button>
                <button id="close-anim-panel" style="
                    flex: 1;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;
        
        // Event listeners
        panel.querySelector('#anim-enabled').addEventListener('change', (e) => {
            this.settings.enabled = e.target.checked;
            this.applySettings();
            this.saveSettings();
        });
        
        const speedSlider = panel.querySelector('#anim-speed');
        speedSlider.addEventListener('input', (e) => {
            this.settings.speed = parseFloat(e.target.value);
            panel.querySelector('#speed-value').textContent = this.settings.speed + 'x';
            this.applySettings();
            this.saveSettings();
        });
        
        panel.querySelector('#reduce-motion').addEventListener('change', (e) => {
            this.settings.reduceMotion = e.target.checked;
            if (e.target.checked) {
                this.settings.speed = 0.5;
                speedSlider.value = 0.5;
                panel.querySelector('#speed-value').textContent = '0.5x';
            }
            this.applySettings();
            this.saveSettings();
        });
        
        ['scroll-anim', 'hover-anim', 'entrance-anim', 'parallax', 'transitions'].forEach(id => {
            panel.querySelector(`#${id}`).addEventListener('change', (e) => {
                const key = id.replace('-', '').replace('anim', 'Animations').replace('parallax', 'parallax').replace('transitions', 'transitions');
                this.settings[key] = e.target.checked;
                this.applySettings();
                this.saveSettings();
            });
        });
        
        panel.querySelector('#reset-anim').addEventListener('click', () => {
            this.settings = {
                enabled: true,
                speed: 1.0,
                reduceMotion: false,
                scrollAnimations: true,
                hoverAnimations: true,
                entranceAnimations: true,
                parallax: true,
                transitions: true
            };
            this.applySettings();
            this.saveSettings();
            panel.remove();
            this.showPanel();
        });
        
        panel.querySelector('#close-anim-panel').addEventListener('click', () => {
            panel.remove();
        });
        
        document.body.appendChild(panel);
    }
    
    applySettings() {
        const root = document.documentElement;
        
        if (!this.settings.enabled || this.settings.reduceMotion) {
            root.style.setProperty('--animation-duration', '0s');
            root.style.setProperty('--transition-duration', '0s');
            document.body.classList.add('reduce-motion');
        } else {
            const duration = (1 / this.settings.speed) + 's';
            root.style.setProperty('--animation-duration', duration);
            root.style.setProperty('--transition-duration', duration);
            document.body.classList.remove('reduce-motion');
        }
        
        // Apply specific animation toggles
        document.body.classList.toggle('no-scroll-animations', !this.settings.scrollAnimations);
        document.body.classList.toggle('no-hover-animations', !this.settings.hoverAnimations);
        document.body.classList.toggle('no-entrance-animations', !this.settings.entranceAnimations);
        document.body.classList.toggle('no-parallax', !this.settings.parallax);
        document.body.classList.toggle('no-transitions', !this.settings.transitions);
        
        // Add CSS for animation control
        if (!document.getElementById('animation-controls-styles')) {
            const style = document.createElement('style');
            style.id = 'animation-controls-styles';
            style.textContent = `
                .reduce-motion *,
                .reduce-motion *::before,
                .reduce-motion *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
                .no-scroll-animations [data-scroll-animate] {
                    animation: none !important;
                }
                .no-hover-animations *:hover {
                    transform: none !important;
                    transition: none !important;
                }
                .no-entrance-animations [data-stagger] {
                    animation: none !important;
                }
                .no-parallax {
                    transform: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

AnimationControlsPanel.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`animation_controls_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'animation_controls_panel', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.animationControlsPanel = new AnimationControlsPanel();
    });
} else {
    window.animationControlsPanel = new AnimationControlsPanel();
}

