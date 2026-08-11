/**
 * Anomaly Detection System
 * Detects anomalies in user behavior and system metrics
 */

class AnomalyDetectionSystem {
    constructor() {
        this.baselines = {};
        this.anomalies = [];
        this.init();
    }
    
    init() {
        this.establishBaselines();
        this.startMonitoring();
        this.trackEvent('system_initialized');
    }
    
    establishBaselines() {
        // Establish baseline metrics
        this.baselines = {
            requestRate: 100, // requests per minute
            errorRate: 0.01, // 1% error rate
            responseTime: 500, // 500ms average
            userActivity: 50 // active users per hour
        };
    }
    
    startMonitoring() {
        // Monitor for anomalies
        setInterval(() => {
            this.checkAnomalies();
        }, 60000); // Check every minute
    }
    
    async checkAnomalies() {
        const metrics = await this.collectMetrics();
        const detected = this.detectAnomalies(metrics);
        
        if (detected.length > 0) {
            this.handleAnomalies(detected);
        }
    }
    
    async collectMetrics() {
        // Collect current metrics
        return {
            requestRate: await this.getRequestRate(),
            errorRate: await this.getErrorRate(),
            responseTime: await this.getAverageResponseTime(),
            userActivity: await this.getActiveUsers()
        };
    }
    
    async getRequestRate() {
        // Get requests per minute
        // Simplified - would track actual requests
        return 50;
    }
    
    async getErrorRate() {
        // Get error rate
        // Simplified
        return 0.005;
    }
    
    async getAverageResponseTime() {
        // Get average response time
        const navigation = performance.getEntriesByType('navigation')[0];
        return navigation ? navigation.responseEnd - navigation.requestStart : 300;
    }
    
    async getActiveUsers() {
        // Get active users
        // Would query database
        return 30;
    }
    
    detectAnomalies(metrics) {
        const anomalies = [];
        const threshold = 2; // 2 standard deviations
        
        Object.keys(metrics).forEach(key => {
            const baseline = this.baselines[key];
            const current = metrics[key];
            const deviation = Math.abs(current - baseline) / baseline;
            
            if (deviation > threshold * 0.5) { // 50% deviation
                anomalies.push({
                    metric: key,
                    current,
                    baseline,
                    deviation: (deviation * 100).toFixed(2) + '%',
                    severity: deviation > 1 ? 'high' : 'medium'
                });
            }
        });
        
        return anomalies;
    }
    
    handleAnomalies(anomalies) {
        anomalies.forEach(anomaly => {
            this.anomalies.push({
                ...anomaly,
                timestamp: Date.now()
            });
            
            this.alertAnomaly(anomaly);
        });
    }
    
    alertAnomaly(anomaly) {
        console.warn('Anomaly detected:', anomaly);
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(
                `Anomaly detected: ${anomaly.metric} (${anomaly.deviation} deviation)`,
                anomaly.severity === 'high' ? 'error' : 'warning'
            );
        }
        
        // Send to monitoring
        if (window.analytics) {
            window.analytics.track('Anomaly Detected', anomaly);
        }
    }
    
    detectUserBehaviorAnomaly(userId, behavior) {
        // Detect anomalies in user behavior
        const anomalies = [];
        
        // Unusual login time
        const hour = new Date().getHours();
        if (hour < 6 || hour > 23) {
            anomalies.push({
                type: 'unusual_login_time',
                severity: 'low'
            });
        }
        
        // Rapid actions
        if (behavior.actionsPerMinute > 100) {
            anomalies.push({
                type: 'rapid_actions',
                severity: 'medium'
            });
        }
        
        // Unusual location
        if (behavior.locationChange && behavior.timeSinceLastLocation < 300) {
            anomalies.push({
                type: 'impossible_location',
                severity: 'high'
            });
        }
        
        return anomalies;
    }
    
    getAnomalies(limit = 10) {
        return this.anomalies
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`anomaly_system_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.anomalyDetectionSystem = new AnomalyDetectionSystem(); });
} else {
    window.anomalyDetectionSystem = new AnomalyDetectionSystem();
}

