/**
 * Rate Limiting System
 * Prevents API abuse and ensures fair resource usage
 */

class RateLimiter {
    constructor(options = {}) {
        this.requests = new Map(); // Store request timestamps
        this.config = {
            // Default limits
            maxRequests: options.maxRequests || 100, // Max requests per window
            windowMs: options.windowMs || 60000, // 1 minute window
            maxRequestsPerSecond: options.maxRequestsPerSecond || 10, // Max requests per second
            maxRequestsPerMinute: options.maxRequestsPerMinute || 60, // Max requests per minute
            maxRequestsPerHour: options.maxRequestsPerHour || 1000, // Max requests per hour
            
            // Per-endpoint limits
            endpointLimits: options.endpointLimits || {},
            
            // Storage
            storageKey: options.storageKey || 'rate-limit-data',
            useLocalStorage: options.useLocalStorage !== false, // Default true
            
            // Callbacks
            onLimitExceeded: options.onLimitExceeded || null,
            onLimitWarning: options.onLimitWarning || null,
            
            // Warning threshold (percentage)
            warningThreshold: options.warningThreshold || 0.8 // Warn at 80% of limit
        };
        
        this.loadFromStorage();
        this.startCleanupInterval();
    }

    /**
     * Check if request is allowed
     * @param {string} identifier - User/IP identifier
     * @param {string} endpoint - API endpoint (optional)
     * @returns {Object} { allowed: boolean, remaining: number, resetTime: number, message: string }
     */
    checkLimit(identifier, endpoint = 'default') {
        const now = Date.now();
        const key = `${identifier}:${endpoint}`;
        
        // Get or create request history
        if (!this.requests.has(key)) {
            this.requests.set(key, {
                timestamps: [],
                lastReset: now
            });
        }
        
        const history = this.requests.get(key);
        
        // Clean old timestamps outside the window
        history.timestamps = history.timestamps.filter(
            timestamp => (now - timestamp) < this.config.windowMs
        );
        
        // Get endpoint-specific limit or use default
        const limit = this.config.endpointLimits[endpoint]?.maxRequests || this.config.maxRequests;
        const windowMs = this.config.endpointLimits[endpoint]?.windowMs || this.config.windowMs;
        
        // Check per-second limit
        const recentSecond = history.timestamps.filter(
            timestamp => (now - timestamp) < 1000
        ).length;
        
        if (recentSecond >= this.config.maxRequestsPerSecond) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: now + 1000,
                message: 'Rate limit exceeded: Too many requests per second. Please wait a moment.',
                limitType: 'per-second'
            };
        }
        
        // Check per-minute limit
        const recentMinute = history.timestamps.filter(
            timestamp => (now - timestamp) < 60000
        ).length;
        
        if (recentMinute >= this.config.maxRequestsPerMinute) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: now + 60000,
                message: 'Rate limit exceeded: Too many requests per minute. Please wait.',
                limitType: 'per-minute'
            };
        }
        
        // Check per-hour limit
        const recentHour = history.timestamps.filter(
            timestamp => (now - timestamp) < 3600000
        ).length;
        
        if (recentHour >= this.config.maxRequestsPerHour) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: now + 3600000,
                message: 'Rate limit exceeded: Too many requests per hour. Please try again later.',
                limitType: 'per-hour'
            };
        }
        
        // Check window limit
        const count = history.timestamps.length;
        const remaining = Math.max(0, limit - count);
        
        if (count >= limit) {
            const oldestTimestamp = Math.min(...history.timestamps);
            const resetTime = oldestTimestamp + windowMs;
            
            return {
                allowed: false,
                remaining: 0,
                resetTime: resetTime,
                message: `Rate limit exceeded: Maximum ${limit} requests per ${windowMs / 1000} seconds. Please wait.`,
                limitType: 'window'
            };
        }
        
        // Check warning threshold
        const usagePercent = count / limit;
        if (usagePercent >= this.config.warningThreshold && this.config.onLimitWarning) {
            this.config.onLimitWarning({
                identifier,
                endpoint,
                remaining,
                usagePercent: (usagePercent * 100).toFixed(1)
            });
        }
        
        // Record request
        history.timestamps.push(now);
        this.saveToStorage();
        
        return {
            allowed: true,
            remaining: remaining - 1,
            resetTime: now + windowMs,
            message: 'Request allowed',
            limitType: 'window'
        };
    }

    /**
     * Record a request (alternative to checkLimit)
     */
    recordRequest(identifier, endpoint = 'default') {
        const result = this.checkLimit(identifier, endpoint);
        if (!result.allowed) {
            if (this.config.onLimitExceeded) {
                this.config.onLimitExceeded({
                    identifier,
                    endpoint,
                    ...result
                });
            }
            throw new Error(result.message);
        }
        return result;
    }

    /**
     * Get remaining requests for identifier
     */
    getRemaining(identifier, endpoint = 'default') {
        const now = Date.now();
        const key = `${identifier}:${endpoint}`;
        
        if (!this.requests.has(key)) {
            return this.config.endpointLimits[endpoint]?.maxRequests || this.config.maxRequests;
        }
        
        const history = this.requests.get(key);
        history.timestamps = history.timestamps.filter(
            timestamp => (now - timestamp) < this.config.windowMs
        );
        
        const limit = this.config.endpointLimits[endpoint]?.maxRequests || this.config.maxRequests;
        return Math.max(0, limit - history.timestamps.length);
    }

    /**
     * Reset limits for identifier
     */
    reset(identifier, endpoint = 'default') {
        const key = `${identifier}:${endpoint}`;
        this.requests.delete(key);
        this.saveToStorage();
    }

    /**
     * Reset all limits
     */
    resetAll() {
        this.requests.clear();
        this.saveToStorage();
    }

    /**
     * Clean up old entries
     */
    cleanup() {
        const now = Date.now();
        const maxAge = this.config.windowMs * 2; // Keep entries for 2x window
        
        for (const [key, history] of this.requests.entries()) {
            // Remove old timestamps
            history.timestamps = history.timestamps.filter(
                timestamp => (now - timestamp) < maxAge
            );
            
            // Remove entry if no recent activity
            if (history.timestamps.length === 0 && (now - history.lastReset) > maxAge) {
                this.requests.delete(key);
            }
        }
        
        this.saveToStorage();
    }

    /**
     * Start cleanup interval
     */
    startCleanupInterval() {
        // Cleanup every 5 minutes
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Save to localStorage
     */
    saveToStorage() {
        if (!this.config.useLocalStorage) return;
        
        try {
            const data = {};
            for (const [key, history] of this.requests.entries()) {
                data[key] = {
                    timestamps: history.timestamps,
                    lastReset: history.lastReset
                };
            }
            localStorage.setItem(this.config.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save rate limit data to localStorage:', error);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        if (!this.config.useLocalStorage) return;
        
        try {
            const data = localStorage.getItem(this.config.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                const now = Date.now();
                
                for (const [key, history] of Object.entries(parsed)) {
                    // Only load recent entries (within last hour)
                    const recentTimestamps = history.timestamps.filter(
                        timestamp => (now - timestamp) < 3600000
                    );
                    
                    if (recentTimestamps.length > 0) {
                        this.requests.set(key, {
                            timestamps: recentTimestamps,
                            lastReset: history.lastReset || now
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load rate limit data from localStorage:', error);
        }
    }

    /**
     * Get user identifier (IP or user ID)
     */
    static getUserIdentifier() {
        // Try to get user ID from auth
        if (typeof window !== 'undefined' && window.supabase) {
            // This would need to be implemented with actual auth
            // For now, use a combination of factors
        }
        
        // Fallback to session-based identifier
        let identifier = sessionStorage.getItem('user-identifier');
        if (!identifier) {
            identifier = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('user-identifier', identifier);
        }
        
        return identifier;
    }
}

/**
 * Rate-limited fetch wrapper
 */
class RateLimitedFetch {
    constructor(rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    /**
     * Fetch with rate limiting
     */
    async fetch(url, options = {}) {
        const identifier = RateLimiter.getUserIdentifier();
        const endpoint = new URL(url, window.location.origin).pathname;
        
        // Check rate limit
        const limitCheck = this.rateLimiter.checkLimit(identifier, endpoint);
        
        if (!limitCheck.allowed) {
            // Add rate limit headers to response
            const error = new Error(limitCheck.message);
            error.status = 429; // Too Many Requests
            error.retryAfter = Math.ceil((limitCheck.resetTime - Date.now()) / 1000);
            error.remaining = limitCheck.remaining;
            error.resetTime = limitCheck.resetTime;
            
            // Show user-friendly error
            this.showRateLimitError(limitCheck);
            
            throw error;
        }
        
        // Record request
        this.rateLimiter.recordRequest(identifier, endpoint);
        
        // Perform fetch
        try {
            const response = await fetch(url, options);
            
            // Add rate limit headers to response
            const remaining = this.rateLimiter.getRemaining(identifier, endpoint);
            const resetTime = limitCheck.resetTime;
            
            // Store in response headers (if we could modify them)
            response.rateLimit = {
                remaining,
                resetTime,
                limit: this.rateLimiter.config.maxRequests
            };
            
            return response;
        } catch (error) {
            // Don't count failed requests against rate limit
            // (optional: could reset on error)
            throw error;
        }
    }

    /**
     * Show rate limit error to user
     */
    showRateLimitError(limitCheck) {
        // Create or update error notification
        let errorEl = document.getElementById('rate-limit-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'rate-limit-error';
            errorEl.className = 'rate-limit-error';
            errorEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(220, 53, 69, 0.95);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                max-width: 400px;
                font-family: 'Raleway', sans-serif;
                animation: slideInRight 0.3s ease;
            `;
            document.body.appendChild(errorEl);
        }
        
        const waitSeconds = Math.ceil((limitCheck.resetTime - Date.now()) / 1000);
        errorEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.5rem;">⚠️</span>
                <strong>Rate Limit Exceeded</strong>
            </div>
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">${limitCheck.message}</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; opacity: 0.8;">Please wait ${waitSeconds} seconds before trying again.</p>
        `;
        
        // Auto-remove after delay
        setTimeout(() => {
            if (errorEl && errorEl.parentNode) {
                errorEl.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (errorEl && errorEl.parentNode) {
                        errorEl.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Initialize global rate limiter
let rateLimiterInstance = null;

function initRateLimiter(options) {
    if (!rateLimiterInstance) {
        rateLimiterInstance = new RateLimiter(options);
    }
    return rateLimiterInstance;
}

// Auto-initialize
if (typeof window !== 'undefined') {
    window.rateLimiter = initRateLimiter({
        maxRequests: 100,
        windowMs: 60000,
        maxRequestsPerSecond: 10,
        onLimitExceeded: (info) => {
            console.warn('Rate limit exceeded:', info);
        },
        onLimitWarning: (info) => {
            console.info('Rate limit warning:', `${info.usagePercent}% used`);
        }
    });
    
    // Create rate-limited fetch wrapper
    window.rateLimitedFetch = new RateLimitedFetch(window.rateLimiter);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RateLimiter, RateLimitedFetch };
}

window.RateLimiter = RateLimiter;
window.RateLimitedFetch = RateLimitedFetch;

