/**
 * ESA (European Space Agency) Integration
 * Integrate ESA data and APIs
 * 
 * Features:
 * - ESA mission data
 * - Space science updates
 * - Mission status
 * - News and updates
 */

class ESAAPIIntegration {
    constructor() {
        this.baseUrl = 'https://www.esa.int';
        this.cache = new Map();
        this.init();
    }
    
    init() {
        // Create ESA widget
        this.createESAWidget();
        
        // Load ESA data
        this.loadESAData();
        
        console.log('🌍 ESA API Integration initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_sa_ap_ii_nt_eg_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    createESAWidget() {
        // Prefer a pre-reserved placeholder to avoid layout shifts
        let container = document.getElementById('esa-api-widget') || document.getElementById('esa-api-widget-placeholder');
        const created = !container;
        if (!container) {
            container = document.createElement('div');
        }
        container.id = 'esa-api-widget';
        container.className = 'esa-api-widget';
        container.style.cssText = `
            padding: 2rem;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            margin: 2rem 0;
            color: white;
            min-height: 320px;
        `;
        
        container.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0; display: flex; justify-content: space-between; align-items: center;">
                <span>🌍 ESA (European Space Agency)</span>
                <button id="refresh-esa-data" style="background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
                    🔄 Refresh
                </button>
            </h2>
            <div id="esa-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                <div style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">
                    Loading ESA data...
                </div>
            </div>
        `;
        
        // Insert into page if this wasn't pre-reserved
        if (created) {
            const main = document.querySelector('main') || document.body;
            const nasaWidget = document.getElementById('nasa-api-widget');
            if (nasaWidget) {
                nasaWidget.insertAdjacentElement('afterend', container);
            } else {
                const firstSection = main.querySelector('section');
                if (firstSection) {
                    firstSection.insertAdjacentElement('afterend', container);
                } else {
                    main.appendChild(container);
                }
            }
        }
        
        // Refresh button
        const refreshBtn = container.querySelector('#refresh-esa-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadESAData();
            });
        }
    }
    
    async loadESAData() {
        try {
            // ESA doesn't have a public API like NASA, so we'll create a widget with information
            // In production, you would integrate with ESA's actual APIs or RSS feeds
            const missions = this.getESAMissions();
            this.renderESAData(missions);
        } catch (e) {
            console.error('Failed to load ESA data:', e);
            this.renderError('Failed to load ESA data');
        }
    }
    
    getESAMissions() {
        // Sample ESA mission data (in production, would come from API)
        return [
            {
                name: 'CHEOPS',
                description: 'Characterising Exoplanet Satellite - studying exoplanets',
                status: 'Active',
                launchDate: '2019-12-18'
            },
            {
                name: 'Gaia',
                description: 'Mapping the Milky Way galaxy',
                status: 'Active',
                launchDate: '2013-12-19'
            },
            {
                name: 'PLATO',
                description: 'PLAnetary Transits and Oscillations - searching for Earth-like planets',
                status: 'Planned',
                launchDate: '2026'
            },
            {
                name: 'Ariel',
                description: 'Atmospheric Remote-sensing Infrared Exoplanet Large-survey',
                status: 'Planned',
                launchDate: '2029'
            }
        ];
    }
    
    renderESAData(missions) {
        const container = document.getElementById('esa-content');
        if (!container) return;
        
        container.innerHTML = missions.map(mission => `
            <div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 1.5rem; border: 1px solid rgba(186,148,79,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <h3 style="color: #ba944f; margin: 0;">${mission.name}</h3>
                    <span style="background: ${mission.status === 'Active' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}; 
                                 color: ${mission.status === 'Active' ? '#4ade80' : '#fbbf24'}; 
                                 padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem;">
                        ${mission.status}
                    </span>
                </div>
                <p style="color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 1rem;">${mission.description}</p>
                <div style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                    Launch: ${mission.launchDate}
                </div>
            </div>
        `).join('');
    }
    
    renderError(message) {
        const container = document.getElementById('esa-content');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: rgba(255,0,0,0.7); padding: 2rem;">
                    ${message}
                </div>
            `;
        }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.esaAPIIntegration = new ESAAPIIntegration();
    });
} else {
    window.esaAPIIntegration = new ESAAPIIntegration();
}
