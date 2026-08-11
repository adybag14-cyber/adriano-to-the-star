/**
 * Database Query Performance Optimizer
 * Optimizes database queries for better performance
 * 
 * Features:
 * - Query result caching
 * - Query batching
 * - Index optimization suggestions
 * - Query performance monitoring
 * - Lazy loading
 */

class DatabaseQueryOptimizer {
    constructor() {
        this.queryCache = new Map();
        this.pendingQueries = new Map();
        this.batchQueue = [];
        this.performanceMetrics = [];
        this.init();
    }
    
    init() {
        this.setupQueryInterception();
        this.startBatching();
        this.trackEvent('db_query_optimizer_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_query_optimizer_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    setupQueryInterception() {
        // Intercept Supabase queries if available
        if (window.supabase) {
            const originalFrom = window.supabase.from;
            window.supabase.from = function(table) {
                const query = originalFrom.call(this, table);
                return window.databaseQueryOptimizer.optimizeQuery(query, table);
            };
        }
    }
    
    optimizeQuery(query, table) {
        // Add caching wrapper
        const originalSelect = query.select;
        query.select = function(...args) {
            const cacheKey = this.generateCacheKey(table, 'select', args);
            const cached = this.queryCache.get(cacheKey);
            
            if (cached && Date.now() < cached.expires) {
                return Promise.resolve({ data: cached.data, error: null });
            }
            
            return originalSelect.apply(this, args).then(result => {
                if (result.data && !result.error) {
                    this.queryCache.set(cacheKey, {
                        data: result.data,
                        expires: Date.now() + 60000 // 1 minute cache
                    });
                }
                return result;
            });
        }.bind(this);
        
        return query;
    }
    
    generateCacheKey(table, operation, args) {
        return `${table}:${operation}:${JSON.stringify(args)}`;
    }
    
    // Batch multiple queries
    batchQuery(queryFn) {
        return new Promise((resolve, reject) => {
            this.batchQueue.push({ queryFn, resolve, reject });
            
            if (this.batchQueue.length >= 10) {
                this.executeBatch();
            }
        });
    }
    
    executeBatch() {
        if (this.batchQueue.length === 0) return;
        
        const batch = this.batchQueue.splice(0, 10);
        const promises = batch.map(item => item.queryFn());
        
        Promise.all(promises).then(results => {
            batch.forEach((item, index) => {
                item.resolve(results[index]);
            });
        }).catch(error => {
            batch.forEach(item => {
                item.reject(error);
            });
        });
    }
    
    startBatching() {
        setInterval(() => {
            if (this.batchQueue.length > 0) {
                this.executeBatch();
            }
        }, 100); // Execute batch every 100ms
    }
    
    // Monitor query performance
    measureQuery(table, operation, queryFn) {
        const startTime = performance.now();
        return queryFn().then(result => {
            const duration = performance.now() - startTime;
            this.performanceMetrics.push({
                table,
                operation,
                duration,
                timestamp: Date.now()
            });
            
            if (duration > 1000) {
                console.warn(`Slow query detected: ${table}.${operation} took ${duration}ms`);
            }
            
            return result;
        });
    }
    
    getPerformanceReport() {
        const report = {
            total: this.performanceMetrics.length,
            average: 0,
            slow: []
        };
        
        if (this.performanceMetrics.length > 0) {
            const total = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0);
            report.average = total / this.performanceMetrics.length;
            report.slow = this.performanceMetrics
                .filter(m => m.duration > 1000)
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 10);
        }
        
        return report;
    }
    
    // Clear cache
    clearCache(pattern) {
        if (pattern) {
            const regex = new RegExp(pattern);
            this.queryCache.forEach((value, key) => {
                if (regex.test(key)) {
                    this.queryCache.delete(key);
                }
            });
        } else {
            this.queryCache.clear();
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.databaseQueryOptimizer = new DatabaseQueryOptimizer();
    });
} else {
    window.databaseQueryOptimizer = new DatabaseQueryOptimizer();
}

