/**
 * Business Process Management
 * Business process management system
 */

class BusinessProcessManagement {
    constructor() {
        this.processes = new Map();
        this.instances = new Map();
        this.init();
    }

    init() {
        this.trackEvent('bpm_initialized');
    }

    createProcess(processId, processData) {
        const process = {
            id: processId,
            ...processData,
            name: processData.name || processId,
            steps: processData.steps || [],
            status: 'draft',
            createdAt: new Date()
        };
        
        this.processes.set(processId, process);
        console.log(`Business process created: ${processId}`);
        return process;
    }

    async startInstance(processId, instanceData) {
        const process = this.processes.get(processId);
        if (!process) {
            throw new Error('Process not found');
        }
        
        const instance = {
            id: `instance_${Date.now()}`,
            processId,
            ...instanceData,
            status: 'running',
            currentStep: 0,
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.instances.set(instance.id, instance);
        
        return instance;
    }

    async executeStep(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            throw new Error('Instance not found');
        }
        
        const process = this.processes.get(instance.processId);
        if (!process) {
            throw new Error('Process not found');
        }
        
        if (instance.currentStep >= process.steps.length) {
            instance.status = 'completed';
            instance.completedAt = new Date();
            return instance;
        }
        
        const step = process.steps[instance.currentStep];
        instance.currentStep++;
        
        return instance;
    }

    getProcess(processId) {
        return this.processes.get(processId);
    }

    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bpm_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.businessProcessManagement = new BusinessProcessManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessProcessManagement;
}

