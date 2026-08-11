/**
 * Install Prompts
 * Manages PWA installation prompts
 */

class InstallPrompts {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        this.trackEvent('i_ns_ta_ll_pr_om_pt_s_initialized');
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_ns_ta_ll_pr_om_pt_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async showPrompt() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;
            return outcome;
        }
    }
}

// Auto-initialize
const installPrompts = new InstallPrompts();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InstallPrompts;
}
