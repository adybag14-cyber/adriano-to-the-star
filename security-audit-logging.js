/**
 * Security Audit Logging
 * Comprehensive security audit logging system
 */

class SecurityAuditLogging {
    constructor() {
        this.auditLogs = [];
        this.logRetentionDays = 90;
        this.init();
    }

    init() {
        this.startCleanupTask();
        this.trackEvent('sec_audit_logging_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sec_audit_logging_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    logEvent(eventType, userId, details, severity = 'info') {
        const logEntry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventType,
            userId,
            details,
            severity,
            timestamp: new Date(),
            ipAddress: details.ipAddress || null,
            userAgent: details.userAgent || null
        };
        
        this.auditLogs.push(logEntry);
        console.log(`Security audit event logged: ${eventType}`);
        
        return logEntry.id;
    }

    logAuthentication(userId, action, success, details = {}) {
        return this.logEvent('authentication', userId, {
            action,
            success,
            ...details
        }, success ? 'info' : 'warning');
    }

    logAuthorization(userId, resource, action, allowed, details = {}) {
        return this.logEvent('authorization', userId, {
            resource,
            action,
            allowed,
            ...details
        }, allowed ? 'info' : 'warning');
    }

    logDataAccess(userId, resourceType, resourceId, action, details = {}) {
        return this.logEvent('data_access', userId, {
            resourceType,
            resourceId,
            action,
            ...details
        }, 'info');
    }

    logSecurityIncident(userId, incidentType, details = {}) {
        return this.logEvent('security_incident', userId, {
            incidentType,
            ...details
        }, 'critical');
    }

    logConfigurationChange(userId, configType, changes, details = {}) {
        return this.logEvent('configuration_change', userId, {
            configType,
            changes,
            ...details
        }, 'warning');
    }

    queryLogs(filters = {}) {
        let logs = [...this.auditLogs];
        
        if (filters.userId) {
            logs = logs.filter(log => log.userId === filters.userId);
        }
        
        if (filters.eventType) {
            logs = logs.filter(log => log.eventType === filters.eventType);
        }
        
        if (filters.severity) {
            logs = logs.filter(log => log.severity === filters.severity);
        }
        
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            logs = logs.filter(log => new Date(log.timestamp) >= start);
        }
        
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            logs = logs.filter(log => new Date(log.timestamp) <= end);
        }
        
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getSecuritySummary(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentLogs = this.auditLogs.filter(
            log => new Date(log.timestamp) >= cutoffDate
        );
        
        const summary = {
            totalEvents: recentLogs.length,
            byType: {},
            bySeverity: {},
            failedAuthentications: 0,
            securityIncidents: 0
        };
        
        recentLogs.forEach(log => {
            summary.byType[log.eventType] = (summary.byType[log.eventType] || 0) + 1;
            summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;
            
            if (log.eventType === 'authentication' && !log.details.success) {
                summary.failedAuthentications++;
            }
            
            if (log.eventType === 'security_incident') {
                summary.securityIncidents++;
            }
        });
        
        return summary;
    }

    startCleanupTask() {
        // Clean up old logs periodically
        setInterval(() => {
            this.cleanupOldLogs();
        }, 24 * 60 * 60 * 1000); // Daily
    }

    cleanupOldLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);
        
        const initialLength = this.auditLogs.length;
        this.auditLogs = this.auditLogs.filter(
            log => new Date(log.timestamp) >= cutoffDate
        );
        
        const removed = initialLength - this.auditLogs.length;
        if (removed > 0) {
            console.log(`Cleaned up ${removed} old audit logs`);
        }
    }

    exportLogs(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.auditLogs, null, 2);
        }
        // Add other formats (CSV, etc.) as needed
        return this.auditLogs;
    }
}

if (typeof window !== 'undefined') {
    window.securityAuditLogging = new SecurityAuditLogging();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityAuditLogging;
}
