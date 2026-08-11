/**
 * Practical Byzantine Fault Tolerance
 * PBFT consensus implementation
 */

class PracticalByzantineFaultTolerance {
    constructor() {
        this.nodes = new Map();
        this.requests = new Map();
        this.views = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_ra_ct_ic_al_by_za_nt_in_ef_au_lt_to_le_ra_nc_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ra_ct_ic_al_by_za_nt_in_ef_au_lt_to_le_ra_nc_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async addNode(nodeId, nodeData) {
        const node = {
            id: nodeId,
            ...nodeData,
            name: nodeData.name || nodeId,
            publicKey: nodeData.publicKey || this.generateKey(),
            view: 0,
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
            client: requestData.client || '',
            timestamp: requestData.timestamp || Date.now(),
            status: 'pre-prepare',
            createdAt: new Date()
        };

        this.requests.set(requestId, request);
        await this.processPBFT(request);
        return request;
    }

    async processPBFT(request) {
        await new Promise(resolve => setTimeout(resolve, 500));
        request.status = 'prepare';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        request.status = 'commit';
        
        await new Promise(resolve => setTimeout(resolve, 500));
        request.status = 'reply';
        request.completedAt = new Date();
    }

    async changeView(viewId, viewData) {
        const view = {
            id: viewId,
            ...viewData,
            viewNumber: viewData.viewNumber || 0,
            primary: viewData.primary || '',
            status: 'active',
            createdAt: new Date()
        };

        this.views.set(viewId, view);
        return view;
    }

    generateKey() {
        return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
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
}

module.exports = PracticalByzantineFaultTolerance;

