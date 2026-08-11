/**
 * Screen Sharing
 * @class ScreenSharing
 * @description Manages screen sharing in live sessions.
 */
class ScreenSharing {
    constructor() {
        this.shares = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_cr_ee_ns_ha_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_cr_ee_ns_ha_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Start screen share.
     * @param {string} sessionId - Session identifier.
     * @param {string} userId - User identifier.
     * @param {object} shareData - Share data.
     * @returns {string} Share identifier.
     */
    startShare(sessionId, userId, shareData) {
        const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.shares.set(shareId, {
            id: shareId,
            sessionId,
            userId,
            streamUrl: shareData.streamUrl,
            type: shareData.type || 'screen', // screen, window, tab
            status: 'active',
            startedAt: new Date()
        });
        console.log(`Screen share started: ${shareId} by user ${userId}`);
        return shareId;
    }

    /**
     * Stop screen share.
     * @param {string} shareId - Share identifier.
     */
    stopShare(shareId) {
        const share = this.shares.get(shareId);
        if (share) {
            share.status = 'stopped';
            share.stoppedAt = new Date();
            console.log(`Screen share stopped: ${shareId}`);
        }
    }

    /**
     * Get active share for session.
     * @param {string} sessionId - Session identifier.
     * @returns {object} Active share or null.
     */
    getActiveShare(sessionId) {
        for (const share of this.shares.values()) {
            if (share.sessionId === sessionId && share.status === 'active') {
                return share;
            }
        }
        return null;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.screenSharing = new ScreenSharing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenSharing;
}

