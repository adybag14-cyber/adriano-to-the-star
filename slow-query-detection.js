/**
 * Slow Query Detection
 * Detects and reports slow database queries
 */

class SlowQueryDetection {
    constructor() {
        this.slowQueries = [];
        this.threshold = 1000; // 1 second
        this.init();
    }
    
    init() {
        this.startMonitoring();
    }
    
    startMonitoring() {
        // Monitor query performance
        this.interceptQueries();
    }
    
    interceptQueries() {
        // Intercept database queries
        if (window.supabase) {
            const originalFrom = window.supabase.from;
            const self = this;
            
            window.supabase.from = function(table) {
                const query = originalFrom.call(this, table);
                const startTime = performance.now();
                
                // Wrap select to measure time
                const originalSelect = query.select;
                query.select = function(...args) {
                    const result = originalSelect.apply(this, args);
                    
                    // Measure execution time
                    result.then(() => {
                        const duration = performance.now() - startTime;
                        if (duration > self.threshold) {
                            self.recordSlowQuery(table, duration, args);
                        }
                    });
                    
                    return result;
                };
                
                return query;
            };
        }
    }
    
    recordSlowQuery(table, duration, params) {
        const slowQuery = {
            table,
            duration,
            params,
            timestamp: Date.now()
        };
        
        this.slowQueries.push(slowQuery);
        
        // Alert if too many slow queries
        if (this.slowQueries.length > 10) {
            this.alertSlowQueries();
        }
    }
    
    alertSlowQueries() {
        console.warn('Multiple slow queries detected:', this.slowQueries.length);
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(
                `${this.slowQueries.length} slow queries detected`,
                'warning'
            );
        }
    }
    
    getSlowQueries(limit = 10) {
        return this.slowQueries
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.slowQueryDetection = new SlowQueryDetection(); });
} else {
    window.slowQueryDetection = new SlowQueryDetection();
}

