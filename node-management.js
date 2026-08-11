/**
 * Node Management
 * Blockchain node management system
 */

class NodeManagement {
    constructor() {
        this.nodes = new Map();
        this.networks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('n_od_em_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_od_em_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerNetwork(networkId, networkData) {
        const network = {
            id: networkId,
            ...networkData,
            name: networkData.name || networkId,
            chainId: networkData.chainId || 1,
            nodes: [],
            createdAt: new Date()
        };
        
        this.networks.set(networkId, network);
        console.log(`Network registered: ${networkId}`);
        return network;
    }

    registerNode(networkId, nodeId, nodeData) {
        const network = this.networks.get(networkId);
        if (!network) {
            throw new Error('Network not found');
        }
        
        const node = {
            id: nodeId,
            networkId,
            ...nodeData,
            name: nodeData.name || nodeId,
            address: nodeData.address || this.generateAddress(),
            rpcUrl: nodeData.rpcUrl || '',
            status: 'offline',
            lastSeen: null,
            createdAt: new Date()
        };
        
        this.nodes.set(nodeId, node);
        network.nodes.push(nodeId);
        
        return node;
    }

    async connectNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) {
            throw new Error('Node not found');
        }
        
        node.status = 'online';
        node.lastSeen = new Date();
        node.connectedAt = new Date();
        
        return node;
    }

    async disconnectNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) {
            throw new Error('Node not found');
        }
        
        node.status = 'offline';
        node.disconnectedAt = new Date();
        
        return node;
    }

    getNodeInfo(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) {
            throw new Error('Node not found');
        }
        
        return {
            id: node.id,
            name: node.name,
            status: node.status,
            networkId: node.networkId,
            lastSeen: node.lastSeen,
            uptime: node.connectedAt ? Date.now() - node.connectedAt.getTime() : 0
        };
    }

    generateAddress() {
        return '0x' + Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    getNetwork(networkId) {
        return this.networks.get(networkId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.nodeManagement = new NodeManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeManagement;
}


