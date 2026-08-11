/**
 * Real-Time Collaboration
 * @class RealTimeCollaboration
 * @description Enables real-time collaboration with live updates and presence.
 */
class RealTimeCollaboration {
    constructor() {
        this.sessions = new Map();
        this.participants = new Map();
        this.changes = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ea_lt_im_ec_ol_la_bo_ra_ti_on_initialized');
    }

    /**
     * Create collaboration session.
     * @param {string} sessionId - Session identifier.
     * @param {object} sessionData - Session data.
     */
    createSession(sessionId, sessionData) {
        this.sessions.set(sessionId, {
            ...sessionData,
            id: sessionId,
            documentId: sessionData.documentId,
            participants: [],
            changes: [],
            createdAt: new Date()
        });
        console.log(`Collaboration session created: ${sessionId}`);
        this.trackEvent('session_created', { sessionId, documentId: sessionData.documentId });
    }

    /**
     * Join session.
     * @param {string} sessionId - Session identifier.
     * @param {string} userId - User identifier.
     */
    joinSession(sessionId, userId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        if (!session.participants.includes(userId)) {
            session.participants.push(userId);
            this.participants.set(`${sessionId}_${userId}`, {
                sessionId,
                userId,
                joinedAt: new Date(),
                cursor: null
            });
            console.log(`User ${userId} joined session ${sessionId}`);
            this.trackEvent('user_joined_session', { sessionId, userId });
        }
    }

    /**
     * Apply change.
     * @param {string} sessionId - Session identifier.
     * @param {string} userId - User identifier.
     * @param {object} change - Change data.
     */
    applyChange(sessionId, userId, change) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const changeId = `change_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const changeRecord = {
            id: changeId,
            sessionId,
            userId,
            ...change,
            type: change.type, // insert, delete, format
            position: change.position,
            content: change.content,
            timestamp: new Date()
        };

        this.changes.set(changeId, changeRecord);
        session.changes.push(changeId);

        // Broadcast to other participants
        this.broadcastChange(sessionId, changeRecord, userId);
        
        // Track every 10th change to avoid flooding logs
        if (session.changes.length % 10 === 0) {
            this.trackEvent('collab_changes_batch', { sessionId, count: 10 });
        }
    }

    /**
     * Broadcast change.
     * @param {string} sessionId - Session identifier.
     * @param {object} change - Change object.
     * @param {string} excludeUserId - User ID to exclude.
     */
    broadcastChange(sessionId, change, excludeUserId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.participants.forEach(userId => {
            if (userId !== excludeUserId) {
                const participant = this.participants.get(`${sessionId}_${userId}`);
                if (participant && participant.onChange) {
                    participant.onChange(change);
                }
            }
        });
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`collab:${eventName}`, 1, {
                    source: 'real-time-collaboration',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record collaboration event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Collaboration Event', { event: eventName, ...data });
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.realTimeCollaboration = new RealTimeCollaboration();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeCollaboration;
}
