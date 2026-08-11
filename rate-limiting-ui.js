/**
 * Rate Limiting UI Indicators
 * Visual feedback for rate limit status
 */

class RateLimitingUI {
    constructor(rateLimiter) {
        this.rateLimiter = rateLimiter || window.rateLimiter;
        this.indicator = null;
        this.updateInterval = null;
        this.isVisible = false;
        
        if (this.rateLimiter) {
            this.init();
        }
    }

    init() {
        // Create UI indicator
        this.createIndicator();
        
        // Start update interval
        this.startUpdateInterval();
        
        // Listen for rate limit events
        this.setupEventListeners();
    }

    /**
     * Create rate limit indicator
     */
    createIndicator() {
        if (document.getElementById('rate-limit-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'rate-limit-indicator';
        indicator.className = 'rate-limit-indicator';
        indicator.innerHTML = `
            <div class="rate-limit-content">
                <div class="rate-limit-icon">⚡</div>
                <div class="rate-limit-info">
                    <div class="rate-limit-label">API Rate Limit</div>
                    <div class="rate-limit-stats">
                        <span class="rate-limit-remaining" id="rate-limit-remaining">--</span>
                        <span class="rate-limit-separator">/</span>
                        <span class="rate-limit-total" id="rate-limit-total">--</span>
                    </div>
                </div>
                <div class="rate-limit-progress">
                    <div class="rate-limit-progress-bar" id="rate-limit-progress-bar"></div>
                </div>
            </div>
            <button class="rate-limit-toggle" id="rate-limit-toggle" title="Toggle Rate Limit Indicator">
                <span>▼</span>
            </button>
        `;

        document.body.appendChild(indicator);
        this.indicator = indicator;

        // Add toggle functionality
        const toggle = document.getElementById('rate-limit-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleVisibility());
        }

        // Inject styles
        this.injectStyles();
    }

    /**
     * Update indicator with current rate limit status
     */
    updateIndicator() {
        if (!this.rateLimiter || !this.indicator) return;
        
        // Check if rate limiter is properly initialized
        if (!this.rateLimiter.config || !this.rateLimiter.getRemaining) {
            console.warn('Rate limiter not properly initialized');
            return;
        }

        const identifier = RateLimiter.getUserIdentifier();
        const remaining = this.rateLimiter.getRemaining(identifier, 'default');
        const limit = this.rateLimiter.config.maxRequests || 100;
        const used = Math.max(0, limit - remaining);
        const percentage = limit > 0 ? (used / limit) * 100 : 0;

        // Update remaining count
        const remainingEl = document.getElementById('rate-limit-remaining');
        const totalEl = document.getElementById('rate-limit-total');
        const progressBar = document.getElementById('rate-limit-progress-bar');

        if (remainingEl) {
            remainingEl.textContent = remaining;
            remainingEl.className = `rate-limit-remaining ${this.getStatusClass(percentage)}`;
        }

        if (totalEl) {
            totalEl.textContent = limit;
        }

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.className = `rate-limit-progress-bar ${this.getStatusClass(percentage)}`;
        }

        // Show warning if approaching limit
        if (percentage >= 80 && percentage < 100) {
            this.showWarning(remaining, percentage);
        } else if (percentage >= 100) {
            this.showError(remaining);
        } else {
            this.hideWarning();
        }

        // Update indicator visibility based on usage
        if (percentage > 0 || this.isVisible) {
            this.show();
        }
    }

    /**
     * Get status class based on percentage
     */
    getStatusClass(percentage) {
        if (percentage >= 100) return 'status-error';
        if (percentage >= 80) return 'status-warning';
        if (percentage >= 50) return 'status-caution';
        return 'status-ok';
    }

    /**
     * Show warning notification
     */
    showWarning(remaining, percentage) {
        let warning = document.getElementById('rate-limit-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'rate-limit-warning';
            warning.className = 'rate-limit-warning';
            document.body.appendChild(warning);
        }

        warning.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <div class="warning-text">
                    <strong>Rate Limit Warning</strong>
                    <p>You've used ${percentage.toFixed(0)}% of your API rate limit. ${remaining} requests remaining.</p>
                </div>
                <button class="warning-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        warning.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (warning && warning.parentNode) {
                warning.style.opacity = '0';
                setTimeout(() => {
                    if (warning && warning.parentNode) {
                        warning.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Show error notification
     */
    showError(remaining) {
        // Error is already shown by rate-limiting.js
        // Just update the indicator
        if (this.indicator) {
            this.indicator.classList.add('rate-limit-exceeded');
        }
    }

    /**
     * Hide warning
     */
    hideWarning() {
        const warning = document.getElementById('rate-limit-warning');
        if (warning) {
            warning.remove();
        }
        if (this.indicator) {
            this.indicator.classList.remove('rate-limit-exceeded');
        }
    }

    /**
     * Show indicator
     */
    show() {
        if (this.indicator) {
            this.indicator.style.display = 'flex';
            this.isVisible = true;
        }
    }

    /**
     * Hide indicator
     */
    hide() {
        if (this.indicator) {
            this.indicator.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Toggle visibility
     */
    toggleVisibility() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Start update interval
     */
    startUpdateInterval() {
        // Update every 2 seconds
        this.updateInterval = setInterval(() => {
            this.updateIndicator();
        }, 2000);

        // Initial update
        this.updateIndicator();
    }

    /**
     * Stop update interval
     */
    stopUpdateInterval() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for rate limit exceeded events
        if (this.rateLimiter && this.rateLimiter.config) {
            const originalOnLimitExceeded = this.rateLimiter.config.onLimitExceeded;
            this.rateLimiter.config.onLimitExceeded = (info) => {
                if (originalOnLimitExceeded) {
                    originalOnLimitExceeded(info);
                }
                this.updateIndicator();
                this.showError(info.remaining);
            };

            const originalOnLimitWarning = this.rateLimiter.config.onLimitWarning;
            this.rateLimiter.config.onLimitWarning = (info) => {
                if (originalOnLimitWarning) {
                    originalOnLimitWarning(info);
                }
                this.updateIndicator();
                this.showWarning(info.remaining, parseFloat(info.usagePercent));
            };
        }
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('rate-limiting-ui-styles')) return;

        const style = document.createElement('style');
        style.id = 'rate-limiting-ui-styles';
        style.textContent = `
            .rate-limit-indicator {
                position: fixed;
                bottom: 100px;
                right: 20px;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 30, 0.95));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 12px;
                padding: 1rem;
                min-width: 250px;
                max-width: 300px;
                z-index: 9999;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                font-family: 'Raleway', sans-serif;
                transition: all 0.3s ease;
                display: none;
            }

            .rate-limit-indicator.rate-limit-exceeded {
                border-color: rgba(220, 53, 69, 0.8);
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(20, 20, 30, 0.95));
            }

            .rate-limit-content {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .rate-limit-content > div:first-child {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .rate-limit-icon {
                font-size: 1.5rem;
            }

            .rate-limit-info {
                flex: 1;
            }

            .rate-limit-label {
                font-size: 0.85rem;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 0.25rem;
            }

            .rate-limit-stats {
                display: flex;
                align-items: baseline;
                gap: 0.25rem;
            }

            .rate-limit-remaining {
                font-size: 1.5rem;
                font-weight: bold;
                color: #44ff44;
            }

            .rate-limit-remaining.status-warning {
                color: #ffd700;
            }

            .rate-limit-remaining.status-caution {
                color: #ffaa00;
            }

            .rate-limit-remaining.status-error {
                color: #ff4444;
            }

            .rate-limit-separator {
                color: rgba(255, 255, 255, 0.5);
                font-size: 1rem;
            }

            .rate-limit-total {
                font-size: 1rem;
                color: rgba(255, 255, 255, 0.7);
            }

            .rate-limit-progress {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }

            .rate-limit-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #44ff44, #ffd700);
                transition: width 0.3s ease, background 0.3s ease;
                border-radius: 3px;
            }

            .rate-limit-progress-bar.status-warning {
                background: linear-gradient(90deg, #ffd700, #ffaa00);
            }

            .rate-limit-progress-bar.status-caution {
                background: linear-gradient(90deg, #ffaa00, #ff8800);
            }

            .rate-limit-progress-bar.status-error {
                background: linear-gradient(90deg, #ff4444, #cc0000);
            }

            .rate-limit-toggle {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                font-size: 0.8rem;
                padding: 0.25rem;
                transition: color 0.2s;
            }

            .rate-limit-toggle:hover {
                color: #ba944f;
            }

            .rate-limit-warning {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 170, 0, 0.95));
                color: #000;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10001;
                max-width: 400px;
                font-family: 'Raleway', sans-serif;
                animation: slideInRight 0.3s ease;
                transition: opacity 0.3s ease;
            }

            .warning-content {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
            }

            .warning-icon {
                font-size: 1.5rem;
            }

            .warning-text {
                flex: 1;
            }

            .warning-text strong {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 1rem;
            }

            .warning-text p {
                margin: 0;
                font-size: 0.9rem;
                opacity: 0.9;
            }

            .warning-close {
                background: transparent;
                border: none;
                color: #000;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .warning-close:hover {
                opacity: 1;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @media (max-width: 768px) {
                .rate-limit-indicator {
                    bottom: 80px;
                    right: 10px;
                    left: 10px;
                    min-width: auto;
                    max-width: none;
                }

                .rate-limit-warning {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Destroy UI
     */
    destroy() {
        this.stopUpdateInterval();
        if (this.indicator) {
            this.indicator.remove();
        }
        const warning = document.getElementById('rate-limit-warning');
        if (warning) {
            warning.remove();
        }
    }
}

// Initialize globally
let rateLimitingUIInstance = null;

function initRateLimitingUI() {
    if (!rateLimitingUIInstance && window.rateLimiter) {
        rateLimitingUIInstance = new RateLimitingUI(window.rateLimiter);
    }
    return rateLimitingUIInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRateLimitingUI);
} else {
    // Wait a bit for rate limiter to initialize
    setTimeout(initRateLimitingUI, 500);
}

// Export globally
window.RateLimitingUI = RateLimitingUI;
window.rateLimitingUI = () => rateLimitingUIInstance;

