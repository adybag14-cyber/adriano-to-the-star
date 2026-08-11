/**
 * Custom Event Tracking System
 * Tracks custom events and user interactions
 */

class CustomEventTrackingSystem {
    constructor() {
        this.events = [];
        this.batchSize = 10;
        this.batchTimer = null;
        this.init();
    }
    
    init() {
        this.setupAutoTracking();
        this.startBatching();
        this.trackTelemetry('custom_event_tracking_initialized');
    }
    
    setupAutoTracking() {
        // Auto-track common events
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, a, [data-track]')) {
                this.track('click', {
                    element: e.target.tagName,
                    text: e.target.textContent?.substring(0, 50),
                    href: e.target.href || null
                });
            }
        });
        
        document.addEventListener('submit', (e) => {
            this.track('form_submit', {
                form: e.target.id || e.target.className,
                action: e.target.action || null
            });
        });
    }
    
    track(eventName, properties = {}) {
        // Track custom event
        const event = {
            name: eventName,
            properties: {
                ...properties,
                url: window.location.href,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                referrer: document.referrer
            }
        };
        
        this.events.push(event);
        
        // Send immediately if high priority
        if (properties.priority === 'high') {
            this.sendEvent(event);
        } else {
            // Batch send
            this.scheduleBatch();
        }
    }
    
    scheduleBatch() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }
        
        this.batchTimer = setTimeout(() => {
            this.sendBatch();
        }, 5000); // Batch every 5 seconds
    }
    
    async sendBatch() {
        if (this.events.length === 0) return;
        
        const batch = this.events.splice(0, this.batchSize);
        
        // Send to analytics
        if (window.supabase) {
            await window.supabase
                .from('events')
                .insert(batch.map(e => ({
                    name: e.name,
                    properties: e.properties,
                    timestamp: new Date(e.properties.timestamp).toISOString()
                })));
        }
        
        // Also send to external analytics if available
        if (window.analytics && window.analytics.track) {
            batch.forEach(event => {
                window.analytics.track(event.name, event.properties);
            });
        }
    }
    
    async sendEvent(event) {
        // Send single event immediately
        if (window.supabase) {
            await window.supabase
                .from('events')
                .insert({
                    name: event.name,
                    properties: event.properties,
                    timestamp: new Date(event.properties.timestamp).toISOString()
                });
        }
        
        if (window.analytics && window.analytics.track) {
            window.analytics.track(event.name, event.properties);
        }
    }
    
    startBatching() {
        // Periodically send batches
        setInterval(() => {
            if (this.events.length > 0) {
                this.sendBatch();
            }
        }, 30000); // Every 30 seconds
    }
    
    trackPageView() {
        this.track('page_view', {
            path: window.location.pathname,
            title: document.title
        });
    }
    
    trackUserAction(action, details = {}) {
        this.track('user_action', {
            action,
            ...details
        });
    }

    trackTelemetry(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`custom_event_tracking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { 
        window.customEventTrackingSystem = new CustomEventTrackingSystem();
        window.customEventTrackingSystem.trackPageView();
    });
} else {
    window.customEventTrackingSystem = new CustomEventTrackingSystem();
    window.customEventTrackingSystem.trackPageView();
}

