/**
 * API Mocking Service
 * @class APIMockingService
 * @description Provides API mocking for testing and development.
 */
class APIMockingService {
    constructor() {
        this.mocks = new Map();
        this.responses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('mocking_service_initialized');
    }

    /**
     * Create mock endpoint.
     * @param {string} mockId - Mock identifier.
     * @param {object} mockData - Mock data.
     */
    createMock(mockId, mockData) {
        this.mocks.set(mockId, {
            ...mockData,
            id: mockId,
            path: mockData.path,
            method: mockData.method || 'GET',
            response: mockData.response || {},
            statusCode: mockData.statusCode || 200,
            delay: mockData.delay || 0,
            active: true,
            createdAt: new Date()
        });
        this.trackEvent('mock_created', { mockId });
    }

    /**
     * Handle mock request.
     * @param {string} path - Request path.
     * @param {string} method - HTTP method.
     * @returns {Promise<object>} Mock response.
     */
    async handleRequest(path, method) {
        const mock = Array.from(this.mocks.values())
            .find(m => m.path === path && m.method === method && m.active);

        if (!mock) {
            throw new Error(`Mock not found for ${method} ${path}`);
        }

        // Apply delay if specified
        if (mock.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, mock.delay));
        }

        // Track response
        const responseId = `response_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.responses.set(responseId, {
            id: responseId,
            mockId: mock.id,
            path,
            method,
            respondedAt: new Date()
        });

        return {
            status: mock.statusCode,
            data: mock.response
        };
    }
}

APIMockingService.prototype.trackEvent = function(eventName, data = {}) {
    try {
        if (typeof window !== 'undefined' && window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric(`mocking_service_${eventName}`, 1, data);
        }
        if (typeof window !== 'undefined' && window.analytics) {
            window.analytics.track(eventName, { module: 'api_mocking_service', ...data });
        }
    } catch (e) { /* Silent fail */ }
};

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.apiMockingService = new APIMockingService();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIMockingService;
}

