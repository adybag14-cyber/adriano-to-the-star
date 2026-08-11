/**
 * Business Metrics Tracking
 * Track business metrics
 */

class BusinessMetricsTracking {
    constructor() {
        this.metrics = new Map();
        this.init();
    }
    
    init() {
        this.setupTracking();
        this.trackEvent('biz_metrics_initialized');
    }
    
    setupTracking() {
        // Setup metrics tracking
    }
    
    async trackMetric(name, value, metadata = {}) {
        // Track business metric
        const metric = {
            name,
            value,
            metadata,
            timestamp: Date.now()
        };
        
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        this.metrics.get(name).push(metric);
        return metric;
    }
    
    async getMetric(name, timeRange) {
        // Get metric values
        const values = this.metrics.get(name) || [];
        
        if (timeRange) {
            const cutoff = Date.now() - (timeRange * 1000);
            return values.filter(m => m.timestamp > cutoff);
        }
        
        return values;
    }
    
    async getMetricSummary(name) {
        // Get metric summary
        const values = this.metrics.get(name) || [];
        if (values.length === 0) return null;
        
        const numericValues = values.map(v => parseFloat(v.value)).filter(v => !isNaN(v));
        
        return {
            name,
            count: values.length,
            average: numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0,
            min: numericValues.length > 0 ? Math.min(...numericValues) : 0,
            max: numericValues.length > 0 ? Math.max(...numericValues) : 0
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`biz_metrics_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.businessMetricsTracking = new BusinessMetricsTracking(); });
} else {
    window.businessMetricsTracking = new BusinessMetricsTracking();
}

