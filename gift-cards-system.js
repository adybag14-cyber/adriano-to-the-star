/**
 * Gift Cards System
 * @class GiftCardsSystem
 * @description Manages gift cards with generation, redemption, and balance tracking.
 */
class GiftCardsSystem {
    constructor() {
        this.giftCards = new Map();
        this.transactions = [];
        this.init();
    }

    init() {
        this.trackEvent('g_if_tc_ar_ds_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("g_if_tc_ar_ds_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a gift card.
     * @param {object} cardData - Gift card data.
     * @returns {string} Gift card code.
     */
    createGiftCard(cardData) {
        const code = this.generateGiftCardCode();
        this.giftCards.set(code, {
            code,
            amount: cardData.amount,
            balance: cardData.amount,
            currency: cardData.currency || 'USD',
            recipientEmail: cardData.recipientEmail,
            message: cardData.message,
            expiresAt: cardData.expiresAt || null,
            isRedeemed: false,
            createdAt: new Date()
        });
        console.log(`Gift card created: ${code}`);
        return code;
    }

    /**
     * Generate gift card code.
     * @returns {string} Gift card code.
     */
    generateGiftCardCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Redeem a gift card.
     * @param {string} code - Gift card code.
     * @param {number} amount - Amount to redeem.
     * @returns {object} Redemption result.
     */
    redeemGiftCard(code, amount) {
        const card = this.giftCards.get(code);
        if (!card) {
            throw new Error('Invalid gift card code');
        }

        if (card.isRedeemed) {
            throw new Error('Gift card already redeemed');
        }

        if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
            throw new Error('Gift card has expired');
        }

        if (card.balance < amount) {
            throw new Error('Insufficient gift card balance');
        }

        card.balance -= amount;
        if (card.balance === 0) {
            card.isRedeemed = true;
        }

        this.transactions.push({
            code,
            amount,
            type: 'redemption',
            timestamp: new Date()
        });

        console.log(`Gift card ${code} redeemed: ${amount}`);
        return {
            success: true,
            remainingBalance: card.balance
        };
    }

    /**
     * Get gift card balance.
     * @param {string} code - Gift card code.
     * @returns {number} Balance.
     */
    getBalance(code) {
        const card = this.giftCards.get(code);
        return card ? card.balance : 0;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.giftCardsSystem = new GiftCardsSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GiftCardsSystem;
}
