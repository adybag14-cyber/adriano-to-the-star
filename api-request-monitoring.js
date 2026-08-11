/**
 * API Request Monitoring
 * Monitor and track API request performance
 */

class APIRequestMonitoring {
    constructor() {
        this.metrics = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('request_monitoring_initialized');
    }

    recordRequest(endpoint, method, duration, statusCode, error = null) {
        const key = `${method}_${endpoint}`;
        const metric = this.metrics.get(key) || {
            endpoint,
            method,
            requestCount: 0,
            totalDuration: 0,
            minDuration: Infinity,
            maxDuration: 0,
            statusCodes: {},
            errors: [],
            lastRequest: null
        };
        
        metric.requestCount++;
        metric.totalDuration += duration;
        metric.minDuration = Math.min(metric.minDuration, duration);
        metric.maxDuration = Math.max(metric.maxDuration, duration);
        metric.statusCodes[statusCode] = (metric.statusCodes[statusCode] || 0) + 1;
        metric.lastRequest = new Date();
        
        if (error) {
            metric.errors.push({
                error,
                timestamp: new Date()
            });
        }
        
        this.metrics.set(key, metric);
        
        // Check alerts
        this.checkAlerts(key, metric);
    }

    checkAlerts(key, metric) {
        for (const alert of this.alerts.values()) {
            if (alert.enabled && this.matchesAlert(metric, alert)) {
                this.triggerAlert(alert, metric);
            }
        }
    }

    matchesAlert(metric, alert) {
        switch (alert.type) {
            case 'error_rate':
                const errorCount = metric.errors.length;
                const errorRate = metric.requestCount > 0 
                    ? (errorCount / metric.requestCount) * 100 
                    : 0;
                return errorRate >= alert.threshold;
            case 'response_time':
                const avgDuration = metric.requestCount > 0 
                    ? metric.totalDuration / metric.requestCount 
                    : 0;
                return avgDuration >= alert.threshold;
            case 'request_count':
                return metric.requestCount >= alert.threshold;
            default:
                return false;
        }
    }

    triggerAlert(alert, metric) {
        console.warn(`Alert triggered: ${alert.name}`, {
            alert,
            metric
        });
    }

    createAlert(alertId, name, type, threshold, endpoint = null) {
        this.alerts.set(alertId, {
            id: alertId,
            name,
            type,
            threshold,
            endpoint,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Alert created: ${alertId}`);
    }

    getMetrics(endpoint = null, method = null) {
        if (endpoint && method) {
            const key = `${method}_${endpoint}`;
            return this.metrics.get(key);
        }
        
        return Array.from(this.metrics.values());
    }

    getMetricStats(endpoint, method) {
        const key = `${method}_${endpoint}`;
        const metric = this.metrics.get(key);
        if (!metric) {
            return null;
        }
        
        const avgDuration = metric.requestCount > 0 
            ? metric.totalDuration / metric.requestCount 
            : 0;
        
        const errorRate = metric.requestCount > 0 
            ? (metric.errors.length / metric.requestCount) * 100 
            : 0;
        
        return {
            endpoint: metric.endpoint,
            method: metric.method,
            requestCount: metric.requestCount,
            averageDuration: avgDuration,
            minDuration: metric.minDuration === Infinity ? 0 : metric.minDuration,
            maxDuration: metric.maxDuration,
            errorRate: errorRate.toFixed(2) + '%',
            statusCodes: metric.statusCodes,
            lastRequest: metric.lastRequest
        };
    }

    getAlert(alertId) {
        return this.alerts.get(alertId);
    }

    getAllAlerts() {
        return Array.from(this.alerts.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`req_monitoring_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestMonitoring = new APIRequestMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestMonitoring;
}

