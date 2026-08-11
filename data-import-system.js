/**
 * Comprehensive Data Import System
 * 
 * Adds comprehensive data import functionality with validation.
 * 
 * @module DataImportSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class DataImportSystem {
    constructor() {
        this.importers = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize data import system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('DataImportSystem already initialized');
            return;
        }

        this.setupImporters();
        
        this.isInitialized = true;
        this.trackEvent('data_import_system_initialized');
    }

    /**
     * Set up importers
     * @private
     */
    setupImporters() {
        // JSON importer
        this.importers.set('json', {
            import: this.importJSON.bind(this),
            validate: this.validateJSON.bind(this)
        });

        // CSV importer
        this.importers.set('csv', {
            import: this.importCSV.bind(this),
            validate: this.validateCSV.bind(this)
        });

        // Text importer
        this.importers.set('txt', {
            import: this.importText.bind(this),
            validate: this.validateText.bind(this)
        });
    }

    /**
     * Import data from file
     * @public
     * @param {File} file - File to import
     * @param {Object} options - Import options
     * @returns {Promise<Object>} Import result
     */
    async importFromFile(file, options = {}) {
        const format = this.detectFormat(file);
        const importer = this.importers.get(format);

        if (!importer) {
            throw new Error(`Unsupported import format: ${format}`);
        }

        // Read file
        const content = await this.readFile(file);

        // Validate
        const validation = importer.validate(content, options.schema);
        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        // Import
        const data = await importer.import(content, options);

        // Process data
        if (options.process) {
            await options.process(data);
        }

        return {
            success: true,
            data,
            format
        };
    }

    /**
     * Detect file format
     * @private
     * @param {File} file - File object
     * @returns {string} Format name
     */
    detectFormat(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return extension || 'txt';
    }

    /**
     * Read file
     * @private
     * @param {File} file - File object
     * @returns {Promise<string>} File content
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Import JSON
     * @private
     * @param {string} content - JSON content
     * @param {Object} options - Import options
     * @returns {Promise<*>} Parsed data
     */
    async importJSON(content, options = {}) {
        try {
            return JSON.parse(content);
        } catch (e) {
            throw new Error(`Invalid JSON: ${e.message}`);
        }
    }

    /**
     * Validate JSON
     * @private
     * @param {string} content - JSON content
     * @param {Object} schema - JSON Schema (optional)
     * @returns {Object} Validation result
     */
    validateJSON(content, schema = null) {
        try {
            const data = JSON.parse(content);
            
            if (schema && window.jsonSchemaValidator) {
                return window.jsonSchemaValidator.validate(data, schema);
            }

            return { valid: true, errors: [] };
        } catch (e) {
            return {
                valid: false,
                errors: [{ message: `Invalid JSON: ${e.message}` }]
            };
        }
    }

    /**
     * Import CSV
     * @private
     * @param {string} content - CSV content
     * @param {Object} options - Import options
     * @returns {Promise<Array>} Parsed data
     */
    async importCSV(content, options = {}) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            return [];
        }

        const headers = this.parseCSVLine(lines[0]);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const item = {};
            headers.forEach((header, index) => {
                item[header] = values[index] || '';
            });
            data.push(item);
        }

        return data;
    }

    /**
     * Parse CSV line
     * @private
     * @param {string} line - CSV line
     * @returns {Array} Parsed values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current);
        return values;
    }

    /**
     * Validate CSV
     * @private
     * @param {string} content - CSV content
     * @param {Object} schema - Validation schema (optional)
     * @returns {Object} Validation result
     */
    validateCSV(content, schema = null) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            return { valid: false, errors: [{ message: 'CSV file is empty' }] };
        }

        return { valid: true, errors: [] };
    }

    /**
     * Import text
     * @private
     * @param {string} content - Text content
     * @param {Object} options - Import options
     * @returns {Promise<string>} Text content
     */
    async importText(content, options = {}) {
        return content;
    }

    /**
     * Validate text
     * @private
     * @param {string} content - Text content
     * @param {Object} schema - Validation schema (optional)
     * @returns {Object} Validation result
     */
    validateText(content, schema = null) {
        if (!content || content.trim().length === 0) {
            return { valid: false, errors: [{ message: 'Text content is empty' }] };
        }

        return { valid: true, errors: [] };
    }

    /**
     * Create file input
     * @public
     * @param {Function} callback - Callback function
     * @param {Object} options - Options
     * @returns {HTMLElement} File input element
     */
    createFileInput(callback, options = {}) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = options.accept || '.json,.csv,.txt';
        input.multiple = options.multiple || false;

        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                try {
                    const result = await this.importFromFile(file, options);
                    callback(result, file);
                } catch (error) {
                    callback({ success: false, error: error.message }, file);
                }
            }
        });

        return input;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_import_system_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.DataImportSystem = DataImportSystem;
window.dataImport = new DataImportSystem();
window.dataImport.init();

