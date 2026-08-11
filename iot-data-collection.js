/**
 * IoT Data Collection
 * IoT sensor data collection system
 */

class IoTDataCollection {
    constructor() {
        this.collectors = new Map();
        this.devices = new Map();
        this.data = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_da_ta_co_ll_ec_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_da_ta_co_ll_ec_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerCollector(collectorId, collectorData) {
        const collector = {
            id: collectorId,
            ...collectorData,
            name: collectorData.name || collectorId,
            devices: [],
            enabled: collectorData.enabled !== false,
            createdAt: new Date()
        };
        
        this.collectors.set(collectorId, collector);
        console.log(`Data collector registered: ${collectorId}`);
        return collector;
    }

    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            sensors: deviceData.sensors || [],
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`Device registered: ${deviceId}`);
        return device;
    }

    async collectData(collectorId, deviceId, sensorData) {
        const collector = this.collectors.get(collectorId);
        const device = this.devices.get(deviceId);
        
        if (!collector) {
            throw new Error('Collector not found');
        }
        if (!device) {
            throw new Error('Device not found');
        }
        
        const data = {
            id: `data_${Date.now()}`,
            collectorId,
            deviceId,
            ...sensorData,
            sensors: sensorData.sensors || [],
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.data.set(data.id, data);
        
        return data;
    }

    getData(collectorId = null, deviceId = null, startDate = null, endDate = null) {
        let data = Array.from(this.data.values());
        
        if (collectorId) {
            data = data.filter(d => d.collectorId === collectorId);
        }
        
        if (deviceId) {
            data = data.filter(d => d.deviceId === deviceId);
        }
        
        if (startDate) {
            data = data.filter(d => d.timestamp >= startDate);
        }
        
        if (endDate) {
            data = data.filter(d => d.timestamp <= endDate);
        }
        
        return data.sort((a, b) => b.timestamp - a.timestamp);
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
    window.iotDataCollection = new IoTDataCollection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTDataCollection;
}


