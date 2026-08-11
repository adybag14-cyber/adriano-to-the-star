/**
 * CCPA Compliance Tools
 * Tools for CCPA (California Consumer Privacy Act) compliance
 */

class CCPAComplianceTools {
    constructor() {
        this.dataRecords = new Map();
        this.requests = new Map();
        this.salesOptOuts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('ccpa_tools_initialized');
    }

    registerDataRecord(recordId, recordData) {
        const record = {
            id: recordId,
            ...recordData,
            consumer: recordData.consumer || null,
            categories: recordData.categories || [],
            sources: recordData.sources || [],
            businessPurpose: recordData.businessPurpose || '',
            sold: recordData.sold || false,
            disclosed: recordData.disclosed || false,
            createdAt: new Date()
        };
        
        this.dataRecords.set(recordId, record);
        console.log(`Data record registered: ${recordId}`);
        return record;
    }

    handleConsumerRequest(requestId, requestData) {
        const request = {
            id: requestId,
            ...requestData,
            type: requestData.type, // know, delete, opt-out, opt-in
            consumer: requestData.consumer,
            status: 'pending',
            submittedAt: new Date(),
            createdAt: new Date()
        };
        
        this.requests.set(requestId, request);
        console.log(`Consumer request created: ${requestId}`);
        return request;
    }

    processKnowRequest(requestId) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        if (request.type !== 'know') {
            throw new Error('Request is not a know request');
        }
        
        const dataRecords = Array.from(this.dataRecords.values())
            .filter(record => record.consumer === request.consumer);
        
        const categories = new Set();
        const sources = new Set();
        const purposes = new Set();
        let sold = false;
        let disclosed = false;
        
        dataRecords.forEach(record => {
            record.categories.forEach(cat => categories.add(cat));
            record.sources.forEach(src => sources.add(src));
            purposes.add(record.businessPurpose);
            if (record.sold) sold = true;
            if (record.disclosed) disclosed = true;
        });
        
        request.status = 'completed';
        request.completedAt = new Date();
        request.response = {
            categories: Array.from(categories),
            sources: Array.from(sources),
            purposes: Array.from(purposes),
            sold,
            disclosed,
            dataRecords
        };
        
        return request.response;
    }

    processDeleteRequest(requestId) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        if (request.type !== 'delete') {
            throw new Error('Request is not a delete request');
        }
        
        const deletedRecords = [];
        this.dataRecords.forEach((record, recordId) => {
            if (record.consumer === request.consumer) {
                this.dataRecords.delete(recordId);
                deletedRecords.push(recordId);
            }
        });
        
        request.status = 'completed';
        request.completedAt = new Date();
        request.deletedRecords = deletedRecords;
        
        return {
            requestId: request.id,
            consumer: request.consumer,
            deletedRecords,
            deletedAt: new Date()
        };
    }

    recordOptOut(consumer, optOutData = {}) {
        const optOut = {
            id: `optout_${Date.now()}`,
            consumer,
            ...optOutData,
            optedOut: true,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.salesOptOuts.set(optOut.id, optOut);
        console.log(`Opt-out recorded for consumer: ${consumer}`);
        return optOut;
    }

    recordOptIn(consumer) {
        const optOuts = Array.from(this.salesOptOuts.values())
            .filter(optOut => optOut.consumer === consumer && optOut.optedOut);
        
        optOuts.forEach(optOut => {
            optOut.optedOut = false;
            optOut.optedInAt = new Date();
        });
        
        return {
            consumer,
            optOutsRemoved: optOuts.length,
            optedInAt: new Date()
        };
    }

    checkOptOutStatus(consumer) {
        const activeOptOuts = Array.from(this.salesOptOuts.values())
            .filter(optOut => optOut.consumer === consumer && optOut.optedOut);
        
        return {
            consumer,
            optedOut: activeOptOuts.length > 0,
            optOuts: activeOptOuts
        };
    }

    checkCompliance() {
        const totalRecords = this.dataRecords.size;
        const recordsSold = Array.from(this.dataRecords.values())
            .filter(r => r.sold).length;
        
        const pendingRequests = Array.from(this.requests.values())
            .filter(r => r.status === 'pending').length;
        
        const overdueRequests = Array.from(this.requests.values())
            .filter(r => {
                if (r.status === 'pending') {
                    const daysSince = (Date.now() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
                    return daysSince > 45;
                }
                return false;
            }).length;
        
        return {
            totalRecords,
            recordsSold,
            salesRate: totalRecords > 0 ? (recordsSold / totalRecords) * 100 : 0,
            pendingRequests,
            overdueRequests,
            complianceScore: this.calculateComplianceScore()
        };
    }

    calculateComplianceScore() {
        let score = 100;
        
        const overdueRequests = Array.from(this.requests.values())
            .filter(r => {
                if (r.status === 'pending') {
                    const daysSince = (Date.now() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
                    return daysSince > 45;
                }
                return false;
            }).length;
        
        score -= overdueRequests * 10;
        
        return Math.max(0, Math.min(100, score));
    }

    getRequest(requestId) {
        return this.requests.get(requestId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ccpa_tools_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.ccpaComplianceTools = new CCPAComplianceTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CCPAComplianceTools;
}

