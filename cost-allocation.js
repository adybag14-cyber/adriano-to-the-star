/**
 * Cost Allocation
 * Cost allocation system
 */

class CostAllocation {
    constructor() {
        this.allocations = new Map();
        this.costs = new Map();
        this.accounts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cost_allocation_initialized');
    }

    async allocate(allocationId, allocationData) {
        const allocation = {
            id: allocationId,
            ...allocationData,
            accountId: allocationData.accountId || '',
            amount: allocationData.amount || 0,
            method: allocationData.method || 'proportional',
            status: 'allocated',
            createdAt: new Date()
        };
        
        this.allocations.set(allocationId, allocation);
        return allocation;
    }

    async getCosts(accountId, timeRange) {
        const accountCosts = Array.from(this.allocations.values())
            .filter(a => a.accountId === accountId);

        return {
            accountId,
            timeRange,
            total: accountCosts.reduce((sum, a) => sum + a.amount, 0),
            breakdown: accountCosts,
            timestamp: new Date()
        };
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
                window.performanceMonitoring.recordMetric(`cost_allocation_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = CostAllocation;

