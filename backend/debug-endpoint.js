/**
 * Debug Endpoints for Monitoring and Diagnostics
 */

const express = require('express');
const debugMonitor = require('./debug-monitor');
const errorHandler = require('./error-handler');
const googleCloudBackend = require('./google-cloud-backend');
const autoRecovery = require('./auto-recovery');

const NODE_ENV = process.env.NODE_ENV || 'development';

function setupDebugEndpoints(app, options = {}) {
    const router = express.Router();

    const authMiddleware = options.authMiddleware;
    if (typeof authMiddleware === 'function') {
        router.use(authMiddleware);
    }

    // Get debug statistics
    router.get('/debug/stats', (req, res) => {
        try {
            const stats = debugMonitor.getStats();
            res.json({
                success: true,
                stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: NODE_ENV === 'production' ? 'Internal server error' : error.message
            });
        }
    });

    // Get recent errors
    router.get('/debug/errors', (req, res) => {
        try {
            const count = parseInt(req.query.count) || 10;
            const errors = debugMonitor.getRecentErrors(count);
            res.json({
                success: true,
                errors,
                count: errors.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: NODE_ENV === 'production' ? 'Internal server error' : error.message
            });
        }
    });

    // Reset statistics
    router.post('/debug/reset', (req, res) => {
        try {
            debugMonitor.resetStats();
            res.json({
                success: true,
                message: 'Statistics reset'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: NODE_ENV === 'production' ? 'Internal server error' : error.message
            });
        }
    });

    // Get system health
    router.get('/debug/health', (req, res) => {
        try {
            const health = {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                googleCloud: googleCloudBackend.getStatus(),
                stats: debugMonitor.getStats(),
                timestamp: new Date().toISOString()
            };
            res.json({
                success: true,
                health
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: NODE_ENV === 'production' ? 'Internal server error' : error.message
            });
        }
    });

    // Trigger manual recovery
    router.post('/debug/recover', async (req, res) => {
        try {
            const { error, context } = req.body;
            const result = await autoRecovery.recoverFromError(
                new Error(error || 'Manual recovery trigger'),
                context || {}
            );
            res.json({
                success: result.success || false,
                result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: NODE_ENV === 'production' ? 'Internal server error' : error.message
            });
        }
    });

    // Test Google Cloud connection
    router.get('/debug/test-google-cloud', async (req, res) => {
        try {
            const status = googleCloudBackend.getStatus();
            res.json({
                success: true,
                status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: NODE_ENV === 'production' ? 'Internal server error' : error.message
            });
        }
    });

    app.use(router);
}

module.exports = setupDebugEndpoints;

