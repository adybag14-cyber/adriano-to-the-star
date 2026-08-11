/**
 * Recently Viewed Products v2
 * Advanced recently viewed products system
 */

class RecentlyViewedProductsV2 {
    constructor() {
        this.views = new Map();
        this.histories = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Recently Viewed Products v2 initialized' };
    }

    recordView(userId, productId) {
        const key = `${userId}-${productId}`;
        const view = {
            userId,
            productId,
            viewedAt: new Date()
        };
        this.views.set(key, view);
        this.histories.push(view);
        return view;
    }

    getRecentViews(userId, limit) {
        if (limit < 1) {
            throw new Error('Limit must be at least 1');
        }
        return this.histories
            .filter(v => v.userId === userId)
            .sort((a, b) => b.viewedAt - a.viewedAt)
            .slice(0, limit)
            .map(v => v.productId);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecentlyViewedProductsV2;
}

