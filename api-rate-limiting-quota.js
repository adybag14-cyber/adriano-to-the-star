/**
 * API Rate Limiting and Quota Management
 * 
 * Adds comprehensive API rate limiting and quota management.
 * 
 * @module APIRateLimitingQuota
 * @version 1.0.0
 * @author Adriano To The Star
 */

class APIRateLimitingQuota {
    constructor() {
        this.quotas = new Map();
        this.rateLimits = new Map();
        this.requests = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize API rate limiting system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('APIRateLimitingQuota already initialized');
            return;
        }

        this.setupDefaultQuotas();
        this.loadQuotas();
        
        this.isInitialized = true;
        this.trackEvent('quota_initialized');
    }

    /**
     * Set up default quotas
     * @private
     */
    setupDefaultQuotas() {
        // Default quotas per user
        this.setQuota('default', {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
            requestsPerDay: 10000,
            dataTransferPerDay: 100 * 1024 * 1024 // 100 MB
        });

        // Premium user quotas
        this.setQuota('premium', {
            requestsPerMinute: 300,
            requestsPerHour: 10000,
            requestsPerDay: 100000,
            dataTransferPerDay: 1024 * 1024 * 1024 // 1 GB
        });
    }

    /**
     * Set quota
     * @public
     * @param {string} tier - Quota tier
     * @param {Object} quota - Quota configuration
     */
    setQuota(tier, quota) {
        this.quotas.set(tier, quota);
        this.saveQuotas();
    }

    /**
     * Get quota
     * @public
     * @param {string} userId - User ID
     * @returns {Object} Quota configuration
     */
    getQuota(userId) {
        const userTier = this.getUserTier(userId);
        return this.quotas.get(userTier) || this.quotas.get('default');
    }

    /**
     * Check rate limit
     * @public
     * @param {string} userId - User ID
     * @param {string} endpoint - API endpoint
     * @returns {Object} Rate limit check result
     */
    checkRateLimit(userId, endpoint) {
        const quota = this.getQuota(userId);
        const key = `${userId}-${endpoint}`;
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, {
                requests: [],
                dataTransfer: 0,
                resetAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            });
        }

        const limit = this.rateLimits.get(key);
        const now = Date.now();

        // Clean old requests
        limit.requests = limit.requests.filter(time => now - time < 24 * 60 * 60 * 1000);

        // Check per-minute limit
        const requestsLastMinute = limit.requests.filter(time => now - time < 60 * 1000).length;
        if (requestsLastMinute >= quota.requestsPerMinute) {
            return {
                allowed: false,
                reason: 'rate_limit_exceeded',
                retryAfter: 60 - Math.floor((now - limit.requests[0]) / 1000),
                limit: quota.requestsPerMinute
            };
        }

        // Check per-hour limit
        const requestsLastHour = limit.requests.filter(time => now - time < 60 * 60 * 1000).length;
        if (requestsLastHour >= quota.requestsPerHour) {
            return {
                allowed: false,
                reason: 'hourly_limit_exceeded',
                retryAfter: 3600 - Math.floor((now - limit.requests[0]) / 1000),
                limit: quota.requestsPerHour
            };
        }

        // Check per-day limit
        if (limit.requests.length >= quota.requestsPerDay) {
            return {
                allowed: false,
                reason: 'daily_limit_exceeded',
                retryAfter: Math.floor((limit.resetAt - now) / 1000),
                limit: quota.requestsPerDay
            };
        }

        // Check data transfer limit
        if (limit.dataTransfer >= quota.dataTransferPerDay) {
            return {
                allowed: false,
                reason: 'data_transfer_limit_exceeded',
                retryAfter: Math.floor((limit.resetAt - now) / 1000),
                limit: quota.dataTransferPerDay
            };
        }

        return {
            allowed: true,
            remaining: {
                perMinute: quota.requestsPerMinute - requestsLastMinute,
                perHour: quota.requestsPerHour - requestsLastHour,
                perDay: quota.requestsPerDay - limit.requests.length,
                dataTransfer: quota.dataTransferPerDay - limit.dataTransfer
            }
        };
    }

    /**
     * Record request
     * @public
     * @param {string} userId - User ID
     * @param {string} endpoint - API endpoint
     * @param {number} dataSize - Data size in bytes
     */
    recordRequest(userId, endpoint, dataSize = 0) {
        const key = `${userId}-${endpoint}`;
        const limit = this.rateLimits.get(key);
        
        if (limit) {
            limit.requests.push(Date.now());
            limit.dataTransfer += dataSize;

            // Reset if past reset time
            if (Date.now() > limit.resetAt) {
                limit.requests = [];
                limit.dataTransfer = 0;
                limit.resetAt = Date.now() + (24 * 60 * 60 * 1000);
            }
        }
    }

    /**
     * Get usage
     * @public
     * @param {string} userId - User ID
     * @param {string} endpoint - API endpoint
     * @returns {Object} Usage statistics
     */
    getUsage(userId, endpoint) {
        const quota = this.getQuota(userId);
        const key = `${userId}-${endpoint}`;
        const limit = this.rateLimits.get(key);

        if (!limit) {
            return {
                requests: 0,
                dataTransfer: 0,
                quota
            };
        }

        const now = Date.now();
        const requestsLastMinute = limit.requests.filter(time => now - time < 60 * 1000).length;
        const requestsLastHour = limit.requests.filter(time => now - time < 60 * 60 * 1000).length;

        return {
            requests: {
                lastMinute: requestsLastMinute,
                lastHour: requestsLastHour,
                today: limit.requests.length,
                total: limit.requests.length
            },
            dataTransfer: {
                today: limit.dataTransfer,
                total: limit.dataTransfer
            },
            quota,
            resetAt: limit.resetAt
        };
    }

    /**
     * Get user tier
     * @private
     * @param {string} userId - User ID
     * @returns {string} User tier
     */
    getUserTier(userId) {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.tier || 'default';
        } catch {
            return 'default';
        }
    }

    /**
     * Save quotas
     * @private
     */
    saveQuotas() {
        try {
            const quotas = Object.fromEntries(this.quotas);
            localStorage.setItem('api-quotas', JSON.stringify(quotas));
        } catch (e) {
            console.warn('Failed to save quotas:', e);
        }
    }

    /**
     * Load quotas
     * @private
     */
    loadQuotas() {
        try {
            const saved = localStorage.getItem('api-quotas');
            if (saved) {
                const quotas = JSON.parse(saved);
                Object.entries(quotas).forEach(([tier, quota]) => {
                    this.quotas.set(tier, quota);
                });
            }
        } catch (e) {
            console.warn('Failed to load quotas:', e);
        }
    }
}

APIRateLimitingQuota.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`quota_${eventName}`, 1, data);
        }
    } catch (e) { /* Silent fail */ }
};

// Create global instance
window.APIRateLimitingQuota = APIRateLimitingQuota;
window.apiRateLimiting = new APIRateLimitingQuota();
window.apiRateLimiting.init();

