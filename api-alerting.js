/**
 * API Alerting
 * Sends alerts for API issues
 */

class APIAlerting {
    constructor() {
        this.alerts = [];
        this.thresholds = { errorRate: 0.05, responseTime: 1000 };
        this.init();
    }

    init() {
        this.trackEvent('api_alerting_initialized');
    }

    checkThresholds(metrics) {
        if (metrics.errorRate > this.thresholds.errorRate) {
            this.createAlert('high_error_rate', `Error rate: ${metrics.errorRate}`);
        }
        if (metrics.avgResponseTime > this.thresholds.responseTime) {
            this.createAlert('slow_response', `Response time: ${metrics.avgResponseTime}ms`);
        }
    }

    createAlert(type, message) {
        this.alerts.push({ type, message, timestamp: new Date() });
        this.trackEvent('alert_created', { type });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_alerting_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_alerting', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const apiAlerting = new APIAlerting();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIAlerting;
}

