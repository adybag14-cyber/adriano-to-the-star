/**
 * Merkle Tree
 * Merkle tree construction and verification
 */

class MerkleTree {
    constructor() {
        this.trees = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_er_kl_et_re_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_er_kl_et_re_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createTree(treeId, leaves) {
        const tree = {
            id: treeId,
            leaves,
            levels: [],
            root: null,
            createdAt: new Date()
        };
        
        tree.levels = this.buildTree(leaves);
        tree.root = tree.levels[tree.levels.length - 1][0];
        
        this.trees.set(treeId, tree);
        console.log(`Merkle tree created: ${treeId}`);
        return tree;
    }

    buildTree(leaves) {
        const levels = [leaves];
        let currentLevel = leaves;
        
        while (currentLevel.length > 1) {
            const nextLevel = [];
            
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
                const parent = this.hashPair(left, right);
                nextLevel.push(parent);
            }
            
            levels.push(nextLevel);
            currentLevel = nextLevel;
        }
        
        return levels;
    }

    hashPair(left, right) {
        return this.hash(left + right);
    }

    hash(data) {
        return '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    generateProof(treeId, leafIndex) {
        const tree = this.trees.get(treeId);
        if (!tree) {
            throw new Error('Tree not found');
        }
        
        const proof = [];
        let index = leafIndex;
        
        for (let level = 0; level < tree.levels.length - 1; level++) {
            const isRight = index % 2 === 1;
            const siblingIndex = isRight ? index - 1 : index + 1;
            
            if (siblingIndex < tree.levels[level].length) {
                proof.push({
                    hash: tree.levels[level][siblingIndex],
                    position: isRight ? 'left' : 'right'
                });
            }
            
            index = Math.floor(index / 2);
        }
        
        return proof;
    }

    verifyProof(leaf, proof, root) {
        let currentHash = leaf;
        
        for (const node of proof) {
            if (node.position === 'left') {
                currentHash = this.hashPair(node.hash, currentHash);
            } else {
                currentHash = this.hashPair(currentHash, node.hash);
            }
        }
        
        return currentHash === root;
    }

    getTree(treeId) {
        return this.trees.get(treeId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.merkleTree = new MerkleTree();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MerkleTree;
}


