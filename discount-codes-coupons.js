class DiscountCodesCoupons {
    constructor() {
        this.codes = new Map();
        this.usage = new Map();
    }
    init() {
        // Discount Codes and Coupons initialized.
    }

    /**
     * Create a discount code.
     * @param {string} code - Discount code.
     * @param {object} discountData - Discount data.
     */
    createDiscountCode(code, discountData) {
        this.codes.set(code, {
            code,
            type: discountData.type || 'percentage', // percentage or fixed
            value: discountData.value,
            minPurchase: discountData.minPurchase || 0,
            maxDiscount: discountData.maxDiscount || null,
            validFrom: discountData.validFrom || new Date(),
            validUntil: discountData.validUntil || null,
            usageLimit: discountData.usageLimit || null,
            usageCount: 0,
            isActive: true,
            createdAt: new Date()
        });
        this.trackEvent('discount_code_created', { code, type: discountData.type, value: discountData.value });
    }

    /**
     * Validate and apply discount code.
     * @param {string} code - Discount code.
     * @param {number} cartTotal - Cart total amount.
     * @param {string} userId - User identifier (optional).
     * @returns {object} Discount result.
     */
    applyDiscountCode(code, cartTotal, userId = null) {
        const discount = this.codes.get(code);
        if (!discount) {
            throw new Error('Invalid discount code');
        }

        if (!discount.isActive) {
            throw new Error('Discount code is not active');
        }

        const now = new Date();
        if (now < discount.validFrom) {
            throw new Error('Discount code is not yet valid');
        }

        if (discount.validUntil && now > discount.validUntil) {
            throw new Error('Discount code has expired');
        }

        if (cartTotal < discount.minPurchase) {
            throw new Error(`Minimum purchase of ${discount.minPurchase} required`);
        }

        if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
            throw new Error('Discount code usage limit reached');
        }

        // Check user-specific usage
        if (userId) {
            const userUsageKey = `${userId}_${code}`;
            const userUsage = this.usage.get(userUsageKey) || 0;
            // Could add per-user limits here
        }

        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = (cartTotal * discount.value) / 100;
            if (discount.maxDiscount) {
                discountAmount = Math.min(discountAmount, discount.maxDiscount);
            }
        } else {
            discountAmount = discount.value;
        }

        discount.usageCount++;
        const usageKey = userId ? `${userId}_${code}` : code;
        this.usage.set(usageKey, (this.usage.get(usageKey) || 0) + 1);

        this.trackEvent('discount_code_applied', { code, discountAmount, cartTotal });
        return {
            success: true,
            discountAmount,
            finalTotal: cartTotal - discountAmount
        };
    }

    /**
     * Get discount code info.
     * @param {string} code - Discount code.
     * @returns {object} Discount code information.
     */
    getDiscountInfo(code) {
        return this.codes.get(code);
    }

    trackEvent(eventName, data = {}) {
        if (typeof window !== 'undefined' && window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`discount:${eventName}`, 1, {
                    source: 'discount-codes-coupons',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record discount event:', e);
            }
        }
        if (typeof window !== 'undefined' && window.analytics && window.analytics.track) {
            window.analytics.track('Discount Event', { event: eventName, ...data });
        }
    }
}
const discountCodesCoupons = new DiscountCodesCoupons();
if (typeof window !== 'undefined') {
    window.discountCodesCoupons = discountCodesCoupons;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscountCodesCoupons;
}
