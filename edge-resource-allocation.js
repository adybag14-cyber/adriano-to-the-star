/**
 * Edge Resource Allocation
 * Edge device resource allocation system
 */

class EdgeResourceAllocation {
    constructor() {
        this.allocations = new Map();
        this.devices = new Map();
        this.resources = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_resource_alloc_initialized');
    }

    async allocate(deviceId, resourceData) {
        const allocation = {
            id: `alloc_${Date.now()}`,
            deviceId,
            ...resourceData,
            cpu: resourceData.cpu || 0,
            memory: resourceData.memory || 0,
            storage: resourceData.storage || 0,
            status: 'allocated',
            createdAt: new Date()
        };

        this.allocations.set(allocation.id, allocation);
        return allocation;
    }

    async deallocate(allocationId) {
        const allocation = this.allocations.get(allocationId);
        if (!allocation) {
            throw new Error(`Allocation ${allocationId} not found`);
        }

        allocation.status = 'deallocated';
        allocation.deallocatedAt = new Date();
        return allocation;
    }

    getAllocation(allocationId) {
        return this.allocations.get(allocationId);
    }

    getAllAllocations() {
        return Array.from(this.allocations.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_resource_alloc_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = EdgeResourceAllocation;

