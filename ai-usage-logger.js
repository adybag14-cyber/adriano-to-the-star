class AIUsageLogger {
    constructor() {
        this.events = [];
        this.trackEvent('usage_logger_initialized');
    }

    log({ feature, model, context = {} }) {
        const event = {
            feature,
            model,
            context,
            url: window.location.href,
            timestamp: Date.now()
        };
        this.events.push(event);
        if (this.events.length > 200) {
            this.events.shift();
        }
        window.aiUsageEvents = window.aiUsageEvents || [];
        window.aiUsageEvents.push(event);
        if (window.aiUsageEvents.length > 500) {
            window.aiUsageEvents.shift();
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('AI Usage', {
                feature,
                model,
                url: event.url,
                timestamp: event.timestamp
            });
        }
    }

    getRecent(limit = 50) {
        return this.events.slice(-limit);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`usage_logger_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

window.aiUsageLogger = window.aiUsageLogger || new AIUsageLogger();

window.showAIUsageSummary = window.showAIUsageSummary || function(limit = 20) {
    if (!window.aiUsageLogger || typeof window.aiUsageLogger.getRecent !== 'function') {
        console.warn('AIUsageLogger not available');
        return;
    }
    const events = window.aiUsageLogger.getRecent(limit);
    if (!events.length) {
        console.log('No AI usage events recorded yet.');
        return;
    }
    console.table(events.map(e => ({
        feature: e.feature,
        model: e.model,
        time: new Date(e.timestamp).toLocaleString(),
        url: e.url
    })));
};

window.showAIFairnessSummary = window.showAIFairnessSummary || function(limit = 20) {
    if (!window.aiUsageLogger || typeof window.aiUsageLogger.getRecent !== 'function') {
        console.warn('AIUsageLogger not available');
        return;
    }
    const events = window.aiUsageLogger.getRecent(limit).filter(e => e.context && e.context.fairness);
    if (!events.length) {
        console.log('No AI fairness data recorded yet.');
        return;
    }
    console.table(events.map(e => ({
        feature: e.feature,
        model: e.model,
        overallBias: e.context.fairness && e.context.fairness.overallBias,
        metric: e.context.fairness && e.context.fairness.metric,
        disparity: e.context.fairness && e.context.fairness.disparity,
        time: new Date(e.timestamp).toLocaleString()
    })));
};
