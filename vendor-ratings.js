/**
 * Vendor Ratings
 * Vendor rating system
 */

class VendorRatings {
    constructor() {
        this.ratings = new Map();
        this.init();
    }
    
    init() {
        this.setupRatings();
    }
    
    setupRatings() {
        // Setup ratings
    }
    
    async rateVendor(vendorId, userId, rating, review) {
        const ratingData = {
            vendorId,
            userId,
            rating,
            review,
            createdAt: Date.now()
        };
        
        if (!this.ratings.has(vendorId)) {
            this.ratings.set(vendorId, []);
        }
        this.ratings.get(vendorId).push(ratingData);
        return ratingData;
    }
    
    async getAverageRating(vendorId) {
        const ratings = this.ratings.get(vendorId) || [];
        if (ratings.length === 0) return 0;
        return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.vendorRatings = new VendorRatings(); });
} else {
    window.vendorRatings = new VendorRatings();
}

