/**
 * API Request Batching
 * Batch multiple API requests into a single request
 */

class APIRequestBatching {
    constructor() {
        this.batchQueue = [];
        this.batchConfig = {
            maxBatchSize: 10,
            maxWaitTime: 100, // milliseconds
            enabled: true
        };
        this.batchHistory = [];
        this.init();
    }

    init() {
        this.startBatchProcessor();
        this.trackEvent('batching_initialized');
    }

    addToBatch(request) {
        if (!this.batchConfig.enabled) {
            return this.executeRequest(request);
        }
        
        this.batchQueue.push({
            ...request,
            queuedAt: Date.now()
        });
        
        console.log(`Request added to batch queue`);
        
        // Execute batch if it reaches max size
        if (this.batchQueue.length >= this.batchConfig.maxBatchSize) {
            this.processBatch();
        }
    }

    startBatchProcessor() {
        setInterval(() => {
            if (this.batchQueue.length > 0) {
                const oldestRequest = this.batchQueue[0];
                const waitTime = Date.now() - oldestRequest.queuedAt;
                
                if (waitTime >= this.batchConfig.maxWaitTime) {
                    this.processBatch();
                }
            }
        }, this.batchConfig.maxWaitTime);
    }

    processBatch() {
        if (this.batchQueue.length === 0) {
            return;
        }
        
        const batch = this.batchQueue.splice(0, this.batchConfig.maxBatchSize);
        const batchId = `batch_${Date.now()}`;
        
        console.log(`Processing batch of ${batch.length} requests`);
        
        // Execute batched requests
        const results = this.executeBatch(batch);
        
        this.batchHistory.push({
            id: batchId,
            size: batch.length,
            processedAt: new Date(),
            results
        });
        
        return results;
    }

    executeBatch(batch) {
        // Simulate batch execution
        return batch.map(request => ({
            id: request.id,
            url: request.url,
            status: 'completed',
            data: 'batched_response'
        }));
    }

    executeRequest(request) {
        // Execute single request
        return {
            id: request.id,
            url: request.url,
            status: 'completed',
            data: 'response'
        };
    }

    configureBatching(config) {
        this.batchConfig = {
            ...this.batchConfig,
            ...config
        };
        console.log('Batch configuration updated');
    }

    getBatchStats() {
        const totalBatches = this.batchHistory.length;
        const totalRequests = this.batchHistory.reduce((sum, batch) => sum + batch.size, 0);
        const averageBatchSize = totalBatches > 0 
            ? totalRequests / totalBatches 
            : 0;
        
        return {
            totalBatches,
            totalRequests,
            averageBatchSize: averageBatchSize.toFixed(2),
            queueLength: this.batchQueue.length
        };
    }

    clearBatchQueue() {
        this.batchQueue = [];
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`batching_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestBatching = new APIRequestBatching();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestBatching;
}

