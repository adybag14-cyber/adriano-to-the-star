/**
 * Shipping Zones
 * @class ShippingZones
 * @description Manages shipping zones with different rates and rules.
 */
class ShippingZones {
    constructor() {
        this.zones = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_hi_pp_in_gz_on_es_initialized');
        this.setupDefaultZones();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_hi_pp_in_gz_on_es_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultZones() {
        this.zones.set('domestic', {
            id: 'domestic',
            name: 'Domestic',
            countries: ['US'],
            baseRate: 5.99
        });

        this.zones.set('international', {
            id: 'international',
            name: 'International',
            countries: [],
            baseRate: 15.99
        });
    }

    /**
     * Create a shipping zone.
     * @param {string} zoneId - Zone identifier.
     * @param {object} zoneData - Zone data.
     */
    createZone(zoneId, zoneData) {
        this.zones.set(zoneId, {
            ...zoneData,
            id: zoneId,
            countries: zoneData.countries || [],
            rates: zoneData.rates || {}
        });
        console.log(`Shipping zone created: ${zoneId}`);
    }

    /**
     * Get zone for country.
     * @param {string} countryCode - Country code.
     * @returns {object} Shipping zone.
     */
    getZoneForCountry(countryCode) {
        for (const zone of this.zones.values()) {
            if (zone.countries.includes(countryCode)) {
                return zone;
            }
        }
        return this.zones.get('international');
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.shippingZones = new ShippingZones();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShippingZones;
}

