/**
 * Network Security Monitoring
 * Continuous network security monitoring and analysis
 */

class NetworkSecurityMonitoring {
    constructor() {
        this.monitors = new Map();
        this.events = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('n_et_wo_rk_se_cu_ri_ty_mo_ni_to_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_et_wo_rk_se_cu_ri_ty_mo_ni_to_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            target: monitorData.target || '',
            metrics: monitorData.metrics || [],
            thresholds: monitorData.thresholds || {},
            enabled: monitorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        console.log(`Network monitor created: ${monitorId}`);
        return monitor;
    }

    recordEvent(event) {
        const eventData = {
            id: `event_${Date.now()}`,
            ...event,
            timestamp: new Date(),
            analyzed: false,
            createdAt: new Date()
        };
        
        this.events.set(eventData.id, eventData);
        this.analyzeEvent(eventData);
        
        return eventData;
    }

    analyzeEvent(event) {
        event.analyzed = true;
        
        this.monitors.forEach((monitor, monitorId) => {
            if (!monitor.enabled) return;
            
            const metrics = monitor.metrics;
            metrics.forEach(metric => {
                const value = event[metric];
                const threshold = monitor.thresholds[metric];
                
                if (threshold && value !== undefined) {
                    if (value > threshold.max || value < threshold.min) {
                        this.createAlert(monitorId, metric, value, threshold);
                    }
                }
            });
        });
        
        return event;
    }

    createAlert(monitorId, metric, value, threshold) {
        const alert = {
            id: `alert_${Date.now()}`,
            monitorId,
            metric,
            value,
            threshold,
            severity: this.calculateSeverity(value, threshold),
            timestamp: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.alerts.set(alert.id, alert);
        return alert;
    }

    calculateSeverity(value, threshold) {
        const deviation = Math.abs(value - ((threshold.max + threshold.min) / 2));
        const range = threshold.max - threshold.min;
        
        if (deviation > range * 0.5) return 'high';
        if (deviation > range * 0.3) return 'medium';
        return 'low';
    }

    getAlerts(severity = null) {
        if (severity) {
            return Array.from(this.alerts.values())
                .filter(a => a.severity === severity);
        }
        return Array.from(this.alerts.values());
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.networkSecurityMonitoring = new NetworkSecurityMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkSecurityMonitoring;
}

