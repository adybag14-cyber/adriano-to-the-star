/**
 * Change Management
 * Change management system
 */

class ChangeManagement {
    constructor() {
        this.changes = new Map();
        this.requests = new Map();
        this.approvals = new Map();
        this.init();
    }

    init() {
        this.trackEvent('change_mgmt_initialized');
    }

    createRequest(requestId, requestData) {
        const request = {
            id: requestId,
            ...requestData,
            name: requestData.name || requestId,
            type: requestData.type || 'standard',
            status: 'submitted',
            priority: requestData.priority || 'medium',
            submittedAt: new Date(),
            createdAt: new Date()
        };
        
        this.requests.set(requestId, request);
        console.log(`Change request created: ${requestId}`);
        return request;
    }

    createChange(requestId, changeId, changeData) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        const change = {
            id: changeId,
            requestId,
            ...changeData,
            name: changeData.name || changeId,
            status: 'planned',
            createdAt: new Date()
        };
        
        this.changes.set(changeId, change);
        request.changeId = changeId;
        
        return change;
    }

    async approve(requestId, approverId) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        const approval = {
            id: `approval_${Date.now()}`,
            requestId,
            approverId,
            status: 'approved',
            approvedAt: new Date(),
            createdAt: new Date()
        };
        
        this.approvals.set(approval.id, approval);
        
        request.status = 'approved';
        request.approvedAt = new Date();
        
        return { request, approval };
    }

    getRequest(requestId) {
        return this.requests.get(requestId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`change_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.changeManagement = new ChangeManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChangeManagement;
}

