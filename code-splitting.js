/**
 * Code Splitting System
 * Dynamic imports and lazy loading for improved performance
 */

class CodeSplitter {
    constructor() {
        this.loadedModules = new Map();
        this.loadingModules = new Map();
        this.moduleCache = new Map();
        this.config = {
            // Cache strategy
            cacheEnabled: true,
            cacheMaxAge: 5 * 60 * 1000, // 5 minutes
            
            // Preload strategy
            preloadEnabled: true,
            preloadOnHover: true,
            preloadOnVisible: true,
            
            // Loading indicators
            showLoadingIndicator: true,
            
            // Error handling
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        this.init();
    }

    /**
     * Initialize code splitter
     */
    init() {
        // Preload critical modules first
        this.preloadCriticalModules();
        
        // Setup intersection observer for lazy loading
        if (this.config.preloadOnVisible) {
            this.setupIntersectionObserver();
        }
        
        // Setup hover preloading
        if (this.config.preloadOnHover) {
            this.setupHoverPreloading();
        }
        
        // Setup route-based code splitting
        this.setupRouteBasedSplitting();
        this.trackEvent('code_splitter_initialized');
    }

    /**
     * Dynamically import a module
     * @param {string} modulePath - Path to module
     * @param {Object} options - Import options
     * @returns {Promise} Module export
     */
    async importModule(modulePath, options = {}) {
        // Check cache
        if (this.config.cacheEnabled && this.moduleCache.has(modulePath)) {
            const cached = this.moduleCache.get(modulePath);
            if (Date.now() - cached.timestamp < this.config.cacheMaxAge) {
                return cached.module;
            }
        }
        
        // Check if already loading
        if (this.loadingModules.has(modulePath)) {
            return this.loadingModules.get(modulePath);
        }
        
        // Check if already loaded
        if (this.loadedModules.has(modulePath)) {
            return this.loadedModules.get(modulePath);
        }
        
        // Create loading promise
        const loadPromise = this.loadModule(modulePath, options);
        this.loadingModules.set(modulePath, loadPromise);
        
        try {
            const module = await loadPromise;
            
            // Cache module
            this.loadedModules.set(modulePath, module);
            this.loadingModules.delete(modulePath);
            
            if (this.config.cacheEnabled) {
                this.moduleCache.set(modulePath, {
                    module,
                    timestamp: Date.now()
                });
            }
            
            return module;
        } catch (error) {
            this.loadingModules.delete(modulePath);
            throw error;
        }
    }

    /**
     * Load module with retry logic
     */
    async loadModule(modulePath, options = {}) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                // Show loading indicator
                if (this.config.showLoadingIndicator && options.showLoading !== false) {
                    this.showLoadingIndicator(modulePath);
                }
                
                // Dynamic import
                const module = await import(modulePath);
                
                // Hide loading indicator
                if (this.config.showLoadingIndicator) {
                    this.hideLoadingIndicator(modulePath);
                }
                
                return module;
            } catch (error) {
                lastError = error;
                console.warn(`Failed to load module ${modulePath} (attempt ${attempt}/${this.config.retryAttempts}):`, error);
                
                if (attempt < this.config.retryAttempts) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
                }
            }
        }
        
        // Hide loading indicator on final failure
        if (this.config.showLoadingIndicator) {
            this.hideLoadingIndicator(modulePath);
        }

        const message = (lastError && lastError.message) ? lastError.message : 'Unknown error';
        throw new Error(`Failed to load module ${modulePath} after ${this.config.retryAttempts} attempts: ${message}`);
    }

    /**
     * Lazy load module when element becomes visible
     */
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const modulePath = element.dataset.lazyModule;
                    
                    if (modulePath && !this.loadedModules.has(modulePath)) {
                        this.importModule(modulePath, { showLoading: false });
                    }
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before element is visible
        });
        
        // Observe elements with data-lazy-module attribute
        document.querySelectorAll('[data-lazy-module]').forEach(el => {
            observer.observe(el);
        });
        
        // Watch for dynamically added elements
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        const lazyElements = node.querySelectorAll ? node.querySelectorAll('[data-lazy-module]') : [];
                        lazyElements.forEach(el => observer.observe(el));

                        const hasDataset = typeof node.dataset !== 'undefined' && node.dataset !== null;
                        if (hasDataset && node.dataset.lazyModule) {
                            observer.observe(node);
                        }
                    }
                });
            });
        });
        
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Preload module on hover
     */
    setupHoverPreloading() {
        document.querySelectorAll('[data-preload-module]').forEach(element => {
            let hoverTimeout;
            
            element.addEventListener('mouseenter', () => {
                hoverTimeout = setTimeout(() => {
                    const modulePath = element.dataset.preloadModule;
                    if (modulePath && !this.loadedModules.has(modulePath)) {
                        this.importModule(modulePath, { showLoading: false });
                    }
                }, 200); // Preload after 200ms hover
            });
            
            element.addEventListener('mouseleave', () => {
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }
            });
        });
    }

    /**
     * Setup route-based code splitting
     */
    setupRouteBasedSplitting() {
        // Map routes to modules with priority
        const routeModules = {
            '/database.html': { 
                module: './database-optimized.js',
                priority: 'high',
                dependencies: ['./database-advanced-features.js', './planet-3d-viewer.js']
            },
            '/stellar-ai.html': { 
                module: './stellar-ai.js',
                priority: 'high',
                dependencies: ['./stellar-ai-enhancements.js']
            },
            '/marketplace.html': { 
                module: './marketplace.js',
                priority: 'medium',
                dependencies: []
            },
            '/messaging.html': { 
                module: './messaging.js',
                priority: 'medium',
                dependencies: []
            },
            '/analytics-dashboard.html': { 
                module: './analytics-dashboard.js',
                priority: 'medium',
                dependencies: ['./dashboard-widgets.js', './planet-claim-statistics.js']
            },
            '/event-calendar.html': { 
                module: './event-calendar.js',
                priority: 'low',
                dependencies: []
            },
            '/newsletter.html': { 
                module: './newsletter.js',
                priority: 'low',
                dependencies: []
            },
            '/education.html': { 
                module: './education.js',
                priority: 'low',
                dependencies: []
            },
            '/badges.html': { 
                module: './badges-page.js',
                priority: 'low',
                dependencies: []
            }
        };
        
        // Preload modules for current page
        const currentPath = window.location.pathname;
        const routeConfig = routeModules[currentPath];
        
        if (routeConfig) {
            // Preload main module immediately
            this.importModule(routeConfig.module, { showLoading: false })
                .catch(err => console.warn('Failed to preload main module:', err));
            
            // Preload dependencies with lower priority
            if (routeConfig.dependencies && routeConfig.dependencies.length > 0) {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => {
                        routeConfig.dependencies.forEach(dep => {
                            this.importModule(dep, { showLoading: false })
                                .catch(err => console.warn('Failed to preload dependency:', err));
                        });
                    });
                } else {
                    setTimeout(() => {
                        routeConfig.dependencies.forEach(dep => {
                            this.importModule(dep, { showLoading: false })
                                .catch(err => console.warn('Failed to preload dependency:', err));
                        });
                    }, 1000);
                }
            }
        }
        
        // Preload modules for links on hover (with delay to avoid unnecessary loads)
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            const routeConfig = routeModules[href];
            
            if (routeConfig) {
                let hoverTimeout;
                link.addEventListener('mouseenter', () => {
                    hoverTimeout = setTimeout(() => {
                        if (!this.loadedModules.has(routeConfig.module)) {
                            this.importModule(routeConfig.module, { showLoading: false })
                                .catch(err => console.warn('Failed to preload module on hover:', err));
                        }
                    }, 300); // Wait 300ms before preloading
                });
                
                link.addEventListener('mouseleave', () => {
                    if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                    }
                });
            }
        });
        
        // Add resource hints for critical modules
        this.addResourceHints(routeModules);
    }

    /**
     * Add resource hints (preload, prefetch) for better performance
     */
    addResourceHints(routeModules) {
        const currentPath = window.location.pathname;
        const routeConfig = routeModules[currentPath];
        
        if (!routeConfig) return;
        
        // Add preload link for high-priority modules
        if (routeConfig.priority === 'high') {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'script';
            preloadLink.href = routeConfig.module;
            document.head.appendChild(preloadLink);
        }
        
        // Add prefetch for likely next pages (navigation links)
        document.querySelectorAll('nav a[href], .navigation a[href]').forEach(link => {
            const href = link.getAttribute('href');
            const nextRouteConfig = routeModules[href];
            
            if (nextRouteConfig && nextRouteConfig.priority === 'high') {
                const prefetchLink = document.createElement('link');
                prefetchLink.rel = 'prefetch';
                prefetchLink.as = 'script';
                prefetchLink.href = nextRouteConfig.module;
                document.head.appendChild(prefetchLink);
            }
        });
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator(modulePath) {
        // Create or update loading indicator
        let indicator = document.getElementById('code-split-loading');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'code-split-loading';
            indicator.className = 'code-split-loading';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(186, 148, 79, 0.9);
                color: white;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                font-family: 'Raleway', sans-serif;
                font-size: 0.85rem;
                z-index: 9998;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            `;
            document.body.appendChild(indicator);
        }
        
        const moduleName = modulePath.split('/').pop().replace('.js', '');
        indicator.innerHTML = `
            <span class="spinner" style="
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            "></span>
            <span>Loading ${moduleName}...</span>
        `;
        
        indicator.style.display = 'flex';
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator(modulePath) {
        const indicator = document.getElementById('code-split-loading');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Clear module cache
     */
    clearCache() {
        this.moduleCache.clear();
    }

    /**
     * Get loaded modules
     */
    getLoadedModules() {
        return Array.from(this.loadedModules.keys());
    }

    /**
     * Preload module
     */
    async preload(modulePath) {
        return this.importModule(modulePath, { showLoading: false });
    }

    /**
     * Preload critical modules for current page
     */
    async preloadCriticalModules() {
        const criticalModules = [
            './navigation.js',
            './cosmic-music-player.js',
            './theme-toggle.js',
            './accessibility.js'
        ];

        // Load critical modules in parallel
        const loadPromises = criticalModules.map(module => 
            this.importModule(module, { showLoading: false })
                .catch(err => console.warn(`Failed to preload critical module ${module}:`, err))
        );

        await Promise.all(loadPromises);
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            loadedModules: this.loadedModules.size,
            cachedModules: this.moduleCache.size,
            loadingModules: this.loadingModules.size,
            modules: Array.from(this.loadedModules.keys())
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`code_splitter_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize code splitter
let codeSplitterInstance = null;

function initCodeSplitter() {
    if (!codeSplitterInstance) {
        codeSplitterInstance = new CodeSplitter();
    }
    return codeSplitterInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodeSplitter);
} else {
    initCodeSplitter();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeSplitter;
}

window.CodeSplitter = CodeSplitter;
window.codeSplitter = () => codeSplitterInstance;

// Add CSS for spinner animation
if (!document.getElementById('code-split-styles')) {
    const style = document.createElement('style');
    style.id = 'code-split-styles';
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

