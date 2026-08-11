/**
 * Planet Discovery Timeline Personalization
 * Customize timeline view
 */

class PlanetTimelinePersonalization {
    constructor() {
        this.settings = {
            showConfirmed: true,
            showCandidates: true,
            dateRange: 'all',
            sortBy: 'date'
        };
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadSettings();
        this.isInitialized = true;
        console.log('📅 Planet Timeline Personalization initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tt_im_el_in_ep_er_so_na_li_za_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadSettings() {
        try {
            const stored = localStorage.getItem('timeline-settings');
            if (stored) this.settings = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('timeline-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    renderPersonalization(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="timeline-personalization" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📅 Timeline Settings</h3>
                <label style="display: block; margin-bottom: 1rem; color: rgba(255, 255, 255, 0.7);">
                    <input type="checkbox" ${this.settings.showConfirmed ? 'checked' : ''} onchange="planetTimelinePersonalization.updateSetting('showConfirmed', this.checked)">
                    Show Confirmed Planets
                </label>
                <label style="display: block; margin-bottom: 1rem; color: rgba(255, 255, 255, 0.7);">
                    <input type="checkbox" ${this.settings.showCandidates ? 'checked' : ''} onchange="planetTimelinePersonalization.updateSetting('showCandidates', this.checked)">
                    Show Candidates
                </label>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetTimelinePersonalization = PlanetTimelinePersonalization;
    window.planetTimelinePersonalization = new PlanetTimelinePersonalization();
}

