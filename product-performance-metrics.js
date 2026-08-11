/**
 * Product Performance Metrics
 * Tracks product performance metrics
 */

class ProductPerformanceMetrics {
    constructor() {
        this.metrics = new Map();
        this.products = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ro_du_ct_pe_rf_or_ma_nc_em_et_ri_cs_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ro_du_ct_pe_rf_or_ma_nc_em_et_ri_cs_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerProduct(productId, name) {
        this.products.set(productId, {
            id: productId,
            name,
            metrics: {
                views: 0,
                interactions: 0,
                conversions: 0,
                revenue: 0
            }
        });
    }

    trackMetric(productId, metricType, value = 1) {
        const product = this.products.get(productId);
        if (!product) return;
        
        if (product.metrics[metricType] !== undefined) {
            product.metrics[metricType] += value;
        }
        
        // Store historical data
        const metricKey = `${productId}_${metricType}`;
        if (!this.metrics.has(metricKey)) {
            this.metrics.set(metricKey, []);
        }
        
        this.metrics.get(metricKey).push({
            value,
            timestamp: new Date()
        });
    }

    getProductMetrics(productId) {
        const product = this.products.get(productId);
        if (!product) return null;
        
        const metrics = product.metrics;
        const conversionRate = metrics.views > 0 ? 
            (metrics.conversions / metrics.views) * 100 : 0;
        const revenuePerView = metrics.views > 0 ? 
            metrics.revenue / metrics.views : 0;
        
        return {
            productName: product.name,
            ...metrics,
            conversionRate: Math.round(conversionRate * 100) / 100,
            revenuePerView: Math.round(revenuePerView * 100) / 100
        };
    }

    getTopPerformers(metricType = 'revenue', limit = 10) {
        return Array.from(this.products.values())
            .sort((a, b) => b.metrics[metricType] - a.metrics[metricType])
            .slice(0, limit)
            .map(p => ({
                name: p.name,
                value: p.metrics[metricType]
            }));
    }

    getMetricTrend(productId, metricType, days = 30) {
        const metricKey = `${productId}_${metricType}`;
        const data = this.metrics.get(metricKey) || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return data.filter(m => m.timestamp >= cutoffDate);
    }
}

// Auto-initialize
const productPerformanceMetrics = new ProductPerformanceMetrics();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductPerformanceMetrics;
}


