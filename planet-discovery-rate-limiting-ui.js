/**
 * Planet Discovery Rate Limiting UI
 * User interface for displaying rate limit status and information
 */

class PlanetDiscoveryRateLimitingUI {
    constructor() {
        this.rateLimits = {
            requests: { used: 0, limit: 100, resetAt: null },
            searches: { used: 0, limit: 50, resetAt: null },
            claims: { used: 0, limit: 10, resetAt: null }
        };
        this.init();
    }

    init() {
        this.loadRateLimits();
        this.setupPolling();
        console.log('🚦 Rate limiting UI initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ra_te_li_mi_ti_ng_ui_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadRateLimits() {
        // Load from API or localStorage
        try {
            const saved = localStorage.getItem('rate-limits');
            if (saved) {
                const limits = JSON.parse(saved);
                Object.keys(this.rateLimits).forEach(key => {
                    if (limits[key]) {
                        this.rateLimits[key] = { ...this.rateLimits[key], ...limits[key] };
                    }
                });
            }
        } catch (error) {
            console.error('Error loading rate limits:', error);
        }
    }

    saveRateLimits() {
        try {
            localStorage.setItem('rate-limits', JSON.stringify(this.rateLimits));
        } catch (error) {
            console.error('Error saving rate limits:', error);
        }
    }

    updateRateLimit(type, used, limit, resetAt = null) {
        if (this.rateLimits[type]) {
            this.rateLimits[type] = { used, limit, resetAt };
            this.saveRateLimits();
            this.updateUI();
        }
    }

    incrementRateLimit(type) {
        if (this.rateLimits[type]) {
            this.rateLimits[type].used++;
            this.saveRateLimits();
            this.updateUI();
        }
    }

    isRateLimited(type) {
        const limit = this.rateLimits[type];
        if (!limit) return false;
        return limit.used >= limit.limit;
    }

    getRemaining(type) {
        const limit = this.rateLimits[type];
        if (!limit) return 0;
        return Math.max(0, limit.limit - limit.used);
    }

    getResetTime(type) {
        const limit = this.rateLimits[type];
        if (!limit || !limit.resetAt) return null;
        return new Date(limit.resetAt);
    }

    setupPolling() {
        // Poll for rate limit updates every 30 seconds
        setInterval(() => {
            this.fetchRateLimits();
        }, 30000);
    }

    async fetchRateLimits() {
        // Fetch from API if available
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                // This would be a custom endpoint or RPC function
                // For now, we'll use localStorage
            } catch (error) {
                console.error('Error fetching rate limits:', error);
            }
        }
    }

    updateUI() {
        // Update any visible rate limit indicators
        const indicators = document.querySelectorAll('.rate-limit-indicator');
        indicators.forEach(indicator => {
            const type = indicator.dataset.type;
            if (type && this.rateLimits[type]) {
                const limit = this.rateLimits[type];
                const percentage = (limit.used / limit.limit) * 100;
                const remaining = this.getRemaining(type);

                indicator.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1; background: rgba(0, 0, 0, 0.3); border-radius: 5px; height: 8px; overflow: hidden;">
                            <div style="height: 100%; background: ${percentage > 80 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#4ade80'}; width: ${percentage}%; transition: width 0.3s;"></div>
                        </div>
                        <span style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.7);">${remaining}/${limit.limit}</span>
                    </div>
                `;
            }
        });
    }

    renderRateLimitPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="rate-limit-panel" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">🚦 Rate Limits</h3>
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${Object.entries(this.rateLimits).map(([type, limit]) => {
                        const percentage = (limit.used / limit.limit) * 100;
                        const remaining = this.getRemaining(type);
                        const color = percentage > 80 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#4ade80';
                        const resetTime = this.getResetTime(type);
                        
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                    <span style="color: rgba(255, 255, 255, 0.9); text-transform: capitalize;">${type}</span>
                                    <span style="color: ${color}; font-weight: bold;">${remaining} remaining</span>
                                </div>
                                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 5px; height: 10px; overflow: hidden;">
                                    <div style="height: 100%; background: ${color}; width: ${percentage}%; transition: width 0.3s;"></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                                    <span style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.7);">${limit.used} / ${limit.limit}</span>
                                    ${resetTime ? `
                                        <span style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.7);">
                                            Resets: ${resetTime.toLocaleTimeString()}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    showRateLimitWarning(type) {
        const limit = this.rateLimits[type];
        if (!limit) return;

        const warning = document.createElement('div');
        warning.className = 'rate-limit-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(239, 68, 68, 0.95);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;

        warning.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                <span>⚠️ Rate limit reached for ${type}. Please wait before trying again.</span>
                <button style="background: transparent; border: none; color: white; font-size: 1.2rem; cursor: pointer;" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(warning);

        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 5000);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryRateLimitingUI = new PlanetDiscoveryRateLimitingUI();
}

