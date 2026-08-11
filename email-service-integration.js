class EmailServiceIntegration {
    constructor() {
        this.sent = [];
        this.enabled = true;
        this.trackEvent('email_service_integ_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`email_service_integ_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    configure(config) {
        this.enabled = config?.enabled !== false;
        this.defaultFrom = config?.from || this.defaultFrom;
    }
    async sendEmail({ to, subject, text, html, from }) {
        if (!this.enabled) return { success: false, reason: 'disabled' };
        const mail = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            to, subject, text, html, from: from || this.defaultFrom, timestamp: new Date()
        };
        this.sent.push(mail);
        return { success: true, id: mail.id };
    }
    getSent(limit = 20) {
        return this.sent.slice(-limit).reverse();
    }
}
const emailService = new EmailServiceIntegration();
if (typeof window !== 'undefined') {
    window.emailService = emailService;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailServiceIntegration;
}
