/**
 * Hybrid Consensus
 * Hybrid consensus algorithm implementation
 */

class HybridConsensus {
    constructor() {
        this.consensus = new Map();
        this.nodes = new Map();
        this.blocks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('h_yb_ri_dc_on_se_ns_us_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("h_yb_ri_dc_on_se_ns_us_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createConsensus(consensusId, consensusData) {
        const consensus = {
            id: consensusId,
            ...consensusData,
            primary: consensusData.primary || 'pow',
            secondary: consensusData.secondary || 'pos',
            status: 'active',
            createdAt: new Date()
        };
        
        this.consensus.set(consensusId, consensus);
        return consensus;
    }

    async addNode(nodeId, nodeData) {
        const node = {
            id: nodeId,
            ...nodeData,
            name: nodeData.name || nodeId,
            type: nodeData.type || 'hybrid',
            status: 'active',
            createdAt: new Date()
        };

        this.nodes.set(nodeId, node);
        return node;
    }

    async createBlock(blockId, blockData) {
        const block = {
            id: blockId,
            ...blockData,
            number: blockData.number || 0,
            transactions: blockData.transactions || [],
            consensusType: blockData.consensusType || 'hybrid',
            status: 'pending',
            createdAt: new Date()
        };

        this.blocks.set(blockId, block);
        await this.finalizeBlock(block);
        return block;
    }

    async finalizeBlock(block) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        block.status = 'finalized';
        block.finalizedAt = new Date();
    }

    getConsensus(consensusId) {
        return this.consensus.get(consensusId);
    }

    getAllConsensus() {
        return Array.from(this.consensus.values());
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }
}

module.exports = HybridConsensus;

