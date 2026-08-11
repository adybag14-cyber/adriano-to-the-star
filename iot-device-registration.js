/**
 * IoT Device Registration
 * IoT device registration system
 */

class IoTDeviceRegistration {
    constructor() {
        this.devices = new Map();
        this.registrations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_de_vi_ce_re_gi_st_ra_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_de_vi_ce_re_gi_st_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            type: deviceData.type || 'sensor',
            manufacturer: deviceData.manufacturer || '',
            model: deviceData.model || '',
            serialNumber: deviceData.serialNumber || this.generateSerialNumber(),
            macAddress: deviceData.macAddress || this.generateMAC(),
            status: 'registered',
            registeredAt: new Date(),
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        
        const registration = {
            id: `registration_${Date.now()}`,
            deviceId,
            certificate: this.generateCertificate(device),
            credentials: this.generateCredentials(device),
            registeredAt: new Date(),
            createdAt: new Date()
        };
        
        this.registrations.set(registration.id, registration);
        
        console.log(`Device registered: ${deviceId}`);
        return { device, registration };
    }

    generateSerialNumber() {
        return 'SN' + Array.from({ length: 12 }, () => 
            Math.floor(Math.random() * 10).toString()
        ).join('');
    }

    generateMAC() {
        return Array.from({ length: 6 }, () => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join(':');
    }

    generateCertificate(device) {
        return {
            id: `cert_${Date.now()}`,
            deviceId: device.id,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        };
    }

    generateCredentials(device) {
        return {
            deviceId: device.id,
            apiKey: this.generateAPIKey(),
            secret: this.generateSecret()
        };
    }

    generateAPIKey() {
        return 'ak_' + Array.from({ length: 32 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    generateSecret() {
        return Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getRegistration(registrationId) {
        return this.registrations.get(registrationId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.iotDeviceRegistration = new IoTDeviceRegistration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTDeviceRegistration;
}


