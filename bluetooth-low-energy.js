/**
 * Bluetooth Low Energy
 * BLE device integration
 */

class BluetoothLowEnergy {
    constructor() {
        this.devices = new Map();
        this.services = new Map();
        this.characteristics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('ble_initialized');
    }

    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            address: deviceData.address || this.generateMACAddress(),
            rssi: deviceData.rssi || -70,
            services: [],
            connected: false,
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`BLE device registered: ${deviceId}`);
        return device;
    }

    createService(deviceId, serviceId, serviceData) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        
        const service = {
            id: serviceId,
            deviceId,
            ...serviceData,
            uuid: serviceData.uuid || this.generateUUID(),
            characteristics: [],
            createdAt: new Date()
        };
        
        this.services.set(serviceId, service);
        device.services.push(serviceId);
        
        return service;
    }

    createCharacteristic(serviceId, characteristicId, characteristicData) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error('Service not found');
        }
        
        const characteristic = {
            id: characteristicId,
            serviceId,
            ...characteristicData,
            uuid: characteristicData.uuid || this.generateUUID(),
            properties: characteristicData.properties || ['read'],
            value: characteristicData.value || null,
            createdAt: new Date()
        };
        
        this.characteristics.set(characteristicId, characteristic);
        service.characteristics.push(characteristicId);
        
        return characteristic;
    }

    async readCharacteristic(characteristicId) {
        const characteristic = this.characteristics.get(characteristicId);
        if (!characteristic) {
            throw new Error('Characteristic not found');
        }
        
        if (!characteristic.properties.includes('read')) {
            throw new Error('Characteristic does not support read');
        }
        
        return {
            characteristicId,
            value: characteristic.value,
            timestamp: new Date()
        };
    }

    async writeCharacteristic(characteristicId, value) {
        const characteristic = this.characteristics.get(characteristicId);
        if (!characteristic) {
            throw new Error('Characteristic not found');
        }
        
        if (!characteristic.properties.includes('write')) {
            throw new Error('Characteristic does not support write');
        }
        
        characteristic.value = value;
        characteristic.updatedAt = new Date();
        
        return {
            characteristicId,
            value,
            timestamp: new Date()
        };
    }

    generateMACAddress() {
        return Array.from({ length: 6 }, () => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join(':');
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getService(serviceId) {
        return this.services.get(serviceId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ble_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.bluetoothLowEnergy = new BluetoothLowEnergy();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BluetoothLowEnergy;
}

