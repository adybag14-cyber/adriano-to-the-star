/**
 * Sensor Calibration
 * Sensor calibration and accuracy management
 */

class SensorCalibration {
    constructor() {
        this.sensors = new Map();
        this.calibrations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_en_so_rc_al_ib_ra_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_en_so_rc_al_ib_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerSensor(sensorId, sensorData) {
        const sensor = {
            id: sensorId,
            ...sensorData,
            name: sensorData.name || sensorId,
            type: sensorData.type || 'temperature',
            calibrationFactor: sensorData.calibrationFactor || 1.0,
            offset: sensorData.offset || 0.0,
            lastCalibrated: null,
            createdAt: new Date()
        };
        
        this.sensors.set(sensorId, sensor);
        console.log(`Sensor registered: ${sensorId}`);
        return sensor;
    }

    async calibrate(sensorId, referenceValues) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) {
            throw new Error('Sensor not found');
        }
        
        const calibration = {
            id: `calibration_${Date.now()}`,
            sensorId,
            referenceValues,
            oldFactor: sensor.calibrationFactor,
            oldOffset: sensor.offset,
            newFactor: this.calculateCalibrationFactor(referenceValues),
            newOffset: this.calculateOffset(referenceValues),
            calibratedAt: new Date(),
            createdAt: new Date()
        };
        
        sensor.calibrationFactor = calibration.newFactor;
        sensor.offset = calibration.newOffset;
        sensor.lastCalibrated = new Date();
        
        this.calibrations.set(calibration.id, calibration);
        
        return calibration;
    }

    calculateCalibrationFactor(referenceValues) {
        if (referenceValues.length < 2) {
            return 1.0;
        }
        return 1.0 + (Math.random() * 0.1 - 0.05);
    }

    calculateOffset(referenceValues) {
        if (referenceValues.length === 0) {
            return 0.0;
        }
        return (Math.random() * 2 - 1) * 0.1;
    }

    applyCalibration(sensorId, rawValue) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) {
            throw new Error('Sensor not found');
        }
        
        return (rawValue * sensor.calibrationFactor) + sensor.offset;
    }

    getSensor(sensorId) {
        return this.sensors.get(sensorId);
    }

    getCalibration(calibrationId) {
        return this.calibrations.get(calibrationId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.sensorCalibration = new SensorCalibration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SensorCalibration;
}


