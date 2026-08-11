/**
 * Chain Reorganization
 * Blockchain chain reorganization handling
 */

class ChainReorganization {
    constructor() {
        this.networks = new Map();
        this.reorganizations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('chain_reorg_initialized');
    }

    registerNetwork(networkId, networkData) {
        const network = {
            id: networkId,
            ...networkData,
            name: networkData.name || networkId,
            chain: [],
            reorganizations: [],
            createdAt: new Date()
        };
        
        this.networks.set(networkId, network);
        console.log(`Network registered: ${networkId}`);
        return network;
    }

    async addBlock(networkId, block) {
        const network = this.networks.get(networkId);
        if (!network) {
            throw new Error('Network not found');
        }
        
        const reorganization = this.detectReorganization(network, block);
        
        if (reorganization) {
            const reorgRecord = {
                id: `reorg_${Date.now()}`,
                networkId,
                oldChain: [...network.chain],
                newChain: [],
                depth: reorganization.depth,
                detectedAt: new Date(),
                createdAt: new Date()
            };
            
            this.reorganizations.set(reorgRecord.id, reorgRecord);
            network.reorganizations.push(reorgRecord.id);
            
            network.chain = reorganization.newChain;
        } else {
            network.chain.push(block);
        }
        
        return { block, reorganization };
    }

    detectReorganization(network, block) {
        if (network.chain.length === 0) {
            return null;
        }
        
        const lastBlock = network.chain[network.chain.length - 1];
        
        if (block.parentHash !== lastBlock.hash && block.blockNumber <= lastBlock.blockNumber) {
            const depth = lastBlock.blockNumber - block.blockNumber + 1;
            const newChain = network.chain.slice(0, network.chain.length - depth);
            newChain.push(block);
            
            return {
                depth,
                newChain
            };
        }
        
        return null;
    }

    getNetwork(networkId) {
        return this.networks.get(networkId);
    }

    getReorganization(reorgId) {
        return this.reorganizations.get(reorgId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`chain_reorg_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.chainReorganization = new ChainReorganization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChainReorganization;
}


