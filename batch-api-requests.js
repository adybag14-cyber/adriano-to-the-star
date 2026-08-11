/**
 * Batch API Requests
 * Batches multiple API requests into single calls
 */

class BatchAPIRequests {
    constructor() {
        this.batchQueue = [];
        this.batchDelay = 50; // ms
        this.maxBatchSize = 10;
        this.batchTimer = null;
        this.init();
    }
    
    init() {
        this.trackEvent('batch_api_initialized');
    }
    
    async batchRequest(request) {
        return new Promise((resolve, reject) => {
            this.batchQueue.push({
                request,
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
        
        // Process batch if queue is full
        if (this.batchQueue.length >= this.maxBatchSize) {
            this.processBatch();
        } else {
            // Process after delay
            this.batchTimer = setTimeout(() => {
                this.processBatch();
            }, this.batchDelay);
        }
    }
    
    async processBatch() {
        if (this.batchQueue.length === 0) return;
        
        const batch = this.batchQueue.splice(0, this.maxBatchSize);
        this.batchTimer = null;
        
        try {
            // Group requests by endpoint
            const grouped = this.groupRequests(batch);
            
            // Execute batches
            const results = await Promise.all(
                Object.entries(grouped).map(([endpoint, requests]) =>
                    this.executeBatch(endpoint, requests)
                )
            );
            
            // Resolve individual requests
            batch.forEach((item, index) => {
                item.resolve(results[index]);
            });
        } catch (error) {
            // Reject all requests in batch
            batch.forEach(item => {
                item.reject(error);
            });
        }
    }
    
    groupRequests(batch) {
        const grouped = {};
        
        batch.forEach(item => {
            const endpoint = this.getEndpoint(item.request);
            if (!grouped[endpoint]) {
                grouped[endpoint] = [];
            }
            grouped[endpoint].push(item);
        });
        
        return grouped;
    }
    
    getEndpoint(request) {
        if (typeof request === 'string') {
            return new URL(request, window.location.origin).pathname;
        }
        if (request.url) {
            return new URL(request.url, window.location.origin).pathname;
        }
        return '/api/batch';
    }
    
    async executeBatch(endpoint, requests) {
        // Create batch request payload
        const batchPayload = requests.map((item, index) => ({
            id: index,
            method: item.request.method || 'GET',
            url: this.getRequestUrl(item.request),
            body: item.request.body,
            headers: item.request.headers
        }));
        
        // Send batch request
        const response = await fetch('/api/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: batchPayload
            })
        });
        
        if (!response.ok) {
            throw new Error(`Batch request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Return results in same order
        return data.results || [];
    }
    
    getRequestUrl(request) {
        if (typeof request === 'string') {
            return request;
        }
        return request.url || '';
    }
    
    async singleRequest(url, options = {}) {
        // For single requests, use normal fetch
        return fetch(url, options);
    }
    
    createBatchRequest(requests) {
        // Create a batch request from multiple individual requests
        return this.batchRequest({
            type: 'batch',
            requests: requests
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`batch_api_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.batchAPIRequests = new BatchAPIRequests(); });
} else {
    window.batchAPIRequests = new BatchAPIRequests();
}

