/**
 * Event Debugging
 * Debug event tracking
 */

class EventDebugging {
    constructor() {
        this.debugMode = false;
        this.init();
    }
    
    init() {
        this.setupDebugging();
        this.trackEvent('event_debugging_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`event_debugging_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    setupDebugging() {
        // Setup event debugging
    }
    
    enableDebugMode() {
        // Enable debug mode
        this.debugMode = true;
        
        if (window.eventTrackingSystemAdvanced) {
            window.eventTrackingSystemAdvanced.on('*', (event) => {
                console.log('[Event Debug]', event);
            });
        }
    }
    
    disableDebugMode() {
        // Disable debug mode
        this.debugMode = false;
    }
    
    async getEventLog(filters = {}) {
        // Get event log for debugging
        if (window.eventTrackingSystemAdvanced) {
            return await window.eventTrackingSystemAdvanced.getEvents(filters);
        }
        return [];
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.eventDebugging = new EventDebugging(); });
} else {
    window.eventDebugging = new EventDebugging();
}

