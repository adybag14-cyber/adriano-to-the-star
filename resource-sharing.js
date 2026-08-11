/**
 * Resource Sharing
 * Resource sharing system
 */

class ResourceSharing {
    constructor() {
        this.shares = new Map();
        this.resources = new Map();
        this.permissions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_es_ou_rc_es_ha_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_es_ou_rc_es_ha_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async share(shareId, shareData) {
        const share = {
            id: shareId,
            ...shareData,
            resourceId: shareData.resourceId || '',
            sharedWith: shareData.sharedWith || [],
            permissions: shareData.permissions || ['read'],
            status: 'shared',
            createdAt: new Date()
        };
        
        this.shares.set(shareId, share);
        return share;
    }

    async checkAccess(resourceId, userId) {
        const share = Array.from(this.shares.values())
            .find(s => s.resourceId === resourceId && s.sharedWith.includes(userId));

        return {
            resourceId,
            userId,
            hasAccess: !!share,
            permissions: share ? share.permissions : []
        };
    }

    getShare(shareId) {
        return this.shares.get(shareId);
    }

    getAllShares() {
        return Array.from(this.shares.values());
    }
}

module.exports = ResourceSharing;

