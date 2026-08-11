/**
 * Shipping Rates Calculator
 * @class ShippingRatesCalculator
 * @description Calculates shipping rates based on weight, dimensions, and destination.
 */
class ShippingRatesCalculator {
    constructor() {
        this.carriers = new Map();
        this.rates = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_hi_pp_in_gr_at_es_ca_lc_ul_at_or_initialized');
        this.setupCarriers();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_hi_pp_in_gr_at_es_ca_lc_ul_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupCarriers() {
        this.carriers.set('usps', {
            name: 'USPS',
            baseRate: 5.00,
            perPound: 0.50
        });

        this.carriers.set('fedex', {
            name: 'FedEx',
            baseRate: 8.00,
            perPound: 0.75
        });

        this.carriers.set('ups', {
            name: 'UPS',
            baseRate: 7.00,
            perPound: 0.70
        });
    }

    /**
     * Calculate shipping rate.
     * @param {object} shipmentData - Shipment data.
     * @param {string} carrier - Carrier identifier (optional).
     * @returns {Array<object>} Shipping rates.
     */
    calculateRate(shipmentData, carrier = null) {
        const carriers = carrier ? [carrier] : Array.from(this.carriers.keys());
        const rates = [];

        for (const carr of carriers) {
            const carrierData = this.carriers.get(carr);
            if (!carrierData) continue;

            const weight = shipmentData.weight || 1;
            const rate = carrierData.baseRate + (weight * carrierData.perPound);
            
            // Add distance-based calculation if provided
            let finalRate = rate;
            if (shipmentData.distance) {
                finalRate += shipmentData.distance * 0.10;
            }

            rates.push({
                carrier: carr,
                service: 'standard',
                rate: finalRate,
                estimatedDays: 5
            });
        }

        return rates;
    }

    /**
     * Get best rate.
     * @param {object} shipmentData - Shipment data.
     * @returns {object} Best shipping rate.
     */
    getBestRate(shipmentData) {
        const rates = this.calculateRate(shipmentData);
        return rates.sort((a, b) => a.rate - b.rate)[0];
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.shippingRatesCalculator = new ShippingRatesCalculator();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShippingRatesCalculator;
}

