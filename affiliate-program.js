/**
 * Affiliate Program
 * @class AffiliateProgram
 * @description Manages affiliate program with tracking, commissions, and payouts.
 */
class AffiliateProgram {
    constructor() {
        this.affiliates = new Map();
        this.commissions = [];
        this.clicks = [];
        this.init();
    }

    init() {
        this.trackEvent('affiliate_program_initialized');
    }

    /**
     * Register an affiliate.
     * @param {string} userId - User identifier.
     * @returns {string} Affiliate code.
     */
    registerAffiliate(userId) {
        const code = `AFF${userId.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        this.affiliates.set(userId, {
            userId,
            code,
            totalCommissions: 0,
            paidCommissions: 0,
            clicks: 0,
            conversions: 0,
            createdAt: new Date()
        });
        this.trackEvent('affiliate_registered', { userId, code });
        return code;
    }

    /**
     * Track affiliate click.
     * @param {string} code - Affiliate code.
     */
    trackClick(code) {
        const affiliate = this.findAffiliateByCode(code);
        if (affiliate) {
            affiliate.clicks++;
            this.clicks.push({
                code,
                timestamp: new Date()
            });
            this.trackEvent('affiliate_click_tracked', { code });
        }
    }

    /**
     * Record a conversion.
     * @param {string} code - Affiliate code.
     * @param {number} amount - Sale amount.
     * @param {number} commissionRate - Commission rate (percentage).
     */
    recordConversion(code, amount, commissionRate = 10) {
        const affiliate = this.findAffiliateByCode(code);
        if (!affiliate) return;

        const commission = (amount * commissionRate) / 100;
        affiliate.conversions++;
        affiliate.totalCommissions += commission;

        this.commissions.push({
            code,
            amount,
            commission,
            commissionRate,
            timestamp: new Date()
        });

        this.trackEvent('conversion_recorded', { code, commission });
    }

    /**
     * Find affiliate by code.
     * @param {string} code - Affiliate code.
     * @returns {object} Affiliate data.
     */
    findAffiliateByCode(code) {
        for (const affiliate of this.affiliates.values()) {
            if (affiliate.code === code) {
                return affiliate;
            }
        }
        return null;
    }

    /**
     * Get affiliate statistics.
     * @param {string} userId - User identifier.
     * @returns {object} Affiliate statistics.
     */
    getAffiliateStats(userId) {
        const affiliate = this.affiliates.get(userId);
        if (!affiliate) return null;

        return {
            code: affiliate.code,
            clicks: affiliate.clicks,
            conversions: affiliate.conversions,
            conversionRate: affiliate.clicks > 0 ? (affiliate.conversions / affiliate.clicks) * 100 : 0,
            totalCommissions: affiliate.totalCommissions,
            paidCommissions: affiliate.paidCommissions,
            pendingCommissions: affiliate.totalCommissions - affiliate.paidCommissions
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`affiliate_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'affiliate_program', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.affiliateProgram = new AffiliateProgram();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AffiliateProgram;
}
