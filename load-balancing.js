/**
 * Load Balancing
 * @class LoadBalancing
 * @description Manages load balancing across multiple servers.
 */
class LoadBalancing {
    constructor() {
        this.balancers = new Map();
        this.backends = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_oa_db_al_an_ci_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_oa_db_al_an_ci_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create load balancer.
     * @param {string} balancerId - Balancer identifier.
     * @param {object} balancerData - Balancer data.
     */
    createLoadBalancer(balancerId, balancerData) {
        this.balancers.set(balancerId, {
            ...balancerData,
            id: balancerId,
            algorithm: balancerData.algorithm || 'round-robin', // round-robin, least-connections, ip-hash
            backends: [],
            status: 'active',
            createdAt: new Date()
        });
        console.log(`Load balancer created: ${balancerId}`);
    }

    /**
     * Add backend server.
     * @param {string} balancerId - Balancer identifier.
     * @param {string} backendId - Backend identifier.
     * @param {object} backendData - Backend data.
     */
    addBackend(balancerId, backendId, backendData) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer) {
            throw new Error(`Load balancer not found: ${balancerId}`);
        }

        this.backends.set(backendId, {
            ...backendData,
            id: backendId,
            url: backendData.url,
            weight: backendData.weight || 1,
            health: 'healthy'
        });

        balancer.backends.push(backendId);
        console.log(`Backend added to load balancer: ${backendId}`);
    }

    /**
     * Select backend for request.
     * @param {string} balancerId - Balancer identifier.
     * @returns {string} Backend URL.
     */
    selectBackend(balancerId) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer || balancer.backends.length === 0) {
            throw new Error('No backends available');
        }

        // Simple round-robin selection
        const backendId = balancer.backends[0];
        const backend = this.backends.get(backendId);
        return backend.url;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.loadBalancing = new LoadBalancing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadBalancing;
}

