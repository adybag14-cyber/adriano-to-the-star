/**
 * Code Splitting Optimizer
 * Dynamic code splitting and lazy loading for JavaScript modules
 * 
 * Features:
 * - Dynamic imports
 * - Route-based code splitting
 * - Component lazy loading
 * - Bundle analysis
 * - Preloading strategies
 */

class CodeSplittingOptimizer {
    constructor() {
        this.loadedChunks = new Set();
        this.chunkCache = new Map();
        this.preloadQueue = [];
        this.init();
    }
    
    init() {
        this.setupRouteBasedSplitting();
        this.setupPreloading();
        this.analyzeBundles();
        this.trackEvent('code_split_optimizer_initialized');
    }
    
    setupRouteBasedSplitting() {
        // Lazy load components based on route
        const routes = {
            '/database': () => import('./database.js').catch(() => null),
            '/stellar-ai': () => import('./stellar-ai.js').catch(() => null),
            '/shop': () => import('./shop.js').catch(() => null),
            '/groups': () => import('./groups-manager.js').catch(() => null)
        };
        
        // Load route-specific code when navigating
        window.addEventListener('popstate', () => {
            this.loadRouteCode(window.location.pathname, routes);
        });
        
        // Intercept link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.hostname === window.location.hostname) {
                const path = new URL(link.href).pathname;
                this.preloadRouteCode(path, routes);
            }
        });
        
        // Load current route
        this.loadRouteCode(window.location.pathname, routes);
    }
    
    async loadRouteCode(path, routes) {
        const route = Object.keys(routes).find(r => path.startsWith(r));
        if (route && !this.loadedChunks.has(route)) {
            try {
                await routes[route]();
                this.loadedChunks.add(route);
            } catch (e) {
                console.warn(`Failed to load route code for ${route}:`, e);
            }
        }
    }
    
    preloadRouteCode(path, routes) {
        const route = Object.keys(routes).find(r => path.startsWith(r));
        if (route && !this.loadedChunks.has(route) && !this.preloadQueue.includes(route)) {
            this.preloadQueue.push(route);
            // Preload on idle
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    this.loadRouteCode(path, routes);
                });
            } else {
                setTimeout(() => {
                    this.loadRouteCode(path, routes);
                }, 100);
            }
        }
    }
    
    setupPreloading() {
        // Preload critical resources
        const criticalResources = [
            '/styles.css',
            '/navigation.js',
            '/loader.js'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            link.href = resource;
            document.head.appendChild(link);
        });
    }
    
    async loadComponent(componentName) {
        if (this.chunkCache.has(componentName)) {
            return this.chunkCache.get(componentName);
        }
        
        try {
            const component = await import(`./components/${componentName}.js`);
            this.chunkCache.set(componentName, component);
            return component;
        } catch (e) {
            console.warn(`Failed to load component ${componentName}:`, e);
            return null;
        }
    }
    
    analyzeBundles() {
        // Analyze loaded scripts
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const bundleInfo = {
            total: scripts.length,
            sizes: [],
            async: 0,
            defer: 0
        };
        
        scripts.forEach(script => {
            if (script.async) bundleInfo.async++;
            if (script.defer) bundleInfo.defer++;
        });
        
        console.log('Bundle Analysis:', bundleInfo);
        
        // Suggest optimizations
        if (bundleInfo.total > 10) {
            console.warn('Consider code splitting: Too many scripts loaded');
        }
    }
    
    // Lazy load heavy libraries
    async loadLibrary(libraryName) {
        const libraries = {
            'chart': () => import('https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'),
            'three': () => import('https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.module.js'),
            'd3': () => import('https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js')
        };
        
        if (libraries[libraryName]) {
            try {
                return await libraries[libraryName]();
            } catch (e) {
                console.warn(`Failed to load library ${libraryName}:`, e);
                return null;
            }
        }
        return null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`code_split_optimizer_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.codeSplittingOptimizer = new CodeSplittingOptimizer();
    });
} else {
    window.codeSplittingOptimizer = new CodeSplittingOptimizer();
}
