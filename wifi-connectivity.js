/**
 * WiFi Connectivity
 * WiFi network connectivity management
 */

class WiFiConnectivity {
    constructor() {
        this.networks = new Map();
        this.devices = new Map();
        this.connections = new Map();
        this.init();
    }

    init() {
        this.trackEvent('w_if_ic_on_ne_ct_iv_it_y_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_if_ic_on_ne_ct_iv_it_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerNetwork(networkId, networkData) {
        const network = {
            id: networkId,
            ...networkData,
            name: networkData.name || networkId,
            ssid: networkData.ssid || networkId,
            security: networkData.security || 'WPA2',
            password: networkData.password || '',
            frequency: networkData.frequency || '2.4GHz',
            signalStrength: networkData.signalStrength || -50,
            createdAt: new Date()
        };
        
        this.networks.set(networkId, network);
        console.log(`WiFi network registered: ${networkId}`);
        return network;
    }

    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            macAddress: deviceData.macAddress || this.generateMACAddress(),
            connectedNetwork: null,
            status: 'disconnected',
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`Device registered: ${deviceId}`);
        return device;
    }

    async connect(deviceId, networkId, password = null) {
        const device = this.devices.get(deviceId);
        const network = this.networks.get(networkId);
        
        if (!device || !network) {
            throw new Error('Device or network not found');
        }
        
        if (network.security !== 'Open' && password !== network.password) {
            throw new Error('Invalid password');
        }
        
        const connection = {
            id: `connection_${Date.now()}`,
            deviceId,
            networkId,
            ipAddress: this.assignIPAddress(),
            connectedAt: new Date(),
            createdAt: new Date()
        };
        
        this.connections.set(connection.id, connection);
        
        device.connectedNetwork = networkId;
        device.status = 'connected';
        device.ipAddress = connection.ipAddress;
        
        return { connection, device };
    }

    disconnect(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        
        const connections = Array.from(this.connections.values())
            .filter(c => c.deviceId === deviceId);
        
        connections.forEach(c => this.connections.delete(c.id));
        
        device.connectedNetwork = null;
        device.status = 'disconnected';
        device.ipAddress = null;
        
        return device;
    }

    assignIPAddress() {
        return `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
    }

    generateMACAddress() {
        return Array.from({ length: 6 }, () => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join(':');
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
    window.wifiConnectivity = new WiFiConnectivity();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WiFiConnectivity;
}

