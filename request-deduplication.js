/**
 * Request Deduplication
 * Deduplicates identical requests
 */

class RequestDeduplication {
    constructor() {
        this.pendingRequests = new Map();
        this.init();
    }
    
    init() {
        this.interceptRequests();
    }
    
    interceptRequests() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(url, options = {}) {
            const key = self.getRequestKey(url, options);
            
            // Check if request is already pending
            if (self.pendingRequests.has(key)) {
                return self.pendingRequests.get(key);
            }
            
            // Create new request
            const promise = originalFetch(url, options).finally(() => {
                self.pendingRequests.delete(key);
            });
            
            self.pendingRequests.set(key, promise);
            return promise;
        };
    }
    
    getRequestKey(url, options) {
        return btoa(JSON.stringify({ url, method: options.method || 'GET', body: options.body }));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.requestDeduplication = new RequestDeduplication(); });
} else {
    window.requestDeduplication = new RequestDeduplication();
}

