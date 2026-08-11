/**
 * Planet Discovery Feature Flags
 * Feature flag system for gradual rollouts and feature toggles
 */

class PlanetDiscoveryFeatureFlags {
    constructor() {
        this.flags = new Map();
        this.init();
    }

    init() {
        this.loadFlags();
        this.loadRemoteFlags();
        console.log('🚩 Feature flags initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_fe_at_ur_ef_la_gs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadFlags() {
        // Default feature flags
        const defaultFlags = {
            'new-planet-ui': false,
            'advanced-search': true,
            'social-features': true,
            'marketplace': true,
            'vr-support': false,
            'ai-predictions': true,
            'offline-mode': true,
            'push-notifications': false
        };

        try {
            const saved = localStorage.getItem('feature-flags');
            if (saved) {
                const savedFlags = JSON.parse(saved);
                Object.entries(savedFlags).forEach(([key, value]) => {
                    this.flags.set(key, value);
                });
            } else {
                // Initialize with defaults
                Object.entries(defaultFlags).forEach(([key, value]) => {
                    this.flags.set(key, value);
                });
                this.saveFlags();
            }
        } catch (error) {
            console.error('Error loading feature flags:', error);
            // Fallback to defaults
            Object.entries(defaultFlags).forEach(([key, value]) => {
                this.flags.set(key, value);
            });
        }
    }

    async loadRemoteFlags() {
        // Load feature flags from server/Supabase
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data, error } = await supabase
                    .from('feature_flags')
                    .select('*')
                    .eq('enabled', true);

                if (!error && data) {
                    data.forEach(flag => {
                        this.flags.set(flag.name, flag.value);
                    });
                    this.saveFlags();
                }
            } catch (error) {
                console.error('Error loading remote feature flags:', error);
            }
        }
    }

    saveFlags() {
        try {
            const flagsObj = Object.fromEntries(this.flags);
            localStorage.setItem('feature-flags', JSON.stringify(flagsObj));
        } catch (error) {
            console.error('Error saving feature flags:', error);
        }
    }

    isEnabled(flagName) {
        return this.flags.get(flagName) === true;
    }

    isDisabled(flagName) {
        return !this.isEnabled(flagName);
    }

    enable(flagName) {
        this.flags.set(flagName, true);
        this.saveFlags();
        this.triggerFlagChange(flagName, true);
    }

    disable(flagName) {
        this.flags.set(flagName, false);
        this.saveFlags();
        this.triggerFlagChange(flagName, false);
    }

    toggle(flagName) {
        const current = this.isEnabled(flagName);
        this.flags.set(flagName, !current);
        this.saveFlags();
        this.triggerFlagChange(flagName, !current);
    }

    set(flagName, value) {
        this.flags.set(flagName, value);
        this.saveFlags();
        this.triggerFlagChange(flagName, value);
    }

    get(flagName, defaultValue = false) {
        return this.flags.get(flagName) ?? defaultValue;
    }

    getAll() {
        return Object.fromEntries(this.flags);
    }

    triggerFlagChange(flagName, value) {
        // Dispatch custom event for flag changes
        window.dispatchEvent(new CustomEvent('feature-flag-changed', {
            detail: { flag: flagName, value }
        }));
    }

    renderFeatureFlagsPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const flags = this.getAll();

        container.innerHTML = `
            <div class="feature-flags-panel" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">🚩 Feature Flags</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${Object.entries(flags).map(([name, value]) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                            <span style="color: rgba(255, 255, 255, 0.9);">${name}</span>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" data-flag="${name}" ${value ? 'checked' : ''} 
                                    style="width: 20px; height: 20px; cursor: pointer;">
                                <span style="color: ${value ? '#4ade80' : '#ef4444'};">
                                    ${value ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const flagName = e.target.dataset.flag;
                this.set(flagName, e.target.checked);
                
                // Update label
                const label = e.target.parentElement;
                const statusSpan = label.querySelector('span');
                statusSpan.textContent = e.target.checked ? 'Enabled' : 'Disabled';
                statusSpan.style.color = e.target.checked ? '#4ade80' : '#ef4444';
            });
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryFeatureFlags = new PlanetDiscoveryFeatureFlags();
}

