/**
 * Agriculture IoT
 * Agricultural IoT monitoring system
 */

class AgricultureIoT {
    constructor() {
        this.farms = new Map();
        this.fields = new Map();
        this.sensors = new Map();
        this.init();
    }

    init() {
        this.trackEvent('agriculture_iot_initialized');
    }

    createFarm(farmId, farmData) {
        const farm = {
            id: farmId,
            ...farmData,
            name: farmData.name || farmId,
            location: farmData.location || '',
            fields: [],
            createdAt: new Date()
        };
        
        this.farms.set(farmId, farm);
        this.trackEvent('farm_created', { farmId, name: farm.name });
        return farm;
    }

    createField(farmId, fieldId, fieldData) {
        const farm = this.farms.get(farmId);
        if (!farm) {
            throw new Error('Farm not found');
        }
        
        const field = {
            id: fieldId,
            farmId,
            ...fieldData,
            name: fieldData.name || fieldId,
            area: fieldData.area || 0,
            crop: fieldData.crop || '',
            sensors: [],
            createdAt: new Date()
        };
        
        this.fields.set(fieldId, field);
        farm.fields.push(fieldId);
        this.trackEvent('field_created', { fieldId, farmId, crop: field.crop });
        
        return field;
    }

    registerSensor(fieldId, sensorId, sensorData) {
        const field = this.fields.get(fieldId);
        if (!field) {
            throw new Error('Field not found');
        }
        
        const sensor = {
            id: sensorId,
            fieldId,
            ...sensorData,
            name: sensorData.name || sensorId,
            type: sensorData.type || 'soil_moisture',
            location: sensorData.location || '',
            createdAt: new Date()
        };
        
        this.sensors.set(sensorId, sensor);
        field.sensors.push(sensorId);
        this.trackEvent('sensor_registered', { sensorId, fieldId, type: sensor.type });
        
        return sensor;
    }

    async recordSensorData(sensorId, value, timestamp = null) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) {
            throw new Error('Sensor not found');
        }
        
        return {
            sensorId,
            fieldId: sensor.fieldId,
            value,
            timestamp: timestamp || new Date()
        };
    }

    getFarm(farmId) {
        return this.farms.get(farmId);
    }

    getField(fieldId) {
        return this.fields.get(fieldId);
    }

    getSensor(sensorId) {
        return this.sensors.get(sensorId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`agriculture_iot_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'agriculture_iot', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.agricultureIot = new AgricultureIoT();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgricultureIoT;
}

