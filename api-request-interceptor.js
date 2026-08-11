/**
 * API Request Interceptor
 * Intercept and modify API requests
 */

class APIRequestInterceptor {
    constructor() {
        this.interceptors = new Map();
        this.init();
    }

    init() {
        this.trackEvent('interceptor_initialized');
    }

    registerInterceptor(interceptorId, type, interceptorFn, priority = 0) {
        this.interceptors.set(interceptorId, {
            id: interceptorId,
            type, // request, response, error
            interceptorFn,
            priority,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Interceptor registered: ${interceptorId}`);
    }

    async interceptRequest(request) {
        const requestInterceptors = Array.from(this.interceptors.values())
            .filter(i => i.type === 'request' && i.enabled)
            .sort((a, b) => b.priority - a.priority);
        
        let modifiedRequest = { ...request };
        
        for (const interceptor of requestInterceptors) {
            try {
                modifiedRequest = await interceptor.interceptorFn(modifiedRequest) || modifiedRequest;
            } catch (error) {
                console.error(`Interceptor ${interceptor.id} failed:`, error);
            }
        }
        
        return modifiedRequest;
    }

    async interceptResponse(response, request) {
        const responseInterceptors = Array.from(this.interceptors.values())
            .filter(i => i.type === 'response' && i.enabled)
            .sort((a, b) => b.priority - a.priority);
        
        let modifiedResponse = { ...response };
        
        for (const interceptor of responseInterceptors) {
            try {
                modifiedResponse = await interceptor.interceptorFn(modifiedResponse, request) || modifiedResponse;
            } catch (error) {
                console.error(`Interceptor ${interceptor.id} failed:`, error);
            }
        }
        
        return modifiedResponse;
    }

    async interceptError(error, request) {
        const errorInterceptors = Array.from(this.interceptors.values())
            .filter(i => i.type === 'error' && i.enabled)
            .sort((a, b) => b.priority - a.priority);
        
        let modifiedError = error;
        
        for (const interceptor of errorInterceptors) {
            try {
                modifiedError = await interceptor.interceptorFn(modifiedError, request) || modifiedError;
            } catch (err) {
                console.error(`Interceptor ${interceptor.id} failed:`, err);
            }
        }
        
        return modifiedError;
    }

    getInterceptor(interceptorId) {
        return this.interceptors.get(interceptorId);
    }

    getAllInterceptors() {
        return Array.from(this.interceptors.values());
    }

    removeInterceptor(interceptorId) {
        this.interceptors.delete(interceptorId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`interceptor_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestInterceptor = new APIRequestInterceptor();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestInterceptor;
}

