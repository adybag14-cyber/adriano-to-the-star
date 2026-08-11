/**
 * Comprehensive Data Export System
 * 
 * Implements comprehensive data export functionality (all user data).
 * 
 * @module DataExportSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class DataExportSystem {
    constructor() {
        this.exporters = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize data export system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('DataExportSystem already initialized');
            return;
        }

        this.setupExporters();
        
        this.isInitialized = true;
        this.trackEvent('data_export_system_initialized');
    }

    /**
     * Set up exporters
     * @private
     */
    setupExporters() {
        // JSON exporter
        this.exporters.set('json', {
            export: this.exportJSON.bind(this),
            mimeType: 'application/json',
            extension: 'json'
        });

        // CSV exporter
        this.exporters.set('csv', {
            export: this.exportCSV.bind(this),
            mimeType: 'text/csv',
            extension: 'csv'
        });

        // Text exporter
        this.exporters.set('txt', {
            export: this.exportText.bind(this),
            mimeType: 'text/plain',
            extension: 'txt'
        });
    }

    /**
     * Export data
     * @public
     * @param {Array|Object} data - Data to export
     * @param {string} format - Export format (json, csv, txt)
     * @param {string} filename - Filename
     * @returns {Promise} Export result
     */
    async export(data, format = 'json', filename = null) {
        const exporter = this.exporters.get(format);
        if (!exporter) {
            throw new Error(`Unsupported export format: ${format}`);
        }

        const content = await exporter.export(data);
        const defaultFilename = filename || `export-${Date.now()}.${exporter.extension}`;
        
        this.downloadFile(content, defaultFilename, exporter.mimeType);
        
        return { success: true, filename: defaultFilename };
    }

    /**
     * Export all user data
     * @public
     * @param {string} format - Export format
     * @returns {Promise} Export result
     */
    async exportAllUserData(format = 'json') {
        const userData = {
            user: this.getUserData(),
            preferences: this.getPreferences(),
            chatHistory: this.getChatHistory(),
            planetClaims: this.getPlanetClaims(),
            favorites: this.getFavorites(),
            bookmarks: this.getBookmarks(),
            exportDate: new Date().toISOString()
        };

        return this.export(userData, format, `user-data-export-${Date.now()}.${this.exporters.get(format).extension}`);
    }

    /**
     * Export JSON
     * @private
     * @param {*} data - Data to export
     * @returns {Promise<string>} JSON string
     */
    async exportJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export CSV
     * @private
     * @param {Array} data - Data array
     * @returns {Promise<string>} CSV string
     */
    async exportCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const rows = [headers.join(',')];

        data.forEach(item => {
            const values = headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined) {
                    return '';
                }
                const stringValue = String(value);
                // Escape commas and quotes
                if (stringValue.includes(',') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            rows.push(values.join(','));
        });

        return rows.join('\n');
    }

    /**
     * Export text
     * @private
     * @param {*} data - Data to export
     * @returns {Promise<string>} Text string
     */
    async exportText(data) {
        if (typeof data === 'string') {
            return data;
        }
        return JSON.stringify(data, null, 2);
    }

    /**
     * Download file
     * @private
     * @param {string} content - File content
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get user data
     * @private
     * @returns {Object} User data
     */
    getUserData() {
        try {
            return JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
        } catch {
            return null;
        }
    }

    /**
     * Get preferences
     * @private
     * @returns {Object} Preferences
     */
    getPreferences() {
        if (window.userPreferences) {
            return window.userPreferences.getAll();
        }
        try {
            return JSON.parse(localStorage.getItem('user-preferences') || '{}');
        } catch {
            return {};
        }
    }

    /**
     * Get chat history
     * @private
     * @returns {Array} Chat history
     */
    getChatHistory() {
        try {
            return JSON.parse(localStorage.getItem('stellar-ai-chats') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Get planet claims
     * @private
     * @returns {Array} Planet claims
     */
    getPlanetClaims() {
        try {
            return JSON.parse(localStorage.getItem('planet-claims') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Get favorites
     * @private
     * @returns {Array} Favorites
     */
    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Get bookmarks
     * @private
     * @returns {Array} Bookmarks
     */
    getBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('bookmarks') || '[]');
        } catch {
            return [];
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_export_system_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.DataExportSystem = DataExportSystem;
window.dataExport = new DataExportSystem();
window.dataExport.init();

