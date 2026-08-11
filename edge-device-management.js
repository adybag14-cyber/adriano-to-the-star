/**
 * Edge Device Management
 * Edge device lifecycle management
 */

class EdgeDeviceManagement {
    constructor() {
        this.devices = new Map();
        this.groups = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_device_mgmt_initialized');
    }

    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            type: deviceData.type || 'edge',
            location: deviceData.location || '',
            capabilities: deviceData.capabilities || [],
            status: 'offline',
            lastSeen: null,
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`Edge device registered: ${deviceId}`);
        return device;
    }

    createGroup(groupId, groupData) {
        const group = {
            id: groupId,
            ...groupData,
            name: groupData.name || groupId,
            devices: [],
            policies: groupData.policies || [],
            createdAt: new Date()
        };
        
        this.groups.set(groupId, group);
        console.log(`Device group created: ${groupId}`);
        return group;
    }

    addDeviceToGroup(groupId, deviceId) {
        const group = this.groups.get(groupId);
        const device = this.devices.get(deviceId);
        
        if (!group) {
            throw new Error('Group not found');
        }
        if (!device) {
            throw new Error('Device not found');
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
        
        return device;
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getGroup(groupId) {
        return this.groups.get(groupId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_device_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.edgeDeviceManagement = new EdgeDeviceManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdgeDeviceManagement;
}


