/**
 * Planet Data Export Wizard
 * Easy export of planet data in multiple formats
 */

class PlanetDataExportWizard {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('📤 Planet Data Export Wizard initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_at_ae_xp_or_tw_iz_ar_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    exportToCSV(planets) {
        const headers = ['Name', 'Radius', 'Mass', 'Temperature', 'Period'];
        const rows = planets.map(p => [
            p.kepler_name || p.kepoi_name,
            p.radius || '',
            p.mass || '',
            p.koi_teq || '',
            p.koi_period || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        this.downloadFile(csv, 'planets.csv', 'text/csv');
    }

    exportToJSON(planets) {
        const json = JSON.stringify(planets, null, 2);
        this.downloadFile(json, 'planets.json', 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    renderExportWizard(containerId, planets) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="export-wizard" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📤 Export Data</h3>
                <button id="export-csv-btn" style="padding: 0.75rem 1.5rem; margin-right: 1rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                    Export CSV
                </button>
                <button id="export-json-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                    Export JSON
                </button>
            </div>
        `;
        document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportToCSV(planets));
        document.getElementById('export-json-btn')?.addEventListener('click', () => this.exportToJSON(planets));
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDataExportWizard = PlanetDataExportWizard;
    window.planetDataExportWizard = new PlanetDataExportWizard();
}

