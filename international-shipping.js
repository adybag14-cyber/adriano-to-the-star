/**
 * International Shipping
 * @class InternationalShipping
 * @description Manages international shipping with customs and duties.
 */
class InternationalShipping {
    constructor() {
        this.countries = new Map();
        this.customs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_nt_er_na_ti_on_al_sh_ip_pi_ng_initialized');
        this.setupCountries();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_er_na_ti_on_al_sh_ip_pi_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupCountries() {
        this.countries.set('CA', {
            code: 'CA',
            name: 'Canada',
            baseRate: 15.00,
            customsRequired: true
        });

        this.countries.set('GB', {
            code: 'GB',
            name: 'United Kingdom',
            baseRate: 20.00,
            customsRequired: true
        });

        this.countries.set('AU', {
            code: 'AU',
            name: 'Australia',
            baseRate: 25.00,
            customsRequired: true
        });
    }

    /**
     * Calculate international shipping rate.
     * @param {string} countryCode - Country code.
     * @param {object} shipmentData - Shipment data.
     * @returns {object} Shipping rate with customs information.
     */
    calculateInternationalRate(countryCode, shipmentData) {
        const country = this.countries.get(countryCode);
        if (!country) {
            throw new Error(`Country not supported: ${countryCode}`);
        }

        const baseRate = country.baseRate;
        const weight = shipmentData.weight || 1;
        const rate = baseRate + (weight * 2.00); // Higher per-pound rate for international

        return {
            country: country.name,
            rate,
            customsRequired: country.customsRequired,
            estimatedDays: 10,
            duties: this.calculateDuties(shipmentData.value, countryCode)
        };
    }

    /**
     * Calculate duties.
     * @param {number} value - Item value.
     * @param {string} countryCode - Country code.
     * @returns {number} Estimated duties.
     */
    calculateDuties(value, countryCode) {
        // Placeholder for actual duty calculation
        return value * 0.10; // 10% of value
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.internationalShipping = new InternationalShipping();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InternationalShipping;
}

