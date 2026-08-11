/**
 * Cache Performance Analytics
 * Analyzes cache performance and provides insights
 */

class CachePerformanceAnalytics {
    constructor() {
        this.metrics = {
            hitRate: 0,
            missRate: 0,
            avgResponseTime: 0,
            cacheSize: 0,
            evictions: 0
        };
        this.init();
    }
    
    init() {
        this.startAnalytics();
        this.trackEvent('cache_perf_analytics_initialized');
    }
    
    startAnalytics() {
        // Collect cache performance metrics
        setInterval(() => {
            this.collectMetrics();
            this.analyzePerformance();
        }, 60000); // Every minute
    }
    
    collectMetrics() {
        // Collect metrics from cache systems
        if (window.cacheHitRatioMonitoring) {
            const stats = window.cacheHitRatioMonitoring.getStats();
            this.metrics.hitRate = stats.hitRatio;
            this.metrics.missRate = stats.missRatio;
        }
        
        if (window.applicationLevelCaching) {
            const stats = window.applicationLevelCaching.getStats();
            this.metrics.cacheSize = stats.size;
        }
    }
    
    analyzePerformance() {
        // Analyze cache performance
        const analysis = {
            hitRate: this.metrics.hitRate,
            recommendations: []
        };
        
        // Generate recommendations
        if (this.metrics.hitRate < 50) {
            analysis.recommendations.push('Consider increasing cache TTL');
            analysis.recommendations.push('Review cache invalidation strategy');
        }
        
        if (this.metrics.cacheSize > 800) {
            analysis.recommendations.push('Cache size is high, consider eviction policy');
        }
        
        return analysis;
    }
    
    getPerformanceReport() {
        return {
            metrics: { ...this.metrics },
            analysis: this.analyzePerformance(),
            timestamp: Date.now()
        };
    }
    
    exportReport() {
        const report = this.getPerformanceReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cache-performance-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cache_perf_analytics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.cachePerformanceAnalytics = new CachePerformanceAnalytics(); });
} else {
    window.cachePerformanceAnalytics = new CachePerformanceAnalytics();
}

