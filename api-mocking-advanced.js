/**
 * API Mocking Advanced
 * Advanced API mocking system
 */

class APIMockingAdvanced {
    constructor() {
        this.mocks = new Map();
        this.responses = new Map();
        this.scenarios = new Map();
        this.init();
    }

    init() {
        this.trackEvent('api_mocking_adv_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_mocking_adv_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createMock(mockId, mockData) {
        const mock = {
            id: mockId,
            ...mockData,
            name: mockData.name || mockId,
            endpoint: mockData.endpoint || '',
            method: mockData.method || 'GET',
            response: mockData.response || {},
            status: 'active',
            createdAt: new Date()
        };
        
        this.mocks.set(mockId, mock);
        return mock;
    }

    async handleRequest(mockId, request) {
        const mock = this.mocks.get(mockId);
        if (!mock) {
            throw new Error(`Mock ${mockId} not found`);
        }

        const response = {
            id: `resp_${Date.now()}`,
            mockId,
            request,
            response: this.generateResponse(mock, request),
            timestamp: new Date()
        };

        this.responses.set(response.id, response);
        return response;
    }

    generateResponse(mock, request) {
        return {
            ...mock.response,
            timestamp: new Date()
        };
    }

    getMock(mockId) {
        return this.mocks.get(mockId);
    }

    getAllMocks() {
        return Array.from(this.mocks.values());
    }
}

module.exports = APIMockingAdvanced;

