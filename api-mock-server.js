/**
 * API Mock Server
 * Mock server for API testing
 */

class APIMockServer {
    constructor() {
        this.mocks = new Map();
        this.init();
    }
    
    init() {
        this.setupMockServer();
        this.trackEvent('mock_server_initialized');
    }
    
    setupMockServer() {
        // Setup mock server
    }
    
    mock(endpoint, method, response) {
        // Create API mock
        const key = `${method}:${endpoint}`;
        this.mocks.set(key, response);
    }
    
    async getMock(endpoint, method) {
        // Get mock response
        const key = `${method}:${endpoint}`;
        return this.mocks.get(key);
    }
    
    async interceptRequest(endpoint, method) {
        // Intercept and mock request
        const mock = await this.getMock(endpoint, method);
        if (mock) {
            return mock;
        }
        return null;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`mock_server_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_mock_server', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.apiMockServer = new APIMockServer(); });
} else {
    window.apiMockServer = new APIMockServer();
}
