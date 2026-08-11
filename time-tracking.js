/**
 * Time Tracking
 * Time tracking system
 */

class TimeTracking {
    constructor() {
        this.timesheets = new Map();
        this.entries = new Map();
        this.projects = new Map();
        this.init();
    }

    init() {
        this.trackEvent('time_tracking_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`time_tracking_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createEntry(entryId, entryData) {
        const entry = {
            id: entryId,
            ...entryData,
            projectId: entryData.projectId || '',
            hours: entryData.hours || 0,
            date: entryData.date || new Date(),
            createdAt: new Date()
        };
        
        this.entries.set(entryId, entry);
        return entry;
    }

    getEntry(entryId) {
        return this.entries.get(entryId);
    }

    getAllEntries() {
        return Array.from(this.entries.values());
    }
}

module.exports = TimeTracking;

