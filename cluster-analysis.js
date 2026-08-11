/**
 * Cluster Analysis
 * Advanced clustering algorithms and analysis
 */

class ClusterAnalysis {
    constructor() {
        this.datasets = new Map();
        this.clusterings = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cluster_analysis_initialized');
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

    performClustering(datasetId, variables, nClusters = 3, method = 'kmeans') {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error('Dataset not found');
        }
        
        const points = dataset.data.map(row => variables.map(varName => row[varName] || 0));
        
        let clusters;
        if (method === 'kmeans') {
            clusters = this.kMeans(points, nClusters);
        } else if (method === 'hierarchical') {
            clusters = this.hierarchicalClustering(points, nClusters);
        } else if (method === 'dbscan') {
            clusters = this.dbscan(points);
        }
        
        const clusteringId = `clustering_${Date.now()}`;
        this.clusterings.set(clusteringId, {
            id: clusteringId,
            datasetId,
            method,
            clusters,
            nClusters: clusters.length,
            createdAt: new Date()
        });
        
        return this.clusterings.get(clusteringId);
    }

    kMeans(points, k, maxIterations = 100) {
        let centroids = [];
        for (let i = 0; i < k; i++) {
            const randomIndex = Math.floor(Math.random() * points.length);
            centroids.push([...points[randomIndex]]);
        }
        
        let clusters = [];
        let iterations = 0;
        
        while (iterations < maxIterations) {
            clusters = Array(k).fill(null).map(() => []);
            
            points.forEach((point, index) => {
                let minDistance = Infinity;
                let closestCentroid = 0;
                
                centroids.forEach((centroid, centroidIndex) => {
                    const distance = this.euclideanDistance(point, centroid);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCentroid = centroidIndex;
                    }
                });
                
                clusters[closestCentroid].push(index);
            });
            
            let converged = true;
            const newCentroids = [];
            
            clusters.forEach((cluster, index) => {
                if (cluster.length === 0) {
                    newCentroids.push(centroids[index]);
                    return;
                }
                
                const dimensions = points[0].length;
                const newCentroid = Array(dimensions).fill(0);
                
                cluster.forEach(pointIndex => {
                    const point = points[pointIndex];
                    point.forEach((val, dim) => {
                        newCentroid[dim] += val;
                    });
                });
                
                newCentroid.forEach((val, dim) => {
                    newCentroid[dim] = val / cluster.length;
                });
                
                if (this.euclideanDistance(newCentroid, centroids[index]) > 0.001) {
                    converged = false;
                }
                
                newCentroids.push(newCentroid);
            });
            
            if (converged) {
                break;
            }
            
            centroids = newCentroids;
            iterations++;
        }
        
        return clusters.map((cluster, index) => ({
            id: index,
            points: cluster,
            centroid: centroids[index],
            size: cluster.length
        }));
    }

    hierarchicalClustering(points, nClusters) {
        const n = points.length;
        const clusters = points.map((point, index) => ({
            id: index,
            points: [index],
            centroid: point
        }));
        
        while (clusters.length > nClusters) {
            let minDistance = Infinity;
            let mergeI = 0;
            let mergeJ = 1;
            
            for (let i = 0; i < clusters.length; i++) {
                for (let j = i + 1; j < clusters.length; j++) {
                    const distance = this.euclideanDistance(clusters[i].centroid, clusters[j].centroid);
                    if (distance < minDistance) {
                        minDistance = distance;
                        mergeI = i;
                        mergeJ = j;
                    }
                }
            }
            
            const merged = {
                id: clusters.length,
                points: [...clusters[mergeI].points, ...clusters[mergeJ].points],
                centroid: this.calculateCentroid(
                    clusters[mergeI].points.map(idx => points[idx]),
                    clusters[mergeJ].points.map(idx => points[idx])
                )
            };
            
            clusters.splice(mergeJ, 1);
            clusters.splice(mergeI, 1);
            clusters.push(merged);
        }
        
        return clusters;
    }

    dbscan(points, eps = 0.5, minPts = 3) {
        const n = points.length;
        const visited = new Set();
        const clusters = [];
        let clusterId = 0;
        
        for (let i = 0; i < n; i++) {
            if (visited.has(i)) continue;
            
            visited.add(i);
            const neighbors = this.getNeighbors(points, i, eps);
            
            if (neighbors.length < minPts) {
                continue;
            }
            
            const cluster = [i];
            const queue = [...neighbors];
            
            while (queue.length > 0) {
                const pointIdx = queue.shift();
                if (visited.has(pointIdx)) continue;
                
                visited.add(pointIdx);
                cluster.push(pointIdx);
                
                const pointNeighbors = this.getNeighbors(points, pointIdx, eps);
                if (pointNeighbors.length >= minPts) {
                    queue.push(...pointNeighbors);
                }
            }
            
            clusters.push({
                id: clusterId++,
                points: cluster,
                size: cluster.length
            });
        }
        
        return clusters;
    }

    getNeighbors(points, pointIndex, eps) {
        const neighbors = [];
        const point = points[pointIndex];
        
        points.forEach((otherPoint, index) => {
            if (index !== pointIndex) {
                const distance = this.euclideanDistance(point, otherPoint);
                if (distance <= eps) {
                    neighbors.push(index);
                }
            }
        });
        
        return neighbors;
    }

    calculateCentroid(points1, points2) {
        const allPoints = [...points1, ...points2];
        const dimensions = allPoints[0].length;
        const centroid = Array(dimensions).fill(0);
        
        allPoints.forEach(point => {
            point.forEach((val, dim) => {
                centroid[dim] += val;
            });
        });
        
        centroid.forEach((val, dim) => {
            centroid[dim] = val / allPoints.length;
        });
        
        return centroid;
    }

    euclideanDistance(point1, point2) {
        if (point1.length !== point2.length) {
            throw new Error('Points must have the same dimensions');
        }
        const sum = point1.reduce((acc, val, i) => {
            return acc + Math.pow(val - point2[i], 2);
        }, 0);
        return Math.sqrt(sum);
    }

    getClustering(clusteringId) {
        return this.clusterings.get(clusteringId);
    }

    getDataset(datasetId) {
        return this.datasets.get(datasetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cluster_analysis_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.clusterAnalysis = new ClusterAnalysis();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClusterAnalysis;
}

