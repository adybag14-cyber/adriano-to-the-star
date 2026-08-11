/**
 * Event Export
 * Export tracked events
 */

class EventExport {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupExport();
        this.trackEvent('event_export_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`event_export_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    setupExport() {
        // Setup event export
    }
    
    async exportEvents(events, format = 'json') {
        // Export events
        switch (format) {
            case 'json':
                return this.exportJSON(events);
            case 'csv':
                return this.exportCSV(events);
            case 'xlsx':
                return this.exportXLSX(events);
            default:
                return this.exportJSON(events);
        }
    }
    
    exportJSON(events) {
        // Export as JSON
        const data = JSON.stringify(events, null, 2);
        this.downloadFile(data, 'events.json', 'application/json');
        return { format: 'json', exported: true };
    }
    
    exportCSV(events) {
        // Export as CSV
        if (events.length === 0) return { format: 'csv', exported: false };
        
        const headers = Object.keys(events[0]).join(',');
        const rows = events.map(e => Object.values(e).join(','));
        const csv = [headers, ...rows].join('\n');
        
        this.downloadFile(csv, 'events.csv', 'text/csv');
        return { format: 'csv', exported: true };
    }
    
    exportXLSX(events) {
        // Export as XLSX (would need library)
        return { format: 'xlsx', exported: false, note: 'Requires XLSX library' };
    }
    
    downloadFile(content, filename, mimeType) {
        // Download file
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.eventExport = new EventExport(); });
} else {
    window.eventExport = new EventExport();
}

