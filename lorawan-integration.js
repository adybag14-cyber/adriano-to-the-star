/**
 * LoRaWAN Integration
 * LoRaWAN network integration
 */

class LoRaWANIntegration {
    constructor() {
        this.networks = new Map();
        this.devices = new Map();
        this.messages = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_or_aw_an_in_te_gr_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_or_aw_an_in_te_gr_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createNetwork(networkId, networkData) {
        const network = {
            id: networkId,
            ...networkData,
            name: networkData.name || networkId,
            gateway: networkData.gateway || '',
            frequency: networkData.frequency || 868.1,
            devices: [],
            createdAt: new Date()
        };
        
        this.networks.set(networkId, network);
        console.log(`LoRaWAN network created: ${networkId}`);
        return network;
    }

    registerDevice(networkId, deviceId, deviceData) {
        const network = this.networks.get(networkId);
        if (!network) {
            throw new Error('Network not found');
        }
        
        const device = {
            id: deviceId,
            networkId,
            ...deviceData,
            name: deviceData.name || deviceId,
            devEUI: deviceData.devEUI || this.generateDevEUI(),
            appEUI: deviceData.appEUI || this.generateAppEUI(),
            appKey: deviceData.appKey || this.generateAppKey(),
            status: 'registered',
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        network.devices.push(deviceId);
        
        return device;
    }

    async sendMessage(networkId, deviceId, payload) {
        const network = this.networks.get(networkId);
        const device = this.devices.get(deviceId);
        
        if (!network || !device) {
            throw new Error('Network or device not found');
        }
        
        const message = {
            id: `message_${Date.now()}`,
            networkId,
            deviceId,
            payload,
            fPort: 1,
            confirmed: false,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.messages.set(message.id, message);
        
        return message;
    }

    generateDevEUI() {
        return Array.from({ length: 16 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    generateAppEUI() {
        return Array.from({ length: 16 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    generateAppKey() {
        return Array.from({ length: 32 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getNetwork(networkId) {
        return this.networks.get(networkId);
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.lorawanIntegration = new LoRaWANIntegration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoRaWANIntegration;
}

