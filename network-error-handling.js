/**
 * Network Error Handling
 * Handles network errors gracefully
 */

class NetworkErrorHandling {
    constructor() {
        this.init();
    }
    
    init() {
        this.interceptErrors();
        this.setupRetryLogic();
    }
    
    interceptErrors() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(url, options = {}) {
            try {
                return await originalFetch(url, options);
            } catch (error) {
                return self.handleError(error, url, options);
            }
        };
    }
    
    async handleError(error, url, options) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            // Network error
            if (window.toastNotificationQueue) {
                window.toastNotificationQueue.show('Network error. Please check your connection.', 'error');
            }
            
            // Try retry
            if (options.retry !== false) {
                return this.retryRequest(url, options);
            }
        }
        
        throw error;
    }
    
    async retryRequest(url, options, maxRetries = 3) {
        // Retry request with exponential backoff
        for (let i = 0; i < maxRetries; i++) {
            await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
            
            try {
                return await fetch(url, options);
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw error;
                }
            }
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    setupRetryLogic() {
        // Setup automatic retry for failed requests
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.networkErrorHandling = new NetworkErrorHandling(); });
} else {
    window.networkErrorHandling = new NetworkErrorHandling();
}

