/**
 * IoT Command Control
 * IoT device command and control system
 */

class IoTCommandControl {
    constructor() {
        this.devices = new Map();
        this.commands = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ot_co_mm_an_dc_on_tr_ol_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ot_co_mm_an_dc_on_tr_ol_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            commands: deviceData.commands || [],
            status: 'offline',
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`Device registered: ${deviceId}`);
        return device;
    }

    async sendCommand(deviceId, commandData) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }
        
        if (device.status !== 'online') {
            throw new Error('Device is offline');
        }
        
        const command = {
            id: `command_${Date.now()}`,
            deviceId,
            ...commandData,
            action: commandData.action || '',
            parameters: commandData.parameters || {},
            status: 'pending',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.commands.set(command.id, command);
        
        await this.executeCommand(device, command);
        
        command.status = 'completed';
        command.completedAt = new Date();
        
        return command;
    }

    async executeCommand(device, command) {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    getCommandHistory(deviceId, startDate = null, endDate = null) {
        let commands = Array.from(this.commands.values())
            .filter(c => c.deviceId === deviceId);
        
        if (startDate) {
            commands = commands.filter(c => c.timestamp >= startDate);
        }
        
        if (endDate) {
            commands = commands.filter(c => c.timestamp <= endDate);
        }
        
        return commands.sort((a, b) => b.timestamp - a.timestamp);
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getCommand(commandId) {
        return this.commands.get(commandId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.iotCommandControl = new IoTCommandControl();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IoTCommandControl;
}


