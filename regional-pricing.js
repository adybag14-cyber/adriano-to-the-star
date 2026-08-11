/**
 * Regional Pricing
 * Regional pricing system
 */

class RegionalPricing {
    constructor() {
        this.regions = new Map();
        this.prices = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Regional Pricing initialized' };
    }

    defineRegion(regionCode, name, currency) {
        const region = {
            id: Date.now().toString(),
            regionCode,
            name,
            currency,
            definedAt: new Date()
        };
        this.regions.set(regionCode, region);
        return region;
    }

    setPrice(productId, regionCode, price) {
        if (price < 0) {
            throw new Error('Price must be non-negative');
        }
        const region = this.regions.get(regionCode);
        if (!region) {
            throw new Error('Region not found');
        }
        const key = `${productId}-${regionCode}`;
        this.prices.set(key, { productId, regionCode, price, setAt: new Date() });
        return { productId, regionCode, price };
    }

    getPrice(productId, regionCode) {
        const key = `${productId}-${regionCode}`;
        const priceData = this.prices.get(key);
        if (!priceData) {
            return null;
        }
        return priceData.price;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegionalPricing;
}
