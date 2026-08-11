/**
 * API Request Middleware
 * Middleware pipeline for API requests
 */

class APIRequestMiddleware {
    constructor() {
        this.middlewareStack = [];
        this.init();
    }

    init() {
        this.trackEvent('middleware_initialized');
    }

    use(middlewareFn, priority = 0) {
        this.middlewareStack.push({
            fn: middlewareFn,
            priority,
            enabled: true
        });
        
        // Sort by priority
        this.middlewareStack.sort((a, b) => b.priority - a.priority);
        
        console.log(`Middleware added to stack`);
    }

    async execute(request, response = {}) {
        const currentRequest = { ...request };
        let currentResponse = { ...response };
        let index = 0;
        
        const next = async () => {
            if (index >= this.middlewareStack.length) {
                return currentResponse;
            }
            
            const middleware = this.middlewareStack[index++];
            
            if (!middleware.enabled) {
                return next();
            }
            
            try {
                const result = await middleware.fn(currentRequest, currentResponse, next);
                if (result) {
                    currentResponse = { ...currentResponse, ...result };
                }
            } catch (error) {
                console.error('Middleware error:', error);
                throw error;
            }
            
            return currentResponse;
        };
        
        return await next();
    }

    removeMiddleware(index) {
        if (index >= 0 && index < this.middlewareStack.length) {
            this.middlewareStack.splice(index, 1);
            console.log(`Middleware removed at index ${index}`);
        }
    }

    clearMiddleware() {
        this.middlewareStack = [];
        console.log('Middleware stack cleared');
    }

    getMiddlewareStack() {
        return this.middlewareStack.map((m, index) => ({
            index,
            priority: m.priority,
            enabled: m.enabled
        }));
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`middleware_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestMiddleware = new APIRequestMiddleware();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestMiddleware;
}

