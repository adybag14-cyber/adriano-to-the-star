/**
 * Request Batching (Advanced)
 * Advanced request batching for reduced network overhead
 */

class RequestBatchingAdvanced {
    constructor() {
        this.batchQueue = [];
        this.batchDelay = 50;
        this.maxBatchSize = 10;
        this.batchTimer = null;
        this.init();
    }
    
    init() {
        this.interceptRequests();
    }
    
    interceptRequests() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(url, options = {}) {
            // Batch GET requests
            if ((options.method === 'GET' || !options.method) && !options.noBatch) {
                return self.batchRequest(url, options);
            }
            
            return originalFetch(url, options);
        };
    }
    
    async batchRequest(url, options) {
        return new Promise((resolve, reject) => {
            this.batchQueue.push({
                url,
                options,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            this.scheduleBatch();
        });
    }
    
    scheduleBatch() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }
        
        if (this.batchQueue.length >= this.maxBatchSize) {
            this.processBatch();
        } else {
            this.batchTimer = setTimeout(() => {
                this.processBatch();
            }, this.batchDelay);
        }
    }
    
    async processBatch() {
        if (this.batchQueue.length === 0) return;
        
        const batch = this.batchQueue.splice(0, this.maxBatchSize);
        this.batchTimer = null;
        
        // Execute batch requests
        const promises = batch.map(item => 
            fetch(item.url, item.options)
                .then(item.resolve)
                .catch(item.reject)
        );
        
        await Promise.all(promises);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.requestBatchingAdvanced = new RequestBatchingAdvanced(); });
} else {
    window.requestBatchingAdvanced = new RequestBatchingAdvanced();
}

