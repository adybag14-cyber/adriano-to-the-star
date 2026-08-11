/**
 * API Circuit Breaker
 * Circuit breaker pattern for API resilience
 */

class APICircuitBreaker {
    constructor() {
        this.circuits = new Map();
        this.init();
    }

    init() {
        this.trackEvent('circuit_breaker_initialized');
    }

    createCircuit(circuitId, config) {
        const circuit = {
            id: circuitId,
            failureThreshold: config.failureThreshold || 5,
            timeout: config.timeout || 60000, // 1 minute
            halfOpenTimeout: config.halfOpenTimeout || 30000, // 30 seconds
            state: 'closed', // closed, open, half-open
            failureCount: 0,
            lastFailureTime: null,
            successCount: 0,
            stats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                rejectedRequests: 0
            },
            createdAt: new Date()
        };
        
        this.circuits.set(circuitId, circuit);
        this.trackEvent('circuit_created', { circuitId });
        return circuit;
    }

    async execute(circuitId, fn) {
        const circuit = this.circuits.get(circuitId);
        if (!circuit) {
            throw new Error('Circuit does not exist');
        }
        
        circuit.stats.totalRequests++;
        
        if (circuit.state === 'open') {
            // Check if timeout has passed
            if (Date.now() - circuit.lastFailureTime >= circuit.timeout) {
                circuit.state = 'half-open';
                circuit.successCount = 0;
                console.log(`Circuit ${circuitId} moved to half-open state`);
            } else {
                circuit.stats.rejectedRequests++;
                throw new Error('Circuit breaker is open');
            }
        }
        
        try {
            const result = await fn();
            this.onSuccess(circuit);
            return result;
        } catch (error) {
            this.onFailure(circuit);
            throw error;
        }
    }

    onSuccess(circuit) {
        circuit.stats.successfulRequests++;
        
        if (circuit.state === 'half-open') {
            circuit.successCount++;
            if (circuit.successCount >= 2) {
                circuit.state = 'closed';
                circuit.failureCount = 0;
                console.log(`Circuit ${circuit.id} closed after successful recovery`);
            }
        } else {
            circuit.failureCount = 0;
        }
    }

    onFailure(circuit) {
        circuit.failureCount++;
        circuit.stats.failedRequests++;
        circuit.lastFailureTime = Date.now();
        
        if (circuit.failureCount >= circuit.failureThreshold) {
            circuit.state = 'open';
            console.log(`Circuit ${circuit.id} opened due to failures`);
        }
    }

    getCircuitState(circuitId) {
        const circuit = this.circuits.get(circuitId);
        if (!circuit) {
            throw new Error('Circuit does not exist');
        }
        
        return {
            id: circuit.id,
            state: circuit.state,
            failureCount: circuit.failureCount,
            stats: circuit.stats
        };
    }

    resetCircuit(circuitId) {
        const circuit = this.circuits.get(circuitId);
        if (!circuit) {
            throw new Error('Circuit does not exist');
        }
        
        circuit.state = 'closed';
        circuit.failureCount = 0;
        circuit.successCount = 0;
        circuit.lastFailureTime = null;
        
        console.log(`Circuit ${circuitId} reset`);
    }

    getAllCircuits() {
        return Array.from(this.circuits.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`circuit_breaker_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_circuit_breaker', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiCircuitBreaker = new APICircuitBreaker();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APICircuitBreaker;
}

