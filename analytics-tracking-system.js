/**
 * Analytics Tracking System
 * 
 * Adds analytics tracking for user interactions and feature usage.
 * 
 * @module AnalyticsTrackingSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class AnalyticsTrackingSystem {
    constructor() {
        this.events = [];
        this.maxEvents = 1000;
        this.batchSize = 10;
        this.batchTimer = null;
        this.endpoint = null;
        this.isInitialized = false;
        this.userId = null;
        this.sessionId = null;
    }

    /**
     * Initialize analytics system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('AnalyticsTrackingSystem already initialized');
            return;
        }

        this.endpoint = options.endpoint || null;
        this.userId = this.getUserId();
        this.sessionId = this.getSessionId();
        this.setupAutoTracking();
        this.startBatchTimer();
        
        this.isInitialized = true;
        this.trackTelemetry('tracking_system_initialized');
    }

    /**
     * Track event
     * @public
     * @param {string} eventName - Event name
     * @param {Object} properties - Event properties
     */
    track(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userId: this.userId,
                sessionId: this.sessionId,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };

        this.events.push(event);
        
        // Keep only last maxEvents
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Send immediately if critical event
        if (properties.critical) {
            this.sendEvent(event);
        }
    }

    /**
     * Track page view
     * @public
     * @param {string} page - Page name
     */
    trackPageView(page = null) {
        this.track('page_view', {
            page: page || window.location.pathname,
            title: document.title
        });
    }

    /**
     * Track user interaction
     * @public
     * @param {string} action - Action name
     * @param {string} target - Target element
     * @param {Object} properties - Additional properties
     */
    trackInteraction(action, target, properties = {}) {
        this.track('user_interaction', {
            action,
            target,
            ...properties
        });
    }

    /**
     * Track feature usage
     * @public
     * @param {string} feature - Feature name
     * @param {Object} properties - Additional properties
     */
    trackFeatureUsage(feature, properties = {}) {
        this.track('feature_usage', {
            feature,
            ...properties
        });
    }

    /**
     * Track error
     * @public
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     */
    trackError(error, context = {}) {
        this.track('error', {
            error_message: error.message,
            error_stack: error.stack,
            ...context
        }, { critical: true });
    }

    /**
     * Track performance
     * @public
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {Object} properties - Additional properties
     */
    trackPerformance(metric, value, properties = {}) {
        this.track('performance', {
            metric,
            value,
            ...properties
        });
    }

    /**
     * Set up auto tracking
     * @private
     */
    setupAutoTracking() {
        // Track page view on load
        this.trackPageView();

        // Track clicks
        document.addEventListener('click', (e) => {
            const target = e.target;
            const tagName = target.tagName.toLowerCase();
            const id = target.id;
            const className = target.className;
            const text = target.textContent?.trim().substring(0, 50);

            this.trackInteraction('click', {
                tag: tagName,
                id,
                className: typeof className === 'string' ? className : '',
                text
            });
        }, true);

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackInteraction('form_submit', {
                formId: e.target.id,
                formAction: e.target.action
            });
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.track('page_visibility', {
                hidden: document.hidden
            });
        });
    }

    /**
     * Start batch timer
     * @private
     */
    startBatchTimer() {
        if (!this.endpoint) return;

        this.batchTimer = setInterval(() => {
            this.flushEvents();
        }, 5000); // Flush every 5 seconds
    }

    /**
     * Flush events
     * @private
     */
    async flushEvents() {
        if (this.events.length === 0 || !this.endpoint) {
            return;
        }

        const batch = this.events.splice(0, this.batchSize);

        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ events: batch })
            });
        } catch (error) {
            console.warn('Failed to send analytics events:', error);
            // Re-queue failed events
            this.events.unshift(...batch);
        }
    }

    /**
     * Send single event
     * @private
     * @param {Object} event - Event object
     */
    async sendEvent(event) {
        if (!this.endpoint) return;

        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ events: [event] })
            });
        } catch (error) {
            console.warn('Failed to send analytics event:', error);
        }
    }

    /**
     * Get user ID
     * @private
     * @returns {string|null} User ID
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.id || null;
        } catch {
            return null;
        }
    }

    /**
     * Get session ID
     * @private
     * @returns {string} Session ID
     */
    getSessionId() {
        if (!sessionStorage.getItem('session-id')) {
            sessionStorage.setItem('session-id', `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        }
        return sessionStorage.getItem('session-id');
    }

    /**
     * Get events
     * @public
     * @returns {Array} Events array
     */
    getEvents() {
        return [...this.events];
    }

    /**
     * Clear events
     * @public
     */
    clearEvents() {
        this.events = [];
    }
}

AnalyticsTrackingSystem.prototype.trackTelemetry = function(eventName, data = {}) {
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`tracking_system_${eventName}`, 1, data);
        }
    } catch (e) { /* Silent fail */ }
};

// Create global instance
window.AnalyticsTrackingSystem = AnalyticsTrackingSystem;
window.analytics = new AnalyticsTrackingSystem();
window.analytics.init();

