/**
 * Lazy Loading Manager
 * Lazy load images, 3D models, and heavy assets
 */

class LazyLoadingManager {
    constructor() {
        this.imageObserver = null;
        this.scriptObserver = null;
        this.loadedAssets = new Set();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize lazy loading
     */
    init() {
        // Setup Intersection Observer for images
        this.setupImageObserver();
        
        // Setup lazy loading for scripts
        this.setupScriptLazyLoading();
        
        // Setup lazy loading for iframes
        this.setupIframeLazyLoading();
        
        this.isInitialized = true;
        console.log('🔄 Lazy Loading Manager initialized');
    }

    /**
     * Setup Intersection Observer for images
     */
    setupImageObserver() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: load all images immediately
            this.loadAllImages();
            return;
        }

        const options = {
            root: null,
            rootMargin: '50px', // Start loading 50px before entering viewport
            threshold: 0.01
        };

        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, options);

        // Observe all images with data-src
        this.observeLazyImages();
    }

    /**
     * Observe lazy images
     */
    observeLazyImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.imageObserver.observe(img);
        });

        // Watch for dynamically added images
        const observer = new MutationObserver(() => {
            const newLazyImages = document.querySelectorAll('img[data-src]:not([data-observed])');
            newLazyImages.forEach(img => {
                img.setAttribute('data-observed', 'true');
                this.imageObserver.observe(img);
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Load image
     */
    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src || this.loadedAssets.has(src)) return;

        // Don't hide image while loading - keep it visible
        img.style.opacity = '1';
        img.style.transition = 'opacity 0.3s';

        // Load image
        const imageLoader = new Image();
        imageLoader.onload = () => {
            img.src = src;
            img.removeAttribute('data-src');
            img.style.opacity = '1';
            this.loadedAssets.add(src);
            this.trackEvent('image_loaded', { src });
        };

        imageLoader.onerror = () => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage failed to load%3C/text%3E%3C/svg%3E';
            img.style.opacity = '1';
            this.trackEvent('image_load_failed', { src });
        };

        imageLoader.src = src;
    }

    /**
     * Load all images (fallback)
     */
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
            }
        });
    }

    /**
     * Setup lazy loading for scripts
     */
    setupScriptLazyLoading() {
        // Lazy load scripts with data-src attribute
        const lazyScripts = document.querySelectorAll('script[data-src]');
        lazyScripts.forEach(script => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadScript(script);
                        observer.unobserve(script);
                    }
                });
            }, { rootMargin: '100px' });

            observer.observe(script);
        });
    }

    /**
     * Load script
     */
    loadScript(scriptElement) {
        const src = scriptElement.getAttribute('data-src');
        if (!src || this.loadedAssets.has(src)) return;

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = scriptElement.hasAttribute('defer');

        script.onload = () => {
            this.loadedAssets.add(src);
            scriptElement.remove();
        };

        script.onerror = () => {
            console.error('Failed to load script:', src);
        };

        document.head.appendChild(script);
    }

    /**
     * Setup lazy loading for iframes
     */
    setupIframeLazyLoading() {
        const lazyIframes = document.querySelectorAll('iframe[data-src]');
        lazyIframes.forEach(iframe => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadIframe(iframe);
                        observer.unobserve(iframe);
                    }
                });
            }, { rootMargin: '50px' });

            observer.observe(iframe);
        });
    }

    /**
     * Load iframe
     */
    loadIframe(iframe) {
        const src = iframe.getAttribute('data-src');
        if (!src || this.loadedAssets.has(src)) return;

        iframe.src = src;
        iframe.removeAttribute('data-src');
        this.loadedAssets.add(src);
    }

    /**
     * Preload critical assets
     */
    preloadAsset(url, type = 'image') {
        if (this.loadedAssets.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = type;

        if (type === 'font') {
            link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
        this.loadedAssets.add(url);
    }

    /**
     * Lazy load module
     */
    async lazyLoadModule(modulePath) {
        if (this.loadedAssets.has(modulePath)) {
            return;
        }

        try {
            const module = await import(modulePath);
            this.loadedAssets.add(modulePath);
            return module;
        } catch (error) {
            console.error('Failed to load module:', modulePath, error);
            return null;
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`lazyLoad:${eventName}`, 1, {
                    source: 'lazy-loading-manager',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record lazy load event:', e);
            }
        }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.lazyLoadingManager = new LazyLoadingManager();
    
    // Make available globally
    window.getLazyLoadingManager = () => window.lazyLoadingManager;
}

