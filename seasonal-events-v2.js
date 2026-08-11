/**
 * Seasonal Events v2
 * Advanced seasonal events system
 */

class SeasonalEventsV2 {
    constructor() {
        this.events = new Map();
        this.participants = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Seasonal Events v2 initialized' };
    }

    createEvent(name, season, startDate, endDate, rewards) {
        if (!['spring', 'summer', 'fall', 'winter'].includes(season)) {
            throw new Error('Invalid season');
        }
        const event = {
            id: Date.now().toString(),
            name,
            season,
            startDate,
            endDate,
            rewards: rewards || [],
            createdAt: new Date(),
            active: true
        };
        this.events.set(event.id, event);
        this.participants.set(event.id, []);
        return event;
    }

    joinEvent(userId, eventId) {
        const event = this.events.get(eventId);
        if (!event || !event.active) {
            throw new Error('Event not found or inactive');
        }
        const participants = this.participants.get(eventId);
        if (participants.includes(userId)) {
            throw new Error('User already participating');
        }
        participants.push(userId);
        return { userId, eventId, joinedAt: new Date() };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeasonalEventsV2;
}

