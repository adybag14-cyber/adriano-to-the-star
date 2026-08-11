/**
 * API Request Prioritization
 * Priority-based request handling
 */

class APIRequestPrioritization {
    constructor() {
        this.priorityQueues = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };
        this.priorityOrder = ['critical', 'high', 'medium', 'low'];
        this.init();
    }

    init() {
        this.trackEvent('prioritization_initialized');
    }

    addRequest(request, priority = 'medium') {
        if (!this.priorityQueues[priority]) {
            priority = 'medium';
        }
        
        const requestItem = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            request,
            priority,
            addedAt: new Date(),
            status: 'queued'
        };
        
        this.priorityQueues[priority].push(requestItem);
        console.log(`Request added with priority ${priority}: ${requestItem.id}`);
        return requestItem.id;
    }

    getNextRequest() {
        for (const priority of this.priorityOrder) {
            if (this.priorityQueues[priority].length > 0) {
                return this.priorityQueues[priority].shift();
            }
        }
        return null;
    }

    getAllRequests() {
        const all = [];
        for (const priority of this.priorityOrder) {
            all.push(...this.priorityQueues[priority]);
        }
        return all;
    }

    getQueueStats() {
        return {
            critical: this.priorityQueues.critical.length,
            high: this.priorityQueues.high.length,
            medium: this.priorityQueues.medium.length,
            low: this.priorityQueues.low.length,
            total: this.getAllRequests().length
        };
    }

    clearQueue(priority = null) {
        if (priority) {
            this.priorityQueues[priority] = [];
            console.log(`Queue cleared for priority: ${priority}`);
        } else {
            for (const priority in this.priorityQueues) {
                this.priorityQueues[priority] = [];
            }
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`prioritization_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestPrioritization = new APIRequestPrioritization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestPrioritization;
}

