/**
 * Vendor Ratings v2
 * Advanced vendor ratings system
 */

class VendorRatingsV2 {
    constructor() {
        this.ratings = new Map();
        this.reviews = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Vendor Ratings v2 initialized' };
    }

    createRating(vendorId, customerId, rating, comment) {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }
        const ratingObj = {
            id: Date.now().toString(),
            vendorId,
            customerId,
            rating,
            comment: comment || '',
            createdAt: new Date()
        };
        this.reviews.push(ratingObj);
        if (!this.ratings.has(vendorId)) {
            this.ratings.set(vendorId, []);
        }
        this.ratings.get(vendorId).push(ratingObj);
        return ratingObj;
    }

    getAverageRating(vendorId) {
        const vendorRatings = this.ratings.get(vendorId) || [];
        if (vendorRatings.length === 0) return 0;
        const sum = vendorRatings.reduce((acc, r) => acc + r.rating, 0);
        return sum / vendorRatings.length;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VendorRatingsV2;
}

