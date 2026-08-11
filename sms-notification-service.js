/**
 * SMS Notification Service
 * Sends SMS notifications via Twilio and other providers
 */

class SMSNotificationService {
    constructor() {
        this.provider = null;
        this.accountSid = null;
        this.authToken = null;
        this.fromNumber = null;
        this.init();
    }

    init() {
        this.trackEvent('s_ms_no_ti_fi_ca_ti_on_se_rv_ic_e_initialized');
    }

    configure(provider, accountSid, authToken, fromNumber) {
        this.provider = provider;
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
    }

    async sendSMS(to, message) {
        if (!this.provider || !this.accountSid || !this.authToken) {
            throw new Error('SMS service not configured');
        }

        const payload = {
            To: to,
            From: this.fromNumber,
            Body: message
        };

        try {
            const response = await fetch(this.getProviderUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`
                },
                body: new URLSearchParams(payload)
            });

            if (!response.ok) {
                throw new Error(`SMS send failed: ${response.statusText}`);
            }

            const result = await response.json();
            this.trackEvent('sms_sent', { to, provider: this.provider });
            return result;
        } catch (error) {
            console.error('SMS send error:', error);
            this.trackEvent('sms_send_failed', { to, provider: this.provider, error: error.message });
            throw error;
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`sms:${eventName}`, 1, {
                    source: 'sms-notification-service',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record SMS event:', e);
            }
        }
    }

    getProviderUrl() {
        if (this.provider === 'twilio') {
            return `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
        }
        throw new Error(`Unsupported SMS provider: ${this.provider}`);
    }
}

// Auto-initialize
const smsService = new SMSNotificationService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SMSNotificationService;
}

