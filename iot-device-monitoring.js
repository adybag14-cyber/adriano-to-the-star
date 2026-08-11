/**
 * IoT Device Monitoring
 * IoT device health and status monitoring
 */

class IoTDeviceMonitoring {
    constructor() {
        this.monitors = new Map();
        this.devices = new Map();
        this.metrics = new Map();
        this.alerts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_de_vi_ce_mo_ni_to_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_de_vi_ce_mo_ni_to_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            status: 'offline',
            lastSeen: null,
            health: 'unknown',
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`Device registered for monitoring: ${deviceId}`);
        return device;
    }

    createMonitor(monitorId, monitorData) {
        const monitor = {
            id: monitorId,
            ...monitorData,
            deviceId: monitorData.deviceId,
            metrics: monitorData.metrics || [],
            thresholds: monitorData.thresholds || {},
            enabled: monitorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.monitors.set(monitorId, monitor);
        console.log(`Device monitor created: ${monitorId}`);
        return monitor;
    }

    recordMetric(monitorId, metricData) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            throw new Error('Monitor not found');
        }
        
        const device = this.devices.get(monitor.deviceId);
        if (device) {
            device.lastSeen = new Date();
            device.status = 'online';
        }
        
        const metric = {
            id: `metric_${Date.now()}`,
            monitorId,
            ...metricData,
            name: metricData.name || 'unknown',
            value: metricData.value || 0,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.metrics.set(metric.id, metric);
        
        this.checkThresholds(monitorId, metric);
        
        return metric;
    }

    checkThresholds(monitorId, metric) {
        const monitor = this.monitors.get(monitorId);
        if (!monitor) {
            return;
        }
        
        const threshold = monitor.thresholds[metric.name];
        if (threshold) {
            if (metric.value > threshold.max || metric.value < threshold.min) {
                this.createAlert(monitorId, metric, threshold);
            }
        }
    }

    createAlert(monitorId, metric, threshold) {
        const alert = {
            id: `alert_${Date.now()}`,
            monitorId,
            metricId: metric.id,
            metricName: metric.name,
            value: metric.value,
            threshold,
            severity: 'medium',
            message: `Metric ${metric.name} exceeded threshold`,
            timestamp: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.alerts.set(alert.id, alert);
        return alert;
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getMonitor(monitorId) {
        return this.monitors.get(monitorId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.iotDeviceMonitoring = new IoTDeviceMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTDeviceMonitoring;
}


