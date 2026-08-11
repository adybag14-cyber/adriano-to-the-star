/**
 * API Mock Server (Enhanced)
 * Enhanced API mock server for Agent 2
 */

class APIMockServerEnhanced {
    constructor() {
        this.routes = new Map();
        this.responses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('mock_server_enhanced_initialized');
    }

    mockRoute(path, method, response, options = {}) {
        const key = `${method}:${path}`;
        this.routes.set(key, {
            path,
            method,
            response,
            status: options.status || 200,
            delay: options.delay || 0,
            condition: options.condition
        });
    }

    async getResponse(path, method, request = {}) {
        const key = `${method}:${path}`;
        const route = this.routes.get(key);
        
        if (!route) {
            return { status: 404, body: { error: 'Route not mocked' } };
        }

        // Apply delay if specified
        if (route.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, route.delay));
        }

        // Check condition if specified
        if (route.condition && !route.condition(request)) {
            return { status: 400, body: { error: 'Condition not met' } };
        }

        return {
            status: route.status,
            body: typeof route.response === 'function' ? 
                route.response(request) : route.response
        };
    }

    clearMocks() {
        this.routes.clear();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`mock_server_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_mock_server_enhanced', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const apiMockServerEnhanced = new APIMockServerEnhanced();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIMockServerEnhanced;
}


