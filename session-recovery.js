/**
 * Session Recovery System
 * 
 * Automatically saves and restores user session state including scroll position,
 * form data, search queries, filters, and selected items. Saves every 30 seconds
 * and on page unload.
 * 
 * @class SessionRecovery
 * @example
 * // Auto-initializes on page load
 * // Access via: window.sessionRecovery()
 * 
 * // Set custom session data
 * const recovery = window.sessionRecovery();
 * recovery.setCustomData('lastViewedPlanet', 'Kepler-22b');
 * 
 * // Get custom session data
 * const planet = recovery.getCustomData('lastViewedPlanet');
 */
class SessionRecovery {
    constructor() {
        this.sessionData = {};
        this.autoSaveInterval = null;
        this.saveInterval = 30000; // 30 seconds
        this.init();
    }

    init() {
        // Load previous session
        this.loadSession();
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveSession();
        });
        
        // Restore session state
        this.restoreSession();
        
        console.log('✅ Session Recovery initialized');
    }

    /**
     * Save current session state to sessionStorage
     * 
     * Captures scroll position, form data, search queries, filters,
     * selected items, and custom data.
     * 
     * @method saveSession
     * @returns {void}
     */
    saveSession() {
        try {
            const data = {
                timestamp: Date.now(),
                url: window.location.href,
                scrollPosition: {
                    x: window.scrollX,
                    y: window.scrollY
                },
                formData: this.collectFormData(),
                searchQueries: this.collectSearchQueries(),
                filters: this.collectFilters(),
                selectedItems: this.collectSelectedItems(),
                customData: this.sessionData
            };

            sessionStorage.setItem('session-recovery', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save session:', error);
        }
    }

    /**
     * Load session data from sessionStorage
     * 
     * @method loadSession
     * @returns {void}
     */
    loadSession() {
        try {
            const stored = sessionStorage.getItem('session-recovery');
            if (stored) {
                this.sessionData = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load session:', error);
        }
    }

    /**
     * Restore session state from loaded data
     * 
     * Restores scroll position, form data, search queries, filters,
     * and selected items if on the same page.
     * 
     * @method restoreSession
     * @returns {void}
     */
    restoreSession() {
        if (!this.sessionData || !this.sessionData.url) return;

        // Check if same page
        if (this.sessionData.url === window.location.href) {
            // Restore scroll position
            if (this.sessionData.scrollPosition) {
                const scrollTimeout = setTimeout(() => {
                    window.scrollTo(
                        this.sessionData.scrollPosition.x,
                        this.sessionData.scrollPosition.y
                    );
                }, 100);
                // Store timeout for potential cleanup
                this.scrollTimeout = scrollTimeout;
            }

            // Restore form data
            this.restoreFormData();

            // Restore search queries
            this.restoreSearchQueries();

            // Restore filters
            this.restoreFilters();

            // Restore selected items
            this.restoreSelectedItems();
        }
    }

    /**
     * Collect all form data from the page
     * 
     * @method collectFormData
     * @returns {Object} Object mapping form IDs to form data objects
     */
    collectFormData() {
        const forms = {};
        document.querySelectorAll('form').forEach((form, index) => {
            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            if (Object.keys(data).length > 0) {
                forms[form.id || `form-${index}`] = data;
            }
        });
        return forms;
    }

    /**
     * Restore form data
     */
    restoreFormData() {
        if (!this.sessionData.formData) return;

        Object.keys(this.sessionData.formData).forEach(formId => {
            let form = null;
            if (formId.startsWith('form-')) {
                const index = parseInt(formId.replace('form-', ''));
                const forms = document.querySelectorAll('form');
                if (forms[index]) {
                    form = forms[index];
                }
            } else {
                form = document.getElementById(formId);
            }
            if (!form) return;

            const data = this.sessionData.formData[formId];
            Object.keys(data).forEach(name => {
                const input = form.querySelector(`[name="${name}"]`);
                if (input) {
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        input.checked = data[name] === input.value;
                    } else {
                        input.value = data[name];
                    }
                }
            });
        });
    }

    /**
     * Collect search queries
     */
    collectSearchQueries() {
        const queries = {};
        document.querySelectorAll('input[type="search"], input[placeholder*="search" i]').forEach(input => {
            if (input.value) {
                queries[input.id || input.name || 'search'] = input.value;
            }
        });
        return queries;
    }

    /**
     * Restore search queries
     */
    restoreSearchQueries() {
        if (!this.sessionData.searchQueries) return;

        Object.keys(this.sessionData.searchQueries).forEach(key => {
            const input = document.getElementById(key) || 
                         document.querySelector(`input[name="${key}"]`) ||
                         document.querySelector('input[type="search"]');
            if (input && this.sessionData.searchQueries[key]) {
                input.value = this.sessionData.searchQueries[key];
                // Trigger input event
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    /**
     * Collect filters
     */
    collectFilters() {
        const filters = {};
        document.querySelectorAll('[data-filter], select[data-filter]').forEach(element => {
            const filterKey = element.dataset.filter || element.id || element.name;
            if (element.value || element.checked) {
                filters[filterKey] = element.type === 'checkbox' ? element.checked : element.value;
            }
        });
        return filters;
    }

    /**
     * Restore filters
     */
    restoreFilters() {
        if (!this.sessionData.filters) return;

        Object.keys(this.sessionData.filters).forEach(key => {
            const element = document.querySelector(`[data-filter="${key}"]`) ||
                           document.getElementById(key) ||
                           document.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.sessionData.filters[key];
                } else {
                    element.value = this.sessionData.filters[key];
                }
                // Trigger change event
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    /**
     * Collect selected items
     */
    collectSelectedItems() {
        const selected = [];
        document.querySelectorAll('[data-selected="true"], .selected').forEach(element => {
            const id = element.id || element.dataset.id;
            if (id) {
                selected.push(id);
            }
        });
        return selected;
    }

    /**
     * Restore selected items
     */
    restoreSelectedItems() {
        if (!this.sessionData.selectedItems) return;

        this.sessionData.selectedItems.forEach(id => {
            const element = document.getElementById(id) || 
                          document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.classList.add('selected');
                element.dataset.selected = 'true';
            }
        });
    }

    /**
     * Setup auto-save
     */
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveSession();
        }, this.saveInterval);
    }

    /**
     * Cleanup resources and clear intervals
     * 
     * Should be called when the session recovery is no longer needed
     * to prevent memory leaks.
     * 
     * @method cleanup
     * @returns {void}
     */
    cleanup() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Set custom session data
     * 
     * @method setCustomData
     * @param {string} key - Data key
     * @param {*} value - Data value (must be JSON-serializable)
     * @returns {void}
     */
    setCustomData(key, value) {
        if (!this.sessionData.customData) {
            this.sessionData.customData = {};
        }
        this.sessionData.customData[key] = value;
        this.saveSession();
    }

    /**
     * Get custom session data
     * 
     * @method getCustomData
     * @param {string} key - Data key
     * @returns {*} Stored value or undefined if not found
     */
    getCustomData(key) {
        return this.sessionData.customData?.[key];
    }

    /**
     * Clear session
     */
    clearSession() {
        sessionStorage.removeItem('session-recovery');
        this.sessionData = {};
    }

    /**
     * Export session data
     */
    exportSession() {
        const data = JSON.stringify(this.sessionData, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize globally
let sessionRecoveryInstance = null;

function initSessionRecovery() {
    if (!sessionRecoveryInstance) {
        sessionRecoveryInstance = new SessionRecovery();
    }
    return sessionRecoveryInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSessionRecovery);
} else {
    initSessionRecovery();
}

// Export globally
window.SessionRecovery = SessionRecovery;
window.sessionRecovery = () => sessionRecoveryInstance;

