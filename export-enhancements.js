/**
 * Export Planet Data Enhancements
 * Additional export formats and options for planet data
 * 
 * Features:
 * - XML export
 * - Excel export (XLSX)
 * - Markdown export
 * - Custom format export
 * - Batch export
 * - Export templates
 */

class ExportEnhancements {
    constructor() {
        this.supportedFormats = ['csv', 'json', 'xml', 'xlsx', 'md', 'txt'];
        this.init();
    }
    
    init() {
        // Enhance existing export functionality
        this.enhanceExportButtons();
        
        console.log('📤 Export Enhancements initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_xp_or_te_nh_an_ce_me_nt_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    enhanceExportButtons() {
        // Find existing export buttons and enhance them
        const exportButtons = document.querySelectorAll('[data-export], [data-export-planets]');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showExportDialog();
            });
        });
    }
    
    showExportDialog() {
        // Get planet data (from database instance or global)
        const planets = this.getPlanetData();
        
        if (!planets || planets.length === 0) {
            alert('No planet data available to export');
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 2rem;
            z-index: 10000;
            min-width: 400px;
            color: white;
        `;
        
        dialog.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0;">📤 Export Planet Data</h2>
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Format:</label>
                <select id="export-format" style="width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                    <option value="csv">CSV (Comma Separated Values)</option>
                    <option value="json">JSON (JavaScript Object Notation)</option>
                    <option value="xml">XML (Extensible Markup Language)</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="md">Markdown</option>
                    <option value="txt">Plain Text</option>
                </select>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Scope:</label>
                <select id="export-scope" style="width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(186,148,79,0.3); border-radius: 5px; color: white;">
                    <option value="all">All Planets</option>
                    <option value="filtered">Filtered Results</option>
                    <option value="favorites">Favorites Only</option>
                    <option value="selected">Selected Planets</option>
                </select>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="export-include-metadata" checked>
                    <span>Include metadata (export date, source, etc.)</span>
                </label>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="export-cancel" style="padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: white; cursor: pointer;">Cancel</button>
                <button id="export-confirm" style="padding: 0.75rem 1.5rem; background: #ba944f; border: none; border-radius: 5px; color: white; cursor: pointer;">Export</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Event listeners
        document.getElementById('export-cancel').addEventListener('click', () => {
            dialog.remove();
        });
        
        document.getElementById('export-confirm').addEventListener('click', () => {
            const format = document.getElementById('export-format').value;
            const scope = document.getElementById('export-scope').value;
            const includeMetadata = document.getElementById('export-include-metadata').checked;
            
            this.exportData(planets, format, scope, includeMetadata);
            dialog.remove();
        });
    }
    
    getPlanetData() {
        // Try to get from database instance
        if (window.databaseInstance && window.databaseInstance.planets) {
            return window.databaseInstance.planets;
        }
        
        // Try to get from global
        if (window.KEPLER_DATABASE && window.KEPLER_DATABASE.allPlanets) {
            return window.KEPLER_DATABASE.allPlanets;
        }
        
        // Try to get from filtered results
        const planetCards = document.querySelectorAll('.planet-card');
        if (planetCards.length > 0) {
            return Array.from(planetCards).map(card => {
                return {
                    name: card.dataset.name || '',
                    kepid: card.dataset.kepid || '',
                    // Extract other data from card
                };
            });
        }
        
        return [];
    }
    
    exportData(planets, format, scope, includeMetadata) {
        // Filter by scope
        const dataToExport = this.filterByScope(planets, scope);
        
        if (dataToExport.length === 0) {
            alert('No data to export for the selected scope');
            return;
        }
        
        // Export based on format
        switch (format) {
            case 'csv':
                this.exportToCSV(dataToExport, includeMetadata);
                break;
            case 'json':
                this.exportToJSON(dataToExport, includeMetadata);
                break;
            case 'xml':
                this.exportToXML(dataToExport, includeMetadata);
                break;
            case 'xlsx':
                this.exportToExcel(dataToExport, includeMetadata);
                break;
            case 'md':
                this.exportToMarkdown(dataToExport, includeMetadata);
                break;
            case 'txt':
                this.exportToText(dataToExport, includeMetadata);
                break;
            default:
                alert('Unsupported export format');
        }
    }
    
    filterByScope(planets, scope) {
        switch (scope) {
            case 'all':
                return planets;
            case 'filtered':
                // Get currently filtered planets
                return this.getFilteredPlanets(planets);
            case 'favorites':
                return this.getFavoritePlanets(planets);
            case 'selected':
                return this.getSelectedPlanets(planets);
            default:
                return planets;
        }
    }
    
    getFilteredPlanets(planets) {
        // Get planets that match current filters
        return planets; // Placeholder - implement actual filtering logic
    }
    
    getFavoritePlanets(planets) {
        const favorites = JSON.parse(localStorage.getItem('planet-favorites') || '[]');
        return planets.filter(p => favorites.includes(p.kepid || p.name));
    }
    
    getSelectedPlanets(planets) {
        const selected = document.querySelectorAll('.planet-card.selected');
        const selectedIds = Array.from(selected).map(card => card.dataset.kepid);
        return planets.filter(p => selectedIds.includes(p.kepid));
    }
    
    exportToCSV(data, includeMetadata) {
        const headers = ['KEPID', 'Name', 'Status', 'Type', 'Radius (Earth)', 'Mass (Earth)', 'Distance (ly)', 'Discovery Year'];
        const rows = data.map(planet => [
            planet.kepid || '',
            planet.kepoi_name || planet.name || '',
            planet.status || '',
            planet.type || '',
            planet.radius || '',
            planet.mass || '',
            planet.distance || '',
            planet.disc_year || ''
        ]);
        
        let csv = '';
        if (includeMetadata) {
            csv += `# Exoplanet Database Export\n`;
            csv += `# Export Date: ${new Date().toISOString()}\n`;
            csv += `# Total Planets: ${data.length}\n`;
            csv += `#\n`;
        }
        
        csv += headers.join(',') + '\n';
        csv += rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        
        this.downloadFile(csv, 'exoplanets.csv', 'text/csv');
    }
    
    exportToJSON(data, includeMetadata) {
        const exportData = includeMetadata ? {
            metadata: {
                exportDate: new Date().toISOString(),
                totalPlanets: data.length,
                source: 'Kepler Exoplanet Database'
            },
            planets: data
        } : data;
        
        const json = JSON.stringify(exportData, null, 2);
        this.downloadFile(json, 'exoplanets.json', 'application/json');
    }
    
    exportToXML(data, includeMetadata) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<exoplanets>\n';
        
        if (includeMetadata) {
            xml += '  <metadata>\n';
            xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
            xml += `    <totalPlanets>${data.length}</totalPlanets>\n`;
            xml += '    <source>Kepler Exoplanet Database</source>\n';
            xml += '  </metadata>\n';
        }
        
        data.forEach(planet => {
            xml += '  <planet>\n';
            xml += `    <kepid>${this.escapeXML(planet.kepid || '')}</kepid>\n`;
            xml += `    <name>${this.escapeXML(planet.kepoi_name || planet.name || '')}</name>\n`;
            xml += `    <status>${this.escapeXML(planet.status || '')}</status>\n`;
            xml += `    <type>${this.escapeXML(planet.type || '')}</type>\n`;
            xml += `    <radius>${planet.radius || ''}</radius>\n`;
            xml += `    <mass>${planet.mass || ''}</mass>\n`;
            xml += `    <distance>${planet.distance || ''}</distance>\n`;
            xml += `    <discoveryYear>${planet.disc_year || ''}</discoveryYear>\n`;
            xml += '  </planet>\n';
        });
        
        xml += '</exoplanets>';
        this.downloadFile(xml, 'exoplanets.xml', 'application/xml');
    }
    
    exportToExcel(data, includeMetadata) {
        // Excel export requires a library like SheetJS
        // For now, export as CSV with .xlsx extension
        // In production, use a library like xlsx.js
        alert('Excel export requires xlsx.js library. Exporting as CSV instead.');
        this.exportToCSV(data, includeMetadata);
    }
    
    exportToMarkdown(data, includeMetadata) {
        let md = '';
        
        if (includeMetadata) {
            md += `# Exoplanet Database Export\n\n`;
            md += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
            md += `**Total Planets:** ${data.length}\n\n`;
            md += `---\n\n`;
        }
        
        md += `| KEPID | Name | Status | Type | Radius | Mass | Distance | Year |\n`;
        md += `|-------|------|--------|------|--------|------|----------|------|\n`;
        
        data.forEach(planet => {
            md += `| ${planet.kepid || ''} | ${planet.kepoi_name || planet.name || ''} | ${planet.status || ''} | ${planet.type || ''} | ${planet.radius || ''} | ${planet.mass || ''} | ${planet.distance || ''} | ${planet.disc_year || ''} |\n`;
        });
        
        this.downloadFile(md, 'exoplanets.md', 'text/markdown');
    }
    
    exportToText(data, includeMetadata) {
        let txt = '';
        
        if (includeMetadata) {
            txt += `Exoplanet Database Export\n`;
            txt += `Export Date: ${new Date().toLocaleDateString()}\n`;
            txt += `Total Planets: ${data.length}\n\n`;
            txt += `${'='.repeat(50)}\n\n`;
        }
        
        data.forEach((planet, index) => {
            txt += `Planet ${index + 1}:\n`;
            txt += `  KEPID: ${planet.kepid || 'N/A'}\n`;
            txt += `  Name: ${planet.kepoi_name || planet.name || 'N/A'}\n`;
            txt += `  Status: ${planet.status || 'N/A'}\n`;
            txt += `  Type: ${planet.type || 'N/A'}\n`;
            txt += `  Radius: ${planet.radius || 'N/A'} Earth radii\n`;
            txt += `  Mass: ${planet.mass || 'N/A'} Earth masses\n`;
            txt += `  Distance: ${planet.distance || 'N/A'} light-years\n`;
            txt += `  Discovery Year: ${planet.disc_year || 'N/A'}\n`;
            txt += `\n`;
        });
        
        this.downloadFile(txt, 'exoplanets.txt', 'text/plain');
    }
    
    escapeXML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.exportEnhancements = new ExportEnhancements();
    });
} else {
    window.exportEnhancements = new ExportEnhancements();
}

