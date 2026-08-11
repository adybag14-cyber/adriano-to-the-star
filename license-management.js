/**
 * License Management
 * License management system
 */

class LicenseManagement {
    constructor() {
        this.licenses = new Map();
        this.allocations = new Map();
        this.compliance = new Map();
        this.init();
    }

    init() {
        this.trackEvent('license_mgmt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`license_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createLicense(licenseId, licenseData) {
        const license = {
            id: licenseId,
            ...licenseData,
            name: licenseData.name || licenseId,
            type: licenseData.type || '',
            seats: licenseData.seats || 1,
            status: 'active',
            createdAt: new Date()
        };
        
        this.licenses.set(licenseId, license);
        return license;
    }

    async allocate(licenseId, userId) {
        const license = this.licenses.get(licenseId);
        if (!license) {
            throw new Error(`License ${licenseId} not found`);
        }

        const allocation = {
            id: `alloc_${Date.now()}`,
            licenseId,
            userId,
            timestamp: new Date()
        };

        this.allocations.set(allocation.id, allocation);
        return allocation;
    }

    getLicense(licenseId) {
        return this.licenses.get(licenseId);
    }

    getAllLicenses() {
        return Array.from(this.licenses.values());
    }
}

module.exports = LicenseManagement;

