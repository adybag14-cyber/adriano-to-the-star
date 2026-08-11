/**
 * Performance Observer API
 * Observes and collects performance metrics
 */

class PerformanceObserverAPI {
    constructor() {
        this.observers = new Map();
        this.metrics = new Map();
        this.initialized = false;
    }

    /**
     * Initialize Performance Observer API
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Performance Observer API is not supported in this browser');
        }
        this.initialized = true;
        return { success: true, message: 'Performance Observer API initialized' };
    }

    /**
     * Check if Performance Observer is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof PerformanceObserver !== 'undefined';
    }

    /**
     * Observe performance entries
     * @param {Array<string>} entryTypes - Entry types to observe
     * @param {Function} callback - Callback function
     * @returns {PerformanceObserver}
     */
    observe(entryTypes, callback) {
        if (!this.isSupported()) {
            throw new Error('Performance Observer API is not supported');
        }

        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (!this.metrics.has(entry.name)) {
                    this.metrics.set(entry.name, []);
                }
                this.metrics.get(entry.name).push(entry);
            });
            callback(entries, observer);
        });

        try {
            entryTypes.forEach(type => {
                observer.observe({ entryTypes: [type] });
            });
        } catch (error) {
            observer.observe({ type: entryTypes[0], buffered: true });
        }

        const id = `${Date.now()}-${Math.random()}`;
        this.observers.set(id, observer);
        return observer;
    }

    /**
     * Get performance metrics
     * @param {string} name - Metric name
     * @returns {Array}
     */
    getMetrics(name) {
        return this.metrics.get(name) || [];
    }

    /**
     * Get all metrics
     * @returns {Object}
     */
    getAllMetrics() {
        const result = {};
        this.metrics.forEach((entries, name) => {
            result[name] = entries;
        });
        return result;
    }

    /**
     * Clear metrics
     * @param {string} name - Metric name (optional)
     */
    clearMetrics(name) {
        if (name) {
            this.metrics.delete(name);
        } else {
            this.metrics.clear();
        }
    }

    /**
     * Disconnect observer
     * @param {string} id - Observer ID
     */
    disconnect(id) {
        const observer = this.observers.get(id);
        if (observer) {
            observer.disconnect();
            this.observers.delete(id);
        }
    }

    /**
     * Disconnect all observers
     */
    disconnectAll() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceObserverAPI;
}

