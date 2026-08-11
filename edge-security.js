/**
 * Edge Security
 * Edge device security management
 */

class EdgeSecurity {
    constructor() {
        this.devices = new Map();
        this.policies = new Map();
        this.incidents = new Map();
        this.init();
    }

    init() {
        this.trackEvent('edge_security_initialized');
    }

    registerDevice(deviceId, deviceData) {
        const device = {
            id: deviceId,
            ...deviceData,
            name: deviceData.name || deviceId,
            securityLevel: deviceData.securityLevel || 'standard',
            policies: deviceData.policies || [],
            status: 'secure',
            createdAt: new Date()
        };
        
        this.devices.set(deviceId, device);
        console.log(`Device registered: ${deviceId}`);
        return device;
    }

    createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || policyId,
            rules: policyData.rules || [],
            enabled: policyData.enabled !== false,
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        console.log(`Security policy created: ${policyId}`);
        return policy;
    }

    async enforcePolicy(deviceId, policyId, action) {
        const device = this.devices.get(deviceId);
        const policy = this.policies.get(policyId);
        
        if (!device || !policy) {
            throw new Error('Device or policy not found');
        }
        
        const allowed = this.checkPolicy(policy, action);
        
        if (!allowed) {
            const incident = {
                id: `incident_${Date.now()}`,
                deviceId,
                policyId,
                action,
                severity: 'medium',
                blocked: true,
                timestamp: new Date(),
                createdAt: new Date()
            };
            
            this.incidents.set(incident.id, incident);
            device.status = 'threat_detected';
            
            return { allowed: false, incident };
        }
        
        return { allowed: true };
    }

    checkPolicy(policy, action) {
        if (!policy.enabled) {
            return true;
        }
        
        return policy.rules.every(rule => {
            if (rule.type === 'allow') {
                return rule.actions.includes(action.type);
            } else if (rule.type === 'deny') {
                return !rule.actions.includes(action.type);
            }
            return true;
        });
    }

    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`edge_security_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.edgeSecurity = new EdgeSecurity();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdgeSecurity;
}


