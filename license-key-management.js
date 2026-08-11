/**
 * License Key Management
 * @class LicenseKeyManagement
 * @description Generates and manages license keys for software products.
 */
class LicenseKeyManagement {
    constructor() {
        this.licenses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_ic_en_se_ke_ym_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ic_en_se_ke_ym_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Generate a license key.
     * @param {string} productId - Product identifier.
     * @param {string} userId - User identifier.
     * @param {object} licenseData - License data.
     * @returns {string} License key.
     */
    generateLicenseKey(productId, userId, licenseData) {
        const licenseKey = this.createLicenseKey();
        this.licenses.set(licenseKey, {
            key: licenseKey,
            productId,
            userId,
            type: licenseData.type || 'single', // single, multi, subscription
            maxActivations: licenseData.maxActivations || 1,
            activations: [],
            expiresAt: licenseData.expiresAt || null,
            createdAt: new Date()
        });
        console.log(`License key generated: ${licenseKey}`);
        return licenseKey;
    }

    /**
     * Create a license key.
     * @returns {string} License key.
     */
    createLicenseKey() {
        const segments = [];
        for (let i = 0; i < 4; i++) {
            segments.push(Math.random().toString(36).substring(2, 6).toUpperCase());
        }
        return segments.join('-');
    }

    /**
     * Activate license key.
     * @param {string} licenseKey - License key.
     * @param {string} deviceId - Device identifier.
     * @returns {object} Activation result.
     */
    activateLicense(licenseKey, deviceId) {
        const license = this.licenses.get(licenseKey);
        if (!license) {
            throw new Error('Invalid license key');
        }

        if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
            throw new Error('License has expired');
        }

        if (license.activations.length >= license.maxActivations) {
            throw new Error('Maximum activations reached');
        }

        if (license.activations.includes(deviceId)) {
            return { success: true, message: 'License already activated on this device' };
        }

        license.activations.push(deviceId);
        console.log(`License activated: ${licenseKey} on device ${deviceId}`);
        
        return {
            success: true,
            activationsRemaining: license.maxActivations - license.activations.length
        };
    }

    /**
     * Validate license key.
     * @param {string} licenseKey - License key.
     * @returns {object} License validation result.
     */
    validateLicense(licenseKey) {
        const license = this.licenses.get(licenseKey);
        if (!license) {
            return { valid: false, reason: 'Invalid license key' };
        }

        if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
            return { valid: false, reason: 'License expired' };
        }

        return {
            valid: true,
            productId: license.productId,
            activations: license.activations.length,
            maxActivations: license.maxActivations
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.licenseKeyManagement = new LicenseKeyManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseKeyManagement;
}

