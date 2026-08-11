/**
 * API Timeout Management
 * Timeout handling and management for API requests
 */

class APITimeoutManagement {
    constructor() {
        this.timeouts = new Map();
        this.timeoutConfigs = new Map();
        this.timeoutHistory = [];
        this.init();
    }

    init() {
        this.trackEvent('timeout_mgmt_initialized');
    }

    createTimeoutConfig(configId, endpoint, timeout, retry = false) {
        const config = {
            id: configId,
            endpoint,
            timeout,
            retry,
            enabled: true,
            createdAt: new Date()
        };
        
        this.timeoutConfigs.set(configId, config);
        console.log(`Timeout config created: ${configId}`);
        return config;
    }

    async executeWithTimeout(requestId, fn, timeout = 5000) {
        const timeoutId = `timeout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const timeoutPromise = new Promise((_, reject) => {
            const timer = setTimeout(() => {
                this.recordTimeout(requestId, timeout);
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);
            
            this.timeouts.set(timeoutId, {
                id: timeoutId,
                requestId,
                timer,
                timeout,
                startedAt: new Date()
            });
        });
        
        try {
            const result = await Promise.race([fn(), timeoutPromise]);
            this.clearTimeout(timeoutId);
            return result;
        } catch (error) {
            this.clearTimeout(timeoutId);
            throw error;
        }
    }

    clearTimeout(timeoutId) {
        const timeout = this.timeouts.get(timeoutId);
        if (timeout) {
            clearTimeout(timeout.timer);
            this.timeouts.delete(timeoutId);
        }
    }

    recordTimeout(requestId, timeout) {
        this.timeoutHistory.push({
            requestId,
            timeout,
            timestamp: new Date()
        });
        console.log(`Timeout recorded for request: ${requestId}`);
    }

    getTimeoutForEndpoint(endpoint) {
        for (const config of this.timeoutConfigs.values()) {
            if (config.enabled && endpoint.includes(config.endpoint)) {
                return config.timeout;
            }
        }
        return 5000; // Default timeout
    }

    getTimeoutStats() {
        const total = this.timeoutHistory.length;
        const byTimeout = {};
        
        this.timeoutHistory.forEach(record => {
            const key = `${record.timeout}ms`;
            byTimeout[key] = (byTimeout[key] || 0) + 1;
        });
        
        return {
            total,
            byTimeout,
            averageTimeout: total > 0
                ? this.timeoutHistory.reduce((sum, r) => sum + r.timeout, 0) / total
                : 0
        };
    }

    getTimeoutConfig(configId) {
        return this.timeoutConfigs.get(configId);
    }

    getAllTimeoutConfigs() {
        return Array.from(this.timeoutConfigs.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`timeout_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiTimeoutManagement = new APITimeoutManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APITimeoutManagement;
}

