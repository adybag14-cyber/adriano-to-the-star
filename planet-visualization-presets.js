/**
 * Planet Visualization Presets
 * Pre-configured visualization settings
 */

class PlanetVisualizationPresets {
    constructor() {
        this.presets = {
            'default': { color: '#ba944f', size: 1, rotation: 0 },
            'earth-like': { color: '#4ade80', size: 1.2, rotation: 0.5 },
            'gas-giant': { color: '#fbbf24', size: 2, rotation: 1 },
            'icy': { color: '#60a5fa', size: 0.8, rotation: 0.3 }
        };
        this.currentPreset = 'default';
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('🎨 Planet Visualization Presets initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tv_is_ua_li_za_ti_on_pr_es_et_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    applyPreset(presetName, planetElement) {
        const preset = this.presets[presetName];
        if (!preset || !planetElement) return;
        this.currentPreset = presetName;
        planetElement.style.transform = `scale(${preset.size}) rotate(${preset.rotation}turn)`;
        planetElement.style.filter = `hue-rotate(${preset.color})`;
    }

    renderPresets(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="visualization-presets" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">🎨 Visualization Presets</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    ${Object.keys(this.presets).map(name => `
                        <button class="preset-btn" data-preset="${name}" style="padding: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            ${name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetVisualizationPresets = PlanetVisualizationPresets;
    window.planetVisualizationPresets = new PlanetVisualizationPresets();
}

