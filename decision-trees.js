/**
 * Decision Trees
 * Decision tree algorithm for classification and regression
 */

class DecisionTrees {
    constructor() {
        this.datasets = new Map();
        this.trees = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ec_is_io_nt_re_es_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ec_is_io_nt_re_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addDataset(datasetId, data) {
        const dataset = {
            id: datasetId,
            data: Array.isArray(data) ? data : [],
            createdAt: new Date()
        };
        
        this.datasets.set(datasetId, dataset);
        console.log(`Dataset added: ${datasetId}`);
        return dataset;
    }

    buildTree(datasetId, targetVariable, features, maxDepth = 10) {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error('Dataset not found');
        }
        
        const tree = this.buildDecisionTree(dataset.data, targetVariable, features, maxDepth);
        
        const treeId = `tree_${Date.now()}`;
        this.trees.set(treeId, {
            id: treeId,
            datasetId,
            tree,
            targetVariable,
            features,
            maxDepth,
            createdAt: new Date()
        });
        
        return this.trees.get(treeId);
    }

    buildDecisionTree(data, targetVariable, features, maxDepth, depth = 0) {
        if (data.length === 0) {
            return { type: 'leaf', value: null };
        }
        
        if (depth >= maxDepth) {
            const values = data.map(row => row[targetVariable]);
            return { type: 'leaf', value: this.getMostCommon(values) };
        }
        
        const targetValues = data.map(row => row[targetVariable]);
        if (new Set(targetValues).size === 1) {
            return { type: 'leaf', value: targetValues[0] };
        }
        
        let bestFeature = null;
        let bestGini = Infinity;
        let bestSplit = null;
        
        features.forEach(feature => {
            const { gini, split } = this.findBestSplit(data, feature, targetVariable);
            if (gini < bestGini) {
                bestGini = gini;
                bestFeature = feature;
                bestSplit = split;
            }
        });
        
        if (!bestFeature || bestGini === Infinity) {
            const values = data.map(row => row[targetVariable]);
            return { type: 'leaf', value: this.getMostCommon(values) };
        }
        
        const leftData = data.filter(row => {
            if (typeof row[bestFeature] === 'number') {
                return row[bestFeature] <= bestSplit;
            }
            return row[bestFeature] === bestSplit;
        });
        
        const rightData = data.filter(row => {
            if (typeof row[bestFeature] === 'number') {
                return row[bestFeature] > bestSplit;
            }
            return row[bestFeature] !== bestSplit;
        });
        
        return {
            type: 'node',
            feature: bestFeature,
            split: bestSplit,
            left: this.buildDecisionTree(leftData, targetVariable, features, maxDepth, depth + 1),
            right: this.buildDecisionTree(rightData, targetVariable, features, maxDepth, depth + 1)
        };
    }

    findBestSplit(data, feature, targetVariable) {
        const values = data.map(row => row[feature]).filter(val => val !== null && val !== undefined);
        const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
        
        let bestGini = Infinity;
        let bestSplit = uniqueValues[0];
        
        uniqueValues.forEach(splitValue => {
            const left = data.filter(row => {
                if (typeof row[feature] === 'number') {
                    return row[feature] <= splitValue;
                }
                return row[feature] === splitValue;
            });
            
            const right = data.filter(row => {
                if (typeof row[feature] === 'number') {
                    return row[feature] > splitValue;
                }
                return row[feature] !== splitValue;
            });
            
            if (left.length === 0 || right.length === 0) {
                return;
            }
            
            const gini = this.calculateWeightedGini(left, right, targetVariable);
            if (gini < bestGini) {
                bestGini = gini;
                bestSplit = splitValue;
            }
        });
        
        return { gini: bestGini, split: bestSplit };
    }

    calculateWeightedGini(left, right, targetVariable) {
        const leftGini = this.calculateGini(left.map(row => row[targetVariable]));
        const rightGini = this.calculateGini(right.map(row => row[targetVariable]));
        
        const total = left.length + right.length;
        return (left.length / total) * leftGini + (right.length / total) * rightGini;
    }

    calculateGini(values) {
        if (values.length === 0) {
            return 0;
        }
        
        const counts = new Map();
        values.forEach(val => {
            counts.set(val, (counts.get(val) || 0) + 1);
        });
        
        let gini = 1;
        counts.forEach(count => {
            const probability = count / values.length;
            gini -= probability * probability;
        });
        
        return gini;
    }

    getMostCommon(values) {
        const counts = new Map();
        values.forEach(val => {
            counts.set(val, (counts.get(val) || 0) + 1);
        });
        
        let maxCount = 0;
        let mostCommon = null;
        counts.forEach((count, val) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = val;
            }
        });
        
        return mostCommon;
    }

    predict(treeId, input) {
        const treeData = this.trees.get(treeId);
        if (!treeData) {
            throw new Error('Tree not found');
        }
        
        return this.predictFromTree(treeData.tree, input);
    }

    predictFromTree(node, input) {
        if (node.type === 'leaf') {
            return node.value;
        }
        
        const value = input[node.feature];
        let goLeft;
        
        if (typeof value === 'number') {
            goLeft = value <= node.split;
        } else {
            goLeft = value === node.split;
        }
        
        return goLeft 
            ? this.predictFromTree(node.left, input)
            : this.predictFromTree(node.right, input);
    }

    getTree(treeId) {
        return this.trees.get(treeId);
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.decisionTrees = new DecisionTrees();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DecisionTrees;
}

