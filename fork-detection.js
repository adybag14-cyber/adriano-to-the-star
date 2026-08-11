/**
 * Fork Detection
 * Blockchain fork detection system
 */

class ForkDetection {
    constructor() {
        this.networks = new Map();
        this.forks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_or_kd_et_ec_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_or_kd_et_ec_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerNetwork(networkId, networkData) {
        const network = {
            id: networkId,
            ...networkData,
            name: networkData.name || networkId,
            blocks: [],
            forks: [],
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
        
        const fork = this.detectFork(network, block);
        
        if (fork) {
            const forkRecord = {
                id: `fork_${Date.now()}`,
                networkId,
                blockNumber: block.blockNumber,
                blockHash: block.hash,
                parentHash: block.parentHash,
                detectedAt: new Date(),
                createdAt: new Date()
            };
            
            this.forks.set(forkRecord.id, forkRecord);
            network.forks.push(forkRecord.id);
        }
        
        network.blocks.push(block);
        
        return { block, fork };
    }

    detectFork(network, block) {
        if (network.blocks.length === 0) {
            return false;
        }
        
        const existingBlock = network.blocks.find(b => 
            b.blockNumber === block.blockNumber && b.hash !== block.hash
        );
        
        return existingBlock !== undefined;
    }

    resolveFork(networkId, forkId, chosenBlock) {
        const network = this.networks.get(networkId);
        const fork = this.forks.get(forkId);
        
        if (!network || !fork) {
            throw new Error('Network or fork not found');
        }
        
        fork.resolved = true;
        fork.chosenBlock = chosenBlock.hash;
        fork.resolvedAt = new Date();
        
        return fork;
    }

    getNetwork(networkId) {
        return this.networks.get(networkId);
    }

    getFork(forkId) {
        return this.forks.get(forkId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.forkDetection = new ForkDetection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ForkDetection;
}


