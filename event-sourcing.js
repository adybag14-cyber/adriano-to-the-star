/**
 * Event Sourcing
 * Event sourcing pattern implementation
 */

class EventSourcing {
    constructor() {
        this.aggregates = new Map();
        this.events = new Map();
        this.snapshots = new Map();
        this.init();
    }

    init() {
        this.trackEvent('event_sourcing_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`event_sourcing_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    createAggregate(aggregateId, aggregateData) {
        const aggregate = {
            id: aggregateId,
            ...aggregateData,
            name: aggregateData.name || aggregateId,
            events: [],
            version: 0,
            createdAt: new Date()
        };
        
        this.aggregates.set(aggregateId, aggregate);
        console.log(`Aggregate created: ${aggregateId}`);
        return aggregate;
    }

    appendEvent(aggregateId, eventData) {
        const aggregate = this.aggregates.get(aggregateId);
        if (!aggregate) {
            throw new Error('Aggregate not found');
        }
        
        const event = {
            id: `event_${Date.now()}`,
            aggregateId,
            ...eventData,
            type: eventData.type || 'unknown',
            data: eventData.data || {},
            version: aggregate.version + 1,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.events.set(event.id, event);
        aggregate.events.push(event.id);
        aggregate.version = event.version;
        
        return event;
    }

    getAggregate(aggregateId) {
        const aggregate = this.aggregates.get(aggregateId);
        if (!aggregate) {
            throw new Error('Aggregate not found');
        }
        
        const events = aggregate.events
            .map(id => this.events.get(id))
            .filter(Boolean)
            .sort((a, b) => a.version - b.version);
        
        return {
            aggregate,
            events,
            state: this.rebuildState(events)
        };
    }

    rebuildState(events) {
        let state = {};
        events.forEach(event => {
            state = { ...state, ...event.data };
        });
        return state;
    }

    createSnapshot(aggregateId) {
        const aggregate = this.aggregates.get(aggregateId);
        if (!aggregate) {
            throw new Error('Aggregate not found');
        }
        
        const snapshot = {
            id: `snapshot_${Date.now()}`,
            aggregateId,
            state: this.rebuildState(
                aggregate.events.map(id => this.events.get(id)).filter(Boolean)
            ),
            version: aggregate.version,
            createdAt: new Date()
        };
        
        this.snapshots.set(snapshot.id, snapshot);
        
        return snapshot;
    }

    getAggregateById(aggregateId) {
        return this.aggregates.get(aggregateId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.eventSourcing = new EventSourcing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventSourcing;
}

