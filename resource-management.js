/**
 * Resource Management
 * Resource management system
 */

class ResourceManagement {
    constructor() {
        this.resources = new Map();
        this.allocations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_es_ou_rc_em_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_es_ou_rc_em_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerResource(resourceId, resourceData) {
        const resource = {
            id: resourceId,
            ...resourceData,
            name: resourceData.name || resourceId,
            type: resourceData.type || 'human',
            capacity: resourceData.capacity || 100,
            available: resourceData.capacity || 100,
            status: 'available',
            createdAt: new Date()
        };
        
        this.resources.set(resourceId, resource);
        console.log(`Resource registered: ${resourceId}`);
        return resource;
    }

    allocate(resourceId, allocationId, allocationData) {
        const resource = this.resources.get(resourceId);
        if (!resource) {
            throw new Error('Resource not found');
        }
        
        if (resource.available < allocationData.amount) {
            throw new Error('Insufficient resource capacity');
        }
        
        const allocation = {
            id: allocationId,
            resourceId,
            ...allocationData,
            amount: allocationData.amount || 0,
            projectId: allocationData.projectId || null,
            startDate: allocationData.startDate || new Date(),
            endDate: allocationData.endDate || null,
            status: 'active',
            createdAt: new Date()
        };
        
        this.allocations.set(allocationId, allocation);
        
        resource.available -= allocation.amount;
        if (resource.available === 0) {
            resource.status = 'allocated';
        }
        
        return { resource, allocation };
    }

    release(allocationId) {
        const allocation = this.allocations.get(allocationId);
        if (!allocation) {
            throw new Error('Allocation not found');
        }
        
        const resource = this.resources.get(allocation.resourceId);
        if (resource) {
            resource.available += allocation.amount;
            resource.status = 'available';
        }
        
        allocation.status = 'released';
        allocation.releasedAt = new Date();
        
        return allocation;
    }

    getResource(resourceId) {
        return this.resources.get(resourceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.resourceManagement = new ResourceManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceManagement;
}

