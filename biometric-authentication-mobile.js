/**
 * Biometric Authentication Mobile
 * Mobile biometric authentication
 */
/* global PublicKeyCredential */

class BiometricAuthenticationMobile {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        this.trackEvent('biometric_mob_initialized');
        return { success: true, message: 'Biometric Authentication Mobile initialized' };
    }

    isSupported() {
        return typeof PublicKeyCredential !== 'undefined' && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable;
    }

    async authenticate() {
        if (!this.isSupported()) {
            throw new Error('Biometric authentication not supported');
        }
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`biometric_mob_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BiometricAuthenticationMobile;
}

