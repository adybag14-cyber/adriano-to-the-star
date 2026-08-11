/**
 * HIPAA Compliance Tools
 * Tools for HIPAA (Health Insurance Portability and Accountability Act) compliance
 */

class HIPAAComplianceTools {
    constructor() {
        this.phiRecords = new Map();
        this.accessLogs = new Map();
        this.breaches = new Map();
        this.init();
    }

    init() {
        this.trackEvent('h_ip_aa_co_mp_li_an_ce_to_ol_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("h_ip_aa_co_mp_li_an_ce_to_ol_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerPHIRecord(recordId, recordData) {
        const record = {
            id: recordId,
            ...recordData,
            patientId: recordData.patientId,
            phiType: recordData.phiType, // name, ssn, dob, medical_record, etc.
            accessControls: recordData.accessControls || [],
            encryption: recordData.encryption || false,
            createdAt: new Date()
        };
        
        this.phiRecords.set(recordId, record);
        console.log(`PHI record registered: ${recordId}`);
        return record;
    }

    logAccess(accessId, accessData) {
        const access = {
            id: accessId,
            ...accessData,
            userId: accessData.userId,
            recordId: accessData.recordId,
            purpose: accessData.purpose || '',
            timestamp: new Date(),
            authorized: accessData.authorized || false,
            createdAt: new Date()
        };
        
        this.accessLogs.set(accessId, access);
        console.log(`Access logged: ${accessId}`);
        return access;
    }

    reportBreach(breachId, breachData) {
        const breach = {
            id: breachId,
            ...breachData,
            type: breachData.type, // unauthorized_access, loss, theft, etc.
            affectedRecords: breachData.affectedRecords || [],
            discoveredAt: new Date(breachData.discoveredAt || Date.now()),
            reportedAt: breachData.reportedAt ? new Date(breachData.reportedAt) : null,
            status: 'reported',
            createdAt: new Date()
        };
        
        this.breaches.set(breachId, breach);
        console.log(`Breach reported: ${breachId}`);
        return breach;
    }

    checkAccessAuthorization(userId, recordId) {
        const record = this.phiRecords.get(recordId);
        if (!record) {
            throw new Error('PHI record not found');
        }
        
        const hasAccess = record.accessControls.includes(userId);
        
        this.logAccess(`access_${Date.now()}`, {
            userId,
            recordId,
            authorized: hasAccess,
            purpose: 'access_check'
        });
        
        return {
            authorized: hasAccess,
            recordId,
            userId
        };
    }

    auditAccess(userId, startDate, endDate) {
        const accesses = Array.from(this.accessLogs.values())
            .filter(access => {
                return access.userId === userId &&
                       access.timestamp >= startDate &&
                       access.timestamp <= endDate;
            });
        
        return {
            userId,
            period: { startDate, endDate },
            totalAccesses: accesses.length,
            authorizedAccesses: accesses.filter(a => a.authorized).length,
            unauthorizedAccesses: accesses.filter(a => !a.authorized).length,
            accesses
        };
    }

    checkBreachNotification(breachId) {
        const breach = this.breaches.get(breachId);
        if (!breach) {
            throw new Error('Breach not found');
        }
        
        const daysSinceDiscovery = (Date.now() - breach.discoveredAt.getTime()) / (1000 * 60 * 60 * 24);
        const requiresNotification = daysSinceDiscovery <= 60;
        
        return {
            breachId: breach.id,
            discoveredAt: breach.discoveredAt,
            daysSinceDiscovery,
            requiresNotification,
            notified: breach.reportedAt !== null,
            affectedRecords: breach.affectedRecords.length
        };
    }

    calculateComplianceScore() {
        let score = 100;
        
        const unencryptedRecords = Array.from(this.phiRecords.values())
            .filter(r => !r.encryption).length;
        
        if (this.phiRecords.size > 0) {
            score -= (unencryptedRecords / this.phiRecords.size) * 30;
        }
        
        const unauthorizedAccesses = Array.from(this.accessLogs.values())
            .filter(a => !a.authorized).length;
        
        score -= unauthorizedAccesses * 5;
        
        const unreportedBreaches = Array.from(this.breaches.values())
            .filter(b => !b.reportedAt).length;
        
        score -= unreportedBreaches * 20;
        
        return Math.max(0, Math.min(100, score));
    }

    generateComplianceReport() {
        const totalRecords = this.phiRecords.size;
        const encryptedRecords = Array.from(this.phiRecords.values())
            .filter(r => r.encryption).length;
        
        const totalAccesses = this.accessLogs.size;
        const authorizedAccesses = Array.from(this.accessLogs.values())
            .filter(a => a.authorized).length;
        
        const totalBreaches = this.breaches.size;
        const reportedBreaches = Array.from(this.breaches.values())
            .filter(b => b.reportedAt !== null).length;
        
        return {
            totalRecords,
            encryptedRecords,
            encryptionRate: totalRecords > 0 ? (encryptedRecords / totalRecords) * 100 : 0,
            totalAccesses,
            authorizedAccesses,
            authorizationRate: totalAccesses > 0 ? (authorizedAccesses / totalAccesses) * 100 : 0,
            totalBreaches,
            reportedBreaches,
            breachReportingRate: totalBreaches > 0 ? (reportedBreaches / totalBreaches) * 100 : 0,
            complianceScore: this.calculateComplianceScore(),
            generatedAt: new Date()
        };
    }

    getPHIRecord(recordId) {
        return this.phiRecords.get(recordId);
    }

    getBreach(breachId) {
        return this.breaches.get(breachId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.hipaaComplianceTools = new HIPAAComplianceTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HIPAAComplianceTools;
}

