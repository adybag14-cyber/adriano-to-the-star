/**
 * Network Request Monitoring (Advanced)
 * Advanced monitoring of network requests
 */

class NetworkRequestMonitoringAdvanced {
    constructor() {
        this.requests = [];
        this.init();
    }
    
    init() {
        this.interceptRequests();
    }
    
    interceptRequests() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(url, options = {}) {
            const startTime = performance.now();
            
            try {
                const response = await originalFetch(url, options);
                const duration = performance.now() - startTime;
                
                self.recordRequest({
                    url,
                    method: options.method || 'GET',
                    status: response.status,
                    duration,
                    size: response.headers.get('Content-Length'),
                    timestamp: Date.now()
                });
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                self.recordRequest({
                    url,
                    method: options.method || 'GET',
                    error: error.message,
                    duration,
                    timestamp: Date.now()
                });
                throw error;
            }
        };
    }
    
    recordRequest(request) {
        this.requests.push(request);
        
        // Keep only last 100 requests
        if (this.requests.length > 100) {
            this.requests.shift();
        }
    }
    
    getRequestStats() {
        const stats = {
            total: this.requests.length,
            successful: this.requests.filter(r => !r.error).length,
            failed: this.requests.filter(r => r.error).length,
            avgDuration: 0,
            totalSize: 0
        };
        
        const successful = this.requests.filter(r => !r.error);
        if (successful.length > 0) {
            stats.avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
            stats.totalSize = successful.reduce((sum, r) => sum + (parseInt(r.size) || 0), 0);
        }
        
        return stats;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.networkRequestMonitoringAdvanced = new NetworkRequestMonitoringAdvanced(); });
} else {
    window.networkRequestMonitoringAdvanced = new NetworkRequestMonitoringAdvanced();
}

