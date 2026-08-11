/**
 * API Request Queuing
 * Queue management for API requests
 */

class APIRequestQueuing {
    constructor() {
        this.queues = new Map();
        this.queueConfigs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('queuing_initialized');
    }

    createQueue(queueId, config) {
        const queue = {
            id: queueId,
            maxSize: config.maxSize || 1000,
            concurrency: config.concurrency || 5,
            priority: config.priority || false,
            items: [],
            processing: [],
            stats: {
                totalEnqueued: 0,
                totalProcessed: 0,
                totalFailed: 0,
                averageWaitTime: 0
            },
            createdAt: new Date()
        };
        
        this.queues.set(queueId, queue);
        this.queueConfigs.set(queueId, config);
        console.log(`Queue created: ${queueId}`);
        return queue;
    }

    enqueue(queueId, request, priority = 0) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            throw new Error('Queue does not exist');
        }
        
        if (queue.items.length >= queue.maxSize) {
            throw new Error('Queue is full');
        }
        
        const item = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            request,
            priority,
            enqueuedAt: new Date(),
            status: 'queued'
        };
        
        if (queue.priority) {
            queue.items.push(item);
            queue.items.sort((a, b) => b.priority - a.priority);
        } else {
            queue.items.push(item);
        }
        
        queue.stats.totalEnqueued++;
        console.log(`Request enqueued: ${item.id}`);
        
        this.processQueue(queueId);
        return item.id;
    }

    async processQueue(queueId) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            return;
        }
        
        // Check concurrency limit
        if (queue.processing.length >= queue.concurrency) {
            return;
        }
        
        // Get next item
        const item = queue.items.shift();
        if (!item) {
            return;
        }
        
        queue.processing.push(item);
        item.status = 'processing';
        item.processingAt = new Date();
        
        try {
            // Simulate request processing
            await this.processRequest(item.request);
            
            item.status = 'completed';
            item.completedAt = new Date();
            queue.stats.totalProcessed++;
            
            const waitTime = item.processingAt - item.enqueuedAt;
            this.updateAverageWaitTime(queue, waitTime);
            
            console.log(`Request processed: ${item.id}`);
        } catch (error) {
            item.status = 'failed';
            item.error = error.message;
            queue.stats.totalFailed++;
            console.log(`Request failed: ${item.id}`);
        } finally {
            const index = queue.processing.indexOf(item);
            if (index > -1) {
                queue.processing.splice(index, 1);
            }
            
            // Process next item
            if (queue.items.length > 0) {
                this.processQueue(queueId);
            }
        }
    }

    async processRequest(request) {
        // Simulate request processing
        return new Promise((resolve) => {
            setTimeout(() => resolve('processed'), 100);
        });
    }

    updateAverageWaitTime(queue, waitTime) {
        const total = queue.stats.totalProcessed;
        queue.stats.averageWaitTime = 
            ((queue.stats.averageWaitTime * (total - 1)) + waitTime) / total;
    }

    getQueueStats(queueId) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            throw new Error('Queue does not exist');
        }
        
        return {
            id: queue.id,
            queued: queue.items.length,
            processing: queue.processing.length,
            stats: queue.stats
        };
    }

    getQueue(queueId) {
        return this.queues.get(queueId);
    }

    getAllQueues() {
        return Array.from(this.queues.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`queuing_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestQueuing = new APIRequestQueuing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestQueuing;
}

