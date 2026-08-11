/**
 * API Rate Limiting Dashboard and Monitoring
 * Monitor and manage API rate limits
 */
(function() {
    'use strict';

    class APIRateLimitingDashboard {
        constructor() {
            this.limits = new Map();
            this.usage = new Map();
            this.init();
        }

        init() {
            this.setupUI();
            this.startMonitoring();
            this.trackEvent('dashboard_initialized');
        }

        setupUI() {
            if (!document.getElementById('rate-limiting-dashboard')) {
                const dashboard = document.createElement('div');
                dashboard.id = 'rate-limiting-dashboard';
                dashboard.className = 'rate-limiting-dashboard';
                dashboard.innerHTML = `
                    <div class="dashboard-header">
                        <h2>API Rate Limiting</h2>
                        <button class="refresh-btn" id="refresh-rates">Refresh</button>
                    </div>
                    <div class="limits-grid" id="limits-grid"></div>
                    <div class="usage-chart" id="usage-chart"></div>
                `;
                document.body.appendChild(dashboard);
            }
        }

        setLimit(endpoint, limit) {
            this.limits.set(endpoint, limit);
            this.renderLimits();
        }

        recordUsage(endpoint, count = 1) {
            const current = this.usage.get(endpoint) || 0;
            this.usage.set(endpoint, current + count);
            this.renderLimits();
        }

        renderLimits() {
            const grid = document.getElementById('limits-grid');
            if (!grid) return;

            grid.innerHTML = Array.from(this.limits.entries()).map(([endpoint, limit]) => {
                const usage = this.usage.get(endpoint) || 0;
                const percentage = (usage / limit) * 100;
                const status = percentage >= 90 ? 'critical' : percentage >= 70 ? 'warning' : 'normal';

                return `
                    <div class="limit-card ${status}">
                        <div class="limit-endpoint">${endpoint}</div>
                        <div class="limit-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <div class="limit-stats">
                                <span>${usage} / ${limit}</span>
                                <span>${percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="limit-actions">
                            <button class="reset-btn" data-endpoint="${endpoint}">Reset</button>
                        </div>
                    </div>
                `;
            }).join('');

            // Add reset handlers
            grid.querySelectorAll('.reset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.resetUsage(btn.dataset.endpoint);
                });
            });
        }

        resetUsage(endpoint) {
            this.usage.set(endpoint, 0);
            this.renderLimits();
        }

        startMonitoring() {
            // Monitor API calls
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const url = args[0];
                const endpoint = this.extractEndpoint(url);
                
                if (endpoint && this.limits.has(endpoint)) {
                    const limit = this.limits.get(endpoint);
                    const usage = this.usage.get(endpoint) || 0;
                    
                    if (usage >= limit) {
                        throw new Error(`Rate limit exceeded for ${endpoint}`);
                    }
                    
                    this.recordUsage(endpoint);
                }
                
                return originalFetch.apply(this, args);
            };

            // Refresh display every 5 seconds
            setInterval(() => {
                this.renderLimits();
            }, 5000);
        }

        extractEndpoint(url) {
            if (typeof url === 'string') {
                try {
                    const urlObj = new URL(url);
                    return urlObj.pathname;
                } catch {
                    return url;
                }
            }
            return null;
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`rate_limit_dashboard_${eventName}`, 1, data);
                }
                if (window.analytics) {
                    window.analytics.track(eventName, { module: 'api_rate_limiting_dashboard', ...data });
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.apiRateLimiting = new APIRateLimitingDashboard();
        });
    } else {
        window.apiRateLimiting = new APIRateLimitingDashboard();
    }
})();


