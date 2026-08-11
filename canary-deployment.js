/**
 * Canary Deployment
 * Canary deployment strategy
 */

class CanaryDeployment {
    constructor() {
        this.deployments = new Map();
        this.versions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('canary_dep_initialized');
    }

    createDeployment(deploymentId, deploymentData) {
        const deployment = {
            id: deploymentId,
            ...deploymentData,
            name: deploymentData.name || deploymentId,
            currentVersion: deploymentData.currentVersion || 'v1',
            canaryVersion: null,
            trafficSplit: 0,
            status: 'stable',
            createdAt: new Date()
        };
        
        this.deployments.set(deploymentId, deployment);
        console.log(`Deployment created: ${deploymentId}`);
        return deployment;
    }

    async deployCanary(deploymentId, versionId, versionData) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }
        
        const version = {
            id: versionId,
            deploymentId,
            ...versionData,
            version: versionData.version || versionId,
            image: versionData.image || '',
            status: 'deploying',
            createdAt: new Date()
        };
        
        this.versions.set(versionId, version);
        
        version.status = 'running';
        version.deployedAt = new Date();
        
        deployment.canaryVersion = versionId;
        deployment.status = 'canary';
        deployment.trafficSplit = 10;
        
        return { deployment, version };
    }

    async increaseTraffic(deploymentId, percentage) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }
        
        if (deployment.status !== 'canary') {
            throw new Error('Deployment is not in canary mode');
        }
        
        deployment.trafficSplit = Math.min(100, deployment.trafficSplit + percentage);
        
        if (deployment.trafficSplit >= 100) {
            await this.promote(deploymentId);
        }
        
        return deployment;
    }

    async promote(deploymentId) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }
        
        if (deployment.canaryVersion) {
            deployment.currentVersion = deployment.canaryVersion;
            deployment.canaryVersion = null;
            deployment.trafficSplit = 0;
            deployment.status = 'stable';
        }
        
        return deployment;
    }

    getDeployment(deploymentId) {
        return this.deployments.get(deploymentId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`canary_dep_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.canaryDeployment = new CanaryDeployment();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanaryDeployment;
}
