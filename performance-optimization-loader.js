/**
 * Performance Optimization - Lazy Loading and Code Splitting
 * 
 * Optimizes database.html page load performance (lazy load scripts, code splitting).
 * 
 * @module PerformanceOptimizationLoader
 * @version 1.0.0
 * @author Adriano To The Star
 */

class PerformanceOptimizationLoader {
    constructor() {
        this.loadedScripts = new Set();
        this.loadedStyles = new Set();
        this.isInitialized = false;
    }

    /**
     * Initialize performance optimization loader
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('PerformanceOptimizationLoader already initialized');
            return;
        }

        this.setupLazyLoading();
        this.optimizeImages();
        
        this.isInitialized = true;
        console.log('✅ Performance Optimization Loader initialized');
    }

    /**
     * Set up lazy loading for scripts
     * @private
     */
    setupLazyLoading() {
        // Lazy load scripts with data-lazy attribute
        const lazyScripts = document.querySelectorAll('script[data-lazy]');
        lazyScripts.forEach(script => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadScript(script.src || script.dataset.src);
                        observer.unobserve(script);
                    }
                });
            });
            observer.observe(script);
        });
    }

    /**
     * Load script dynamically
     * @public
     * @param {string} src - Script source
     * @returns {Promise} Load promise
     */
    loadScript(src) {
        if (this.loadedScripts.has(src)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                this.loadedScripts.add(src);
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Load stylesheet dynamically
     * @public
     * @param {string} href - Stylesheet href
     * @returns {Promise} Load promise
     */
    loadStylesheet(href) {
        if (this.loadedStyles.has(href)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            link.onload = () => {
                this.loadedStyles.add(href);
                resolve();
            };
            
            link.onerror = () => {
                reject(new Error(`Failed to load stylesheet: ${href}`));
            };

            document.head.appendChild(link);
        });
    }

    /**
     * Optimize images
     * @private
     */
    optimizeImages() {
        // Add loading="lazy" to images without it
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.loading = 'lazy';
            img.decoding = 'async';
        });

        // Use Intersection Observer for images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Preload resource
     * @public
     * @param {string} href - Resource href
     * @param {string} as - Resource type
     */
    preloadResource(href, as = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
    }

    /**
     * Prefetch resource
     * @public
     * @param {string} href - Resource href
     */
    prefetchResource(href) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
    }

    /**
     * Code split - load module on demand
     * @public
     * @param {string} modulePath - Module path
     * @returns {Promise} Module load promise
     */
    async loadModule(modulePath) {
        if (this.loadedScripts.has(modulePath)) {
            return;
        }

        await this.loadScript(modulePath);
        
        // Wait for module to be available
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const moduleName = modulePath.split('/').pop().replace('.js', '');
                if (window[moduleName] || window[moduleName.charAt(0).toUpperCase() + moduleName.slice(1)]) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }

    /**
     * Defer non-critical scripts
     * @public
     */
    deferNonCriticalScripts() {
        const criticalScripts = ['loader.js', 'stellar-ai.js', 'database.js'];
        
        document.querySelectorAll('script[src]:not([defer]):not([async])').forEach(script => {
            const src = script.src;
            const isCritical = criticalScripts.some(critical => src.includes(critical));
            
            if (!isCritical) {
                script.defer = true;
            }
        });
    }

    /**
     * Get performance metrics
     * @public
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        if (!window.performance || !window.performance.timing) {
            return null;
        }

        const timing = window.performance.timing;
        const navigation = window.performance.navigation;

        return {
            pageLoadTime: timing.loadEventEnd - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            firstPaint: timing.responseEnd - timing.navigationStart,
            navigationType: navigation.type,
            redirectCount: navigation.redirectCount
        };
    }
}

// Create global instance
window.PerformanceOptimizationLoader = PerformanceOptimizationLoader;
window.performanceLoader = new PerformanceOptimizationLoader();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceLoader.init();
    });
} else {
    window.performanceLoader.init();
}

