/**
 * Predictive Maintenance (IoT)
 * IoT-based predictive maintenance system
 */

class PredictiveMaintenanceIoT {
    constructor() {
        this.devices = new Map();
        this.models = new Map();
        this.predictions = new Map();
        this.init();
    }

    init() {
        console.log('Predictive Maintenance (IoT) initialized.');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_re_di_ct_iv_em_ai_nt_en_an_ce_io_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            type: deviceData.type || 'equipment',
            sensors: deviceData.sensors || [],
            health: 'good',
            lastMaintenance: null,
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`Device registered: ${deviceId}`);
        return device;
    }

    createModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            type: modelData.type || 'regression',
            features: modelData.features || [],
            accuracy: modelData.accuracy || 0.85,
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Predictive model created: ${modelId}`);
        return model;
    }

    async predict(deviceId, modelId, sensorData) {
        const device = this.devices.get(deviceId);
        const model = this.models.get(modelId);
        
        if (!device || !model) {
            throw new Error('Device or model not found');
        }
        
        const prediction = {
            id: `prediction_${Date.now()}`,
            deviceId,
            modelId,
            sensorData,
            remainingLife: this.calculateRemainingLife(sensorData, model),
            failureProbability: this.calculateFailureProbability(sensorData, model),
            recommendedAction: this.recommendAction(sensorData, model),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.predictions.set(prediction.id, prediction);
        
        if (prediction.failureProbability > 0.7) {
            device.health = 'critical';
        } else if (prediction.failureProbability > 0.4) {
            device.health = 'warning';
        } else {
            device.health = 'good';
        }
        
        return prediction;
    }

    calculateRemainingLife(sensorData, model) {
        const baseLife = 1000;
        const degradation = Object.values(sensorData).reduce((sum, v) => sum + (v || 0), 0) / 100;
        return Math.max(0, baseLife - degradation);
    }

    calculateFailureProbability(sensorData, model) {
        const riskFactors = Object.values(sensorData).filter(v => v > 50).length;
        return Math.min(1.0, riskFactors * 0.15);
    }

    recommendAction(sensorData, model) {
        const failureProb = this.calculateFailureProbability(sensorData, model);
        
        if (failureProb > 0.7) {
            return 'immediate_maintenance';
        } else if (failureProb > 0.4) {
            return 'schedule_maintenance';
        } else {
            return 'monitor';
        }
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getModel(modelId) {
        return this.models.get(modelId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.predictiveMaintenanceIot = new PredictiveMaintenanceIoT();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictiveMaintenanceIoT;
}

