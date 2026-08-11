/**
 * Funnel Analysis
 * @class FunnelAnalysis
 * @description Analyzes user conversion funnels.
 */
class FunnelAnalysis {
    constructor() {
        this.funnels = new Map();
        this.events = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_un_ne_la_na_ly_si_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_un_ne_la_na_ly_si_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create funnel.
     * @param {string} funnelId - Funnel identifier.
     * @param {object} funnelData - Funnel data.
     */
    createFunnel(funnelId, funnelData) {
        this.funnels.set(funnelId, {
            ...funnelData,
            id: funnelId,
            name: funnelData.name,
            steps: funnelData.steps || [],
            createdAt: new Date()
        });
        console.log(`Funnel created: ${funnelId}`);
    }

    /**
     * Track funnel event.
     * @param {string} funnelId - Funnel identifier.
     * @param {string} userId - User identifier.
     * @param {string} step - Funnel step.
     */
    trackEvent(funnelId, userId, step) {
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.events.set(eventId, {
            id: eventId,
            funnelId,
            userId,
            step,
            timestamp: new Date()
        });
        console.log(`Funnel event tracked: ${funnelId} step ${step}`);
    }

    /**
     * Analyze funnel conversion.
     * @param {string} funnelId - Funnel identifier.
     * @returns {object} Conversion analysis.
     */
    analyzeConversion(funnelId) {
        const funnel = this.funnels.get(funnelId);
        if (!funnel) {
            throw new Error(`Funnel not found: ${funnelId}`);
        }

        const funnelEvents = Array.from(this.events.values())
            .filter(e => e.funnelId === funnelId);

        const stepCounts = {};
        funnel.steps.forEach(step => {
            stepCounts[step] = funnelEvents.filter(e => e.step === step).length;
        });

        const conversionRates = {};
        for (let i = 1; i < funnel.steps.length; i++) {
            const current = stepCounts[funnel.steps[i]] || 0;
            const previous = stepCounts[funnel.steps[i - 1]] || 1;
            conversionRates[funnel.steps[i]] = (current / previous) * 100;
        }

        return {
            funnelId,
            stepCounts,
            conversionRates,
            totalUsers: new Set(funnelEvents.map(e => e.userId)).size
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.funnelAnalysis = new FunnelAnalysis();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FunnelAnalysis;
}

