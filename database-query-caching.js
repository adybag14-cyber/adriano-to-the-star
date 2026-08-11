/**
 * Database Query Caching
 * Caches database query results for improved performance
 */

class DatabaseQueryCaching {
    constructor() {
        this.queryCache = new Map();
        this.init();
    }
    
    init() {
        this.setupCache();
        this.trackEvent('db_query_caching_initialized');
    }
    
    setupCache() {
        // Initialize query cache
        this.queryCache = new Map();
    }
    
    getCacheKey(query, params = {}) {
        // Generate cache key from query and parameters
        const key = JSON.stringify({ query, params });
        return btoa(key).substring(0, 50);
    }
    
    async getCached(query, params = {}) {
        const key = this.getCacheKey(query, params);
        const cached = this.queryCache.get(key);
        
        if (!cached) {
            return null;
        }
        
        // Check if expired
        if (cached.expires && Date.now() > cached.expires) {
            this.queryCache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    async cacheQuery(query, params, data, ttl = 300) {
        // Cache query result
        const key = this.getCacheKey(query, params);
        
        this.queryCache.set(key, {
            data,
            expires: Date.now() + (ttl * 1000),
            cachedAt: Date.now(),
            query,
            params
        });
    }
    
    async executeWithCache(query, params = {}, ttl = 300) {
        // Execute query with caching
        const cached = await this.getCached(query, params);
        
        if (cached !== null) {
            return cached;
        }
        
        // Execute query
        let result;
        if (window.supabase) {
            const { data, error } = await window.supabase
                .from(query.table)
                .select(query.select || '*')
                .eq(query.filter || {});
            
            if (error) {
                throw error;
            }
            
            result = data;
        } else {
            result = [];
        }
        
        // Cache result
        await this.cacheQuery(query, params, result, ttl);
        
        return result;
    }
    
    invalidateCache(pattern) {
        // Invalidate cache entries matching pattern
        this.queryCache.forEach((entry, key) => {
            if (pattern.test(entry.query.table)) {
                this.queryCache.delete(key);
            }
        });
    }
    
    clearCache() {
        this.queryCache.clear();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_query_caching_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.databaseQueryCaching = new DatabaseQueryCaching(); });
} else {
    window.databaseQueryCaching = new DatabaseQueryCaching();
}

