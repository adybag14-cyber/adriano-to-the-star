function apiVersioning({ defaultVersion = 'v1', header = 'x-api-version' } = {}) {
    function trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_versioning_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    trackEvent('middleware_created');
    return (req, res, next) => {
        const version = (req.headers[header] || req.headers[header.toLowerCase()] || defaultVersion).toString();
        req.apiVersion = version;
        next();
    };
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiVersioning;
}
