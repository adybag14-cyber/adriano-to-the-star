/**
 * Bulkhead Pattern
 * Resource isolation pattern
 */

class BulkheadPattern {
    constructor() {
        this.pools = new Map();
        this.resources = new Map();
        this.init();
    }

    init() {
        this.trackEvent('bulkhead_initialized');
    }

    createPool(poolId, poolData) {
        const pool = {
            id: poolId,
            ...poolData,
            name: poolData.name || poolId,
            maxResources: poolData.maxResources || 10,
            resources: [],
            createdAt: new Date()
        };
        
        this.pools.set(poolId, pool);
        console.log(`Resource pool created: ${poolId}`);
        return pool;
    }

    async acquire(poolId) {
        const pool = this.pools.get(poolId);
        if (!pool) {
            throw new Error('Pool not found');
        }
        
        if (pool.resources.length >= pool.maxResources) {
            throw new Error('Pool is full');
        }
        
        const resource = {
            id: `resource_${Date.now()}`,
            poolId,
            status: 'acquired',
            acquiredAt: new Date(),
            createdAt: new Date()
        };
        
        this.resources.set(resource.id, resource);
        pool.resources.push(resource.id);
        
        return resource;
    }

    release(resourceId) {
        const resource = this.resources.get(resourceId);
        if (!resource) {
            throw new Error('Resource not found');
        }
        
        const pool = this.pools.get(resource.poolId);
        if (pool) {
            const index = pool.resources.indexOf(resourceId);
            if (index > -1) {
                pool.resources.splice(index, 1);
            }
        }
        
        resource.status = 'released';
        resource.releasedAt = new Date();
        
        return resource;
    }

    getPool(poolId) {
        return this.pools.get(poolId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bulkhead_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.bulkheadPattern = new BulkheadPattern();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BulkheadPattern;
}

