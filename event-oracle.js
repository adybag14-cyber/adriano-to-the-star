/**
 * Event Oracle
 * Event-based oracle system
 */

class EventOracle {
    constructor() {
        this.oracles = new Map();
        this.events = new Map();
        this.init();
    }

    init() {
        this.trackEvent('event_oracle_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`event_oracle_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    registerOracle(oracleId, oracleData) {
        const oracle = {
            id: oracleId,
            ...oracleData,
            name: oracleData.name || oracleId,
            eventTypes: oracleData.eventTypes || [],
            enabled: oracleData.enabled !== false,
            createdAt: new Date()
        };
        
        this.oracles.set(oracleId, oracle);
        console.log(`Event oracle registered: ${oracleId}`);
        return oracle;
    }

    async reportEvent(oracleId, eventData) {
        const oracle = this.oracles.get(oracleId);
        if (!oracle) {
            throw new Error('Oracle not found');
        }
        
        const event = {
            id: `event_${Date.now()}`,
            oracleId,
            ...eventData,
            type: eventData.type || 'unknown',
            data: eventData.data || {},
            verified: false,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        event.verified = this.verifyEvent(event, oracle);
        
        this.events.set(event.id, event);
        
        return event;
    }

    verifyEvent(event, oracle) {
        if (!oracle.eventTypes.includes(event.type)) {
            return false;
        }
        
        return true;
    }

    getEvents(oracleId, eventType = null, startDate = null, endDate = null) {
        let events = Array.from(this.events.values())
            .filter(e => e.oracleId === oracleId);
        
        if (eventType) {
            events = events.filter(e => e.type === eventType);
        }
        
        if (startDate) {
            events = events.filter(e => e.timestamp >= startDate);
        }
        
        if (endDate) {
            events = events.filter(e => e.timestamp <= endDate);
        }
        
        return events.sort((a, b) => b.timestamp - a.timestamp);
    }

    getOracle(oracleId) {
        return this.oracles.get(oracleId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.eventOracle = new EventOracle();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventOracle;
}


