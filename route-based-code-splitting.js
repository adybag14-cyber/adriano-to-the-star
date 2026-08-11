/**
 * Route-Based Code Splitting
 * Splits code by routes for better performance
 */

class RouteBasedCodeSplitting {
    constructor() {
        this.routes = new Map();
        this.loadedRoutes = new Set();
        this.init();
    }
    
    init() {
        this.setupRoutes();
        this.loadCurrentRoute();
    }
    
    setupRoutes() {
        this.routes.set('/', () => import('./index.js').catch(() => null));
        this.routes.set('/database', () => import('./database-optimized.js').catch(() => null));
        this.routes.set('/stellar-ai', () => import('./stellar-ai.js').catch(() => null));
    }
    
    loadCurrentRoute() {
        const path = window.location.pathname;
        const route = this.routes.get(path);
        if (route && !this.loadedRoutes.has(path)) {
            route().then(() => {
                this.loadedRoutes.add(path);
            });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.routeBasedCodeSplitting = new RouteBasedCodeSplitting(); });
} else {
    window.routeBasedCodeSplitting = new RouteBasedCodeSplitting();
}


