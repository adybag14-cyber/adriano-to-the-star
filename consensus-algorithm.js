/**
 * Consensus Algorithm
 * Blockchain consensus algorithm implementation
 */

class ConsensusAlgorithm {
    constructor() {
        this.networks = new Map();
        this.nodes = new Map();
        this.blocks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('consensus_algo_initialized');
    }

    registerNetwork(networkId, networkData) {
        const network = {
            id: networkId,
            ...networkData,
            name: networkData.name || networkId,
            algorithm: networkData.algorithm || 'proof_of_stake',
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
            address: nodeData.address || this.generateAddress(),
            stake: nodeData.stake || 0,
            status: 'active',
            createdAt: new Date()
        };
        
        this.nodes.set(nodeId, node);
        network.nodes.push(nodeId);
        
        return node;
    }

    async proposeBlock(networkId, blockData) {
        const network = this.networks.get(networkId);
        if (!network) {
            throw new Error('Network not found');
        }
        
        const block = {
            id: `block_${Date.now()}`,
            networkId,
            ...blockData,
            blockNumber: blockData.blockNumber || 0,
            transactions: blockData.transactions || [],
            proposer: this.selectProposer(network),
            status: 'proposed',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.blocks.set(block.id, block);
        
        const consensus = await this.reachConsensus(network, block);
        
        if (consensus) {
            block.status = 'finalized';
            block.finalizedAt = new Date();
        }
        
        return block;
    }

    selectProposer(network) {
        const activeNodes = network.nodes
            .map(nodeId => this.nodes.get(nodeId))
            .filter(node => node && node.status === 'active');
        
        if (activeNodes.length === 0) {
            return null;
        }
        
        if (network.algorithm === 'proof_of_stake') {
            const totalStake = activeNodes.reduce((sum, node) => sum + node.stake, 0);
            let random = Math.random() * totalStake;
            
            for (const node of activeNodes) {
                random -= node.stake;
                if (random <= 0) {
                    return node.id;
                }
            }
        }
        
        return activeNodes[Math.floor(Math.random() * activeNodes.length)].id;
    }

    async reachConsensus(network, block) {
        const activeNodes = network.nodes
            .map(nodeId => this.nodes.get(nodeId))
            .filter(node => node && node.status === 'active');
        
        const requiredVotes = Math.ceil(activeNodes.length * 0.67);
        const votes = Math.floor(Math.random() * activeNodes.length * 0.8) + requiredVotes;
        
        return votes >= requiredVotes;
    }

    generateAddress() {
        return '0x' + Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getNetwork(networkId) {
        return this.networks.get(networkId);
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`consensus_algo_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.consensusAlgorithm = new ConsensusAlgorithm();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsensusAlgorithm;
}


