/**
 * Canary Deployments
 * @class CanaryDeployments
 * @description Manages canary deployments for gradual rollouts.
 */
class CanaryDeployments {
    constructor() {
        this.deployments = new Map();
        this.traffic = new Map();
        this.init();
    }

    init() {
        this.trackEvent('canary_deps_initialized');
    }

    /**
     * Create canary deployment.
     * @param {string} deploymentId - Deployment identifier.
     * @param {object} deploymentData - Deployment data.
     */
    createCanaryDeployment(deploymentId, deploymentData) {
        this.deployments.set(deploymentId, {
            ...deploymentData,
            id: deploymentId,
            version: deploymentData.version,
            trafficPercentage: deploymentData.trafficPercentage || 10,
            status: 'active',
            createdAt: new Date()
        });
        console.log(`Canary deployment created: ${deploymentId}`);
    }

    /**
     * Route traffic to canary.
     * @param {string} deploymentId - Deployment identifier.
     * @param {string} userId - User identifier.
     * @returns {boolean} Whether to route to canary.
     */
    shouldRouteToCanary(deploymentId, userId) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) return false;

        const userHash = this.hashUserId(userId);
        return (userHash % 100) < deployment.trafficPercentage;
    }

    /**
     * Hash user ID.
     * @param {string} userId - User identifier.
     * @returns {number} Hash value.
     */
    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Increase canary traffic.
     * @param {string} deploymentId - Deployment identifier.
     * @param {number} percentage - New traffic percentage.
     */
    increaseTraffic(deploymentId, percentage) {
        const deployment = this.deployments.get(deploymentId);
        if (deployment) {
            deployment.trafficPercentage = Math.min(percentage, 100);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`canary_deps_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.canaryDeployments = new CanaryDeployments();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanaryDeployments;
}

