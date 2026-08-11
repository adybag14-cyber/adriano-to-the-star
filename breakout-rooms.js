/**
 * Breakout Rooms
 * @class BreakoutRooms
 * @description Manages breakout rooms for group activities.
 */
class BreakoutRooms {
    constructor() {
        this.rooms = new Map();
        this.participants = new Map();
        this.init();
    }

    init() {
        this.trackEvent('breakout_initialized');
    }

    /**
     * Create breakout rooms.
     * @param {string} sessionId - Session identifier.
     * @param {number} numberOfRooms - Number of rooms to create.
     * @param {object} roomData - Room configuration.
     * @returns {Array<string>} Room identifiers.
     */
    createRooms(sessionId, numberOfRooms, roomData) {
        const roomIds = [];
        for (let i = 0; i < numberOfRooms; i++) {
            const roomId = `room_${sessionId}_${i + 1}`;
            this.rooms.set(roomId, {
                id: roomId,
                sessionId,
                name: roomData.names?.[i] || `Room ${i + 1}`,
                participants: [],
                status: 'open',
                createdAt: new Date()
            });
            roomIds.push(roomId);
        }
        console.log(`Created ${numberOfRooms} breakout rooms for session ${sessionId}`);
        return roomIds;
    }

    /**
     * Assign participant to room.
     * @param {string} roomId - Room identifier.
     * @param {string} userId - User identifier.
     */
    assignParticipant(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error(`Room not found: ${roomId}`);
        }

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            this.participants.set(`${roomId}_${userId}`, {
                roomId,
                userId,
                assignedAt: new Date()
            });
            console.log(`Participant ${userId} assigned to room ${roomId}`);
        }
    }

    /**
     * Close all rooms.
     * @param {string} sessionId - Session identifier.
     */
    closeAllRooms(sessionId) {
        for (const room of this.rooms.values()) {
            if (room.sessionId === sessionId) {
                room.status = 'closed';
                room.closedAt = new Date();
            }
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`breakout_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.breakoutRooms = new BreakoutRooms();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BreakoutRooms;
}

