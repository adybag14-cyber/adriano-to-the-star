/**
 * Advanced Caching Strategies
 * Implement advanced caching for performance
 */
(function() {
    'use strict';

    class AdvancedCachingStrategies {
        constructor() {
            this.cache = new Map();
            this.ttl = new Map();
            this.init();
        }

        init() {
            this.setupUI();
            this.startCleanup();
            this.trackEvent('caching_initialized');
        }

        setupUI() {
            if (!document.getElementById('caching-strategies')) {
                const caching = document.createElement('div');
                caching.id = 'caching-strategies';
                caching.className = 'caching-strategies';
                caching.innerHTML = `<h2>Caching Strategies</h2>`;
                document.body.appendChild(caching);
            }
        }

        set(key, value, ttl = 3600000) {
            this.cache.set(key, value);
            this.ttl.set(key, Date.now() + ttl);
            this.trackEvent('cache_set', { key, ttl });
        }

        get(key) {
            if (this.ttl.has(key) && Date.now() > this.ttl.get(key)) {
                this.cache.delete(key);
                this.ttl.delete(key);
                this.trackEvent('cache_expired', { key });
                return null;
            }
            const hit = this.cache.has(key);
            this.trackEvent(hit ? 'cache_hit' : 'cache_miss', { key });
            return this.cache.get(key);
        }

        startCleanup() {
            setInterval(() => {
                this.cleanup();
            }, 60000);
        }

        cleanup() {
            const now = Date.now();
            let cleaned = 0;
            this.ttl.forEach((expiry, key) => {
                if (now > expiry) {
                    this.cache.delete(key);
                    this.ttl.delete(key);
                    cleaned++;
                }
            });
            if (cleaned > 0) {
                this.trackEvent('cache_cleanup', { entriesRemoved: cleaned });
            }
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`caching_${eventName}`, 1, data);
                }
                if (window.analytics) {
                    window.analytics.track(eventName, { module: 'advanced_caching', ...data });
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.advancedCaching = new AdvancedCachingStrategies();
        });
    } else {
        window.advancedCaching = new AdvancedCachingStrategies();
    }
})();

