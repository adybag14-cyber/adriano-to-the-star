/**
 * Message Queue Advanced
 * Advanced message queue system
 */

class MessageQueueAdvanced {
    constructor() {
        this.queues = new Map();
        this.messages = new Map();
        this.consumers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_es_sa_ge_qu_eu_ea_dv_an_ce_d_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_es_sa_ge_qu_eu_ea_dv_an_ce_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createQueue(queueId, queueData) {
        const queue = {
            id: queueId,
            ...queueData,
            name: queueData.name || queueId,
            type: queueData.type || 'fifo',
            status: 'active',
            createdAt: new Date()
        };
        
        this.queues.set(queueId, queue);
        return queue;
    }

    async publish(queueId, message) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            throw new Error(`Queue ${queueId} not found`);
        }

        const msg = {
            id: `msg_${Date.now()}`,
            queueId,
            message,
            status: 'queued',
            createdAt: new Date()
        };

        this.messages.set(msg.id, msg);
        return msg;
    }

    async consume(queueId, consumerId) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            throw new Error(`Queue ${queueId} not found`);
        }

        const queueMessages = Array.from(this.messages.values())
            .filter(m => m.queueId === queueId && m.status === 'queued');

        if (queueMessages.length === 0) {
            return null;
        }

        const message = queueMessages[0];
        message.status = 'consumed';
        message.consumerId = consumerId;
        message.consumedAt = new Date();

        return message;
    }

    getQueue(queueId) {
        return this.queues.get(queueId);
    }

    getAllQueues() {
        return Array.from(this.queues.values());
    }
}

module.exports = MessageQueueAdvanced;

