function createRateLimiter({ windowMs = 60000, max = 60 } = {}) {
    const store = new Map();
    const trackEvent = (eventName, data = {}) => {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`rate_limiter_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    };
    trackEvent('rate_limiter_created');
    return (req, res, next) => {
        const key = req.headers['x-api-key'] || req.ip || 'anonymous';
        const now = Date.now();
        const bucket = store.get(key) || { count: 0, reset: now + windowMs };
        if (now > bucket.reset) {
            bucket.count = 0;
            bucket.reset = now + windowMs;
        }
        bucket.count += 1;
        store.set(key, bucket);
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
        res.setHeader('X-RateLimit-Reset', String(bucket.reset));
        if (bucket.count > max) {
            return res.status(429).json({ error: 'rate_limit_exceeded', reset: bucket.reset });
        }
        next();
    };
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = createRateLimiter;
}
