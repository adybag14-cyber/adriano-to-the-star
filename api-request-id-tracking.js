/**
 * API Request ID Tracking
 * Track and correlate API requests with unique IDs
 */

class APIRequestIDTracking {
    constructor() {
        this.requests = new Map();
        this.correlations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('id_tracking_initialized');
    }

    generateRequestId(prefix = 'req') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    trackRequest(requestId, request) {
        this.requests.set(requestId, {
            id: requestId,
            method: request.method,
            path: request.path,
            headers: request.headers,
            query: request.query,
            body: request.body,
            timestamp: new Date(),
            status: 'pending'
        });
        console.log(`Request tracked: ${requestId}`);
        return requestId;
    }

    updateRequest(requestId, updates) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        Object.assign(request, updates);
        console.log(`Request updated: ${requestId}`);
    }

    completeRequest(requestId, response, duration) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        request.status = 'completed';
        request.response = response;
        request.duration = duration;
        request.completedAt = new Date();
        
        console.log(`Request completed: ${requestId}`);
    }

    correlateRequests(parentRequestId, childRequestId) {
        const correlations = this.correlations.get(parentRequestId) || [];
        if (!correlations.includes(childRequestId)) {
            correlations.push(childRequestId);
            this.correlations.set(parentRequestId, correlations);
            console.log(`Requests correlated: ${parentRequestId} -> ${childRequestId}`);
        }
    }

    getRequest(requestId) {
        return this.requests.get(requestId);
    }

    getCorrelatedRequests(requestId) {
        return this.correlations.get(requestId) || [];
    }

    getRequestChain(requestId) {
        const chain = [requestId];
        const correlated = this.getCorrelatedRequests(requestId);
        
        correlated.forEach(childId => {
            chain.push(...this.getRequestChain(childId));
        });
        
        return chain;
    }

    searchRequests(filters) {
        let requests = Array.from(this.requests.values());
        
        if (filters.method) {
            requests = requests.filter(r => r.method === filters.method);
        }
        
        if (filters.path) {
            requests = requests.filter(r => r.path.includes(filters.path));
        }
        
        if (filters.status) {
            requests = requests.filter(r => r.status === filters.status);
        }
        
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            requests = requests.filter(r => new Date(r.timestamp) >= start);
        }
        
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            requests = requests.filter(r => new Date(r.timestamp) <= end);
        }
        
        return requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getRequestStats() {
        const requests = Array.from(this.requests.values());
        const total = requests.length;
        const byStatus = {};
        const byMethod = {};
        
        requests.forEach(request => {
            byStatus[request.status] = (byStatus[request.status] || 0) + 1;
            byMethod[request.method] = (byMethod[request.method] || 0) + 1;
        });
        
        return {
            total,
            byStatus,
            byMethod
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`id_tracking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestIDTracking = new APIRequestIDTracking();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestIDTracking;
}

