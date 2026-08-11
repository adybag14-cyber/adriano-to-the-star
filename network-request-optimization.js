/**
 * Network Request Optimization
 * Optimizes network requests for better performance
 */

class NetworkRequestOptimization {
    constructor() {
        this.requestQueue = [];
        this.batchSize = 5;
        this.debounceDelay = 100;
        this.init();
    }
    
    init() {
        this.interceptFetch();
    }
    
    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(...args) {
            return self.optimizeRequest(originalFetch, ...args);
        };
    }
    
    async optimizeRequest(originalFetch, url, options = {}) {
        // Add compression headers
        options.headers = {
            ...options.headers,
            'Accept-Encoding': 'gzip, deflate, br'
        };
        
        // Batch small requests
        if (this.shouldBatch(url, options)) {
            return this.batchRequest(url, options);
        }
        
        // Debounce rapid requests
        if (this.shouldDebounce(url)) {
            return this.debounceRequest(originalFetch, url, options);
        }
        
        // Execute optimized request
        return originalFetch(url, options);
    }
    
    shouldBatch(url, options) {
        // Batch GET requests to same endpoint
        return options.method === 'GET' || !options.method;
    }
    
    shouldDebounce(url) {
        // Debounce requests to same URL within short time
        const recent = this.requestQueue.filter(req => 
            req.url === url && 
            (Date.now() - req.timestamp) < this.debounceDelay
        );
        return recent.length > 0;
    }
    
    async batchRequest(url, options) {
        // Add to batch queue
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                url,
                options,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            // Process batch when queue reaches size
            if (this.requestQueue.length >= this.batchSize) {
                this.processBatch();
            } else {
                // Process after delay
                setTimeout(() => this.processBatch(), 50);
            }
        });
    }
    
    async processBatch() {
        if (this.requestQueue.length === 0) return;
        
        const batch = this.requestQueue.splice(0, this.batchSize);
        
        // Execute requests in parallel
        const promises = batch.map(req => 
            fetch(req.url, req.options)
                .then(req.resolve)
                .catch(req.reject)
        );
        
        await Promise.all(promises);
    }
    
    async debounceRequest(originalFetch, url, options) {
        return new Promise((resolve, reject) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                try {
                    const response = await originalFetch(url, options);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            }, this.debounceDelay);
        });
    }
    
    preconnect(domain) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }
    
    prefetch(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }
    
    optimizeImageRequests() {
        // Convert images to WebP/AVIF if supported
        document.querySelectorAll('img').forEach(img => {
            if (!img.srcset && img.src) {
                // Add responsive srcset
                const src = img.src;
                img.srcset = `
                    ${src}?w=400 400w,
                    ${src}?w=800 800w,
                    ${src}?w=1200 1200w
                `.trim();
                img.sizes = '(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px';
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.networkRequestOptimization = new NetworkRequestOptimization(); });
} else {
    window.networkRequestOptimization = new NetworkRequestOptimization();
}
