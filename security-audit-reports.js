/**
 * Security Audit Reports
 * Generate security audit reports
 */

class SecurityAuditReports {
    constructor() {
        this.init();
    }
    
    init() {
        this.createReportGenerator();
        this.trackEvent('sec_audit_reports_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sec_audit_reports_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    createReportGenerator() {
        const btn = document.createElement('button');
        btn.textContent = '📊 Security Report';
        btn.style.cssText = 'position:fixed;bottom:320px;right:20px;padding:12px 20px;background:rgba(186,148,79,0.9);border:2px solid rgba(186,148,79,1);color:white;border-radius:8px;cursor:pointer;z-index:9999;';
        btn.addEventListener('click', () => this.generateReport());
        document.body.appendChild(btn);
    }
    
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            security: {
                https: window.location.protocol === 'https:',
                cookies: document.cookie ? 'Present' : 'None',
                localStorage: localStorage.length > 0,
                sessionStorage: sessionStorage.length > 0
            },
            vulnerabilities: []
        };
        
        if (window.securityAuditLogging) {
            const logs = window.securityAuditLogging.getLogs({ severity: 'critical' });
            report.criticalEvents = logs.length;
        }
        
        this.downloadReport(report);
    }
    
    downloadReport(report) {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-audit-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.securityAuditReports = new SecurityAuditReports(); });
} else {
    window.securityAuditReports = new SecurityAuditReports();
}


