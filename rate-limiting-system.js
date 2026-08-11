/**
 * Enhanced Rate Limiting System
 * Implements per-user quotas, API key management, and request throttling
 */

class RateLimitingSystem {
    constructor() {
        this.rateLimits = new Map(); // Store rate limit data
        this.apiKeys = new Map(); // Store API keys and their limits
        this.requestHistory = new Map(); // Track request history per user/API key
        this.defaultLimits = {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
            requestsPerDay: 10000,
            burstLimit: 10 // Allow burst of 10 requests
        };
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.cleanupExpiredEntries();
        
        // Cleanup expired entries every 5 minutes
        setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
        
        this.isInitialized = true;
        console.log('🛡️ Rate Limiting System initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_at_el_im_it_in_gs_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Load rate limit data from localStorage/Supabase
     */
    async loadFromStorage() {
        try {
            // Load from localStorage
            const stored = localStorage.getItem('rate-limit-config');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.apiKeys) {
                    this.apiKeys = new Map(Object.entries(data.apiKeys));
                }
                if (data.rateLimits) {
                    this.rateLimits = new Map(Object.entries(data.rateLimits));
                }
            }

            // Load from Supabase if available
            if (window.supabase) {
                try {
                    const { data, error } = await window.supabase
                        .from('rate_limit_configs')
                        .select('*');
                    
                    if (!error && data) {
                        data.forEach(config => {
                            if (config.api_key) {
                                this.apiKeys.set(config.api_key, {
                                    userId: config.user_id,
                                    limits: config.limits,
                                    createdAt: config.created_at
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.warn('Could not load rate limits from Supabase:', error);
                }
            }
        } catch (error) {
            console.error('Error loading rate limit data:', error);
        }
    }

    /**
     * Save rate limit data to storage
     */
    async saveToStorage() {
        try {
            const data = {
                apiKeys: Object.fromEntries(this.apiKeys),
                rateLimits: Object.fromEntries(this.rateLimits),
                lastUpdated: Date.now()
            };
            localStorage.setItem('rate-limit-config', JSON.stringify(data));

            // Save to Supabase if available
            if (window.supabase) {
                try {
                    for (const [apiKey, config] of this.apiKeys.entries()) {
                        await window.supabase
                            .from('rate_limit_configs')
                            .upsert({
                                api_key: apiKey,
                                user_id: config.userId,
                                limits: config.limits,
                                created_at: config.createdAt || new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }, {
                                onConflict: 'api_key'
                            });
                    }
                } catch (error) {
                    console.warn('Could not save rate limits to Supabase:', error);
                }
            }
        } catch (error) {
            console.error('Error saving rate limit data:', error);
        }
    }

    /**
     * Generate API key for user
     */
    generateAPIKey(userId, customLimits = null) {
        const apiKey = this.createSecureToken();
        const limits = customLimits || { ...this.defaultLimits };
        
        this.apiKeys.set(apiKey, {
            userId: userId,
            limits: limits,
            createdAt: Date.now()
        });

        this.saveToStorage();
        
        return apiKey;
    }

    /**
     * Create secure token
     */
    createSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return 'sk_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Check if request is allowed
     */
    async checkRateLimit(identifier, apiKey = null) {
        // Get limits based on API key or default
        let limits = { ...this.defaultLimits };
        let userId = identifier;

        if (apiKey && this.apiKeys.has(apiKey)) {
            const keyConfig = this.apiKeys.get(apiKey);
            limits = keyConfig.limits;
            userId = keyConfig.userId;
        }

        // Get or create request history
        if (!this.requestHistory.has(identifier)) {
            this.requestHistory.set(identifier, {
                requests: [],
                burstCount: 0,
                lastBurstReset: Date.now()
            });
        }

        const history = this.requestHistory.get(identifier);
        const now = Date.now();

        // Clean old requests (older than 24 hours)
        history.requests = history.requests.filter(
            timestamp => now - timestamp < 24 * 60 * 60 * 1000
        );

        // Check burst limit
        if (now - history.lastBurstReset < 1000) { // Within 1 second
            if (history.burstCount >= limits.burstLimit) {
                return {
                    allowed: false,
                    reason: 'burst_limit_exceeded',
                    retryAfter: 1000 - (now - history.lastBurstReset),
                    limit: limits.burstLimit
                };
            }
            history.burstCount++;
        } else {
            history.burstCount = 1;
            history.lastBurstReset = now;
        }

        // Check per-minute limit
        const requestsLastMinute = history.requests.filter(
            timestamp => now - timestamp < 60 * 1000
        ).length;

        if (requestsLastMinute >= limits.requestsPerMinute) {
            const oldestRequest = Math.min(...history.requests.filter(
                timestamp => now - timestamp < 60 * 1000
            ));
            return {
                allowed: false,
                reason: 'rate_limit_exceeded',
                retryAfter: 60 * 1000 - (now - oldestRequest),
                limit: limits.requestsPerMinute,
                period: 'minute'
            };
        }

        // Check per-hour limit
        const requestsLastHour = history.requests.filter(
            timestamp => now - timestamp < 60 * 60 * 1000
        ).length;

        if (requestsLastHour >= limits.requestsPerHour) {
            const oldestRequest = Math.min(...history.requests.filter(
                timestamp => now - timestamp < 60 * 60 * 1000
            ));
            return {
                allowed: false,
                reason: 'rate_limit_exceeded',
                retryAfter: 60 * 60 * 1000 - (now - oldestRequest),
                limit: limits.requestsPerHour,
                period: 'hour'
            };
        }

        // Check per-day limit
        const requestsLastDay = history.requests.filter(
            timestamp => now - timestamp < 24 * 60 * 60 * 1000
        ).length;

        if (requestsLastDay >= limits.requestsPerDay) {
            return {
                allowed: false,
                reason: 'rate_limit_exceeded',
                retryAfter: 24 * 60 * 60 * 1000,
                limit: limits.requestsPerDay,
                period: 'day'
            };
        }

        // Request is allowed - record it
        history.requests.push(now);
        this.requestHistory.set(identifier, history);

        // Log to security audit if available
        if (window.securityAuditLogging) {
            window.securityAuditLogging.logEvent('rate_limit.check', {
                identifier: identifier,
                allowed: true,
                limits: limits
            }, userId);
        }

        return {
            allowed: true,
            remaining: {
                minute: limits.requestsPerMinute - requestsLastMinute - 1,
                hour: limits.requestsPerHour - requestsLastHour - 1,
                day: limits.requestsPerDay - requestsLastDay - 1
            }
        };
    }

    /**
     * Cleanup expired entries
     */
    cleanupExpiredEntries() {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        // Clean request history
        for (const [identifier, history] of this.requestHistory.entries()) {
            history.requests = history.requests.filter(
                timestamp => now - timestamp < 24 * 60 * 60 * 1000
            );
            
            // Remove if no recent activity
            if (history.requests.length === 0 && now - history.lastBurstReset > maxAge) {
                this.requestHistory.delete(identifier);
            }
        }
    }

    /**
     * Revoke API key
     */
    revokeAPIKey(apiKey) {
        if (this.apiKeys.has(apiKey)) {
            this.apiKeys.delete(apiKey);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Get rate limit status for identifier
     */
    getRateLimitStatus(identifier) {
        if (!this.requestHistory.has(identifier)) {
            return {
                requestsLastMinute: 0,
                requestsLastHour: 0,
                requestsLastDay: 0,
                limits: this.defaultLimits
            };
        }

        const history = this.requestHistory.get(identifier);
        const now = Date.now();

        return {
            requestsLastMinute: history.requests.filter(
                timestamp => now - timestamp < 60 * 1000
            ).length,
            requestsLastHour: history.requests.filter(
                timestamp => now - timestamp < 60 * 60 * 1000
            ).length,
            requestsLastDay: history.requests.filter(
                timestamp => now - timestamp < 24 * 60 * 60 * 1000
            ).length,
            limits: this.defaultLimits
        };
    }

    /**
     * Update limits for API key
     */
    updateAPILimits(apiKey, newLimits) {
        if (this.apiKeys.has(apiKey)) {
            const config = this.apiKeys.get(apiKey);
            config.limits = { ...config.limits, ...newLimits };
            this.apiKeys.set(apiKey, config);
            this.saveToStorage();
            return true;
        }
        return false;
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.rateLimitingSystem) {
            window.rateLimitingSystem = new RateLimitingSystem();
        }
    });
}

