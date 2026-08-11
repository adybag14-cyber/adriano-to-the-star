class TaxCalculation {
    constructor() {
        this.taxRules = new Map();
        this.taxRates = new Map();
        this.init();
    }

    init() {
        // Tax Calculation initialized.
        this.setupDefaultTaxRates();
    }

    setupDefaultTaxRates() {
        // Default tax rates by region
        this.taxRates.set('US', {
            default: 0.08, // 8% default
            states: {
                'CA': 0.10,
                'NY': 0.08,
                'TX': 0.0625
            }
        });

        this.taxRates.set('EU', {
            default: 0.20 // 20% VAT
        });
    }

    /**
     * Set tax rate for a region.
     * @param {string} region - Region code (e.g. 'US-CA').
     * @param {number} rate - Tax rate (e.g. 8.25 for 8.25%).
     */
    setTaxRate(region, rate) {
        // Handle US states format 'US-XX'
        if (region.startsWith('US-')) {
            const state = region.split('-')[1];
            if (!this.taxRates.has('US')) {
                this.taxRates.set('US', { default: 0, states: {} });
            }
            const usRates = this.taxRates.get('US');
            if (!usRates.states) usRates.states = {};
            usRates.states[state] = rate / 100; // Convert 8.25 to 0.0825 if needed, or keep consistent. 
            // Existing code uses decimals (0.08). Server sends 8.25. 
            // Let's assume input is percentage if > 1, else decimal.
            usRates.states[state] = rate > 1 ? rate / 100 : rate;
        } else {
            // General region
            this.taxRates.set(region, { default: rate > 1 ? rate / 100 : rate });
        }
    }

    /**
     * Simple tax calculation for total amount.
     * @param {number} amount - Total amount.
     * @param {string} region - Region code.
     * @returns {object} { amount, tax, total }
     */
    calculateSimple(amount, region) {
        let rate = 0;
        // Mock address object for getTaxRate
        let address = { country: region };
        if (region.startsWith('US-')) {
            address = { country: 'US', state: region.split('-')[1] };
        }

        rate = this.getTaxRate(address);
        const tax = amount * rate;
        return {
            amount,
            tax,
            total: amount + tax,
            rate
        };
    }

    /**
     * Calculate tax for an order.
     * @param {object} orderData - Order data.
     * @returns {object} Tax calculation result.
     */
    calculateTax(orderData) {
        const { items, shippingAddress, billingAddress } = orderData;
        const address = shippingAddress || billingAddress;

        if (!address) {
            return { tax: 0, taxRate: 0 };
        }

        const taxRate = this.getTaxRate(address);
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * taxRate;

        this.trackEvent('tax_calculated', { country: address.country, taxRate, tax, subtotal });
        return {
            tax,
            taxRate,
            subtotal,
            total: subtotal + tax
        };
    }

    /**
     * Get tax rate for an address.
     * @param {object} address - Address object.
     * @returns {number} Tax rate.
     */
    getTaxRate(address) {
        const country = address.country || 'US';
        const countryRates = this.taxRates.get(country);

        if (!countryRates) {
            return 0; // No tax if country not found
        }

        if (country === 'US' && address.state && countryRates.states) {
            return countryRates.states[address.state] || countryRates.default;
        }

        return countryRates.default || 0;
    }

    /**
     * Add tax rule.
     * @param {string} ruleId - Rule identifier.
     * @param {object} ruleData - Rule data.
     */
    addTaxRule(ruleId, ruleData) {
        this.taxRules.set(ruleId, {
            ...ruleData,
            id: ruleId,
            createdAt: new Date()
        });
        this.trackEvent('tax_rule_added', { ruleId });
    }

    trackEvent(eventName, data = {}) {
        if (typeof window !== 'undefined' && window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`tax:${eventName}`, 1, {
                    source: 'tax-calculation',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record tax event:', e);
            }
        }
        if (typeof window !== 'undefined' && window.analytics && window.analytics.track) {
            window.analytics.track('Tax Event', { event: eventName, ...data });
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.taxCalculation = new TaxCalculation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaxCalculation;
}
