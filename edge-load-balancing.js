/**
 * Edge Load Balancing
 * Edge device load balancing
 */

class EdgeLoadBalancing {
    constructor() {
        this.balancers = new Map();
        this.backends = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_load_bal_initialized');
    }

    createBalancer(balancerId, balancerData) {
        const balancer = {
            id: balancerId,
            ...balancerData,
            name: balancerData.name || balancerId,
            algorithm: balancerData.algorithm || 'round_robin',
            backends: [],
            healthChecks: balancerData.healthChecks || true,
            createdAt: new Date()
        };
        
        this.balancers.set(balancerId, balancer);
        console.log(`Load balancer created: ${balancerId}`);
        return balancer;
    }

    registerBackend(balancerId, backendId, backendData) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer) {
            throw new Error('Balancer not found');
        }
        
        const backend = {
            id: backendId,
            balancerId,
            ...backendData,
            address: backendData.address || '',
            weight: backendData.weight || 1,
            health: 'healthy',
            createdAt: new Date()
        };
        
        this.backends.set(backendId, backend);
        balancer.backends.push(backendId);
        
        return backend;
    }

    async routeRequest(balancerId, request) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer) {
            throw new Error('Balancer not found');
        }
        
        const healthyBackends = balancer.backends
            .map(id => this.backends.get(id))
            .filter(b => b && b.health === 'healthy');
        
        if (healthyBackends.length === 0) {
            throw new Error('No healthy backends available');
        }
        
        const selectedBackend = this.selectBackend(healthyBackends, balancer.algorithm);
        
        return {
            balancerId,
            backend: selectedBackend,
            request,
            routedAt: new Date()
        };
    }

    selectBackend(backends, algorithm) {
        if (algorithm === 'round_robin') {
            return backends[Math.floor(Math.random() * backends.length)];
        } else if (algorithm === 'least_connections') {
            return backends[0];
        } else if (algorithm === 'weighted') {
            const totalWeight = backends.reduce((sum, b) => sum + b.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const backend of backends) {
                random -= backend.weight;
                if (random <= 0) {
                    return backend;
                }
            }
        }
        
        return backends[0];
    }

    getBalancer(balancerId) {
        return this.balancers.get(balancerId);
    }

    getBackend(backendId) {
        return this.backends.get(backendId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_load_bal_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.edgeLoadBalancing = new EdgeLoadBalancing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdgeLoadBalancing;
}


