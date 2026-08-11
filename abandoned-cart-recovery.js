/**
 * Abandoned Cart Recovery
 * @class AbandonedCartRecovery
 * @description Manages abandoned cart recovery with email campaigns and discounts.
 */
class AbandonedCartRecovery {
    constructor() {
        this.abandonedCarts = new Map();
        this.campaigns = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cart_recovery_initialized');
    }

    /**
     * Mark cart as abandoned.
     * @param {string} cartId - Cart identifier.
     * @param {object} cartData - Cart data.
     */
    markAbandoned(cartId, cartData) {
        this.abandonedCarts.set(cartId, {
            ...cartData,
            id: cartId,
            abandonedAt: new Date(),
            recoveryAttempts: 0,
            status: 'abandoned'
        });
        this.trackEvent('cart_abandoned', { cartId, itemCount: cartData?.items?.length || 0 });
    }

    /**
     * Send recovery email.
     * @param {string} cartId - Cart identifier.
     * @param {object} emailData - Email data.
     */
    sendRecoveryEmail(cartId, emailData) {
        const cart = this.abandonedCarts.get(cartId);
        if (!cart) {
            throw new Error(`Cart not found: ${cartId}`);
        }

        cart.recoveryAttempts++;
        cart.lastEmailSent = new Date();
        
        // Add discount if first attempt
        if (cart.recoveryAttempts === 1 && emailData.discountCode) {
            cart.discountCode = emailData.discountCode;
        }

        this.trackEvent('recovery_email_sent', { cartId, attempt: cart.recoveryAttempts, hasDiscount: !!cart.discountCode });
    }

    /**
     * Recover cart.
     * @param {string} cartId - Cart identifier.
     */
    recoverCart(cartId) {
        const cart = this.abandonedCarts.get(cartId);
        if (cart) {
            cart.status = 'recovered';
            cart.recoveredAt = new Date();
            this.trackEvent('cart_recovered', { cartId, attempts: cart.recoveryAttempts });
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cart_recovery_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'abandoned_cart_recovery', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.abandonedCartRecovery = new AbandonedCartRecovery();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AbandonedCartRecovery;
}

