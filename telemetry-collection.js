/**
 * Telemetry Collection
 * Telemetry data collection system
 */

class TelemetryCollection {
    constructor() {
        this.collectors = new Map();
        this.devices = new Map();
        this.telemetry = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_el_em_et_ry_co_ll_ec_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_el_em_et_ry_co_ll_ec_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createCollector(collectorId, collectorData) {
        const collector = {
            id: collectorId,
            ...collectorData,
            name: collectorData.name || collectorId,
            devices: [],
            enabled: collectorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.collectors.set(collectorId, collector);
        console.log(`Telemetry collector created: ${collectorId}`);
        return collector;
    }

    registerDevice(collectorId, deviceId, deviceData) {
        const collector = this.collectors.get(collectorId);
        if (!collector) {
            throw new Error('Collector not found');
        }
        
        const device = {
            id: deviceId,
            collectorId,
            ...deviceData,
            name: deviceData.name || deviceId,
            metrics: deviceData.metrics || [],
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        collector.devices.push(deviceId);
        
        return device;
    }

    async collect(collectorId, deviceId, telemetryData) {
        const collector = this.collectors.get(collectorId);
        const device = this.devices.get(deviceId);
        
        if (!collector || !device) {
            throw new Error('Collector or device not found');
        }
        
        const telemetry = {
            id: `telemetry_${Date.now()}`,
            collectorId,
            deviceId,
            ...telemetryData,
            metrics: telemetryData.metrics || {},
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.telemetry.set(telemetry.id, telemetry);
        
        return telemetry;
    }

    getTelemetry(collectorId = null, deviceId = null, startDate = null, endDate = null) {
        let telemetry = Array.from(this.telemetry.values());
        
        if (collectorId) {
            telemetry = telemetry.filter(t => t.collectorId === collectorId);
        }
        
        if (deviceId) {
            telemetry = telemetry.filter(t => t.deviceId === deviceId);
        }
        
        if (startDate) {
            telemetry = telemetry.filter(t => t.timestamp >= startDate);
        }
        
        if (endDate) {
            telemetry = telemetry.filter(t => t.timestamp <= endDate);
        }
        
        return telemetry.sort((a, b) => b.timestamp - a.timestamp);
    }

    getCollector(collectorId) {
        return this.collectors.get(collectorId);
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.telemetryCollection = new TelemetryCollection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelemetryCollection;
}

