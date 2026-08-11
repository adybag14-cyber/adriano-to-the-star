/**
 * IT Service Management
 * IT service management system
 */

class ITServiceManagement {
    constructor() {
        this.services = new Map();
        this.incidents = new Map();
        this.requests = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_ts_er_vi_ce_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ts_er_vi_ce_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerService(serviceId, serviceData) {
        const service = {
            id: serviceId,
            ...serviceData,
            name: serviceData.name || serviceId,
            status: 'active',
            incidents: [],
            requests: [],
            createdAt: new Date()
        };
        
        this.services.set(serviceId, service);
        console.log(`IT service registered: ${serviceId}`);
        return service;
    }

    createIncident(serviceId, incidentId, incidentData) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error('Service not found');
        }
        
        const incident = {
            id: incidentId,
            serviceId,
            ...incidentData,
            name: incidentData.name || incidentId,
            severity: incidentData.severity || 'medium',
            status: 'open',
            createdAt: new Date()
        };
        
        this.incidents.set(incidentId, incident);
        service.incidents.push(incidentId);
        
        return incident;
    }

    createRequest(serviceId, requestId, requestData) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error('Service not found');
        }
        
        const request = {
            id: requestId,
            serviceId,
            ...requestData,
            name: requestData.name || requestId,
            type: requestData.type || 'service_request',
            status: 'submitted',
            createdAt: new Date()
        };
        
        this.requests.set(requestId, request);
        service.requests.push(requestId);
        
        return request;
    }

    getService(serviceId) {
        return this.services.get(serviceId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.itServiceManagement = new ITServiceManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITServiceManagement;
}

