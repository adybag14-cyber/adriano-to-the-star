/**
 * Advanced Animation Controls
 * Allows users to control animation speed, disable animations, and respect prefers-reduced-motion
 * 
 * Features:
 * - Animation speed control (slow/normal/fast)
 * - Disable all animations
 * - Respect prefers-reduced-motion
 * - Settings persistence in localStorage
 */

class AnimationControls {
    constructor() {
        this.settings = {
            enabled: true,
            speed: 'normal', // 'slow', 'normal', 'fast'
            respectReducedMotion: true
        };
        
        this.animationSpeedMultipliers = {
            slow: 2.0,    // Animations take 2x longer
            normal: 1.0,  // Default speed
            fast: 0.5     // Animations take half the time
        };
        
        this.init();
    }
    
    init() {
        // Load saved settings
        this.loadSettings();
        
        // Check for prefers-reduced-motion
        if (this.settings.respectReducedMotion) {
            this.checkReducedMotion();
        }
        
        // Apply settings
        this.applySettings();
        
        // Create UI controls
        this.createControls();
        
        // Listen for system preference changes
        this.watchSystemPreferences();
        
        this.trackEvent('animation_controls_initialized');
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('animationControls');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load animation settings:', e);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('animationControls', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save animation settings:', e);
        }
    }
    
    checkReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches) {
            this.settings.enabled = false;
            console.log('🎬 System prefers reduced motion - animations disabled');
        }
        
        // Watch for changes
        prefersReducedMotion.addEventListener('change', (e) => {
            if (e.matches) {
                this.settings.enabled = false;
                this.applySettings();
                this.updateControlsUI();
            }
        });
    }
    
    watchSystemPreferences() {
        // Watch for changes in system preferences
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', () => {
            if (this.settings.respectReducedMotion) {
                this.checkReducedMotion();
                this.applySettings();
            }
        });
    }
    
    applySettings() {
        const root = document.documentElement;
        
        if (!this.settings.enabled) {
            // Disable all animations
            root.style.setProperty('--animation-duration', '0s');
            root.style.setProperty('--transition-duration', '0s');
            document.body.classList.add('animations-disabled');
            document.body.classList.remove('animations-slow', 'animations-normal', 'animations-fast');
        } else {
            // Apply speed multiplier
            const multiplier = this.animationSpeedMultipliers[this.settings.speed];
            root.style.setProperty('--animation-duration', `${multiplier}s`);
            root.style.setProperty('--transition-duration', `${multiplier * 0.3}s`);
            document.body.classList.remove('animations-disabled');
            document.body.classList.add(`animations-${this.settings.speed}`);
        }
        
        // Add CSS for animation control
        this.injectAnimationCSS();
    }
    
    injectAnimationCSS() {
        if (document.getElementById('animation-controls-css')) {
            return; // Already injected
        }
        
        const style = document.createElement('style');
        style.id = 'animation-controls-css';
        style.textContent = `
            /* Animation speed controls */
            .animations-slow *,
            .animations-slow *::before,
            .animations-slow *::after {
                animation-duration: calc(var(--animation-duration, 1s) * 2) !important;
                transition-duration: calc(var(--transition-duration, 0.3s) * 2) !important;
            }
            
            .animations-fast *,
            .animations-fast *::before,
            .animations-fast *::after {
                animation-duration: calc(var(--animation-duration, 1s) * 0.5) !important;
                transition-duration: calc(var(--transition-duration, 0.3s) * 0.5) !important;
            }
            
            .animations-disabled *,
            .animations-disabled *::before,
            .animations-disabled *::after {
                animation-duration: 0s !important;
                transition-duration: 0s !important;
                animation-delay: 0s !important;
                transition-delay: 0s !important;
            }
            
            /* Animation controls panel */
            .animation-controls-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 10px;
                padding: 1rem;
                z-index: 10000;
                min-width: 250px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                font-family: 'Raleway', sans-serif;
            }
            
            .animation-controls-panel h3 {
                color: #ba944f;
                margin: 0 0 1rem 0;
                font-size: 1rem;
                font-weight: 600;
            }
            
            .animation-control-group {
                margin-bottom: 1rem;
            }
            
            .animation-control-group label {
                display: block;
                color: rgba(255, 255, 255, 0.9);
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
            }
            
            .animation-control-group input[type="checkbox"] {
                margin-right: 0.5rem;
            }
            
            .animation-control-group select {
                width: 100%;
                padding: 0.5rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 5px;
                color: white;
                font-size: 0.9rem;
            }
            
            .animation-control-group select option {
                background: #1a1a1a;
                color: white;
            }
            
            .animation-control-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                background: rgba(186, 148, 79, 0.9);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 10001;
                box-shadow: 0 4px 15px rgba(186, 148, 79, 0.4);
                transition: transform 0.2s ease;
            }
            
            .animation-control-toggle:hover {
                transform: scale(1.1);
            }
            
            .animation-control-toggle:active {
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);
    }
    
    createControls() {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'animation-control-toggle';
        toggleBtn.innerHTML = '🎬';
        toggleBtn.title = 'Animation Controls';
        toggleBtn.setAttribute('aria-label', 'Open animation controls');
        
        // Create control panel
        const panel = document.createElement('div');
        panel.className = 'animation-controls-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <h3>🎬 Animation Controls</h3>
            <div class="animation-control-group">
                <label>
                    <input type="checkbox" id="anim-enabled" ${this.settings.enabled ? 'checked' : ''}>
                    Enable Animations
                </label>
            </div>
            <div class="animation-control-group">
                <label for="anim-speed">Animation Speed:</label>
                <select id="anim-speed">
                    <option value="slow" ${this.settings.speed === 'slow' ? 'selected' : ''}>Slow</option>
                    <option value="normal" ${this.settings.speed === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="fast" ${this.settings.speed === 'fast' ? 'selected' : ''}>Fast</option>
                </select>
            </div>
            <div class="animation-control-group">
                <label>
                    <input type="checkbox" id="anim-respect-motion" ${this.settings.respectReducedMotion ? 'checked' : ''}>
                    Respect System Preferences
                </label>
            </div>
        `;
        
        // Toggle panel visibility
        toggleBtn.addEventListener('click', () => {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            toggleBtn.setAttribute('aria-expanded', !isVisible);
        });
        
        // Handle settings changes
        const enabledCheckbox = panel.querySelector('#anim-enabled');
        const speedSelect = panel.querySelector('#anim-speed');
        const respectCheckbox = panel.querySelector('#anim-respect-motion');
        
        enabledCheckbox.addEventListener('change', (e) => {
            this.settings.enabled = e.target.checked;
            this.applySettings();
            this.saveSettings();
        });
        
        speedSelect.addEventListener('change', (e) => {
            this.settings.speed = e.target.value;
            this.applySettings();
            this.saveSettings();
        });
        
        respectCheckbox.addEventListener('change', (e) => {
            this.settings.respectReducedMotion = e.target.checked;
            if (e.target.checked) {
                this.checkReducedMotion();
            }
            this.applySettings();
            this.saveSettings();
        });
        
        document.body.appendChild(toggleBtn);
        document.body.appendChild(panel);
        
        this.panel = panel;
        this.toggleBtn = toggleBtn;
    }
    
    updateControlsUI() {
        if (!this.panel) return;
        
        const enabledCheckbox = this.panel.querySelector('#anim-enabled');
        const speedSelect = this.panel.querySelector('#anim-speed');
        
        if (enabledCheckbox) {
            enabledCheckbox.checked = this.settings.enabled;
        }
        if (speedSelect) {
            speedSelect.value = this.settings.speed;
        }
    }
    
    // Public API methods
    setEnabled(enabled) {
        this.settings.enabled = enabled;
        this.applySettings();
        this.saveSettings();
        this.updateControlsUI();
    }
    
    setSpeed(speed) {
        if (['slow', 'normal', 'fast'].includes(speed)) {
            this.settings.speed = speed;
            this.applySettings();
            this.saveSettings();
            this.updateControlsUI();
        }
    }
    
    disable() {
        this.setEnabled(false);
    }
    
    enable() {
        this.setEnabled(true);
    }
}

AnimationControls.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`animation_controls_${eventName}`, 1, data);
        }
        if (window.analytics) {
            window.analytics.track(eventName, { module: 'animation_controls', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.animationControls = new AnimationControls();
    });
} else {
    window.animationControls = new AnimationControls();
}
