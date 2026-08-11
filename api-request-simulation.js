/**
 * API Request Simulation
 * Simulate API requests for testing
 */

class APIRequestSimulation {
    constructor() {
        this.simulations = new Map();
        this.scenarios = new Map();
        this.init();
    }

    init() {
        this.trackEvent('simulation_initialized');
    }

    createScenario(scenarioId, name, requests) {
        this.scenarios.set(scenarioId, {
            id: scenarioId,
            name,
            requests,
            createdAt: new Date()
        });
        console.log(`Scenario created: ${scenarioId}`);
    }

    createSimulation(simulationId, scenarioId, config) {
        const simulation = {
            id: simulationId,
            scenarioId,
            duration: config.duration || 60000, // 1 minute default
            rate: config.rate || 10, // requests per second
            rampUp: config.rampUp || 0, // ramp up time in ms
            status: 'pending',
            createdAt: new Date()
        };
        
        this.simulations.set(simulationId, simulation);
        console.log(`Simulation created: ${simulationId}`);
        return simulation;
    }

    async runSimulation(simulationId) {
        const simulation = this.simulations.get(simulationId);
        if (!simulation) {
            throw new Error('Simulation does not exist');
        }
        
        const scenario = this.scenarios.get(simulation.scenarioId);
        if (!scenario) {
            throw new Error('Scenario does not exist');
        }
        
        simulation.status = 'running';
        const results = [];
        const startTime = Date.now();
        const endTime = startTime + simulation.duration;
        
        let currentRate = 0;
        const targetRate = simulation.rate;
        const rampUpStep = simulation.rampUp > 0 ? targetRate / (simulation.rampUp / 1000) : targetRate;
        
        while (Date.now() < endTime) {
            const elapsed = Date.now() - startTime;
            
            // Calculate current rate with ramp up
            if (simulation.rampUp > 0 && elapsed < simulation.rampUp) {
                currentRate = Math.min(targetRate, (elapsed / simulation.rampUp) * targetRate);
            } else {
                currentRate = targetRate;
            }
            
            const interval = 1000 / currentRate;
            const batchSize = Math.ceil(currentRate / 10);
            
            for (let i = 0; i < batchSize && Date.now() < endTime; i++) {
                const request = scenario.requests[Math.floor(Math.random() * scenario.requests.length)];
                const result = await this.executeSimulatedRequest(request);
                results.push(result);
            }
            
            await this.sleep(interval);
        }
        
        simulation.status = 'completed';
        simulation.results = results;
        simulation.completedAt = new Date();
        
        console.log(`Simulation completed: ${simulationId}`);
        return results;
    }

    async executeSimulatedRequest(request) {
        const startTime = Date.now();
        try {
            // Simulate request
            await this.sleep(Math.random() * 100 + 50);
            const duration = Date.now() - startTime;
            
            return {
                success: Math.random() > 0.1, // 90% success rate
                duration,
                endpoint: request.endpoint,
                method: request.method,
                timestamp: new Date()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                endpoint: request.endpoint,
                method: request.method,
                timestamp: new Date()
            };
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getSimulation(simulationId) {
        return this.simulations.get(simulationId);
    }

    getScenario(scenarioId) {
        return this.scenarios.get(scenarioId);
    }

    getAllSimulations() {
        return Array.from(this.simulations.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`simulation_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestSimulation = new APIRequestSimulation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestSimulation;
}

