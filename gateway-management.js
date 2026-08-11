/**
 * Gateway Management
 * IoT gateway management system
 */

class GatewayManagement {
    constructor() {
        this.gateways = new Map();
        this.devices = new Map();
        this.init();
    }

    init() {
        this.trackEvent('g_at_ew_ay_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_at_ew_ay_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerGateway(gatewayId, gatewayData) {
        const gateway = {
            id: gatewayId,
            ...gatewayData,
            name: gatewayData.name || gatewayId,
            location: gatewayData.location || '',
            protocol: gatewayData.protocol || 'mqtt',
            devices: [],
            status: 'offline',
            lastSeen: null,
            createdAt: new Date()
        };
        
        this.gateways.set(gatewayId, gateway);
        console.log(`Gateway registered: ${gatewayId}`);
        return gateway;
    }

    connectDevice(gatewayId, deviceId) {
        const gateway = this.gateways.get(gatewayId);
        const device = this.devices.get(deviceId);
        
        if (!gateway) {
            throw new Error('Gateway not found');
        }
        if (!device) {
            throw new Error('Device not found');
        }
        
        if (!gateway.devices.includes(deviceId)) {
            gateway.devices.push(deviceId);
        }
        
        gateway.status = 'online';
        gateway.lastSeen = new Date();
        
        return { gateway, device };
    }

    disconnectDevice(gatewayId, deviceId) {
        const gateway = this.gateways.get(gatewayId);
        if (!gateway) {
            throw new Error('Gateway not found');
        }
        
        const index = gateway.devices.indexOf(deviceId);
        if (index > -1) {
            gateway.devices.splice(index, 1);
        }
        
        return gateway;
    }

    getGateway(gatewayId) {
        return this.gateways.get(gatewayId);
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.gatewayManagement = new GatewayManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GatewayManagement;
}


