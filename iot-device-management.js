/**
 * IoT Device Management
 * IoT device lifecycle management
 */

class IoTDeviceManagement {
    constructor() {
        this.devices = new Map();
        this.groups = new Map();
        this.policies = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_de_vi_ce_ma_na_ge_me_nt_initialized');
    }

    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            type: deviceData.type || 'sensor',
            status: 'offline',
            lastSeen: null,
            properties: deviceData.properties || {},
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`IoT device registered: ${deviceId}`);
        this.trackEvent('device_registered', { deviceId, type: device.type });
        return device;
    }

    createGroup(groupId, groupData) {
        const group = {
            id: groupId,
            ...groupData,
            name: groupData.name || groupId,
            devices: [],
            createdAt: new Date()
        };
        
        this.groups.set(groupId, group);
        console.log(`Device group created: ${groupId}`);
        return group;
    }

    addDeviceToGroup(groupId, deviceId) {
        const group = this.groups.get(groupId);
        const device = this.devices.get(deviceId);
        
        if (!group || !device) {
            throw new Error('Group or device not found');
        }
        
        if (!group.devices.includes(deviceId)) {
            group.devices.push(deviceId);
        }
        
        return { group, device };
    }

    updateDeviceStatus(deviceId, status) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        
        device.status = status;
        device.lastSeen = new Date();
        
        this.trackEvent('device_status_updated', { deviceId, status });
        return device;
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`iot:${eventName}`, 1, {
                    source: 'iot-device-management',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record IoT event:', e);
            }
        }
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getGroup(groupId) {
        return this.groups.get(groupId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.iotDeviceManagement = new IoTDeviceManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTDeviceManagement;
}
