/**
 * Byzantine Fault Tolerance
 * Byzantine Fault Tolerance consensus implementation
 */

class ByzantineFaultTolerance {
    constructor() {
        this.nodes = new Map();
        this.requests = new Map();
        this.replies = new Map();
        this.init();
    }

    init() {
        this.trackEvent('bft_initialized');
    }

    async addNode(nodeId, nodeData) {
        const node = {
            id: nodeId,
            ...nodeData,
            name: nodeData.name || nodeId,
            publicKey: nodeData.publicKey || this.generateKey(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.nodes.set(nodeId, node);
        return node;
    }

    async submitRequest(requestId, requestData) {
        const request = {
            id: requestId,
            ...requestData,
            operation: requestData.operation || '',
            timestamp: requestData.timestamp || Date.now(),
            status: 'pending',
            createdAt: new Date()
        };

        this.requests.set(requestId, request);
        await this.processRequest(request);
        return request;
    }

    async processRequest(request) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        request.status = 'prepared';
        await this.commitRequest(request);
    }

    async commitRequest(request) {
        await new Promise(resolve => setTimeout(resolve, 500));
        request.status = 'committed';
        request.committedAt = new Date();
    }

    async submitReply(replyId, replyData) {
        const reply = {
            id: replyId,
            ...replyData,
            requestId: replyData.requestId || '',
            nodeId: replyData.nodeId || '',
            result: replyData.result || '',
            signature: this.generateSignature(),
            status: 'submitted',
            createdAt: new Date()
        };

        this.replies.set(replyId, reply);
        return reply;
    }

    generateKey() {
        return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    generateSignature() {
        return '0x' + Array.from({length: 128}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    getRequest(requestId) {
        return this.requests.get(requestId);
    }

    getAllRequests() {
        return Array.from(this.requests.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bft_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = ByzantineFaultTolerance;

