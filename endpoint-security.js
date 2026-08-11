/**
 * Endpoint Security
 * Endpoint protection and security management
 */

class EndpointSecurity {
    constructor() {
        this.endpoints = new Map();
        this.scans = new Map();
        this.threats = new Map();
        this.init();
    }

    init() {
        this.trackEvent('e_nd_po_in_ts_ec_ur_it_y_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_nd_po_in_ts_ec_ur_it_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerEndpoint(endpointId, endpointData) {
        const endpoint = {
            id: endpointId,
            ...endpointData,
            hostname: endpointData.hostname || '',
            ip: endpointData.ip || '',
            os: endpointData.os || '',
            status: 'online',
            lastSeen: new Date(),
            createdAt: new Date()
        };
        
        this.endpoints.set(endpointId, endpoint);
        console.log(`Endpoint registered: ${endpointId}`);
        return endpoint;
    }

    scanEndpoint(endpointId) {
        const endpoint = this.endpoints.get(endpointId);
        if (!endpoint) {
            throw new Error('Endpoint not found');
        }
        
        const scan = {
            id: `scan_${Date.now()}`,
            endpointId,
            status: 'running',
            threats: [],
            riskScore: 0,
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        const threats = this.performScan(endpoint);
        scan.threats = threats;
        scan.riskScore = threats.length * 10;
        scan.status = 'completed';
        scan.completedAt = new Date();
        
        this.scans.set(scan.id, scan);
        
        if (threats.length > 0) {
            threats.forEach(threat => {
                const threatId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                this.threats.set(threatId, {
                    id: threatId,
                    endpointId,
                    ...threat,
                    detectedAt: new Date()
                });
            });
        }
        
        return scan;
    }

    performScan(endpoint) {
        const threats = [];
        
        if (!endpoint.antivirus) {
            threats.push({ type: 'missing_antivirus', severity: 'high' });
        }
        
        if (!endpoint.firewall) {
            threats.push({ type: 'missing_firewall', severity: 'medium' });
        }
        
        if (endpoint.outdatedSoftware && endpoint.outdatedSoftware.length > 0) {
            threats.push({ type: 'outdated_software', severity: 'medium', details: endpoint.outdatedSoftware });
        }
        
        return threats;
    }

    quarantineEndpoint(endpointId) {
        const endpoint = this.endpoints.get(endpointId);
        if (!endpoint) {
            throw new Error('Endpoint not found');
        }
        
        endpoint.quarantined = true;
        endpoint.quarantinedAt = new Date();
        endpoint.status = 'quarantined';
        
        return endpoint;
    }

    getEndpoint(endpointId) {
        return this.endpoints.get(endpointId);
    }

    getThreats(endpointId = null) {
        if (endpointId) {
            return Array.from(this.threats.values())
                .filter(t => t.endpointId === endpointId);
        }
        return Array.from(this.threats.values());
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.endpointSecurity = new EndpointSecurity();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EndpointSecurity;
}

