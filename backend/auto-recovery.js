/**
 * Automatic Recovery System
 * Monitors system health and automatically recovers from common issues
 */

/* global AbortSignal */

const debugMonitor = require('./debug-monitor');
const errorHandler = require('./error-handler');
const googleCloudBackend = require('./google-cloud-backend');

class AutoRecovery {
    constructor() {
        this.recoveryInterval = 60000; // Check every minute
        this.healthChecks = [];
        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => {
            this.performHealthChecks();
        }, this.recoveryInterval);

        debugMonitor.log('info', 'Auto-recovery monitoring started', {
            interval: this.recoveryInterval
        });
    }

    async performHealthChecks() {
        const checks = [
            this.checkGeminiAPI.bind(this),
            this.checkGoogleCloud.bind(this),
            this.checkWebSocketConnections.bind(this),
            this.checkSystemResources.bind(this)
        ];

        for (const check of checks) {
            try {
                await check();
            } catch (error) {
                debugMonitor.log('error', 'Health check failed', {
                    check: check.name,
                    error: error.message
                });
            }
        }
    }

    async checkGeminiAPI() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

        if (!apiKey || apiKey === 'your-gemini-api-key-here') {
            debugMonitor.log('warn', 'Gemini API key not configured', {
                suggestion: 'Set GEMINI_API_KEY in .env or configure Google Cloud'
            });

            // Try to use Google Cloud as fallback
            if (googleCloudBackend.isAvailable) {
                debugMonitor.log('info', 'Using Google Cloud as fallback for Gemini API');
                return true;
            }

            return false;
        }

        // Test API key by making a simple request
        try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(testUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'test' }] }]
                }),
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                debugMonitor.log('debug', 'Gemini API key is valid');
                return true;
            } else {
                debugMonitor.log('warn', 'Gemini API key validation failed', {
                    status: response.status
                });
                return false;
            }
        } catch (error) {
            debugMonitor.log('warn', 'Gemini API key test failed', { error: error.message });
            return false;
        }
    }

    async checkGoogleCloud() {
        if (googleCloudBackend.isAvailable) {
            const status = googleCloudBackend.getStatus();
            debugMonitor.log('debug', 'Google Cloud status', status);
            return true;
        } else {
            // Try to initialize if credentials are available
            if (process.env.GOOGLE_CLOUD_PROJECT) {
                debugMonitor.log('info', 'Attempting to initialize Google Cloud', {
                    project: process.env.GOOGLE_CLOUD_PROJECT
                });
                await googleCloudBackend.initialize();
                return googleCloudBackend.isAvailable;
            }
            return false;
        }
    }

    async checkWebSocketConnections() {
        // This would check active WebSocket connections
        // Implementation depends on your WebSocket server
        debugMonitor.log('debug', 'WebSocket connections check completed');
        return true;
    }

    async checkSystemResources() {
        const usage = process.memoryUsage();
        const maxHeap = 512 * 1024 * 1024; // 512MB threshold

        if (usage.heapUsed > maxHeap) {
            debugMonitor.log('warn', 'High memory usage detected', {
                heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                threshold: `${(maxHeap / 1024 / 1024).toFixed(2)}MB`
            });

            // Suggest garbage collection
            if (global.gc) {
                global.gc();
                debugMonitor.log('info', 'Garbage collection triggered');
            }
        }

        return true;
    }

    async recoverFromError(error, context) {
        debugMonitor.log('info', 'Attempting automatic recovery', {
            error: error.message,
            context
        });

        const handled = await errorHandler.handleError(error, context);

        if (handled.success) {
            debugMonitor.log('info', 'Automatic recovery successful', {
                strategy: handled.strategy || 'unknown'
            });
        } else {
            debugMonitor.log('warn', 'Automatic recovery failed', {
                error: error.message
            });
        }

        return handled;
    }
}

// Export singleton instance
const autoRecovery = new AutoRecovery();

module.exports = autoRecovery;


