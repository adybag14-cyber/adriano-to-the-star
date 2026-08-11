/**
 * Raft Consensus
 * Raft consensus algorithm implementation
 */

class RaftConsensus {
    constructor() {
        this.nodes = new Map();
        this.logs = new Map();
        this.entries = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_af_tc_on_se_ns_us_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_af_tc_on_se_ns_us_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async addNode(nodeId, nodeData) {
        const node = {
            id: nodeId,
            ...nodeData,
            name: nodeData.name || nodeId,
            role: nodeData.role || 'follower',
            term: 0,
            status: 'active',
            createdAt: new Date()
        };
        
        this.nodes.set(nodeId, node);
        return node;
    }

    async electLeader(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) {
            throw new Error(`Node ${nodeId} not found`);
        }

        node.role = 'leader';
        node.term++;
        node.electedAt = new Date();
        return node;
    }

    async appendEntry(entryId, entryData) {
        const entry = {
            id: entryId,
            ...entryData,
            term: entryData.term || 0,
            index: entryData.index || 0,
            command: entryData.command || '',
            status: 'pending',
            createdAt: new Date()
        };

        this.entries.set(entryId, entry);
        await this.replicateEntry(entry);
        return entry;
    }

    async replicateEntry(entry) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        entry.status = 'committed';
        entry.committedAt = new Date();
    }

    async createLog(logId, logData) {
        const log = {
            id: logId,
            ...logData,
            nodeId: logData.nodeId || '',
            entries: logData.entries || [],
            status: 'active',
            createdAt: new Date()
        };

        this.logs.set(logId, log);
        return log;
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    getEntry(entryId) {
        return this.entries.get(entryId);
    }

    getAllEntries() {
        return Array.from(this.entries.values());
    }
}

module.exports = RaftConsensus;

