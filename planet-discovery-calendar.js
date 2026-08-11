/**
 * Planet Discovery Calendar
 * Track discovery dates
 */

class PlanetDiscoveryCalendar {
    constructor() {
        this.discoveries = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadDiscoveries();
        this.isInitialized = true;
        console.log('📅 Planet Discovery Calendar initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ca_le_nd_ar_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadDiscoveries() {
        try {
            const stored = localStorage.getItem('discovery-calendar');
            if (stored) this.discoveries = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading discoveries:', error);
        }
    }

    saveDiscoveries() {
        try {
            localStorage.setItem('discovery-calendar', JSON.stringify(this.discoveries));
        } catch (error) {
            console.error('Error saving discoveries:', error);
        }
    }

    addDiscovery(planetData, discoveryDate = new Date()) {
        const discovery = {
            kepid: planetData.kepid,
            name: planetData.kepler_name || planetData.kepoi_name,
            discoveryDate: discoveryDate.toISOString(),
            addedAt: new Date().toISOString()
        };

        this.discoveries.push(discovery);
        this.saveDiscoveries();
        return discovery;
    }

    getDiscoveriesByMonth(year, month) {
        return this.discoveries.filter(d => {
            const date = new Date(d.discoveryDate);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    }

    renderCalendar(containerId, year = new Date().getFullYear(), month = new Date().getMonth()) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const discoveries = this.getDiscoveriesByMonth(year, month);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        container.innerHTML = `
            <div class="discovery-calendar" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📅 Discovery Calendar - ${monthNames[month]} ${year}</h3>
                <div style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem;">${discoveries.length} discoveries this month</div>
                <div class="calendar-discoveries">${this.renderDiscoveries(discoveries)}</div>
            </div>
        `;
    }

    renderDiscoveries(discoveries) {
        if (discoveries.length === 0) {
            return '<p style="color: rgba(255, 255, 255, 0.5);">No discoveries this month</p>';
        }

        return discoveries.map(d => {
            const date = new Date(d.discoveryDate);
            return `
                <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; margin-bottom: 0.5rem;">
                    <div style="color: #ba944f; font-weight: 600; margin-bottom: 0.25rem;">${d.name}</div>
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">${date.toLocaleDateString()}</div>
                </div>
            `;
        }).join('');
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryCalendar = PlanetDiscoveryCalendar;
    window.planetDiscoveryCalendar = new PlanetDiscoveryCalendar();
}

