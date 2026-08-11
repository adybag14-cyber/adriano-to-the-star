/**
 * Webhook Templates
 * Provides webhook templates for common use cases
 */

class WebhookTemplates {
    constructor() {
        this.templates = new Map();
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_te_mp_la_te_s_initialized');
        this.loadDefaultTemplates();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_te_mp_la_te_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadDefaultTemplates() {
        this.templates.set('user-created', {
            name: 'User Created',
            events: ['user.created'],
            payload: { userId: '{{userId}}', email: '{{email}}' }
        });
        
        this.templates.set('order-placed', {
            name: 'Order Placed',
            events: ['order.placed'],
            payload: { orderId: '{{orderId}}', amount: '{{amount}}' }
        });
    }

    getTemplate(name) {
        return this.templates.get(name);
    }
}

// Auto-initialize
const webhookTemplates = new WebhookTemplates();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookTemplates;
}

