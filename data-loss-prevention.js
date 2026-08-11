/**
 * Data Loss Prevention
 * Data loss prevention and data leakage protection
 */

class DataLossPrevention {
    constructor() {
        this.policies = new Map();
        this.incidents = new Map();
        this.blocks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('data_loss_prevention_initialized');
    }

    createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || '',
            dataTypes: policyData.dataTypes || [],
            actions: policyData.actions || ['block'],
            enabled: policyData.enabled !== false,
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        console.log(`DLP policy created: ${policyId}`);
        return policy;
    }

    scanData(data, context = {}) {
        const scan = {
            id: `scan_${Date.now()}`,
            data,
            context,
            violations: [],
            blocked: false,
            scannedAt: new Date()
        };
        
        this.policies.forEach((policy, policyId) => {
            if (!policy.enabled) return;
            
            policy.dataTypes.forEach(dataType => {
                if (this.detectDataType(data, dataType)) {
                    scan.violations.push({
                        policyId,
                        dataType,
                        action: policy.actions[0] || 'block'
                    });
                }
            });
        });
        
        if (scan.violations.length > 0) {
            scan.blocked = scan.violations.some(v => v.action === 'block');
            
            if (scan.blocked) {
                this.recordIncident(scan);
            }
        }
        
        return scan;
    }

    detectDataType(data, dataType) {
        const patterns = {
            'ssn': /\d{3}-\d{2}-\d{4}/,
            'credit_card': /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/,
            'email': /[^\s@]+@[^\s@]+\.[^\s@]+/,
            'phone': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/
        };
        
        const pattern = patterns[dataType];
        if (!pattern) return false;
        
        return pattern.test(data);
    }

    recordIncident(scan) {
        const incident = {
            id: `incident_${Date.now()}`,
            scanId: scan.id,
            violations: scan.violations,
            context: scan.context,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.incidents.set(incident.id, incident);
        
        if (scan.blocked) {
            const block = {
                id: `block_${Date.now()}`,
                incidentId: incident.id,
                blockedAt: new Date(),
                status: 'active',
                createdAt: new Date()
            };
            
            this.blocks.set(block.id, block);
        }
        
        return incident;
    }

    getIncidents() {
        return Array.from(this.incidents.values());
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`data_loss_prevention_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.dataLossPrevention = new DataLossPrevention();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLossPrevention;
}

