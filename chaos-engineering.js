/**
 * Chaos Engineering
 * Chaos engineering experiments
 */

class ChaosEngineering {
    constructor() {
        this.experiments = new Map();
        this.faults = new Map();
        this.init();
    }

    init() {
        this.trackEvent('chaos_eng_initialized');
    }

    createExperiment(experimentId, experimentData) {
        const experiment = {
            id: experimentId,
            ...experimentData,
            name: experimentData.name || experimentId,
            type: experimentData.type || 'latency',
            target: experimentData.target || '',
            duration: experimentData.duration || 60,
            status: 'pending',
            createdAt: new Date()
        };
        
        this.experiments.set(experimentId, experiment);
        console.log(`Chaos experiment created: ${experimentId}`);
        return experiment;
    }

    async run(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error('Experiment not found');
        }
        
        experiment.status = 'running';
        experiment.startedAt = new Date();
        
        const fault = {
            id: `fault_${Date.now()}`,
            experimentId,
            type: experiment.type,
            target: experiment.target,
            status: 'active',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.faults.set(fault.id, fault);
        
        await this.simulateFault(experiment);
        
        fault.status = 'completed';
        fault.completedAt = new Date();
        
        experiment.status = 'completed';
        experiment.completedAt = new Date();
        
        return { experiment, fault };
    }

    async simulateFault(experiment) {
        return new Promise(resolve => setTimeout(resolve, experiment.duration * 1000));
    }

    stop(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error('Experiment not found');
        }
        
        experiment.status = 'stopped';
        experiment.stoppedAt = new Date();
        
        const activeFaults = Array.from(this.faults.values())
            .filter(f => f.experimentId === experimentId && f.status === 'active');
        
        activeFaults.forEach(fault => {
            fault.status = 'stopped';
            fault.stoppedAt = new Date();
        });
        
        return experiment;
    }

    getExperiment(experimentId) {
        return this.experiments.get(experimentId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`chaos_eng_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.chaosEngineering = new ChaosEngineering();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChaosEngineering;
}

