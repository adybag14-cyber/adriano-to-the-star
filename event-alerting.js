/**
 * Event Alerting
 * Alert on specific events
 */

class EventAlerting {
    constructor() {
        this.alerts = new Map();
        this.init();
    }
    
    init() {
        this.setupAlerting();
        this.trackEvent('event_alerting_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`event_alerting_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    setupAlerting() {
        // Setup event alerting
        if (window.eventTrackingSystemAdvanced) {
            window.eventTrackingSystemAdvanced.on('*', (event) => {
                this.checkAlerts(event);
            });
        }
    }
    
    createAlert(name, config) {
        // Create alert
        const alert = {
            id: Date.now().toString(),
            name,
            condition: config.condition,
            threshold: config.threshold || 1,
            action: config.action || null,
            enabled: true,
            createdAt: Date.now()
        };
        
        this.alerts.set(alert.id, alert);
        return alert;
    }
    
    async checkAlerts(event) {
        // Check if event triggers alerts
        for (const alert of this.alerts.values()) {
            if (!alert.enabled) continue;
            
            if (this.evaluateCondition(event, alert.condition)) {
                await this.triggerAlert(alert, event);
            }
        }
    }
    
    evaluateCondition(event, condition) {
        // Evaluate alert condition
        // Simplified - would use expression evaluator
        return true;
    }
    
    async triggerAlert(alert, event) {
        // Trigger alert
        if (alert.action) {
            await alert.action(event);
        }
        
        if (window.toastNotificationQueue) {
            window.toastNotificationQueue.show(`Alert: ${alert.name}`, 'warning');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.eventAlerting = new EventAlerting(); });
} else {
    window.eventAlerting = new EventAlerting();
}

