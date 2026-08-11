/**
 * Suspicious Activity Detection
 * Detects and alerts on suspicious behavior
 */

class SuspiciousActivityDetection {
    constructor() {
        this.patterns = [];
        this.thresholds = {
            failedLogins: 5,
            rapidActions: 10,
            unusualLocation: true
        };
        this.init();
    }
    
    init() {
        this.monitorActivity();
    }
    
    monitorActivity() {
        let actionCount = 0;
        const timeWindow = 60000; // 1 minute
        
        document.addEventListener('click', () => {
            actionCount++;
            if (actionCount > this.thresholds.rapidActions) {
                this.flagSuspicious('rapid_actions', { count: actionCount });
            }
            
            setTimeout(() => {
                actionCount = Math.max(0, actionCount - 1);
            }, timeWindow);
        });
    }
    
    flagSuspicious(type, data) {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString(),
            severity: 'warning'
        };
        
        if (window.securityAuditLogging) {
            window.securityAuditLogging.logEvent({
                type: 'suspicious_activity',
                ...event
            });
        }
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show('Suspicious activity detected', 'warning');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.suspiciousActivityDetection = new SuspiciousActivityDetection(); });
} else {
    window.suspiciousActivityDetection = new SuspiciousActivityDetection();
}


