/**
 * Advanced Filtering System
 * 
 * Provides advanced multi-criteria filtering with saved filter presets,
 * filter combinations, and filter history.
 * 
 * @class AdvancedFilteringSystem
 * @example
 * // Auto-initializes on page load
 * // Access via: window.advancedFiltering()
 * 
 * // Apply filter preset
 * const filtering = window.advancedFiltering();
 * filtering.applyPreset('habitable-planets');
 * 
 * // Create custom filter
 * filtering.createFilter({
 *   name: 'My Custom Filter',
 *   criteria: {
 *     type: 'Terrestrial',
 *     minDistance: 10,
 *     maxDistance: 100
 *   }
 * });
 */
class AdvancedFilteringSystem {
    constructor() {
        this.filters = new Map();
        this.activeFilters = {};
        this.filterPresets = [];
        this.filterHistory = [];
        this.init();
    }

    init() {
        // Load saved presets
        this.loadPresets();
        
        // Load filter history
        this.loadHistory();
        
        this.trackEvent('filtering_system_initialized');
    }

    /**
     * Load saved filter presets
     * 
     * @method loadPresets
     * @returns {void}
     */
    loadPresets() {
        try {
            const stored = localStorage.getItem('filter-presets');
            if (stored) {
                this.filterPresets = JSON.parse(stored);
            } else {
                // Default presets
                this.filterPresets = [
                    {
                        id: 'habitable-planets',
                        name: 'Habitable Planets',
                        description: 'Planets in habitable zone',
                        criteria: {
                            type: 'Terrestrial',
                            minDistance: 0,
                            maxDistance: 1000,
                            habitable: true
                        }
                    },
                    {
                        id: 'gas-giants',
                        name: 'Gas Giants',
                        description: 'Large gas giant planets',
                        criteria: {
                            type: 'Gas Giant',
                            minRadius: 5
                        }
                    },
                    {
                        id: 'recent-discoveries',
                        name: 'Recent Discoveries',
                        description: 'Planets discovered in last 5 years',
                        criteria: {
                            minYear: new Date().getFullYear() - 5
                        }
                    }
                ];
                this.savePresets();
            }
        } catch (error) {
            console.warn('Failed to load filter presets:', error);
        }
    }

    /**
     * Save filter presets
     * 
     * @method savePresets
     * @returns {void}
     */
    savePresets() {
        try {
            localStorage.setItem('filter-presets', JSON.stringify(this.filterPresets));
        } catch (error) {
            console.warn('Failed to save filter presets:', error);
        }
    }

    /**
     * Load filter history
     * 
     * @method loadHistory
     * @returns {void}
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem('filter-history');
            if (stored) {
                this.filterHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load filter history:', error);
        }
    }

    /**
     * Save filter to history
     * 
     * @method saveToHistory
     * @param {Object} filter - Filter criteria
     * @returns {void}
     */
    saveToHistory(filter) {
        this.filterHistory.unshift({
            ...filter,
            timestamp: Date.now()
        });
        
        // Keep only last 20
        if (this.filterHistory.length > 20) {
            this.filterHistory = this.filterHistory.slice(0, 20);
        }
        
        try {
            localStorage.setItem('filter-history', JSON.stringify(this.filterHistory));
        } catch (error) {
            console.warn('Failed to save filter history:', error);
        }
    }

    /**
     * Apply filter criteria
     * 
     * @method applyFilter
     * @param {Object} criteria - Filter criteria object
     * @returns {void}
     */
    applyFilter(criteria) {
        this.activeFilters = { ...this.activeFilters, ...criteria };
        this.saveToHistory(criteria);
        this.triggerFilterEvent();
        this.trackEvent('filter_applied', { criteriaCount: Object.keys(criteria).length });
    }

    /**
     * Remove filter criteria
     * 
     * @method removeFilter
     * @param {string} key - Filter key to remove
     * @returns {void}
     */
    removeFilter(key) {
        delete this.activeFilters[key];
        this.triggerFilterEvent();
    }

    /**
     * Clear all filters
     * 
     * @method clearFilters
     * @returns {void}
     */
    clearFilters() {
        this.activeFilters = {};
        this.triggerFilterEvent();
    }

    /**
     * Apply a filter preset
     * 
     * @method applyPreset
     * @param {string} presetId - Preset ID
     * @returns {boolean} True if preset found and applied
     */
    applyPreset(presetId) {
        const preset = this.filterPresets.find(p => p.id === presetId);
        if (preset) {
            this.applyFilter(preset.criteria);
            this.trackEvent('preset_applied', { presetId });
            return true;
        }
        return false;
    }

    /**
     * Create a new filter preset
     * 
     * @method createPreset
     * @param {Object} preset - Preset configuration
     * @param {string} preset.id - Unique preset ID
     * @param {string} preset.name - Preset name
     * @param {string} [preset.description] - Preset description
     * @param {Object} preset.criteria - Filter criteria
     * @returns {void}
     */
    createPreset(preset) {
        const existingIndex = this.filterPresets.findIndex(p => p.id === preset.id);
        if (existingIndex >= 0) {
            this.filterPresets[existingIndex] = preset;
        } else {
            this.filterPresets.push(preset);
        }
        this.savePresets();
    }

    /**
     * Delete a filter preset
     * 
     * @method deletePreset
     * @param {string} presetId - Preset ID to delete
     * @returns {boolean} True if preset found and deleted
     */
    deletePreset(presetId) {
        const index = this.filterPresets.findIndex(p => p.id === presetId);
        if (index >= 0) {
            this.filterPresets.splice(index, 1);
            this.savePresets();
            return true;
        }
        return false;
    }

