/**
 * Lazy Loading System
 * @class LazyLoadingSystem
 * @description Implements lazy loading for images, components, and resources.
 */
class LazyLoadingSystem {
    constructor() {
        this.loaders = new Map();
        this.observers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_az_yl_oa_di_ng_sy_st_em_initialized');
        this.setupIntersectionObserver();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_az_yl_oa_di_ng_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupIntersectionObserver() {
        if (typeof IntersectionObserver !== 'undefined') {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadResource(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });
        }
    }

    /**
     * Register lazy element.
     * @param {string} elementId - Element identifier.
     * @param {object} elementData - Element data.
     */
    registerElement(elementId, elementData) {
        this.loaders.set(elementId, {
            id: elementId,
            type: elementData.type || 'image',
            src: elementData.src,
            loaded: false,
            registeredAt: new Date()
        });

        if (this.observer && elementData.element) {
            this.observer.observe(elementData.element);
        }

        console.log(`Lazy element registered: ${elementId}`);
    }

    /**
     * Load resource.
     * @param {HTMLElement} element - Element to load.
     */
    loadResource(element) {
        const elementId = element.dataset.lazyId;
        const loader = this.loaders.get(elementId);
        if (!loader || loader.loaded) return;

        if (loader.type === 'image') {
            element.src = loader.src;
            element.classList.add('loaded');
        }

        loader.loaded = true;
        loader.loadedAt = new Date();
        console.log(`Resource loaded: ${elementId}`);
    }

    /**
     * Preload resource.
     * @param {string} url - Resource URL.
     * @returns {Promise<void>}
     */
    async preload(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = 'image';
            link.onload = () => resolve();
            link.onerror = () => reject(new Error('Preload failed'));
            document.head.appendChild(link);
        });
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.lazyLoadingSystem = new LazyLoadingSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoadingSystem;
}

