/**
 * Planet Discovery Export Feature
 * Export discovery data
 */

class PlanetDiscoveryExport {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('📤 Planet Discovery Export initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ex_po_rt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    exportToCSV(discoveries) {
        const headers = ['Planet Name', 'KEPID', 'Discovery Date', 'Status', 'Radius', 'Temperature'];
        const rows = discoveries.map(d => [
            d.name || d.planetName,
            d.kepid || d.planetId,
            d.discoveryDate || d.timestamp,
            d.status || 'Unknown',
            d.radius || '',
            d.temperature || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
        this.downloadFile(csv, 'planet-discoveries.csv', 'text/csv');
    }

    exportToJSON(discoveries) {
        const json = JSON.stringify(discoveries, null, 2);
        this.downloadFile(json, 'planet-discoveries.json', 'application/json');
    }

    exportToTXT(discoveries) {
        const txt = discoveries.map(d => 
            `Planet: ${d.name || d.planetName}\nKEPID: ${d.kepid || d.planetId}\nDiscovery Date: ${d.discoveryDate || d.timestamp}\n\n`
        ).join('---\n\n');
        this.downloadFile(txt, 'planet-discoveries.txt', 'text/plain');
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

    renderExport(containerId, discoveries) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="discovery-export" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📤 Export Discoveries (${discoveries.length})</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button onclick="planetDiscoveryExport.exportToCSV(${JSON.stringify(discoveries).replace(/"/g, '&quot;')})" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        Export CSV
                    </button>
                    <button onclick="planetDiscoveryExport.exportToJSON(${JSON.stringify(discoveries).replace(/"/g, '&quot;')})" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        Export JSON
                    </button>
                    <button onclick="planetDiscoveryExport.exportToTXT(${JSON.stringify(discoveries).replace(/"/g, '&quot;')})" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        Export TXT
                    </button>
                </div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryExport = PlanetDiscoveryExport;
    window.planetDiscoveryExport = new PlanetDiscoveryExport();
}

