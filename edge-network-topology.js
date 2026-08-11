/**
 * Edge Network Topology
 * Edge network topology management
 */

class EdgeNetworkTopology {
    constructor() {
        this.topologies = new Map();
        this.nodes = new Map();
        this.links = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_net_topology_initialized');
    }

    async createTopology(topologyId, topologyData) {
        const topology = {
            id: topologyId,
            ...topologyData,
            name: topologyData.name || topologyId,
            nodes: topologyData.nodes || [],
            links: topologyData.links || [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.topologies.set(topologyId, topology);
        return topology;
    }

    async addNode(nodeId, nodeData) {
        const node = {
            id: nodeId,
            ...nodeData,
            name: nodeData.name || nodeId,
            type: nodeData.type || 'edge',
            position: nodeData.position || {x: 0, y: 0},
            status: 'active',
            createdAt: new Date()
        };

        this.nodes.set(nodeId, node);
        return node;
    }

    getTopology(topologyId) {
        return this.topologies.get(topologyId);
    }

    getAllTopologies() {
        return Array.from(this.topologies.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_net_topology_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

module.exports = EdgeNetworkTopology;

