/**
 * Leave Management
 * Leave management system
 */

class LeaveManagement {
    constructor() {
        this.leaves = new Map();
        this.requests = new Map();
        this.balances = new Map();
        this.init();
    }

    init() {
        this.trackEvent('leave_mgmt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`leave_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createRequest(requestId, requestData) {
        const request = {
            id: requestId,
            ...requestData,
            userId: requestData.userId || '',
            type: requestData.type || 'vacation',
            startDate: requestData.startDate || new Date(),
            endDate: requestData.endDate || new Date(),
            status: 'pending',
            createdAt: new Date()
        };
        
        this.requests.set(requestId, request);
        return request;
    }

    async approve(requestId) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error(`Request ${requestId} not found`);
        }

        request.status = 'approved';
        request.approvedAt = new Date();
        return request;
    }

    getRequest(requestId) {
        return this.requests.get(requestId);
    }

    getAllRequests() {
        return Array.from(this.requests.values());
    }
}

module.exports = LeaveManagement;

