/**
 * API Retry Mechanism
 * Intelligent retry logic for failed API requests
 */

class APIRetryMechanism {
    constructor() {
        this.retryPolicies = new Map();
        this.retryHistory = [];
        this.init();
    }

    init() {
        this.trackEvent('retry_initialized');
    }

    createRetryPolicy(policyId, config) {
        const policy = {
            id: policyId,
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            backoffStrategy: config.backoffStrategy || 'exponential', // linear, exponential, fixed
            retryableErrors: config.retryableErrors || [500, 502, 503, 504],
            jitter: config.jitter || true,
            createdAt: new Date()
        };
        
        this.retryPolicies.set(policyId, policy);
        console.log(`Retry policy created: ${policyId}`);
        return policy;
    }

    async executeWithRetry(policyId, fn, context = {}) {
        const policy = this.retryPolicies.get(policyId);
        if (!policy) {
            throw new Error('Retry policy does not exist');
        }
        
        let attempt = 0;
        let lastError = null;
        
        while (attempt <= policy.maxRetries) {
            try {
                const result = await fn();
                
                if (attempt > 0) {
                    this.recordRetry(policyId, attempt, true, context);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                attempt++;
                
                // Check if error is retryable
                if (!this.isRetryable(error, policy)) {
                    throw error;
                }
                
                // Check if max retries reached
                if (attempt > policy.maxRetries) {
                    this.recordRetry(policyId, attempt, false, context);
                    throw error;
                }
                
                // Calculate delay
                const delay = this.calculateDelay(policy, attempt);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }

    isRetryable(error, policy) {
        const statusCode = error.statusCode || error.code;
        return policy.retryableErrors.includes(statusCode);
    }

    calculateDelay(policy, attempt) {
        let delay = policy.retryDelay;
        
        switch (policy.backoffStrategy) {
            case 'exponential':
                delay = policy.retryDelay * Math.pow(2, attempt - 1);
                break;
            case 'linear':
                delay = policy.retryDelay * attempt;
                break;
            case 'fixed':
                delay = policy.retryDelay;
                break;
        }
        
        // Add jitter if enabled
        if (policy.jitter) {
            const jitter = delay * 0.1 * (Math.random() * 2 - 1);
            delay += jitter;
        }
        
        return Math.max(0, delay);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    recordRetry(policyId, attempt, success, context) {
        this.retryHistory.push({
            policyId,
            attempt,
            success,
            context,
            timestamp: new Date()
        });
    }

    getRetryStats(policyId = null) {
        const history = policyId 
            ? this.retryHistory.filter(h => h.policyId === policyId)
            : this.retryHistory;
        
        const total = history.length;
        const successful = history.filter(h => h.success).length;
        const failed = history.filter(h => !h.success).length;
        
        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? (successful / total) * 100 : 0,
            averageAttempts: history.length > 0
                ? history.reduce((sum, h) => sum + h.attempt, 0) / history.length
                : 0
        };
    }

    getRetryPolicy(policyId) {
        return this.retryPolicies.get(policyId);
    }

    getAllRetryPolicies() {
        return Array.from(this.retryPolicies.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`retry_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRetryMechanism = new APIRetryMechanism();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRetryMechanism;
}

