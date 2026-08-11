/**
 * Actuator Control
 * IoT actuator control system
 */

class ActuatorControl {
    constructor() {
        this.actuators = new Map();
        this.commands = new Map();
        this.init();
    }

    init() {
        this.trackEvent('actuator_control_initialized');
    }

    registerActuator(actuatorId, actuatorData) {
        const actuator = {
            id: actuatorId,
            ...actuatorData,
            name: actuatorData.name || actuatorId,
            type: actuatorData.type || 'motor',
            state: actuatorData.state || 'off',
            position: actuatorData.position || 0,
            createdAt: new Date()
        };
        
        this.actuators.set(actuatorId, actuator);
        this.trackEvent('actuator_registered', { actuatorId, type: actuator.type });
        return actuator;
    }

    async control(actuatorId, command) {
        const actuator = this.actuators.get(actuatorId);
        if (!actuator) {
            throw new Error('Actuator not found');
        }
        
        const commandRecord = {
            id: `command_${Date.now()}`,
            actuatorId,
            ...command,
            action: command.action || 'set',
            value: command.value || 0,
            status: 'pending',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.commands.set(commandRecord.id, commandRecord);
        
        await this.executeCommand(actuator, command);
        
        commandRecord.status = 'completed';
        commandRecord.completedAt = new Date();
        this.trackEvent('command_executed', { actuatorId, action: command.action });
        return { command: commandRecord, actuator };
    }

    async executeCommand(actuator, command) {
        if (command.action === 'on') {
            actuator.state = 'on';
        } else if (command.action === 'off') {
            actuator.state = 'off';
        } else if (command.action === 'set') {
            actuator.position = command.value;
        }
        
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    getActuator(actuatorId) {
        return this.actuators.get(actuatorId);
    }

    getCommand(commandId) {
        return this.commands.get(commandId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`actuator_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'actuator_control', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.actuatorControl = new ActuatorControl();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActuatorControl;
}


