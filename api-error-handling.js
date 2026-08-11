/**
 * API Error Handling
 * Comprehensive error handling for API requests
 */

class APIErrorHandling {
    constructor() {
        this.errorHandlers = new Map();
        this.errorMappings = new Map();
        this.init();
    }

    init() {
        this.setupDefaultErrorMappings();
        this.trackEvent('error_handling_initialized');
    }

    setupDefaultErrorMappings() {
        this.errorMappings.set(400, {
            statusCode: 400,
            message: 'Bad Request',
            type: 'client_error'
        });
        
        this.errorMappings.set(401, {
            statusCode: 401,
            message: 'Unauthorized',
            type: 'authentication_error'
        });
        
        this.errorMappings.set(404, {
            statusCode: 404,
            message: 'Not Found',
            type: 'client_error'
        });
        
        this.errorMappings.set(500, {
            statusCode: 500,
            message: 'Internal Server Error',
            type: 'server_error'
        });
    }

    registerErrorHandler(handlerId, errorType, handlerFn) {
        this.errorHandlers.set(handlerId, {
            id: handlerId,
            errorType,
            handlerFn,
            enabled: true,
            createdAt: new Date()
        });
        this.trackEvent('handler_registered', { handlerId });
    }

    handleError(error, context = {}) {
        const errorInfo = this.parseError(error);
        const handler = this.findHandler(errorInfo.type);
        
        if (handler) {
            return handler.handlerFn(errorInfo, context);
        }
        
        return this.defaultErrorResponse(errorInfo);
    }

    parseError(error) {
        if (error.statusCode) {
            const mapping = this.errorMappings.get(error.statusCode);
            return {
                statusCode: error.statusCode,
                message: error.message || mapping?.message || 'Unknown Error',
                type: mapping?.type || 'unknown_error',
                originalError: error
            };
        }
        
        return {
            statusCode: 500,
            message: error.message || 'Internal Server Error',
            type: 'server_error',
            originalError: error
        };
    }

    findHandler(errorType) {
        for (const handler of this.errorHandlers.values()) {
            if (handler.enabled && handler.errorType === errorType) {
                return handler;
            }
        }
        return null;
    }

    defaultErrorResponse(errorInfo) {
        return {
            error: {
                code: errorInfo.statusCode,
                message: errorInfo.message,
                type: errorInfo.type,
                timestamp: new Date().toISOString()
            }
        };
    }

    createErrorResponse(statusCode, message, details = {}) {
        const mapping = this.errorMappings.get(statusCode);
        return {
            error: {
                code: statusCode,
                message: message || mapping?.message || 'Unknown Error',
                type: mapping?.type || 'unknown_error',
                details,
                timestamp: new Date().toISOString()
            }
        };
    }

    getErrorHandler(handlerId) {
        return this.errorHandlers.get(handlerId);
    }

    getAllErrorHandlers() {
        return Array.from(this.errorHandlers.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`error_handling_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'api_error_handling', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiErrorHandling = new APIErrorHandling();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIErrorHandling;
}

