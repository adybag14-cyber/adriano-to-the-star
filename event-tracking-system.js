/**
 * Event Tracking System
 * Comprehensive event tracking system
 */

class EventTrackingSystem {
    constructor() {
        this.events = [];
        this.eventTypes = new Map();
        this.init();
    }

    init() {
        this.trackEvent('e_ve_nt_tr_ac_ki_ng_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_ve_nt_tr_ac_ki_ng_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerEventType(eventType, schema) {
        this.eventTypes.set(eventType, schema);
    }

    trackEvent(eventType, properties, userId = null) {
        const schema = this.eventTypes.get(eventType);
        if (schema) {
            // Validate against schema
            const validated = this.validateEvent(properties, schema);
            if (!validated.valid) {
                console.warn('Event validation failed:', validated.errors);
                return null;
            }
        }

        const event = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            properties,
            userId,
            timestamp: new Date(),
            sessionId: this.getSessionId()
        };

        this.events.push(event);
        return event;
    }

    validateEvent(properties, schema) {
        const errors = [];
        const required = schema.required || [];
        
        required.forEach(field => {
            if (!(field in properties)) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }

    getEvents(filter = {}) {
        let filtered = this.events;

        if (filter.type) {
            filtered = filtered.filter(e => e.type === filter.type);
        }

        if (filter.userId) {
            filtered = filtered.filter(e => e.userId === filter.userId);
        }

        if (filter.startDate && filter.endDate) {
            filtered = filtered.filter(e => 
                e.timestamp >= filter.startDate && 
                e.timestamp <= filter.endDate
            );
        }

        return filtered;
    }
}

// Auto-initialize
const eventTrackingSystem = new EventTrackingSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventTrackingSystem;
}


