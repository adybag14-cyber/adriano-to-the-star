/**
 * Load Balancing (Cloud)
 * Cloud load balancing
 */

class LoadBalancingCloud {
    constructor() {
        this.balancers = new Map();
        this.targets = new Map();
        this.init();
    }

    init() {
        console.log('Load Balancing (Cloud) initialized.');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_oa_db_al_an_ci_ng_cl_ou_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createBalancer(balancerId, balancerData) {
        const balancer = {
            id: balancerId,
            ...balancerData,
            name: balancerData.name || balancerId,
            type: balancerData.type || 'application',
            algorithm: balancerData.algorithm || 'round_robin',
            targets: [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.balancers.set(balancerId, balancer);
        console.log(`Load balancer created: ${balancerId}`);
        return balancer;
    }

    registerTarget(balancerId, targetId, targetData) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer) {
            throw new Error('Balancer not found');
        }
        
        const target = {
            id: targetId,
            balancerId,
            ...targetData,
            address: targetData.address || 'localhost',
            port: targetData.port || 8080,
            weight: targetData.weight || 1,
            health: 'healthy',
            createdAt: new Date()
        };
        
        this.targets.set(targetId, target);
        balancer.targets.push(targetId);
        
        return target;
    }

    async routeRequest(balancerId, request) {
        const balancer = this.balancers.get(balancerId);
        if (!balancer) {
            throw new Error('Balancer not found');
        }
        
        const healthyTargets = balancer.targets
            .map(id => this.targets.get(id))
            .filter(t => t && t.health === 'healthy');
        
        if (healthyTargets.length === 0) {
            throw new Error('No healthy targets available');
        }
        
        const selectedTarget = this.selectTarget(healthyTargets, balancer.algorithm);
        
        return {
            balancerId,
            target: selectedTarget,
            request,
            routedAt: new Date()
        };
    }

    selectTarget(targets, algorithm) {
        if (algorithm === 'round_robin') {
            return targets[Math.floor(Math.random() * targets.length)];
        } else if (algorithm === 'least_connections') {
            return targets[0];
        } else if (algorithm === 'weighted') {
            const totalWeight = targets.reduce((sum, t) => sum + t.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const target of targets) {
                random -= target.weight;
                if (random <= 0) {
                    return target;
                }
            }
        }
        
        return targets[0];
    }

    getBalancer(balancerId) {
        return this.balancers.get(balancerId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.loadBalancingCloud = new LoadBalancingCloud();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadBalancingCloud;
}

