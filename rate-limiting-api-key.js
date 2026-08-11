/**
 * Rate Limiting per API Key
 * Implements rate limiting based on API keys
 */

class RateLimitingAPIKey {
    constructor() {
        this.limits = new Map();
        this.usage = new Map();
        this.defaultLimit = {
            requests: 100,
            window: 60000, // 1 minute
            burst: 10
        };
        this.init();
    }

    init() {
        this.trackEvent('r_at_el_im_it_in_ga_pi_ke_y_initialized');
        this.startCleanupInterval();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_at_el_im_it_in_ga_pi_ke_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setLimit(apiKey, limit) {
        this.limits.set(apiKey, {
            requests: limit.requests || this.defaultLimit.requests,
            window: limit.window || this.defaultLimit.window,
            burst: limit.burst || this.defaultLimit.burst
        });
    }

    checkLimit(apiKey) {
        const limit = this.limits.get(apiKey) || this.defaultLimit;
        const now = Date.now();
        
        if (!this.usage.has(apiKey)) {
            this.usage.set(apiKey, {
                requests: [],
                burstCount: 0,
                lastBurstReset: now
            });
        }

        const usage = this.usage.get(apiKey);
        
        // Clean old requests outside the window
        usage.requests = usage.requests.filter(timestamp => 
            now - timestamp < limit.window
        );

        // Reset burst counter if window passed
        if (now - usage.lastBurstReset >= limit.window) {
            usage.burstCount = 0;
            usage.lastBurstReset = now;
        }

        // Check burst limit
        if (usage.burstCount >= limit.burst) {
            return {
                allowed: false,
                reason: 'burst_limit_exceeded',
                retryAfter: limit.window - (now - usage.lastBurstReset)
            };
        }

        // Check rate limit
        if (usage.requests.length >= limit.requests) {
            const oldestRequest = usage.requests[0];
            const retryAfter = limit.window - (now - oldestRequest);
            
            return {
                allowed: false,
                reason: 'rate_limit_exceeded',
                retryAfter: Math.ceil(retryAfter / 1000), // Convert to seconds
                limit: limit.requests,
                remaining: 0,
                reset: oldestRequest + limit.window
            };
        }

        // Allow request
        usage.requests.push(now);
        usage.burstCount++;
        
        return {
            allowed: true,
            limit: limit.requests,
            remaining: limit.requests - usage.requests.length,
            reset: usage.requests[0] + limit.window
        };
    }

    recordRequest(apiKey) {
        return this.checkLimit(apiKey);
    }

    getUsage(apiKey) {
        const limit = this.limits.get(apiKey) || this.defaultLimit;
        const usage = this.usage.get(apiKey);
        
        if (!usage) {
            return {
                limit: limit.requests,
                remaining: limit.requests,
                reset: Date.now() + limit.window
            };
        }

        const now = Date.now();
        const activeRequests = usage.requests.filter(timestamp => 
            now - timestamp < limit.window
        );

        return {
            limit: limit.requests,
            remaining: Math.max(0, limit.requests - activeRequests.length),
            reset: activeRequests.length > 0 
                ? activeRequests[0] + limit.window 
                : now + limit.window
        };
    }

    resetUsage(apiKey) {
        this.usage.delete(apiKey);
    }

    startCleanupInterval() {
        // Clean up old usage data every 5 minutes
        setInterval(() => {
            const now = Date.now();
            const maxAge = 3600000; // 1 hour
            
            for (const [apiKey, usage] of this.usage.entries()) {
                const limit = this.limits.get(apiKey) || this.defaultLimit;
                const cutoff = now - Math.max(limit.window, maxAge);
                
                usage.requests = usage.requests.filter(timestamp => timestamp > cutoff);
                
                // Remove empty usage entries
                if (usage.requests.length === 0 && usage.burstCount === 0) {
                    this.usage.delete(apiKey);
                }
            }
        }, 300000); // Every 5 minutes
    }

    // Middleware function
    middleware() {
        return (req, res, next) => {
            const apiKey = this.extractAPIKey(req);
            
            if (!apiKey) {
                return res.status(401).json({
                    error: 'API key required',
                    code: 'MISSING_API_KEY'
                });
            }

            const result = this.recordRequest(apiKey);
            
            if (!result.allowed) {
                res.setHeader('X-RateLimit-Limit', result.limit || 0);
                res.setHeader('X-RateLimit-Remaining', 0);
                res.setHeader('X-RateLimit-Reset', result.reset || Date.now());
                res.setHeader('Retry-After', result.retryAfter || 60);
                
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    code: result.reason,
                    retryAfter: result.retryAfter
                });
            }

            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', result.limit);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', result.reset);
            
            next();
        };
    }

    extractAPIKey(req) {
        // Try header first
        if (req.headers?.['x-api-key']) {
            return req.headers['x-api-key'];
        }
        
        // Try Authorization header
        const authHeader = req.headers?.authorization || req.headers?.Authorization;
        if (authHeader && authHeader.startsWith('ApiKey ')) {
            return authHeader.substring(7);
        }
        
        // Try query parameter
        if (req.query?.api_key) {
            return req.query.api_key;
        }
        
        return null;
    }
}

// Auto-initialize
const rateLimitingAPI = new RateLimitingAPIKey();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimitingAPIKey;
}

