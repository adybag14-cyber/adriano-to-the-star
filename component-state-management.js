/**
 * Component State Management
 * Manages component state
 */

class ComponentStateManagement {
    constructor() {
        this.states = new Map();
        this.listeners = new Map();
        this.initialized = false;
    }

    /**
     * Initialize Component State Management
     */
    async initialize() {
        this.initialized = true;
        this.trackEvent('comp_state_initialized');
        return { success: true, message: 'Component State Management initialized' };
    }

    /**
     * Set state
     * @param {string} componentId - Component ID
     * @param {Object} state - State object
     */
    setState(componentId, state) {
        this.states.set(componentId, state);
        this.notifyListeners(componentId, state);
    }

    /**
     * Get state
     * @param {string} componentId - Component ID
     * @returns {Object|null}
     */
    getState(componentId) {
        return this.states.get(componentId) || null;
    }

    /**
     * Subscribe to state changes
     * @param {string} componentId - Component ID
     * @param {Function} callback - Callback function
     */
    subscribe(componentId, callback) {
        if (!this.listeners.has(componentId)) {
            this.listeners.set(componentId, []);
        }
        this.listeners.get(componentId).push(callback);
    }

    /**
     * Notify listeners
     * @param {string} componentId - Component ID
     * @param {Object} state - State
     */
    notifyListeners(componentId, state) {
        const listeners = this.listeners.get(componentId) || [];
        listeners.forEach(callback => callback(state));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`comp_state_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentStateManagement;
}

