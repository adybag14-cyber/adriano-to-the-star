/**
 * Webhook Versioning
 * Manages webhook versions
 */

class WebhookVersioning {
    constructor() {
        this.versions = new Map();
        this.currentVersion = 'v1';
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_ve_rs_io_ni_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_ve_rs_io_ni_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createVersion(version, webhook) {
        this.versions.set(version, webhook);
    }

    getVersion(version) {
        return this.versions.get(version || this.currentVersion);
    }
}

// Auto-initialize
const webhookVersioning = new WebhookVersioning();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookVersioning;
}

