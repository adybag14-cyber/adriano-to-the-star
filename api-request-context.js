/**
 * API Request Context
 * Manage request context and state
 */

class APIRequestContext {
    constructor() {
        this.contexts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('context_initialized');
    }

    createContext(requestId, initialData = {}) {
        const context = {
            id: requestId,
            data: { ...initialData },
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date()
            }
        };
        
        this.contexts.set(requestId, context);
        console.log(`Context created: ${requestId}`);
        return context;
    }

    getContext(requestId) {
        return this.contexts.get(requestId);
    }

    setContextData(requestId, key, value) {
        const context = this.contexts.get(requestId);
        if (!context) {
            throw new Error('Context not found');
        }
        
        context.data[key] = value;
        context.metadata.updatedAt = new Date();
        console.log(`Context data updated: ${requestId}.${key}`);
    }

    getContextData(requestId, key) {
        const context = this.contexts.get(requestId);
        if (!context) {
            return undefined;
        }
        
        return context.data[key];
    }

    updateContext(requestId, updates) {
        const context = this.contexts.get(requestId);
        if (!context) {
            throw new Error('Context not found');
        }
        
        Object.assign(context.data, updates);
        context.metadata.updatedAt = new Date();
        console.log(`Context updated: ${requestId}`);
    }

    deleteContext(requestId) {
        this.contexts.delete(requestId);
        console.log(`Context deleted: ${requestId}`);
    }

    clearContexts() {
        this.contexts.clear();
        console.log('All contexts cleared');
    }

    getAllContexts() {
        return Array.from(this.contexts.values());
    }

    getContextKeys(requestId) {
        const context = this.contexts.get(requestId);
        return context ? Object.keys(context.data) : [];
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`context_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestContext = new APIRequestContext();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestContext;
}

