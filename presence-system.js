/**
 * Presence System
 * @class PresenceSystem
 * @description Tracks user presence and online status.
 */
class PresenceSystem {
    constructor() {
        this.presences = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_re_se_nc_es_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_re_se_nc_es_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Update presence.
     * @param {string} userId - User identifier.
     * @param {string} status - Presence status.
     * @param {object} metadata - Additional metadata.
     */
    updatePresence(userId, status, metadata = {}) {
        this.presences.set(userId, {
            userId,
            status, // online, away, busy, offline
            lastSeen: new Date(),
            ...metadata,
            location: metadata.location || null,
            device: metadata.device || null
        });
        console.log(`Presence updated: ${userId} -> ${status}`);
    }

    /**
     * Get user presence.
     * @param {string} userId - User identifier.
     * @returns {object} Presence data.
     */
    getUserPresence(userId) {
        return this.presences.get(userId) || {
            userId,
            status: 'offline',
            lastSeen: null
        };
    }

    /**
     * Get online users.
     * @returns {Array<object>} Online users.
     */
    getOnlineUsers() {
        return Array.from(this.presences.values())
            .filter(p => p.status === 'online');
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.presenceSystem = new PresenceSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresenceSystem;
}

