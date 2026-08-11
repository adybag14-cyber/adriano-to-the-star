/**
 * Attribution Modeling
 * @class AttributionModeling
 * @description Models marketing attribution for conversion tracking.
 */
class AttributionModeling {
    constructor() {
        this.models = new Map();
        this.touchpoints = new Map();
        this.init();
    }

    init() {
        this.setupModels();
        this.trackEvent('attribution_initialized');
    }

    setupModels() {
        this.models.set('first-touch', {
            name: 'First Touch',
            description: 'Attributes conversion to first touchpoint'
        });

        this.models.set('last-touch', {
            name: 'Last Touch',
            description: 'Attributes conversion to last touchpoint'
        });

        this.models.set('linear', {
            name: 'Linear',
            description: 'Distributes credit equally across all touchpoints'
        });
    }

    /**
     * Track touchpoint.
     * @param {string} userId - User identifier.
     * @param {string} touchpointId - Touchpoint identifier.
     * @param {object} touchpointData - Touchpoint data.
     */
    trackTouchpoint(userId, touchpointId, touchpointData) {
        const key = `${userId}_${touchpointId}`;
        this.touchpoints.set(key, {
            userId,
            touchpointId,
            ...touchpointData,
            channel: touchpointData.channel,
            timestamp: new Date()
        });
        console.log(`Touchpoint tracked: ${touchpointId} for user ${userId}`);
    }

    /**
     * Calculate attribution.
     * @param {string} userId - User identifier.
     * @param {string} modelType - Attribution model type.
     * @returns {object} Attribution result.
     */
    calculateAttribution(userId, modelType) {
        const model = this.models.get(modelType);
        if (!model) {
            throw new Error(`Model not found: ${modelType}`);
        }

        const userTouchpoints = Array.from(this.touchpoints.values())
            .filter(tp => tp.userId === userId)
            .sort((a, b) => a.timestamp - b.timestamp);

        const attribution = {};
        
        switch (modelType) {
            case 'first-touch':
                if (userTouchpoints.length > 0) {
                    attribution[userTouchpoints[0].touchpointId] = 100;
                }
                break;
            case 'last-touch':
                if (userTouchpoints.length > 0) {
                    attribution[userTouchpoints[userTouchpoints.length - 1].touchpointId] = 100;
                }
                break;
            case 'linear':
                const credit = 100 / userTouchpoints.length;
                userTouchpoints.forEach(tp => {
                    attribution[tp.touchpointId] = credit;
                });
                break;
        }

        return {
            userId,
            model: model.name,
            attribution
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`attribution_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.attributionModeling = new AttributionModeling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttributionModeling;
}

