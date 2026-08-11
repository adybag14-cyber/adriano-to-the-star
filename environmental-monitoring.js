/**
 * Environmental Monitoring
 * Environmental sensor monitoring system
 */

class EnvironmentalMonitoring {
    constructor() {
        this.stations = new Map();
        this.sensors = new Map();
        this.readings = new Map();
        this.init();
    }

    init() {
        this.trackEvent('environmental_mon_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`environmental_mon_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    createStation(stationId, stationData) {
        const station = {
            id: stationId,
            ...stationData,
            name: stationData.name || stationId,
            location: stationData.location || '',
            latitude: stationData.latitude || 0,
            longitude: stationData.longitude || 0,
            sensors: [],
            createdAt: new Date()
        };
        
        this.stations.set(stationId, station);
        console.log(`Monitoring station created: ${stationId}`);
        return station;
    }

    registerSensor(stationId, sensorId, sensorData) {
        const station = this.stations.get(stationId);
        if (!station) {
            throw new Error('Station not found');
        }
        
        const sensor = {
            id: sensorId,
            stationId,
            ...sensorData,
            name: sensorData.name || sensorId,
            type: sensorData.type || 'temperature',
            unit: sensorData.unit || 'celsius',
            createdAt: new Date()
        };
        
        this.sensors.set(sensorId, sensor);
        station.sensors.push(sensorId);
        
        return sensor;
    }

    async recordReading(sensorId, value, timestamp = null) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) {
            throw new Error('Sensor not found');
        }
        
        const reading = {
            id: `reading_${Date.now()}`,
            sensorId,
            stationId: sensor.stationId,
            value,
            unit: sensor.unit,
            timestamp: timestamp || new Date(),
            createdAt: new Date()
        };
        
        this.readings.set(reading.id, reading);
        
        return reading;
    }

    getReadings(stationId = null, sensorId = null, startDate = null, endDate = null) {
        let readings = Array.from(this.readings.values());
        
        if (stationId) {
            readings = readings.filter(r => r.stationId === stationId);
        }
        
        if (sensorId) {
            readings = readings.filter(r => r.sensorId === sensorId);
        }
        
        if (startDate) {
            readings = readings.filter(r => r.timestamp >= startDate);
        }
        
        if (endDate) {
            readings = readings.filter(r => r.timestamp <= endDate);
        }
        
        return readings.sort((a, b) => b.timestamp - a.timestamp);
    }

    getStation(stationId) {
        return this.stations.get(stationId);
    }

    getSensor(sensorId) {
        return this.sensors.get(sensorId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.environmentalMonitoring = new EnvironmentalMonitoring();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvironmentalMonitoring;
}

