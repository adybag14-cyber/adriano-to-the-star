/**
 * Request Prioritization v2
 * Advanced request prioritization
 */

class RequestPrioritizationV2 {
    constructor() {
        this.priorities = new Map();
        this.queue = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Request Prioritization v2 initialized' };
    }

    prioritizeRequest(requestId, priority) {
        if (!['low', 'normal', 'high', 'critical'].includes(priority)) {
            throw new Error('Invalid priority level');
        }
        const prioritized = {
            id: Date.now().toString(),
            requestId,
            priority,
            prioritizedAt: new Date()
        };
        this.priorities.set(prioritized.id, prioritized);
        this.queue.push(prioritized);
        this.queue.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        return prioritized;
    }

    getNextRequest() {
        return this.queue.shift() || null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RequestPrioritizationV2;
}

