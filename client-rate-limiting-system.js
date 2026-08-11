/**
 * Client-Side Rate Limiting System
 * 
 * Implements rate limiting on client-side with user-friendly error messages.
 * 
 * @module ClientRateLimitingSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ClientRateLimitingSystem {
    constructor() {
        this.rateLimits = new Map();
        this.defaultLimits = {
            requests: 100,
            window: 60000, // 1 minute
            burst: 10
        };
        this.isInitialized = false;
    }

    /**
     * Initialize rate limiting system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('ClientRateLimitingSystem already initialized');
            return;
        }

        this.defaultLimits = { ...this.defaultLimits, ...options.defaultLimits };
        this.setupGlobalRateLimiting();
        
        this.isInitialized = true;
        this.trackEvent('rate_limit_initialized');
    }

    /**
     * Set up global rate limiting
     * @private
     */
    setupGlobalRateLimiting() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            const endpoint = this.getEndpoint(url);

            if (!this.checkRateLimit(endpoint)) {
                throw new RateLimitError(
                    `Rate limit exceeded for ${endpoint}. Please try again later.`,
                    this.getRetryAfter(endpoint)
                );
            }

            try {
                const response = await originalFetch(...args);
                this.recordRequest(endpoint);
                return response;
            } catch (error) {
                throw error;
            }
        };
    }

    /**
     * Get endpoint from URL
     * @private
     * @param {string} url - Request URL
     * @returns {string} Endpoint identifier
     */
    getEndpoint(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            return url;
        }
    }

    /**
     * Check rate limit
     * @public
     * @param {string} endpoint - Endpoint identifier
     * @param {Object} limits - Custom limits
     * @returns {boolean} True if within limits
     */
    checkRateLimit(endpoint, limits = null) {
        const limitConfig = limits || this.defaultLimits;
        const now = Date.now();
        const windowStart = now - limitConfig.window;

        if (!this.rateLimits.has(endpoint)) {
            this.rateLimits.set(endpoint, {
                requests: [],
                burst: []
            });
        }

        const endpointData = this.rateLimits.get(endpoint);

        // Clean old requests
        endpointData.requests = endpointData.requests.filter(
            timestamp => timestamp > windowStart
        );
        endpointData.burst = endpointData.burst.filter(
            timestamp => timestamp > windowStart
        );

        // Check burst limit
        if (endpointData.burst.length >= limitConfig.burst) {
            return false;
        }

        // Check window limit
        if (endpointData.requests.length >= limitConfig.requests) {
            return false;
        }

        return true;
    }

    /**
     * Record request
     * @private
     * @param {string} endpoint - Endpoint identifier
     */
    recordRequest(endpoint) {
        if (!this.rateLimits.has(endpoint)) {
            this.rateLimits.set(endpoint, {
                requests: [],
                burst: []
            });
        }

        const now = Date.now();
        const endpointData = this.rateLimits.get(endpoint);
        endpointData.requests.push(now);
        endpointData.burst.push(now);
    }

    /**
     * Get retry after time
     * @private
     * @param {string} endpoint - Endpoint identifier
     * @returns {number} Milliseconds until retry
     */
    getRetryAfter(endpoint) {
        if (!this.rateLimits.has(endpoint)) {
            return 0;
        }

        const endpointData = this.rateLimits.get(endpoint);
        if (endpointData.requests.length === 0) {
            return 0;
        }

        const oldestRequest = Math.min(...endpointData.requests);
        const windowStart = Date.now() - this.defaultLimits.window;
        const retryAfter = oldestRequest - windowStart;

        return Math.max(0, retryAfter);
    }

    /**
     * Set rate limit for endpoint
     * @public
     * @param {string} endpoint - Endpoint identifier
     * @param {Object} limits - Rate limit configuration
     */
    setRateLimit(endpoint, limits) {
        this.rateLimits.set(endpoint, {
            requests: [],
            burst: [],
            limits
        });
    }

    /**
     * Get rate limit status
     * @public
     * @param {string} endpoint - Endpoint identifier
     * @returns {Object} Rate limit status
     */
    getRateLimitStatus(endpoint) {
        if (!this.rateLimits.has(endpoint)) {
            return {
                remaining: this.defaultLimits.requests,
                resetAt: Date.now() + this.defaultLimits.window
            };
        }

        const endpointData = this.rateLimits.get(endpoint);
        const limits = endpointData.limits || this.defaultLimits;
        const now = Date.now();
        const windowStart = now - limits.window;

        const recentRequests = endpointData.requests.filter(
            timestamp => timestamp > windowStart
        );

        return {
            remaining: Math.max(0, limits.requests - recentRequests.length),
            resetAt: recentRequests.length > 0 
                ? Math.max(...recentRequests) + limits.window 
                : now + limits.window
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`rate_limit_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

/**
 * Rate Limit Error
 */
class RateLimitError extends Error {
    constructor(message, retryAfter) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

// Create global instance
window.ClientRateLimitingSystem = ClientRateLimitingSystem;
window.RateLimitError = RateLimitError;
window.clientRateLimiter = new ClientRateLimitingSystem();
window.clientRateLimiter.init();

