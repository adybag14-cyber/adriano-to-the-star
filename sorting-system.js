/**
 * Comprehensive Sorting System
 * 
 * Implements comprehensive sorting options for all data tables.
 * 
 * @module SortingSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class SortingSystem {
    constructor() {
        this.sortConfigs = new Map();
        this.activeSorts = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize sorting system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('SortingSystem already initialized');
            return;
        }

        this.setupDefaultSorters();
        
        this.isInitialized = true;
        console.log('✅ Sorting System initialized');
    }

    /**
     * Set up default sorters
     * @private
     */
    setupDefaultSorters() {
        // String sorter
        this.registerSorter('string', (a, b, order) => {
            const comparison = a.localeCompare(b);
            return order === 'asc' ? comparison : -comparison;
        });

        // Number sorter
        this.registerSorter('number', (a, b, order) => {
            const comparison = a - b;
            return order === 'asc' ? comparison : -comparison;
        });

        // Date sorter
        this.registerSorter('date', (a, b, order) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            const comparison = dateA - dateB;
            return order === 'asc' ? comparison : -comparison;
        });

        // Custom function sorter
        this.registerSorter('custom', (a, b, order, customFn) => {
            const comparison = customFn(a, b);
            return order === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * Register sorter
     * @public
     * @param {string} type - Sorter type
     * @param {Function} sorter - Sorter function
     */
    registerSorter(type, sorter) {
        this.sortConfigs.set(type, sorter);
    }

    /**
     * Sort array
     * @public
     * @param {Array} data - Data array
     * @param {string|Object} sortConfig - Sort configuration
     * @returns {Array} Sorted array
     */
    sort(data, sortConfig) {
        if (!data || !Array.isArray(data)) {
            return [];
        }

        const config = typeof sortConfig === 'string' 
            ? { field: sortConfig, order: 'asc' }
            : sortConfig;

        const { field, order = 'asc', type = 'auto', customFn = null } = config;

        if (!field) {
            return data;
        }

        // Detect type if auto
        const detectedType = type === 'auto' ? this.detectType(data[0]?.[field]) : type;

        // Get sorter
        const sorter = this.sortConfigs.get(detectedType);
        if (!sorter) {
            console.warn(`No sorter found for type: ${detectedType}`);
            return data;
        }

        // Sort
        return [...data].sort((a, b) => {
            const valueA = this.getNestedValue(a, field);
            const valueB = this.getNestedValue(b, field);
            
            if (valueA === null || valueA === undefined) return 1;
            if (valueB === null || valueB === undefined) return -1;

            return sorter(valueA, valueB, order, customFn);
        });
    }

    /**
     * Detect value type
     * @private
     * @param {*} value - Value to detect
     * @returns {string} Type name
     */
    detectType(value) {
        if (value === null || value === undefined) {
            return 'string';
        }

        if (typeof value === 'number') {
            return 'number';
        }

        if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
            return 'date';
        }

        return 'string';
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
     * Multi-sort
     * @public
     * @param {Array} data - Data array
     * @param {Array} sortConfigs - Array of sort configurations
     * @returns {Array} Sorted array
     */
    multiSort(data, sortConfigs) {
        if (!sortConfigs || sortConfigs.length === 0) {
            return data;
        }

        let sorted = [...data];

        // Apply sorts in order
        for (const config of sortConfigs) {
            sorted = this.sort(sorted, config);
        }

        return sorted;
    }

    /**
     * Set active sort
     * @public
     * @param {string} context - Sort context
     * @param {Object} sortConfig - Sort configuration
     */
    setActiveSort(context, sortConfig) {
        this.activeSorts.set(context, sortConfig);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('sort-changed', {
            detail: { context, sortConfig }
        }));
    }

    /**
     * Get active sort
     * @public
     * @param {string} context - Sort context
     * @returns {Object|null} Active sort configuration
     */
    getActiveSort(context) {
        return this.activeSorts.get(context) || null;
    }

    /**
     * Clear sort
     * @public
     * @param {string} context - Sort context
     */
    clearSort(context) {
        this.activeSorts.delete(context);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('sort-cleared', {
            detail: { context }
        }));
    }
}

// Create global instance
window.SortingSystem = SortingSystem;
window.sortingSystem = new SortingSystem();
window.sortingSystem.init();

