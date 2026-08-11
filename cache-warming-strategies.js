/**
 * Cache Warming Strategies
 * Pre-warms cache with frequently accessed resources
 */

class CacheWarmingStrategies {
    constructor() {
        this.warmingQueue = [];
        this.init();
    }
    
    init() {
        this.identifyCriticalResources();
        this.startWarming();
        this.trackEvent('cache_warm_strat_initialized');
    }
    
    identifyCriticalResources() {
        // Identify critical resources to warm
        const critical = [
            '/styles.css',
            '/main.js',
            '/api/user',
            '/api/planets'
        ];
        
        this.warmingQueue = critical;
    }
    
    async startWarming() {
        // Warm cache during idle time
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.warmCache();
            });
        } else {
            setTimeout(() => {
                this.warmCache();
            }, 2000);
        }
    }
    
    async warmCache() {
        // Prefetch and cache resources
        for (const resource of this.warmingQueue) {
            await this.warmResource(resource);
        }
    }
    
    async warmResource(url) {
        // Warm a single resource
        try {
            // Prefetch
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
            
            // Also fetch to cache
            if (url.startsWith('/api/')) {
                await fetch(url);
            }
        } catch (error) {
            console.warn('Cache warming failed for:', url, error);
        }
    }
    
    async warmUserSpecificResources(userId) {
        // Warm user-specific resources
        const userResources = [
            `/api/user/${userId}`,
            `/api/user/${userId}/planets`,
            `/api/user/${userId}/settings`
        ];
        
        for (const resource of userResources) {
            await this.warmResource(resource);
        }
    }
    
    async warmRouteCache(route) {
        // Warm cache for a specific route
        const routeResources = this.getRouteResources(route);
        for (const resource of routeResources) {
            await this.warmResource(resource);
        }
    }
    
    getRouteResources(route) {
        // Get resources needed for a route
        const routeMap = {
            '/': ['/styles.css', '/main.js'],
            '/planets': ['/api/planets', '/planets.css'],
            '/dashboard': ['/api/user', '/dashboard.js']
        };
        
        return routeMap[route] || [];
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cache_warm_strat_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.cacheWarmingStrategies = new CacheWarmingStrategies(); });
} else {
    window.cacheWarmingStrategies = new CacheWarmingStrategies();
}

