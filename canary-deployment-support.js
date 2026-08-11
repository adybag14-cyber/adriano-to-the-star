/**
 * Canary Deployment Support
 * Gradual rollout deployment strategy
 * 
 * Features:
 * - Percentage-based traffic routing
 * - Automatic rollback on errors
 * - Performance monitoring
 * - Gradual traffic increase
 * - A/B testing support
 */

class CanaryDeploymentSupport {
    constructor() {
        this.canaryPercentage = 0;
        this.canaryVersion = null;
        this.productionVersion = null;
        this.metrics = {
            errors: { canary: 0, production: 0 },
            requests: { canary: 0, production: 0 },
            responseTime: { canary: [], production: [] }
        };
        this.init();
    }

    init() {
        this.trackEvent('canary_deploy_initialized');
    }

    /**
     * Start canary deployment
     * @param {string} version - Canary version
     * @param {number} initialPercentage - Initial traffic percentage (0-100)
     */
    startCanary(version, initialPercentage = 5) {
        this.canaryVersion = version;
        this.canaryPercentage = Math.min(100, Math.max(0, initialPercentage));
        this.productionVersion = 'current-production';
        
        console.log(`🚀 Canary deployment started: ${version} at ${this.canaryPercentage}% traffic`);
        
        // Start monitoring
        this.startMonitoring();
        
        return {
            canaryVersion: version,
            trafficPercentage: this.canaryPercentage,
            startTime: new Date().toISOString()
        };
    }

    /**
     * Increase canary traffic percentage
     * @param {number} increment - Percentage to increase (default 5%)
     */
    increaseTraffic(increment = 5) {
        const newPercentage = Math.min(100, this.canaryPercentage + increment);
        
        if (this.shouldIncrease(newPercentage)) {
            this.canaryPercentage = newPercentage;
            console.log(`📈 Canary traffic increased to ${this.canaryPercentage}%`);
            return true;
        } else {
            console.warn('⚠️ Cannot increase traffic - canary metrics below threshold');
            return false;
        }
    }

    /**
     * Check if traffic should be increased
     */
    shouldIncrease(newPercentage) {
        const canaryErrorRate = this.getErrorRate('canary');
        const productionErrorRate = this.getErrorRate('production');
        const canaryAvgResponse = this.getAverageResponseTime('canary');
        const productionAvgResponse = this.getAverageResponseTime('production');
        
        // Only increase if canary performs as well or better
        return canaryErrorRate <= productionErrorRate * 1.1 && 
               canaryAvgResponse <= productionAvgResponse * 1.2;
    }

    /**
     * Promote canary to production
     */
    promoteToProduction() {
        if (this.canaryPercentage < 100) {
            console.warn('⚠️ Canary not at 100% - forcing promotion');
        }
        
        this.productionVersion = this.canaryVersion;
        this.canaryVersion = null;
        this.canaryPercentage = 0;
        
        console.log(`✅ Canary ${this.canaryVersion} promoted to production`);
        
        return {
            newProductionVersion: this.productionVersion,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Rollback canary deployment
     */
    rollback() {
        console.log('⏪ Rolling back canary deployment...');
        
        this.canaryVersion = null;
        this.canaryPercentage = 0;
        this.metrics = {
            errors: { canary: 0, production: 0 },
            requests: { canary: 0, production: 0 },
            responseTime: { canary: [], production: [] }
        };
        
        return {
            rolledBack: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Route request to canary or production
     * @param {string} requestId - Request identifier
     */
    routeRequest(requestId) {
        const random = Math.random() * 100;
        
        if (random < this.canaryPercentage && this.canaryVersion) {
            this.metrics.requests.canary++;
            return {
                environment: 'canary',
                version: this.canaryVersion
            };
        } else {
            this.metrics.requests.production++;
            return {
                environment: 'production',
                version: this.productionVersion
            };
        }
    }

    /**
     * Record request metrics
     */
    recordRequest(environment, responseTime, success) {
        this.metrics.responseTime[environment].push(responseTime);
        
        if (!success) {
            this.metrics.errors[environment]++;
        }
        
        // Keep only last 1000 metrics
        if (this.metrics.responseTime[environment].length > 1000) {
            this.metrics.responseTime[environment].shift();
        }
    }

    getErrorRate(environment) {
        const requests = this.metrics.requests[environment];
        const errors = this.metrics.errors[environment];
        return requests > 0 ? (errors / requests) * 100 : 0;
    }

    getAverageResponseTime(environment) {
        const times = this.metrics.responseTime[environment];
        if (times.length === 0) return 0;
        return times.reduce((sum, time) => sum + time, 0) / times.length;
    }

    startMonitoring() {
        // Monitor canary performance
        setInterval(() => {
            const canaryErrorRate = this.getErrorRate('canary');
            const productionErrorRate = this.getErrorRate('production');
            
            // Auto-rollback if canary error rate is too high
            if (canaryErrorRate > productionErrorRate * 2 && this.canaryPercentage > 0) {
                console.error('🚨 Canary error rate too high - auto-rollback');
                this.rollback();
            }
        }, 60000); // Check every minute
    }

    /**
     * Get canary status
     */
    getStatus() {
        return {
            canaryVersion: this.canaryVersion,
            productionVersion: this.productionVersion,
            trafficPercentage: this.canaryPercentage,
            metrics: {
                canary: {
                    errorRate: this.getErrorRate('canary'),
                    avgResponseTime: this.getAverageResponseTime('canary'),
                    requests: this.metrics.requests.canary
                },
                production: {
                    errorRate: this.getErrorRate('production'),
                    avgResponseTime: this.getAverageResponseTime('production'),
                    requests: this.metrics.requests.production
                }
            }
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`canary_deploy_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.canaryDeployment = new CanaryDeploymentSupport();
}
