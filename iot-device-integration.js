/**
 * IoT Device Integration
 * Integrates with IoT devices
 */

class IoTDeviceIntegration {
    constructor() {
        this.devices = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_de_vi_ce_in_te_gr_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_de_vi_ce_in_te_gr_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerDevice(deviceId, config) {
        this.devices.set(deviceId, {
            ...config,
            connected: true,
            lastSeen: new Date()
        });
    }

    receiveData(deviceId, data) {
        const device = this.devices.get(deviceId);
        if (device) {
            device.lastData = data;
            device.lastSeen = new Date();
        }
    }
}

// Auto-initialize
const iotIntegration = new IoTDeviceIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTDeviceIntegration;
}

