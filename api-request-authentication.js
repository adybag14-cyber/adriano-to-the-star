/**
 * API Request Authentication
 * Authentication middleware for API requests
 */

class APIRequestAuthentication {
    constructor() {
        this.authStrategies = new Map();
        this.tokens = new Map();
        this.init();
    }

    init() {
        this.setupDefaultStrategies();
        this.trackEvent('authentication_initialized');
    }

    setupDefaultStrategies() {
        this.authStrategies.set('bearer', {
            name: 'Bearer Token',
            validate: (token) => this.validateBearerToken(token)
        });
        
        this.authStrategies.set('api-key', {
            name: 'API Key',
            validate: (key) => this.validateAPIKey(key)
        });
    }

    registerStrategy(strategyId, name, validateFn) {
        this.authStrategies.set(strategyId, {
            id: strategyId,
            name,
            validate: validateFn
        });
        this.trackEvent('strategy_registered', { strategyId });
    }

    async authenticate(request, strategyId = 'bearer') {
        const strategy = this.authStrategies.get(strategyId);
        if (!strategy) {
            throw new Error('Authentication strategy does not exist');
        }
        
        const token = this.extractToken(request, strategyId);
        if (!token) {
            throw new Error('No authentication token provided');
        }
        
        const isValid = await strategy.validate(token);
        if (!isValid) {
            throw new Error('Invalid authentication token');
        }
        
        return {
            authenticated: true,
            strategy: strategyId,
            token
        };
    }

    extractToken(request, strategyId) {
        if (strategyId === 'bearer') {
            const authHeader = request.headers?.authorization || request.headers?.Authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                return authHeader.substring(7);
            }
        } else if (strategyId === 'api-key') {
            return request.headers?.['x-api-key'] || request.query?.apiKey;
        }
        return null;
    }

    validateBearerToken(token) {
        // Check if token exists and is valid
        const tokenData = this.tokens.get(token);
        if (!tokenData) {
            return false;
        }
        
        // Check expiration
        if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
            this.tokens.delete(token);
            return false;
        }
        
        return true;
    }

    validateAPIKey(key) {
        // Validate API key
        const keyData = this.tokens.get(key);
        return keyData !== undefined;
    }

    generateToken(userId, expiresIn = 3600000) {
        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.tokens.set(token, {
            userId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + expiresIn)
        });
        console.log(`Token generated for user: ${userId}`);
        return token;
    }

    revokeToken(token) {
        this.tokens.delete(token);
        console.log('Token revoked');
    }

    getStrategy(strategyId) {
        return this.authStrategies.get(strategyId);
    }

    getAllStrategies() {
        return Array.from(this.authStrategies.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`auth_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestAuthentication = new APIRequestAuthentication();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestAuthentication;
}

