/**
 * Sensor Data Management
 * Sensor data collection and management
 */

class SensorDataManagement {
    constructor() {
        this.sensors = new Map();
        this.data = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_en_so_rd_at_am_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_en_so_rd_at_am_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerSensor(sensorId, sensorData) {
        const sensor = {
            id: sensorId,
            ...sensorData,
            name: sensorData.name || sensorId,
            type: sensorData.type || 'temperature',
            unit: sensorData.unit || 'celsius',
            location: sensorData.location || '',
            createdAt: new Date()
        };
        
        this.sensors.set(sensorId, sensor);
        console.log(`Sensor registered: ${sensorId}`);
        return sensor;
    }

    recordData(sensorId, value, timestamp = null) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) {
            throw new Error('Sensor not found');
        }
        
        const data = {
            id: `data_${Date.now()}`,
            sensorId,
            value,
            unit: sensor.unit,
            timestamp: timestamp || new Date(),
            createdAt: new Date()
        };
        
        this.data.set(data.id, data);
        
        return data;
    }

    getSensorData(sensorId, startDate = null, endDate = null) {
        let data = Array.from(this.data.values())
            .filter(d => d.sensorId === sensorId);
        
        if (startDate) {
            data = data.filter(d => d.timestamp >= startDate);
        }
        
        if (endDate) {
            data = data.filter(d => d.timestamp <= endDate);
        }
        
        return data.sort((a, b) => a.timestamp - b.timestamp);
    }

    getSensor(sensorId) {
        return this.sensors.get(sensorId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.sensorDataManagement = new SensorDataManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SensorDataManagement;
}


