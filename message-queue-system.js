/**
 * Message Queue System
 * @class MessageQueueSystem
 * @description Manages message queues for asynchronous processing.
 */
class MessageQueueSystem {
    constructor() {
        this.queues = new Map();
        this.messages = new Map();
        this.consumers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_es_sa_ge_qu_eu_es_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_es_sa_ge_qu_eu_es_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create queue.
     * @param {string} queueId - Queue identifier.
     * @param {object} queueData - Queue data.
     */
    createQueue(queueId, queueData) {
        this.queues.set(queueId, {
            ...queueData,
            id: queueId,
            name: queueData.name,
            maxSize: queueData.maxSize || 10000,
            messages: [],
            createdAt: new Date()
        });
        console.log(`Queue created: ${queueId}`);
    }

    /**
     * Publish message.
     * @param {string} queueId - Queue identifier.
     * @param {object} message - Message data.
     * @returns {string} Message identifier.
     */
    publish(queueId, message) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            throw new Error(`Queue not found: ${queueId}`);
        }

        if (queue.messages.length >= queue.maxSize) {
            throw new Error('Queue is full');
        }

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const messageRecord = {
            id: messageId,
            queueId,
            ...message,
            body: message.body,
            status: 'pending',
            publishedAt: new Date()
        };

        this.messages.set(messageId, messageRecord);
        queue.messages.push(messageId);

        console.log(`Message published: ${messageId} to queue ${queueId}`);
        return messageId;
    }

    /**
     * Consume message.
     * @param {string} queueId - Queue identifier.
     * @param {function} handler - Message handler.
     */
    consume(queueId, handler) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            throw new Error(`Queue not found: ${queueId}`);
        }

        const consumerId = `consumer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.consumers.set(consumerId, {
            id: consumerId,
            queueId,
            handler,
            active: true,
            createdAt: new Date()
        });

        // Start consuming
        this.processQueue(queueId, handler);
        console.log(`Consumer registered: ${consumerId} for queue ${queueId}`);
    }

    /**
     * Process queue.
     * @param {string} queueId - Queue identifier.
     * @param {function} handler - Message handler.
     */
    async processQueue(queueId, handler) {
        const queue = this.queues.get(queueId);
        if (!queue) return;

        while (queue.messages.length > 0) {
            const messageId = queue.messages.shift();
            const message = this.messages.get(messageId);
            
            if (message && message.status === 'pending') {
                message.status = 'processing';
                try {
                    await handler(message);
                    message.status = 'completed';
                    message.completedAt = new Date();
                } catch (error) {
                    message.status = 'failed';
                    message.error = error.message;
                }
            }
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.messageQueueSystem = new MessageQueueSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessageQueueSystem;
}