    /**
     * Get active filters
     * 
     * @method getActiveFilters
     * @returns {Object} Active filter criteria
     */
    getActiveFilters() {
        return { ...this.activeFilters };
    }

    /**
     * Get all presets
     * 
     * @method getPresets
     * @returns {Array} Array of filter presets
     */
    getPresets() {
        return [...this.filterPresets];
    }

    /**
     * Get filter history
     * 
     * @method getHistory
     * @param {number} [limit=10] - Maximum number of history entries
     * @returns {Array} Filter history array
     */
    getHistory(limit = 10) {
        return this.filterHistory.slice(0, limit);
    }

    /**
     * Trigger filter change event
     * 
     * @method triggerFilterEvent
     * @returns {void}
     * @private
     */
    triggerFilterEvent() {
        const event = new CustomEvent('filterChanged', {
            detail: { filters: this.getActiveFilters() },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Create filter UI panel
     * 
     * @method createFilterPanel
     * @returns {HTMLElement} Filter panel DOM element
     */
    createFilterPanel() {
        const panel = document.createElement('div');
        panel.className = 'advanced-filter-panel';
        panel.innerHTML = `
            <div class="filter-panel-header">
                <h3>🔍 Advanced Filters</h3>
                <button class="filter-panel-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="filter-panel-content">
                <div class="filter-presets-section">
                    <h4>Presets</h4>
                    <div class="presets-list">
                        ${this.filterPresets.map(preset => `
                            <button class="preset-btn" data-preset-id="${preset.id}">
                                <span class="preset-name">${this.escapeHtml(preset.name)}</span>
                                <span class="preset-desc">${this.escapeHtml(preset.description || '')}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="filter-criteria-section">
                    <h4>Filter Criteria</h4>
                    <div class="criteria-form">
                        <!-- Filter inputs will be added here -->
                    </div>
                </div>
                <div class="filter-actions">
                    <button class="filter-apply-btn">Apply Filters</button>
                    <button class="filter-clear-btn">Clear All</button>
                </div>
            </div>
        `;

        // Add event listeners
        panel.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetId = btn.dataset.presetId;
                this.applyPreset(presetId);
                panel.remove();
            });
        });

        this.injectStyles();
        return panel;
    }

    /**
     * Show filter panel
     * 
     * @method showFilterPanel
     * @returns {void}
     */
    showFilterPanel() {
        const existing = document.querySelector('.advanced-filter-panel');
        if (existing) {
            existing.remove();
        }

        const panel = this.createFilterPanel();
        document.body.appendChild(panel);

        // Animate in
        requestAnimationFrame(() => {
            panel.style.opacity = '1';
            panel.style.transform = 'scale(1)';
        });
    }

    /**
     * Escape HTML
     * 
     * @method escapeHtml
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles
     * 
     * @method injectStyles
     * @returns {void}
     * @private
     */
    injectStyles() {
        if (document.getElementById('advanced-filtering-styles')) return;

        const style = document.createElement('style');
        style.id = 'advanced-filtering-styles';
        style.textContent = `
            .advanced-filter-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 16px;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 10007;
                opacity: 0;
                transition: all 0.3s ease;
                font-family: 'Raleway', sans-serif;
                color: white;
            }

            .filter-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(186, 148, 79, 0.3);
            }

            .filter-panel-header h3 {
                color: #ba944f;
                margin: 0;
            }

            .filter-panel-close {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .filter-panel-close:hover {
                color: #ba944f;
            }

            .presets-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
            }

            .preset-btn {
                display: flex;
                flex-direction: column;
                padding: 0.75rem;
                background: rgba(186, 148, 79, 0.1);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            }

            .preset-btn:hover {
                background: rgba(186, 148, 79, 0.2);
                border-color: rgba(186, 148, 79, 0.5);
            }

            .preset-name {
                font-weight: 600;
                color: #ba944f;
            }

            .preset-desc {
                font-size: 0.85rem;
                color: rgba(255, 255, 255, 0.7);
                margin-top: 0.25rem;
            }

            .filter-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
            }

            .filter-apply-btn,
            .filter-clear-btn {
                flex: 1;
                padding: 0.75rem 1.5rem;
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 8px;
                background: rgba(186, 148, 79, 0.1);
                color: #ba944f;
                font-family: 'Raleway', sans-serif;
                cursor: pointer;
                transition: all 0.2s;
            }

            .filter-apply-btn:hover {
                background: rgba(186, 148, 79, 0.2);
            }

            .filter-clear-btn {
                background: rgba(220, 53, 69, 0.1);
                border-color: rgba(220, 53, 69, 0.5);
                color: #ff6b6b;
            }

            .filter-clear-btn:hover {
                background: rgba(220, 53, 69, 0.2);
            }
        `;

        document.head.appendChild(style);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`filtering_system_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_filtering_system', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize globally
let advancedFilteringInstance = null;

function initAdvancedFiltering() {
    if (!advancedFilteringInstance) {
        advancedFilteringInstance = new AdvancedFilteringSystem();
    }
    return advancedFilteringInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedFiltering);
} else {
    initAdvancedFiltering();
}

// Export globally
window.AdvancedFilteringSystem = AdvancedFilteringSystem;
window.advancedFiltering = () => advancedFilteringInstance;


