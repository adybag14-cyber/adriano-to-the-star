/**
 * Recently Viewed Products
 * @class RecentlyViewedProducts
 * @description Tracks and displays recently viewed products.
 */
class RecentlyViewedProducts {
    constructor() {
        this.views = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ec_en_tl_yv_ie_we_dp_ro_du_ct_s_initialized');
        this.loadViews();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ec_en_tl_yv_ie_we_dp_ro_du_ct_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Record product view.
     * @param {string} userId - User identifier.
     * @param {string} productId - Product identifier.
     * @param {object} productData - Product data.
     */
    recordView(userId, productId, productData) {
        const viewKey = `${userId}_${productId}`;
        const view = {
            userId,
            productId,
            ...productData,
            viewedAt: new Date()
        };

        this.views.set(viewKey, view);
        this.saveViews();
        console.log(`Product view recorded: ${productId} by user ${userId}`);
    }

    /**
     * Get recently viewed products.
     * @param {string} userId - User identifier.
     * @param {number} limit - Number of products to return.
     * @returns {Array<object>} Recently viewed products.
     */
    getRecentlyViewed(userId, limit = 10) {
        const userViews = Array.from(this.views.values())
            .filter(view => view.userId === userId)
            .sort((a, b) => b.viewedAt - a.viewedAt)
            .slice(0, limit);

        return userViews.map(view => ({
            id: view.productId,
            name: view.name,
            price: view.price,
            viewedAt: view.viewedAt
        }));
    }

    saveViews() {
        try {
            localStorage.setItem('recentlyViewed', JSON.stringify(
                Object.fromEntries(this.views)
            ));
        } catch (error) {
            console.error('Failed to save views:', error);
        }
    }

    loadViews() {
        try {
            const stored = localStorage.getItem('recentlyViewed');
            if (stored) {
                this.views = new Map(Object.entries(JSON.parse(stored)));
            }
        } catch (error) {
            console.error('Failed to load views:', error);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.recentlyViewedProducts = new RecentlyViewedProducts();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecentlyViewedProducts;
}
