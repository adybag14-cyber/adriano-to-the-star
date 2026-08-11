/**
 * Circuit Breaker Pattern
 * Circuit breaker implementation
 */

class CircuitBreakerPattern {
    constructor() {
        this.breakers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('circuit_breaker_initialized');
    }

    createBreaker(breakerId, breakerData) {
        const breaker = {
            id: breakerId,
            ...breakerData,
            name: breakerData.name || breakerId,
            failureThreshold: breakerData.failureThreshold || 5,
            timeout: breakerData.timeout || 60000,
            state: 'closed',
            failures: 0,
            lastFailureTime: null,
            createdAt: new Date()
        };
        
        this.breakers.set(breakerId, breaker);
        console.log(`Circuit breaker created: ${breakerId}`);
        return breaker;
    }

    async execute(breakerId, operation) {
        const breaker = this.breakers.get(breakerId);
        if (!breaker) {
            throw new Error('Circuit breaker not found');
        }
        
        if (breaker.state === 'open') {
            if (Date.now() - breaker.lastFailureTime > breaker.timeout) {
                breaker.state = 'half-open';
                breaker.failures = 0;
            } else {
                throw new Error('Circuit breaker is open');
            }
        }
        
        try {
            const result = await operation();
            
            if (breaker.state === 'half-open') {
                breaker.state = 'closed';
                breaker.failures = 0;
            }
            
            return result;
        } catch (error) {
            breaker.failures++;
            breaker.lastFailureTime = Date.now();
            
            if (breaker.failures >= breaker.failureThreshold) {
                breaker.state = 'open';
            }
            
            throw error;
        }
    }

    getBreaker(breakerId) {
        return this.breakers.get(breakerId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`circuit_breaker_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.circuitBreakerPattern = new CircuitBreakerPattern();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitBreakerPattern;
}

