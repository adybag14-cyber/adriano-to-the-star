/**
 * Shadow Mode
 * Shadow mode deployment
 */

class ShadowMode {
    constructor() {
        this.deployments = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ha_do_wm_od_e_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ha_do_wm_od_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createDeployment(deploymentId, deploymentData) {
        const deployment = {
            id: deploymentId,
            ...deploymentData,
            name: deploymentData.name || deploymentId,
            primaryService: deploymentData.primaryService || '',
            shadowService: deploymentData.shadowService || '',
            enabled: deploymentData.enabled !== false,
            createdAt: new Date()
        };
        
        this.deployments.set(deploymentId, deployment);
        console.log(`Shadow deployment created: ${deploymentId}`);
        return deployment;
    }

    async processRequest(deploymentId, request) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }
        
        if (!deployment.enabled) {
            return { service: deployment.primaryService, response: 'primary_only' };
        }
        
        const requestRecord = {
            id: `request_${Date.now()}`,
            deploymentId,
            request,
            primaryResponse: null,
            shadowResponse: null,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.requests.set(requestRecord.id, requestRecord);
        
        const primaryResponse = await this.callService(deployment.primaryService, request);
        requestRecord.primaryResponse = primaryResponse;
        
        const shadowResponse = await this.callService(deployment.shadowService, request);
        requestRecord.shadowResponse = shadowResponse;
        
        requestRecord.comparison = this.compareResponses(primaryResponse, shadowResponse);
        
        return {
            response: primaryResponse,
            shadow: shadowResponse,
            comparison: requestRecord.comparison
        };
    }

    async callService(service, request) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ service, data: 'response', timestamp: new Date() });
            }, 100);
        });
    }

    compareResponses(primary, shadow) {
        return {
            match: JSON.stringify(primary) === JSON.stringify(shadow),
            differences: []
        };
    }

    getDeployment(deploymentId) {
        return this.deployments.get(deploymentId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.shadowMode = new ShadowMode();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShadowMode;
}

