/**
 * Planet Discovery API Rate Limiting
 * Enhanced rate limiting specifically for planet discovery APIs
 */

class PlanetDiscoveryAPIRateLimiting {
    constructor() {
        this.limits = {
            planetSearch: { max: 100, window: 60000 }, // 100 per minute
            planetDetails: { max: 200, window: 60000 }, // 200 per minute
            planetClaim: { max: 10, window: 3600000 }, // 10 per hour
            predictions: { max: 50, window: 60000 }, // 50 per minute
            default: { max: 100, window: 60000 } // 100 per minute
        };
        this.requests = new Map();
        this.init();
    }

    init() {
        // Use existing rate limiter if available
        if (window.RateLimiter) {
            this.rateLimiter = new RateLimiter({
                maxRequests: 100,
                windowMs: 60000,
                endpointLimits: this.limits
            });
        }
        console.log('🚦 API rate limiting initialized');
    }

    checkLimit(endpoint, identifier = 'default') {
        if (this.rateLimiter) {
            return this.rateLimiter.checkLimit(identifier, endpoint);
        }

        // Fallback rate limiting
        const now = Date.now();
        const key = `${identifier}:${endpoint}`;
        const limit = this.limits[endpoint] || this.limits.default;

        if (!this.requests.has(key)) {
            this.requests.set(key, {
                timestamps: [],
                lastReset: now
            });
        }

        const record = this.requests.get(key);
        
        // Clean old timestamps
        record.timestamps = record.timestamps.filter(ts => now - ts < limit.window);

        if (record.timestamps.length >= limit.max) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: record.timestamps[0] + limit.window,
                message: `Rate limit exceeded. Maximum ${limit.max} requests per ${limit.window / 1000} seconds.`
            };
        }

        record.timestamps.push(now);

        return {
            allowed: true,
            remaining: limit.max - record.timestamps.length,
            resetTime: now + limit.window,
            message: 'Request allowed'
        };
    }

    renderRateLimitStatus(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        const status = this.getStatus();

        container.innerHTML = `
            <div class="rate-limit-status" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h4 style="color: #ba944f; margin-bottom: 1rem;">🚦 API Rate Limits</h4>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${Object.entries(this.limits).map(([endpoint, limit]) => {
                        const endpointStatus = status[endpoint] || { remaining: limit.max, used: 0 };
                        const percentage = (endpointStatus.used / limit.max) * 100;
                        const color = percentage > 80 ? '#f87171' : percentage > 60 ? '#fbbf24' : '#4ade80';
                        
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                    <span style="opacity: 0.8; text-transform: capitalize;">${endpoint.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span style="color: ${color}; font-weight: 600;">${endpointStatus.remaining} / ${limit.max} remaining</span>
                                </div>
                                <div style="width: 100%; height: 8px; background: rgba(186, 148, 79, 0.2); border-radius: 5px; overflow: hidden;">
                                    <div style="width: ${percentage}%; height: 100%; background: ${color}; transition: width 0.3s;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    getStatus() {
        const status = {};
        const now = Date.now();

        Object.keys(this.limits).forEach(endpoint => {
            const limit = this.limits[endpoint];
            let used = 0;

            this.requests.forEach((record, key) => {
                if (key.endsWith(`:${endpoint}`)) {
                    const recent = record.timestamps.filter(ts => now - ts < limit.window);
                    used = Math.max(used, recent.length);
                }
            });

            status[endpoint] = {
                used,
                remaining: limit.max - used
            };
        });

        return status;
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryAPIRateLimiting = new PlanetDiscoveryAPIRateLimiting();
}

