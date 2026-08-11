/**
 * Resource Allocation
 * Dynamic resource allocation and management
 */

class ResourceAllocation {
    constructor() {
        this.allocations = new Map();
        this.resources = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_es_ou_rc_ea_ll_oc_at_io_n_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_es_ou_rc_ea_ll_oc_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerResource(resourceId, resourceData) {
        const resource = {
            id: resourceId,
            ...resourceData,
            name: resourceData.name || resourceId,
            type: resourceData.type || 'compute',
            total: resourceData.total || 0,
            allocated: 0,
            available: resourceData.total || 0,
            createdAt: new Date()
        };
        
        this.resources.set(resourceId, resource);
        console.log(`Resource registered: ${resourceId}`);
        return resource;
    }

    allocateResource(resourceId, amount, requestId) {
        const resource = this.resources.get(resourceId);
        if (!resource) {
            throw new Error('Resource not found');
        }
        
        if (amount > resource.available) {
            throw new Error('Insufficient resources available');
        }
        
        resource.allocated += amount;
        resource.available -= amount;
        
        const allocation = {
            id: `allocation_${Date.now()}`,
            resourceId,
            requestId,
            amount,
            allocatedAt: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.allocations.set(allocation.id, allocation);
        
        return allocation;
    }

    deallocateResource(allocationId) {
        const allocation = this.allocations.get(allocationId);
        if (!allocation) {
            throw new Error('Allocation not found');
        }
        
        const resource = this.resources.get(allocation.resourceId);
        if (resource) {
            resource.allocated -= allocation.amount;
            resource.available += allocation.amount;
        }
        
        allocation.status = 'released';
        allocation.releasedAt = new Date();
        
        return allocation;
    }

    getResource(resourceId) {
        return this.resources.get(resourceId);
    }

    getAllocations(resourceId = null) {
        if (resourceId) {
            return Array.from(this.allocations.values())
                .filter(a => a.resourceId === resourceId && a.status === 'active');
        }
        return Array.from(this.allocations.values())
            .filter(a => a.status === 'active');
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.resourceAllocation = new ResourceAllocation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceAllocation;
}


