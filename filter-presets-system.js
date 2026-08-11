/**
 * Filter Presets System
 * 
 * Adds comprehensive filtering system with saved filter presets.
 * 
 * @module FilterPresetsSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class FilterPresetsSystem {
    constructor() {
        this.presets = new Map();
        this.activeFilters = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize filter presets system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('FilterPresetsSystem already initialized');
            return;
        }

        this.loadPresets();
        
        this.isInitialized = true;
        console.log('✅ Filter Presets System initialized');
    }

    /**
     * Save filter preset
     * @public
     * @param {string} name - Preset name
     * @param {Object} filters - Filter configuration
     * @param {string} context - Filter context (e.g., 'planets', 'database')
     */
    savePreset(name, filters, context = 'default') {
        const preset = {
            name,
            filters,
            context,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const key = `${context}-${name}`;
        this.presets.set(key, preset);
        this.savePresets();

        return preset;
    }

    /**
     * Get preset
     * @public
     * @param {string} name - Preset name
     * @param {string} context - Filter context
     * @returns {Object|null} Preset object
     */
    getPreset(name, context = 'default') {
        const key = `${context}-${name}`;
        return this.presets.get(key) || null;
    }

    /**
     * Get all presets
     * @public
     * @param {string} context - Filter context (optional)
     * @returns {Array} Presets array
     */
    getAllPresets(context = null) {
        const presets = Array.from(this.presets.values());
        if (context) {
            return presets.filter(p => p.context === context);
        }
        return presets;
    }

    /**
     * Apply preset
     * @public
     * @param {string} name - Preset name
     * @param {string} context - Filter context
     * @returns {Object} Applied filters
     */
    applyPreset(name, context = 'default') {
        const preset = this.getPreset(name, context);
        if (!preset) {
            return null;
        }

        this.activeFilters.set(context, preset.filters);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('filters-applied', {
            detail: { context, filters: preset.filters }
        }));

        return preset.filters;
    }

    /**
     * Get active filters
     * @public
     * @param {string} context - Filter context
     * @returns {Object|null} Active filters
     */
    getActiveFilters(context = 'default') {
        return this.activeFilters.get(context) || null;
    }

    /**
     * Set active filters
     * @public
     * @param {string} context - Filter context
     * @param {Object} filters - Filter configuration
     */
    setActiveFilters(context, filters) {
        this.activeFilters.set(context, filters);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('filters-changed', {
            detail: { context, filters }
        }));
    }

    /**
     * Clear filters
     * @public
     * @param {string} context - Filter context
     */
    clearFilters(context = 'default') {
        this.activeFilters.delete(context);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('filters-cleared', {
            detail: { context }
        }));
    }

    /**
     * Delete preset
     * @public
     * @param {string} name - Preset name
     * @param {string} context - Filter context
     * @returns {boolean} True if deleted
     */
    deletePreset(name, context = 'default') {
        const key = `${context}-${name}`;
        const deleted = this.presets.delete(key);
        if (deleted) {
            this.savePresets();
        }
        return deleted;
    }

    /**
     * Save presets
     * @private
     */
    savePresets() {
        try {
            const presets = Object.fromEntries(this.presets);
            localStorage.setItem('filter-presets', JSON.stringify(presets));
        } catch (e) {
            console.warn('Failed to save filter presets:', e);
        }
    }

    /**
     * Load presets
     * @private
     */
    loadPresets() {
        try {
            const saved = localStorage.getItem('filter-presets');
            if (saved) {
                const presets = JSON.parse(saved);
                Object.entries(presets).forEach(([key, value]) => {
                    this.presets.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load filter presets:', e);
        }
    }
}

// Create global instance
window.FilterPresetsSystem = FilterPresetsSystem;
window.filterPresets = new FilterPresetsSystem();
window.filterPresets.init();

