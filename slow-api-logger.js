(function(){
    if (window.SLOW_API_LOGGER_INITIALIZED || window.ENABLE_PERF_LOGS === false) {
        return;
    }
    window.SLOW_API_LOGGER_INITIALIZED = true;

    const config = window.endpointPerformanceConfig || {};
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;

    if (!originalFetch) {
        console.warn('slow-api-logger: window.fetch not available');
        return;
    }

    function getThreshold(url) {
        if (!url) return (config.default && config.default.maxDuration) || 1800;
        try {
            const parsed = new URL(url, window.location.origin);
            const path = parsed.pathname || '';
            const match = Object.keys(config).find(key => key !== 'default' && path.startsWith(key));
            return (match && config[match] && config[match].maxDuration) || (config.default && config.default.maxDuration) || 1800;
        } catch (e) {
            return (config.default && config.default.maxDuration) || 1800;
        }
    }

    window.fetch = async function slowFetch(input, init) {
        const start = performance.now();
        let response;
        try {
            response = await originalFetch(input, init);
            return response;
        } finally {
            const duration = performance.now() - start;
            const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
            const threshold = getThreshold(url);
            if (duration > threshold) {
                const logPayload = {
                    url,
                    duration: Math.round(duration),
                    threshold,
                    timestamp: Date.now()
                };
                console.warn('⚠️ Slow API response detected', logPayload);
                if (window.analytics && window.analytics.track) {
                    window.analytics.track('Slow API Response', logPayload);
                }
                try {
                    window.slowApiEvents = window.slowApiEvents || [];
                    window.slowApiEvents.push(logPayload);
                    if (window.slowApiEvents.length > 50) {
                        window.slowApiEvents.shift();
                    }
                    if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
                        window.dispatchEvent(new CustomEvent('slow-api-response', { detail: logPayload }));
                    }
                } catch (e) {
                    console.warn('slow-api-logger: failed to record slow API event', e);
                }
            }
        }
    };
})();
