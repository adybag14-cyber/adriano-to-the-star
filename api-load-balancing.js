/**
 * API Load Balancing
 * Load balancing for API requests across multiple endpoints
 */

class APILoadBalancing {
    constructor() {
        this.balancers = new Map();
        this.endpoints = new Map();
        this.init();
    }

    init() {
        this.trackEvent('load_balancing_initialized');
    }

    createBalancer(balancerId, strategy) {
        const balancer = {
            id: balancerId,
            strategy, // round-robin, least-connections, weighted, ip-hash
            endpoints: [],
            currentIndex: 0,
            stats: {
                totalRequests: 0,
                requestsByEndpoint: {}
            },
            createdAt: new Date()
        };
        
        this.balancers.set(balancerId, balancer);
        this.trackEvent('balancer_created', { balancerId, strategy });
        return balancer;
    }

    addEndpoint(balancerId, endpointId, url, weight = 1, healthCheck = true) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer) {
            throw new Error('Balancer does not exist');
        }
        
        const endpoint = {
            id: endpointId,
            url,
            weight,
            healthCheck,
            healthy: true,
            connections: 0,
            responseTime: 0,
            createdAt: new Date()
        };
        
        balancer.endpoints.push(endpoint);
        this.endpoints.set(endpointId, endpoint);
        console.log(`Endpoint added to balancer: ${endpointId}`);
    }

    selectEndpoint(balancerId) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer) {
            throw new Error('Balancer does not exist');
        }
        
        const healthyEndpoints = balancer.endpoints.filter(e => e.healthy);
        if (healthyEndpoints.length === 0) {
            throw new Error('No healthy endpoints available');
        }
        
        let selected;
        
        switch (balancer.strategy) {
            case 'round-robin':
                selected = this.roundRobin(balancer, healthyEndpoints);
                break;
            case 'least-connections':
                selected = this.leastConnections(healthyEndpoints);
                break;
            case 'weighted':
                selected = this.weighted(healthyEndpoints);
                break;
            case 'ip-hash':
                selected = this.ipHash(healthyEndpoints);
                break;
            default:
                selected = healthyEndpoints[0];
        }
        
        balancer.stats.totalRequests++;
        balancer.stats.requestsByEndpoint[selected.id] = 
            (balancer.stats.requestsByEndpoint[selected.id] || 0) + 1;
        
        return selected;
    }

    roundRobin(balancer, endpoints) {
        const selected = endpoints[balancer.currentIndex % endpoints.length];
        balancer.currentIndex++;
        return selected;
    }

    leastConnections(endpoints) {
        return endpoints.reduce((min, endpoint) => 
            endpoint.connections < min.connections ? endpoint : min
        );
    }

    weighted(endpoints) {
        const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const endpoint of endpoints) {
            random -= endpoint.weight;
            if (random <= 0) {
                return endpoint;
            }
        }
        
        return endpoints[0];
    }

    ipHash(endpoints) {
        // Simple hash-based selection
        const hash = Math.abs(this.hashCode(this.getClientIP()));
        return endpoints[hash % endpoints.length];
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return hash;
    }

    getClientIP() {
        // Mock client IP
        return '192.168.1.1';
    }

    updateEndpointHealth(endpointId, healthy) {
        const endpoint = this.endpoints.get(endpointId);
        if (endpoint) {
            endpoint.healthy = healthy;
            console.log(`Endpoint ${endpointId} health updated: ${healthy}`);
        }
    }

    getBalancerStats(balancerId) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer) {
            throw new Error('Balancer does not exist');
        }
        
        return {
            id: balancer.id,
            strategy: balancer.strategy,
            totalEndpoints: balancer.endpoints.length,
            healthyEndpoints: balancer.endpoints.filter(e => e.healthy).length,
            stats: balancer.stats
        };
    }

    getBalancer(balancerId) {
        return this.balancers.get(balancerId);
    }

    getAllBalancers() {
        return Array.from(this.balancers.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`load_balancing_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_load_balancing', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiLoadBalancing = new APILoadBalancing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APILoadBalancing;
}

