/**
 * API Circuit Breaker Advanced
 * Advanced API circuit breaker system
 */

class APICircuitBreakerAdvanced {
    constructor() {
        this.breakers = new Map();
        this.states = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_circuit_breaker_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_circuit_breaker_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createBreaker(breakerId, breakerData) {
        const breaker = {
            id: breakerId,
            ...breakerData,
            name: breakerData.name || breakerId,
            threshold: breakerData.threshold || 5,
            timeout: breakerData.timeout || 60000,
            state: 'closed',
            status: 'active',
            createdAt: new Date()
        };
        
        this.breakers.set(breakerId, breaker);
        this.states.set(breakerId, 'closed');
        return breaker;
    }

    async call(breakerId, request) {
        const breaker = this.breakers.get(breakerId);
        if (!breaker) {
            throw new Error(`Breaker ${breakerId} not found`);
        }

        const state = this.states.get(breakerId);
        
        if (state === 'open') {
            return {
                breakerId,
                request,
                allowed: false,
                reason: 'circuit_open',
                timestamp: new Date()
            };
        }

        const req = {
            id: `req_${Date.now()}`,
            breakerId,
            request,
            timestamp: new Date()
        };

        this.requests.set(req.id, req);
        
        const success = Math.random() > 0.2;
        if (!success) {
            await this.recordFailure(breaker);
        }

        return {
            breakerId,
            request,
            allowed: true,
            success,
            timestamp: new Date()
        };
    }

    async recordFailure(breaker) {
        const failures = Array.from(this.requests.values())
            .filter(r => r.breakerId === breaker.id && !r.success).length;

        if (failures >= breaker.threshold) {
            this.states.set(breaker.id, 'open');
            setTimeout(() => {
                this.states.set(breaker.id, 'half-open');
            }, breaker.timeout);
        }
    }

    getBreaker(breakerId) {
        return this.breakers.get(breakerId);
    }

    getAllBreakers() {
        return Array.from(this.breakers.values());
    }
}

module.exports = APICircuitBreakerAdvanced;

