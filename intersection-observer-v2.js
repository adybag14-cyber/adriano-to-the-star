/**
 * Intersection Observer v2
 * Enhanced intersection observation with additional features
 */

class IntersectionObserverV2 {
    constructor(callback, options = {}) {
        this.callback = callback;
        this.options = {
            root: options.root || null,
            rootMargin: options.rootMargin || '0px',
            threshold: options.threshold || 0,
            delay: options.delay || 0,
            trackVisibility: options.trackVisibility || false
        };
        this.observer = null;
        this.observedElements = new Map();
        this.initialized = false;
    }

    /**
     * Initialize Intersection Observer
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('Intersection Observer is not supported in this browser');
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.callback(entry, this);
            });
        }, this.options);

        this.initialized = true;
        return { success: true, message: 'Intersection Observer v2 initialized' };
    }

    /**
     * Check if Intersection Observer is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof IntersectionObserver !== 'undefined';
    }

    /**
     * Observe element
     * @param {Element} element - Element to observe
     * @param {Object} options - Element-specific options
     */
    observe(element, options = {}) {
        if (!this.observer) {
            throw new Error('Observer not initialized');
        }

        this.observer.observe(element);
        this.observedElements.set(element, {
            element,
            options,
            isVisible: false,
            lastIntersectionRatio: 0
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
     * Get observed elements
     * @returns {Array<Element>}
     */
    getObservedElements() {
        return Array.from(this.observedElements.keys());
    }

    /**
     * Check if element is visible
     * @param {Element} element - Element to check
     * @returns {boolean}
     */
    isElementVisible(element) {
        const data = this.observedElements.get(element);
        return data ? data.isVisible : false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntersectionObserverV2;
}

