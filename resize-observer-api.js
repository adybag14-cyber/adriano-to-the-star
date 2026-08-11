/**
 * Resize Observer API
 * Observes changes to element dimensions
 */

class ResizeObserverAPI {
    constructor(callback) {
        this.callback = callback;
        this.observer = null;
        this.observedElements = new Map();
        this.initialized = false;
    }

    /**
     * Initialize Resize Observer
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Resize Observer is not supported in this browser');
        }

        this.observer = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                this.callback(entry, this);
            });
        });

        this.initialized = true;
        return { success: true, message: 'Resize Observer initialized' };
    }

    /**
     * Check if Resize Observer is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof ResizeObserver !== 'undefined';
    }

    /**
     * Observe element
     * @param {Element} element - Element to observe
     * @param {Object} options - Observation options
     */
    observe(element, options = {}) {
        if (!this.observer) {
            throw new Error('Observer not initialized');
        }

        this.observer.observe(element, options);
        this.observedElements.set(element, {
            element,
            options,
            lastSize: null
        });
    }

    /**
     * Unobserve element
     * @param {Element} element - Element to unobserve
     */
    unobserve(element) {
        if (this.observer) {
            this.observer.unobserve(element);
            this.observedElements.delete(element);
        }
    }

    /**
     * Disconnect observer
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            this.observedElements.clear();
        }
    }

    /**
     * Get element size
     * @param {Element} element - Element
     * @returns {Object}
     */
    getElementSize(element) {
        const data = this.observedElements.get(element);
        return data ? data.lastSize : null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResizeObserverAPI;
}

