/**
 * Native iOS App
 * Foundation for native iOS app development
 */

class NativeIOSApp {
    constructor() {
        this.init();
    }

    init() {
        this.trackEvent('n_at_iv_ei_os_ap_p_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_at_iv_ei_os_ap_p_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

}

// Auto-initialize
const nativeIOSApp = new NativeIOSApp();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NativeIOSApp;
}

