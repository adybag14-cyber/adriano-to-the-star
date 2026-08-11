/**
 * Advanced Error Handler
 * Catches and handles errors on the fly with automatic recovery
 */

/* global AbortSignal */

const debugMonitor = require('./debug-monitor');

class ErrorHandler {
    constructor() {
        this.recoveryStrategies = new Map();
        this.setupRecoveryStrategies();
    }

    setupRecoveryStrategies() {
        // Gemini API errors
        this.recoveryStrategies.set('GEMINI_API_ERROR', {
            handler: this.handleGeminiAPIError.bind(this),
            retries: 3,
            backoff: 1000
        });

        // WebSocket errors
        this.recoveryStrategies.set('WEBSOCKET_ERROR', {
            handler: this.handleWebSocketError.bind(this),
            retries: 5,
            backoff: 2000
        });

        // Network errors
        this.recoveryStrategies.set('NETWORK_ERROR', {
            handler: this.handleNetworkError.bind(this),
            retries: 3,
            backoff: 3000
        });

        // Authentication errors
        this.recoveryStrategies.set('AUTH_ERROR', {
            handler: this.handleAuthError.bind(this),
            retries: 1,
            backoff: 0
        });
    }

    async handleError(error, context = {}) {
        const errorType = this.categorizeError(error);
        const strategy = this.recoveryStrategies.get(errorType);

        debugMonitor.log('error', `Error caught: ${error.message}`, {
            error,
            context,
            type: errorType
        });

        if (strategy) {
            try {
                return await this.retryWithStrategy(strategy, error, context);
            } catch (recoveryError) {
                debugMonitor.log('error', 'Recovery strategy failed', {
                    originalError: error,
                    recoveryError,
                    strategy: errorType
                });
            }
        }

        // Fallback error response
        return {
            success: false,
            error: error.message,
            type: errorType,
            context
        };
    }

    categorizeError(error) {
        const message = error.message?.toLowerCase() || '';
        const code = error.code || '';

        if (message.includes('gemini') || message.includes('api key') || code === 'GEMINI_ERROR') {
            return 'GEMINI_API_ERROR';
        }
        if (message.includes('websocket') || message.includes('ws') || code === 'WS_ERROR') {
            return 'WEBSOCKET_ERROR';
        }
        if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused')) {
            return 'NETWORK_ERROR';
        }
        if (message.includes('auth') || message.includes('unauthorized') || message.includes('401') || message.includes('403')) {
            return 'AUTH_ERROR';
        }

        return 'UNKNOWN_ERROR';
    }

    async retryWithStrategy(strategy, error, context) {
        let lastError = error;

        for (let attempt = 0; attempt < strategy.retries; attempt++) {
            try {
                debugMonitor.log('info', `Retry attempt ${attempt + 1}/${strategy.retries}`, {
                    error: error.message,
                    strategy: strategy.handler.name
                });

                const result = await strategy.handler(error, context, attempt);

                if (result.success) {
                    debugMonitor.log('info', 'Error recovery successful', {
                        attempts: attempt + 1,
                        strategy: strategy.handler.name
                    });
                    return result;
                }

                // Wait before next retry (exponential backoff)
                if (attempt < strategy.retries - 1) {
                    const delay = strategy.backoff * Math.pow(2, attempt);
                    await this.sleep(delay);
                }
            } catch (retryError) {
                lastError = retryError;
                debugMonitor.log('warn', `Retry attempt ${attempt + 1} failed`, {
                    error: retryError.message
                });
            }
        }

        throw lastError;
    }

    async handleGeminiAPIError(error, context, attempt) {
        // Check if API key is valid
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

        if (!apiKey || apiKey === 'your-gemini-api-key-here') {
            return {
                success: false,
                error: 'Gemini API key not configured',
                suggestion: 'Set GEMINI_API_KEY in .env file'
            };
        }

        // Try switching to Google Cloud if available
        if (process.env.GOOGLE_CLOUD_PROJECT && attempt > 1) {
            debugMonitor.log('info', 'Switching to Google Cloud Vertex AI', { attempt });
            return await this.tryGoogleCloudFallback(context);
        }

        // Try alternative model
        if (attempt > 0) {
            debugMonitor.log('info', 'Trying alternative Gemini model', { attempt });
            return await this.tryAlternativeModel(context);
        }

        return { success: false, error: error.message };
    }

    async handleWebSocketError(error, context, attempt) {
        // Try to reconnect WebSocket
        if (context.ws && context.ws.readyState !== 1) {
            debugMonitor.log('info', 'Attempting WebSocket reconnection', { attempt });

            // Close existing connection
            if (context.ws.readyState !== 3) {
                context.ws.close();
            }

            // Reconnect logic would go here
            // This depends on your WebSocket implementation
            return { success: false, error: 'WebSocket reconnection not implemented' };
        }

        return { success: false, error: error.message };
    }

    async handleNetworkError(error, context, attempt) {
        // Wait longer for network issues
        await this.sleep(3000 * (attempt + 1));

        // Check if backend is reachable
        if (context.endpoint) {
            try {
                const response = await fetch(context.endpoint, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                if (response.ok) {
                    return { success: true, recovered: true };
                }
            } catch {
                // Still failing
            }
        }

        return { success: false, error: error.message };
    }

    async handleAuthError(error, context, attempt) {
        // Auth errors usually can't be auto-recovered
        debugMonitor.log('error', 'Authentication error - manual intervention required', {
            error: error.message,
            suggestion: 'Check API key or service account credentials'
        });

        return {
            success: false,
            error: 'Authentication failed',
            requiresManualFix: true
        };
    }

    async tryGoogleCloudFallback(context) {
        // Switch to Google Cloud Vertex AI
        const googleCloudBackend = require('./google-cloud-backend');

        if (!googleCloudBackend.isAvailable) {
            return { success: false, error: 'Google Cloud not available' };
        }

        try {
            debugMonitor.log('info', 'Switching to Google Cloud Vertex AI', context);

            // Extract contents from context
            const contents = context.contents || [{ parts: [{ text: context.prompt || 'test' }] }];
            const modelName = context.modelName || 'gemini-2.5-flash';

            const response = await googleCloudBackend.callGeminiLive(modelName, contents, {
                temperature: context.temperature || 0.7,
                maxOutputTokens: context.maxOutputTokens || 8192
            });

            return {
                success: true,
                recovered: true,
                response,
                method: 'google-cloud'
            };
        } catch (error) {
            debugMonitor.log('error', 'Google Cloud fallback failed', { error, context });
            return { success: false, error: error.message };
        }
    }

    async tryAlternativeModel(context) {
        // Try a different Gemini model
        if (context.modelName) {
            const alternatives = {
                'gemini-2.5-flash-live': 'gemini-2.5-flash',
                'gemini-2.5-flash': 'gemini-1.5-flash',
                'gemini-1.5-flash': 'gemini-1.5-pro'
            };

            const alternative = alternatives[context.modelName];
            if (alternative) {
                debugMonitor.log('info', `Switching to alternative model: ${alternative}`, {
                    original: context.modelName
                });
                return {
                    success: true,
                    recovered: true,
                    alternativeModel: alternative
                };
            }
        }

        return { success: false, error: 'No alternative model available' };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
const errorHandler = new ErrorHandler();

module.exports = errorHandler;


