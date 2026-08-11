/**
 * Random Forest Analysis
 * Random forest ensemble method for classification and regression
 */

class RandomForestAnalysis {
    constructor() {
        this.datasets = new Map();
        this.forests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_an_do_mf_or_es_ta_na_ly_si_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_an_do_mf_or_es_ta_na_ly_si_s_" + eventName, 1, data);
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

    buildForest(datasetId, targetVariable, features, nTrees = 100, maxDepth = 10) {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error('Dataset not found');
        }
        
        const trees = [];
        
        for (let i = 0; i < nTrees; i++) {
            const bootstrapSample = this.bootstrapSample(dataset.data);
            const randomFeatures = this.randomFeatureSubset(features);
            const tree = this.buildTree(bootstrapSample, targetVariable, randomFeatures, maxDepth);
            trees.push(tree);
        }
        
        const forestId = `forest_${Date.now()}`;
        this.forests.set(forestId, {
            id: forestId,
            datasetId,
            trees,
            nTrees,
            targetVariable,
            features,
            maxDepth,
            createdAt: new Date()
        });
        
        return this.forests.get(forestId);
    }

    bootstrapSample(data) {
        const sample = [];
        for (let i = 0; i < data.length; i++) {
            const randomIndex = Math.floor(Math.random() * data.length);
            sample.push(data[randomIndex]);
        }
        return sample;
    }

    randomFeatureSubset(features) {
        const nFeatures = Math.ceil(Math.sqrt(features.length));
        const shuffled = [...features].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, nFeatures);
    }

    buildTree(data, targetVariable, features, maxDepth, depth = 0) {
        if (data.length === 0 || depth >= maxDepth) {
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
        
        if (!bestFeature) {
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
            left: this.buildTree(leftData, targetVariable, features, maxDepth, depth + 1),
            right: this.buildTree(rightData, targetVariable, features, maxDepth, depth + 1)
        };
    }

    findBestSplit(data, feature, targetVariable) {
        const values = data.map(row => row[feature]).filter(val => val !== null && val !== undefined);
        const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
        
        let bestGini = Infinity;
        let bestSplit = uniqueValues[0] || 0;
        
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

    predict(forestId, input) {
        const forest = this.forests.get(forestId);
        if (!forest) {
            throw new Error('Forest not found');
        }
        
        const predictions = forest.trees.map(tree => this.predictFromTree(tree, input));
        
        if (typeof predictions[0] === 'number') {
            return predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
        } else {
            const counts = new Map();
            predictions.forEach(pred => {
                counts.set(pred, (counts.get(pred) || 0) + 1);
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

    getForest(forestId) {
        return this.forests.get(forestId);
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.randomForestAnalysis = new RandomForestAnalysis();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RandomForestAnalysis;
}

