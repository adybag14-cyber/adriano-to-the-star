/**
 * Advanced Service Worker Strategies
 * Implements advanced service worker patterns and strategies
 */

class AdvancedServiceWorkerStrategies {
    constructor() {
        this.registration = null;
        this.strategies = new Map();
        this.initialized = false;
    }

    /**
     * Initialize service worker
     * @param {string} swPath - Service worker path
     * @returns {Promise<ServiceWorkerRegistration>}
     */
    async initialize(swPath = '/sw.js') {
        if (!this.isSupported()) {
            throw new Error('Service Workers are not supported');
        }

        try {
            this.registration = await navigator.serviceWorker.register(swPath);
            this.initialized = true;
            this.trackEvent('service_worker_initialized', { swPath });
            return this.registration;
        } catch (error) {
            throw new Error(`Service Worker registration failed: ${error.message}`);
        }
    }

    /**
     * Check if Service Workers are supported
     * @returns {boolean}
     */
    isSupported() {
        return 'serviceWorker' in navigator;
    }

    /**
     * Register cache strategy
     * @param {string} name - Strategy name
     * @param {Function} handler - Strategy handler
     */
    registerStrategy(name, handler) {
        this.strategies.set(name, handler);
        this.trackEvent('strategy_registered', { name });
    }

    /**
     * Cache first strategy
     * @param {Request} request - Request
     * @returns {Promise<Response>}
     */
    async cacheFirst(request) {
        const cache = await caches.open('cache-first-v1');
        const cached = await cache.match(request);
        if (cached) return cached;
        
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    }

    /**
     * Network first strategy
     * @param {Request} request - Request
     * @returns {Promise<Response>}
     */
    async networkFirst(request) {
        const cache = await caches.open('network-first-v1');
        try {
            const response = await fetch(request);
            cache.put(request, response.clone());
            return response;
        } catch (error) {
            const cached = await cache.match(request);
            if (cached) return cached;
            throw error;
        }
    }

    /**
     * Stale while revalidate strategy
     * @param {Request} request - Request
     * @returns {Promise<Response>}
     */
    async staleWhileRevalidate(request) {
        const cache = await caches.open('stale-v1');
        const cached = await cache.match(request);
        
        const fetchPromise = fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
        });

        return cached || await fetchPromise;
    }

    /**
     * Network only strategy
     * @param {Request} request - Request
     * @returns {Promise<Response>}
     */
    async networkOnly(request) {
        return fetch(request);
    }

    /**
     * Cache only strategy
     * @param {Request} request - Request
     * @returns {Promise<Response>}
     */
    async cacheOnly(request) {
        const cache = await caches.open('cache-only-v1');
        const cached = await cache.match(request);
        if (!cached) throw new Error('Not in cache');
        return cached;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sw_strategies_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_service_worker_strategies', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedServiceWorkerStrategies;
}

