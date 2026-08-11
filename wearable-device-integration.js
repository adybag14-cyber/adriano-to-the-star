/**
 * Wearable Device Integration
 * Wearable device data integration
 */

class WearableDeviceIntegration {
    constructor() {
        this.devices = new Map();
        this.users = new Map();
        this.data = new Map();
        this.init();
    }

    init() {
        this.trackEvent('w_ea_ra_bl_ed_ev_ic_ei_nt_eg_ra_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_ea_ra_bl_ed_ev_ic_ei_nt_eg_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerUser(userId, userData) {
        const user = {
            id: userId,
            ...userData,
            name: userData.name || userId,
            devices: [],
            createdAt: new Date()
        };
        
        this.users.set(userId, user);
        console.log(`User registered: ${userId}`);
        return user;
    }

    registerDevice(userId, deviceId, deviceData) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        const device = {
            id: deviceId,
            userId,
            ...deviceData,
            name: deviceData.name || deviceId,
            type: deviceData.type || 'fitness_tracker',
            manufacturer: deviceData.manufacturer || '',
            model: deviceData.model || '',
            status: 'connected',
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        user.devices.push(deviceId);
        
        return device;
    }

    async syncData(deviceId, data) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        
        const dataRecord = {
            id: `data_${Date.now()}`,
            deviceId,
            userId: device.userId,
            ...data,
            steps: data.steps || 0,
            heartRate: data.heartRate || 0,
            calories: data.calories || 0,
            distance: data.distance || 0,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.data.set(dataRecord.id, dataRecord);
        
        return dataRecord;
    }

    getUserData(userId, startDate = null, endDate = null) {
        let data = Array.from(this.data.values())
            .filter(d => d.userId === userId);
        
        if (startDate) {
            data = data.filter(d => d.timestamp >= startDate);
        }
        
        if (endDate) {
            data = data.filter(d => d.timestamp <= endDate);
        }
        
        return data.sort((a, b) => b.timestamp - a.timestamp);
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.wearableDeviceIntegration = new WearableDeviceIntegration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WearableDeviceIntegration;
}

