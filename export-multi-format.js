/**
 * Multi-Format Export System
 * 
 * Implements comprehensive export functionality (CSV, JSON, PDF, Excel).
 * 
 * @module ExportMultiFormat
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ExportMultiFormat {
    constructor() {
        this.exporters = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize multi-format export system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('ExportMultiFormat already initialized');
            return;
        }

        this.setupExporters();

        this.isInitialized = true;
        console.log('✅ Multi-Format Export System initialized');
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

        // Excel exporter (CSV format, can be opened in Excel)
        this.exporters.set('excel', {
            export: this.exportExcel.bind(this),
            mimeType: 'application/vnd.ms-excel',
            extension: 'csv'
        });

        // PDF exporter (using browser print)
        this.exporters.set('pdf', {
            export: this.exportPDF.bind(this),
            mimeType: 'application/pdf',
            extension: 'pdf'
        });
    }

    /**
     * Export data
     * @public
     * @param {Array|Object} data - Data to export
     * @param {string} format - Export format
     * @param {string} filename - Filename
     * @param {Object} options - Export options
     * @returns {Promise} Export result
     */
    async export(data, format = 'json', filename = null, options = {}) {
        const exporter = this.exporters.get(format);
        if (!exporter) {
            throw new Error(`Unsupported export format: ${format}`);
        }

        const content = await exporter.export(data, options);
        const defaultFilename = filename || `export-${Date.now()}.${exporter.extension}`;

        this.downloadFile(content, defaultFilename, exporter.mimeType);

        return { success: true, filename: defaultFilename };
    }

    /**
     * Export JSON
     * @private
     * @param {*} data - Data to export
     * @param {Object} options - Options
     * @returns {Promise<string>} JSON string
     */
    async exportJSON(data, options = {}) {
        return JSON.stringify(data, null, options.pretty ? 2 : 0);
    }

    /**
     * Export CSV
     * @private
     * @param {Array} data - Data array
     * @param {Object} options - Options
     * @returns {Promise<string>} CSV string
     */
    async exportCSV(data, options = {}) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const headers = options.headers || Object.keys(data[0]);
        const rows = [headers.join(',')];

        data.forEach(item => {
            const values = headers.map(header => {
                const value = this.getNestedValue(item, header);
                if (value === null || value === undefined) {
                    return '';
                }
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            rows.push(values.join(','));
        });

        return rows.join('\n');
    }

    /**
     * Export Excel (CSV format)
     * @private
     * @param {Array} data - Data array
     * @param {Object} options - Options
     * @returns {Promise<string>} CSV string
     */
    async exportExcel(data, options = {}) {
        // Excel can open CSV files
        return this.exportCSV(data, options);
    }

    /**
     * Export PDF
     * @private
     * @param {*} data - Data to export
     * @param {Object} options - Options
     * @returns {Promise} PDF export
     */
    async exportPDF(data, options = {}) {
        // Create printable content
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Export</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    ${this.formatDataForPrint(data, options)}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();

        return { printed: true };
    }

    /**
     * Format data for print
     * @private
     * @param {*} data - Data to format
     * @param {Object} options - Options
     * @returns {string} HTML string
     */
    formatDataForPrint(data, options = {}) {
        if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            let html = '<table><thead><tr>';
            headers.forEach(header => {
                html += `<th>${this.escapeHtml(header)}</th>`;
            });
            html += '</tr></thead><tbody>';

            data.forEach(item => {
                html += '<tr>';
                headers.forEach(header => {
                    const val = this.getNestedValue(item, header);
                    html += `<td>${this.escapeHtml(val)}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
            return html;
        }

        return `<pre>${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        if (typeof text === 'object') text = JSON.stringify(text); // Handle objects
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Get nested value
     * @private
     * @param {Object} obj - Object
     * @param {string} path - Field path
     * @returns {*} Value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, prop) => current?.[prop], obj);
    }

    /**
     * Download file
     * @private
     * @param {string|Blob} content - File content
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, filename, mimeType) {
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create global instance
window.ExportMultiFormat = ExportMultiFormat;
window.exportMultiFormat = new ExportMultiFormat();
window.exportMultiFormat.init();

